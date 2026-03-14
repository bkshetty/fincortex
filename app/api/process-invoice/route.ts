import { NextResponse } from "next/server";
import { buildComplianceAdvisor, buildFraudSignals, calculateRiskScore } from "@/lib/compliance";
import { findByImageHash, findDuplicateInvoice, listInvoices, saveInvoice } from "@/lib/invoiceStore";
import { generateGeminiContent, getAIProviderName, getOpenAIClient, hasAIConfig, resolveAIConfigs, shouldRetryWithNextProvider } from "@/lib/ai";
import { InvoiceData } from "@/lib/types";
import { handlePreflight, withCors } from "@/lib/cors";
import { generateVendorResolutionEmail } from "@/lib/agent";
import { createHash, randomUUID } from "crypto";
import { supabase } from "@/lib/supabase";

export async function OPTIONS(request: Request) {
  return handlePreflight(request);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXTRACTION_MAX_OUTPUT_TOKENS = 1200;
const QA_MAX_OUTPUT_TOKENS = 400;

const EXTRACTION_PROMPT = `You extract invoice fields and return only JSON.
Required fields:
vendor_name
vendor_gstin
invoice_number
invoice_date
currency
currency_symbol
taxable_value
subtotal
tax_amount
total_amount
tax_type
effective_tax_rate
total_tax_amount
total_cgst_amount
total_sgst_amount
total_igst_amount
total_cess_amount
cgst_amount
sgst_amount
igst_amount
cess_amount
cgst_rate
sgst_rate
igst_rate
cess_rate
detected_tax_rates
tax_mismatch
tax_mismatch_percent
mixed_tax_rates_detected
currency_inconsistency

Rules:
- Prioritize labeled taxable values in this order: "Total Taxable Amount", "Taxable Value", "Subtotal".
- Identify vendor_gstin from labels like "GSTIN", "GST No", "GST Registration Number".
- If a labeled taxable value exists, return it directly in taxable_value.
- Do not derive subtotal using total_amount - tax_amount unless no labeled taxable value or subtotal exists.
- Use numeric values only for numeric fields.
- Always prefer invoice totals-row tax values when calculating tax.
- Extraction priority for tax is:
  A. total_tax_amount from the totals row
  B. total_cgst_amount + total_sgst_amount from the totals row
  C. line-item tax values only if totals-row values are missing
- Do not sum only the first line item taxes.
- When CGST and SGST totals exist, total tax must be total_cgst_amount + total_sgst_amount.
- Otherwise total tax must include all applicable totals-row components: total_cgst_amount + total_sgst_amount + total_igst_amount + total_cess_amount.
- If both CGST and SGST exist, return each separately.
- If IGST exists, return IGST and leave CGST/SGST empty.
- Extract tax rates only from explicit percentage patterns such as "@9%", "9%", "CGST 9%", "SGST 9%".
- Ignore numeric values greater than 100 when extracting tax rates.
- Tax breakdown fields cgst_rate, sgst_rate, and igst_rate must store rates, not tax amounts.
- Identify vendor_gstin from labels like "GSTIN", "GST No", "GST Registration Number". 
- Valid GSTINs are 15 characters. If you see a string like "12345" or random characters, set vendor_gstin to "INVALID".
- If the uploaded image is clearly NOT an invoice (e.g., it is a logo, a person, or a random photo), set vendor_name to "UNKNOWN", total_amount to 0, and vendor_gstin to "NOT FOUND".
- Return empty strings for missing text values.`;

function toBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

function asNumber(value: unknown) {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? Number(normalized.toFixed(2)) : 0;
}

function asOptionalNumber(value: unknown) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? Number(normalized.toFixed(2)) : undefined;
}

function roundAmount(value: number) {
  return Number(value.toFixed(2));
}

function asOptionalAmount(value: unknown) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? roundAmount(normalized) : undefined;
}

function asOptionalRate(value: unknown) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0 || normalized > 100) {
    return undefined;
  }

  return roundAmount(normalized);
}

function collectDetectedRates(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asOptionalRate(item))
    .filter((item): item is number => item !== undefined && item > 0);
}

function normalizeCurrency(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!normalized || normalized === "RS" || normalized === "INR" || normalized === "â‚¹" || normalized === "₹") return "INR";
  if (normalized === "$" || normalized === "USD") return "USD";
  if (normalized === "OMR") return "OMR";
  if (normalized === "AED") return "AED";
  if (!/^[A-Z]{3}$/.test(normalized)) return "INR";
  return normalized;
}

function sumTaxAmounts(values: Array<number | undefined>) {
  return roundAmount(values.reduce<number>((sum, value) => sum + (value || 0), 0));
}

function computeEffectiveTaxRate(subtotal: number, taxAmount: number) {
  if (subtotal <= 0 || taxAmount < 0) {
    return 0;
  }

  return roundAmount((taxAmount / subtotal) * 100);
}

function computeMismatchPercent(expectedTotal: number, totalAmount: number) {
  if (expectedTotal <= 0) {
    return 0;
  }

  return roundAmount((Math.abs(expectedTotal - totalAmount) / expectedTotal) * 100);
}

function parseBetterJson(text: string) {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Try to find the first '{' and last '}'
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const jsonCandidate = text.substring(start, end + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch (e2) {
        // 3. Last ditch: remove markdown backticks manually if they somehow survived
        const cleaned = text
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        return JSON.parse(cleaned);
      }
    }
    throw e;
  }
}

function extractInvoiceJson(text: string) {
  const parsed = parseBetterJson(text) as Record<string, unknown>;
  const taxableValue = asOptionalAmount(parsed.taxable_value);
  const extractedSubtotal = asOptionalAmount(parsed.subtotal);
  const totalTaxAmount = asOptionalAmount(parsed.total_tax_amount);
  const totalCgstAmount = asOptionalAmount(parsed.total_cgst_amount);
  const totalSgstAmount = asOptionalAmount(parsed.total_sgst_amount);
  const totalIgstAmount = asOptionalAmount(parsed.total_igst_amount);
  const totalCessAmount = asOptionalAmount(parsed.total_cess_amount);
  const cgstAmount = totalCgstAmount ?? asOptionalAmount(parsed.cgst_amount);
  const sgstAmount = totalSgstAmount ?? asOptionalAmount(parsed.sgst_amount);
  const igstAmount = totalIgstAmount ?? asOptionalAmount(parsed.igst_amount);
  const cessAmount = totalCessAmount ?? asOptionalAmount(parsed.cess_amount);
  const hasExplicitTaxAmounts = [cgstAmount, sgstAmount, igstAmount, cessAmount].some((value) => value !== undefined);
  const hasTotalsRowBreakdown = [totalCgstAmount, totalSgstAmount, totalIgstAmount, totalCessAmount].some((value) => value !== undefined);
  const hasSplitGstTotals = totalCgstAmount !== undefined && totalSgstAmount !== undefined;
  const hasSplitGstAmounts = cgstAmount !== undefined && sgstAmount !== undefined;
  const aggregatedTaxAmount =
    totalTaxAmount ??
    (hasSplitGstTotals
      ? sumTaxAmounts([totalCgstAmount, totalSgstAmount])
      : hasTotalsRowBreakdown
        ? sumTaxAmounts([totalCgstAmount, totalSgstAmount, totalIgstAmount, totalCessAmount])
        : hasSplitGstAmounts
          ? sumTaxAmounts([cgstAmount, sgstAmount])
          : sumTaxAmounts([cgstAmount, sgstAmount, igstAmount, cessAmount]));
  const extractedTaxAmount = asNumber(parsed.tax_amount);
  const totalAmount = asNumber(parsed.total_amount);
  const taxAmount = hasExplicitTaxAmounts ? aggregatedTaxAmount : extractedTaxAmount;
  const subtotal = taxableValue ?? extractedSubtotal ?? (totalAmount > 0 ? roundAmount(Math.max(totalAmount - taxAmount, 0)) : 0);
  const effectiveTaxRate = computeEffectiveTaxRate(subtotal, taxAmount);
  const cgstRate = asOptionalRate(parsed.cgst_rate);
  const sgstRate = asOptionalRate(parsed.sgst_rate);
  const igstRate = asOptionalRate(parsed.igst_rate);
  const cessRate = asOptionalRate(parsed.cess_rate);
  const detectedRates = new Set<number>(collectDetectedRates(parsed.detected_tax_rates));

  // Only count non-zero rates — a 0% CGST/SGST on an IGST-only invoice is NOT a different rate
  if (cgstRate !== undefined && cgstRate > 0) {
    detectedRates.add(cgstRate);
  }
  if (sgstRate !== undefined && sgstRate > 0) {
    detectedRates.add(sgstRate);
  }
  if (igstRate !== undefined && igstRate > 0) {
    detectedRates.add(igstRate);
  }

  const expectedTotal = roundAmount(subtotal + taxAmount);
  const taxMismatch = Math.abs(expectedTotal - totalAmount) > 1;

  return {
    vendor_name: String(parsed.vendor_name ?? "").trim(),
    vendor_gstin: String(parsed.vendor_gstin ?? "").trim(),
    invoice_number: String(parsed.invoice_number ?? "").trim(),
    invoice_date: String(parsed.invoice_date ?? "").trim(),
    currency: normalizeCurrency(String(parsed.currency ?? parsed.currency_symbol ?? "INR")),
    currency_symbol: String(parsed.currency_symbol ?? "").trim(),
    subtotal,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    tax_type: String(parsed.tax_type ?? "GST").trim() || "GST",
    effective_tax_rate: effectiveTaxRate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    cess_amount: cessAmount,
    cgst_rate: cgstRate,
    sgst_rate: sgstRate,
    igst_rate: igstRate,
    cess_rate: cessRate,
    tax_mismatch: taxMismatch,
    tax_mismatch_percent: taxMismatch ? computeMismatchPercent(expectedTotal, totalAmount) : 0,
    mixed_tax_rates_detected: detectedRates.size > 1,
    currency_inconsistency: Boolean(parsed.currency_inconsistency)
  };
}

function buildDemoInvoice(fileName: string) {
  const stem = fileName.replace(/\.[^/.]+$/, "");
  const taxRate = stem.toLowerCase().includes("high") ? 38 : 18;
  const subtotal = stem.toLowerCase().includes("large") ? 1_250_000 : 125000;
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));

  return {
    vendor_name: stem.toLowerCase().includes("novendor") ? "" : "Acme Industrial Supplies",
    vendor_gstin: "29AABCA1234A1Z1", // Mock GSTIN for demo
    invoice_number: stem.toUpperCase().replace(/[^A-Z0-9-]/g, "-") || `INV-${Date.now()}`,
    invoice_date: new Date().toISOString().slice(0, 10),
    currency: "INR",
    currency_symbol: "â‚¹",
    subtotal,
    tax_amount: taxAmount,
    total_amount: subtotal + taxAmount,
    tax_type: "GST",
    effective_tax_rate: computeEffectiveTaxRate(subtotal, taxAmount),
    cgst_amount: taxRate === 18 ? roundAmount(taxAmount / 2) : undefined,
    sgst_amount: taxRate === 18 ? roundAmount(taxAmount / 2) : undefined,
    igst_amount: taxRate !== 18 ? taxAmount : undefined,
    cess_amount: undefined,
    cgst_rate: taxRate === 18 ? 9 : undefined,
    sgst_rate: taxRate === 18 ? 9 : undefined,
    igst_rate: taxRate !== 18 ? taxRate : undefined,
    cess_rate: undefined,
    tax_mismatch: false,
    tax_mismatch_percent: 0,
    mixed_tax_rates_detected: stem.toLowerCase().includes("mixed"),
    currency_inconsistency: false
  };
}

async function extractInvoiceFromFile(file: File) {
  const aiConfigs = resolveAIConfigs();

  if (aiConfigs.length === 0) {
    return buildDemoInvoice(file.name);
  }

  const buffer = await file.arrayBuffer();
  const base64 = toBase64(buffer);
  const mimeType = file.type || "application/octet-stream";
  const dataUri = `data:${mimeType};base64,${base64}`;

  let lastError: unknown;

  for (const aiConfig of aiConfigs) {
    try {
      console.log(`[process-invoice] Trying provider: ${aiConfig.provider} model: ${aiConfig.model}`);
      if (aiConfig.provider === "gemini") {
        const outputText = await generateGeminiContent({
          config: aiConfig,
          prompt: EXTRACTION_PROMPT,
          temperature: 0,
          inlineData: {
            mimeType,
            data: base64
          }
        });

        console.log(`[process-invoice] Gemini raw output (first 200 chars):`, outputText.slice(0, 200));
        return extractInvoiceJson(outputText);
      }

      const openai = getOpenAIClient(aiConfig);

      // Use Chat Completions API (works with OpenRouter and all providers)
      // OpenRouter does NOT support the OpenAI Responses API
      const messageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> =
        mimeType === "application/pdf"
          ? [{ type: "text", text: EXTRACTION_PROMPT }]
          : [
            { type: "text", text: EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: dataUri } }
          ];

      const chatResponse = await openai.chat.completions.create({
        model: aiConfig.model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: [{ role: "user", content: messageContent as any }],
        temperature: 0,
        max_tokens: EXTRACTION_MAX_OUTPUT_TOKENS
      });

      const outputText = chatResponse.choices?.[0]?.message?.content?.trim();

      if (!outputText) {
        throw new Error(`No extraction output from ${getAIProviderName(aiConfig.provider)}`);
      }

      console.log(`[process-invoice] ${aiConfig.provider} raw output (first 200 chars):`, outputText.slice(0, 200));
      return extractInvoiceJson(outputText);
    } catch (error) {
      lastError = error;
      console.error(`[process-invoice] Provider ${aiConfig.provider} failed:`, error instanceof Error ? error.message : error);
      const hasFallback = aiConfigs[aiConfigs.length - 1] !== aiConfig;

      if (!hasFallback || !shouldRetryWithNextProvider(error)) {
        throw error;
      }
      console.log(`[process-invoice] Retrying with next provider...`);
    }
  }

  if (shouldRetryWithNextProvider(lastError)) {
    return buildDemoInvoice(file.name);
  }

  throw lastError instanceof Error ? lastError : new Error("No AI provider could process the invoice");
}

function buildFallbackQuestionAnswer(invoice: InvoiceData, question: string) {
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes("gst") || normalizedQuestion.includes("tax")) {
    return `The extracted effective tax rate is ${invoice.effective_tax_rate.toFixed(2)}% and the tax amount is ${invoice.tax_amount.toFixed(2)} ${invoice.currency}. ${invoice.tax_mismatch ? "The invoice should be reviewed because the tax calculation appears inconsistent." : "The extracted totals do not show a tax mismatch."
      }`;
  }

  if (normalizedQuestion.includes("risk")) {
    return `This invoice is ${invoice.risk_score} risk because it has ${invoice.fraud_signals.length} fraud signal(s) and ${invoice.compliance_advisor.warnings.length} compliance warning(s).`;
  }

  if (normalizedQuestion.includes("vendor")) {
    return invoice.vendor_name ? `The detected vendor is ${invoice.vendor_name}.` : "No vendor name was confidently extracted from the invoice.";
  }

  return `Invoice ${invoice.invoice_number} has a total of ${invoice.total_amount.toFixed(2)} ${invoice.currency}, tax amount ${invoice.tax_amount.toFixed(2)}, and risk ${invoice.risk_score}.`;
}

async function answerInvoiceQuestion(invoice: InvoiceData, question: string) {
  const aiConfigs = resolveAIConfigs();

  if (aiConfigs.length === 0) {
    return buildFallbackQuestionAnswer(invoice, question);
  }

  let lastError: unknown;

  for (const aiConfig of aiConfigs) {
    try {
      if (aiConfig.provider === "gemini") {
        return (
          (await generateGeminiContent({
            config: aiConfig,
            systemInstruction: "You are an AI invoice compliance advisor. Answer briefly and directly using the provided invoice JSON only.",
            prompt: `Invoice JSON:\n${JSON.stringify(invoice, null, 2)}\n\nQuestion: ${question}`,
            temperature: 0.2
          })) || buildFallbackQuestionAnswer(invoice, question)
        );
      }

      const openai = getOpenAIClient(aiConfig);
      const response = await openai.responses.create({
        model: aiConfig.model,
        temperature: 0.2,
        max_output_tokens: QA_MAX_OUTPUT_TOKENS,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "You are an AI invoice compliance advisor. Answer briefly and directly using the provided invoice JSON only."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Invoice JSON:\n${JSON.stringify(invoice, null, 2)}\n\nQuestion: ${question}`
              }
            ]
          }
        ]
      });

      return response.output_text?.trim() || buildFallbackQuestionAnswer(invoice, question);
    } catch (error) {
      lastError = error;
      const hasFallback = aiConfigs[aiConfigs.length - 1] !== aiConfig;

      if (!hasFallback || !shouldRetryWithNextProvider(error)) {
        throw error;
      }
    }
  }

  if (shouldRetryWithNextProvider(lastError)) {
    return buildFallbackQuestionAnswer(invoice, question);
  }

  throw lastError instanceof Error ? lastError : new Error("No AI provider could answer the question");
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function isSameInvoice(a: InvoiceData, b: ReturnType<typeof extractInvoiceJson>) {
  return (
    normalizeText(a.invoice_number) === normalizeText(b.invoice_number) &&
    normalizeText(a.vendor_name) === normalizeText(b.vendor_name) &&
    (a.invoice_date || "").trim() === (b.invoice_date || "").trim() &&
    Number(a.subtotal || 0) === Number(b.subtotal || 0) &&
    Number(a.tax_amount || 0) === Number(b.tax_amount || 0) &&
    Number(a.total_amount || 0) === Number(b.total_amount || 0)
  );
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return withCors(NextResponse.json({ success: false, message: "File is required" }, { status: 400 }), origin);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Elite Feature: Pixel-Level Image Hashing
    const imageHash = createHash("sha256").update(buffer).digest("hex");
    const existingImage = await findByImageHash(imageHash);

    if (existingImage) {
      // Still enforce GSTIN rule even on duplicate images
      const existingGstin = (existingImage.vendor_gstin || "").toLowerCase().trim();
      const invalidKeywords = ["unknown", "n/a", "", "not found", "none", "not applicable", "missing"];
      const existingHasNoGST = invalidKeywords.includes(existingGstin) || existingGstin.length < 5;
      if (existingHasNoGST) {
        return withCors(NextResponse.json({
          success: false,
          message: "Compliance Error: Vendor GSTIN not found on invoice. A valid GST number is required for compliance reporting."
        }, { status: 400 }), origin);
      }
      return withCors(NextResponse.json({
        success: true,
        message: "SECURITY ALERT: Exact duplicate image detected. This document was already processed.",
        invoice: { ...existingImage, risk_score: "MEDIUM" }
      }), origin);
    }

    const extractedInvoice = await extractInvoiceFromFile(file);

    // BASE RULE: Validate if it's actually an invoice (Strict Enforce Vendor Name, Amount, and GSTIN)
    const name = (extractedInvoice.vendor_name || "").toLowerCase().trim();
    const gstin = (extractedInvoice.vendor_gstin || "").toLowerCase().trim();
    const isZeroAmount = (extractedInvoice.total_amount || 0) <= 0;

    const invalidKeywords = ["unknown", "n/a", "", "not found", "none", "not applicable", "missing", "logo", "image"];
    const isMissingName = invalidKeywords.includes(name) || name.length < 2;
    const isMissingGST = invalidKeywords.includes(gstin) || gstin.length < 5;

    // Strict Enforcement of User's "Base Rule"
    if (isMissingName || isZeroAmount || isMissingGST) {
      console.log(`[process-invoice] Blocking invalid document. Name: "${name}", GST: "${gstin}", Amount: ${extractedInvoice.total_amount}`);
      return withCors(NextResponse.json({ 
        success: false, 
        message: "Compliance Error: Vendor GSTIN not found on invoice. A valid GST number is required for compliance reporting uplode valid invoice." 
      }, { status: 400 }), origin);
    }

    const existingInvoices = await listInvoices();
    // For the hackathon demo, we want to allow re-analyzing even if exactly the same
    // previously we blocked saving duplicates to keep the dashboard clean.
    // Let's allow it now so the user sees their uploads working every time.
    /*
    const exactExisting = existingInvoices.find((invoice) => isSameInvoice(invoice, extractedInvoice));
    if (exactExisting) {
      return withCors(NextResponse.json({
        success: true,
        message: "Invoice already analyzed. Showing existing result.",
        invoice: exactExisting
      }), origin);
    }
    */

    const isDuplicate = await findDuplicateInvoice(extractedInvoice.invoice_number, extractedInvoice.vendor_name);

    if (isDuplicate) {
        console.log(`[process-invoice] Blocking duplicate invoice: ${extractedInvoice.invoice_number} from ${extractedInvoice.vendor_name}`);
        return withCors(NextResponse.json({ 
          success: false, 
          isDuplicate: true,
          message: "DUPLICATE DETECTED: This invoice has already been processed!" 
        }, { status: 409 }), origin);
    }

    const riskScore = calculateRiskScore({ invoice: extractedInvoice, isDuplicate });
    const complianceAdvisor = buildComplianceAdvisor({ invoice: extractedInvoice, isDuplicate });
    const fraudSignals = buildFraudSignals({ invoice: extractedInvoice, isDuplicate });

    // 🚀 SPEED OPTIMIZATION: Run Storage Upload and AI Resolution Email in parallel
    const fileName = `${imageHash}_${randomUUID()}_${file.name}`;
    
    // Create base data for tasks that need it
    const taskData: Omit<InvoiceData, "draft_vendor_email"> = {
      ...extractedInvoice,
      risk_score: riskScore,
      compliance_advisor: complianceAdvisor,
      fraud_signals: fraudSignals,
      image_hash: imageHash,
      payment_status: riskScore === "HIGH" ? "BLOCKED" : "PENDING"
    };

    // Parallel promises
    const storagePromise = supabase.storage
      .from('invoices')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600'
      })
      .then(({ data, error }) => {
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage
          .from('invoices')
          .getPublicUrl(fileName);
        return publicUrl;
      })
      .catch(err => {
        console.error("[process-invoice] Supabase Storage Upload Failed:", err);
        return "";
      });

    const emailPromise = riskScore !== "LOW" 
      ? generateVendorResolutionEmail(taskData)
      : Promise.resolve(undefined);

    // Wait for parallel tasks
    const [invoiceUrl, draftEmail] = await Promise.all([storagePromise, emailPromise]);

    const storedInvoiceData: InvoiceData = {
      ...taskData,
      image_url: invoiceUrl,
      draft_vendor_email: draftEmail
    };

    // Elite Feature: Finance Channel Notification Bot (Mock)
    if (riskScore === "HIGH") {
      console.log(`\n🚨 [SECURITY ALERT] High-risk invoice detected!`);
      storedInvoiceData.notification_sent = true;
    }

    // Final result - DO NOT SAVE yet, user will approve first
    return withCors(NextResponse.json({
      success: true,
      isDuplicate: false,
      message: hasAIConfig() ? "Invoice analyzed successfully" : "Invoice analyzed in demo mode",
      invoice: {
        ...taskData,
        image_url: invoiceUrl,
        is_duplicate: false
      }
    }), origin);
  } catch (error) {
    console.error("[process-invoice] CRITICAL ERROR IN POST HANDLER:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Unexpected server error" },
        { status: 500 }
      ),
      origin
    );
  }
}

export async function PUT(req: Request) {
  const origin = req.headers.get("origin");
  try {
    const body = (await req.json()) as { invoice: InvoiceData; question: string };

    if (!body?.invoice || !body?.question?.trim()) {
      return withCors(NextResponse.json({ message: "Invoice and question are required" }, { status: 400 }), origin);
    }

    const answer = await answerInvoiceQuestion(body.invoice, body.question.trim());
    return withCors(NextResponse.json({ answer }), origin);
  } catch (error) {
    return withCors(
      NextResponse.json(
        { message: error instanceof Error ? error.message : "Failed to answer question" },
        { status: 500 }
      ),
      origin
    );
  }
}
