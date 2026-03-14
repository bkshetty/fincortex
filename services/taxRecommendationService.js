import OpenAI from 'openai';
import prisma from '../lib/prisma';

// Smart AI provider selection: use Grok if configured, fallback to Groq/OpenAI
const hasGrokKey = process.env.GROK_API_KEY && process.env.GROK_API_KEY !== 'your_xai_grok_api_key_here';

const aiClient = new OpenAI({
  apiKey: hasGrokKey ? process.env.GROK_API_KEY : (process.env.OPENAI_API_KEY || 'dummy_key'),
  baseURL: hasGrokKey 
    ? (process.env.GROK_BASE_URL || 'https://api.x.ai/v1')
    : (process.env.OPENAI_BASE_URL || 'https://api.x.ai/v1'),
  timeout: parseInt(process.env.TAX_ENGINE_TIMEOUT_MS || '60000')
});

const AI_MODEL = hasGrokKey
  ? (process.env.GROK_MODEL || 'grok-3')
  : (process.env.OPENAI_MODEL || 'grok-3');

/**
 * Fetch all invoices from the database
 */
async function getAllInvoices() {
  return await prisma.invoice.findMany({
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Analyze invoices with AI to generate per-invoice tax saving tips
 */
async function analyzeInvoicesWithAI(invoices) {
  if (!invoices.length) return [];

  const totalValue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalTax = invoices.reduce((sum, inv) => sum + inv.tax_amount, 0);

  const invoiceSummaries = invoices.map(inv => ({
    id: inv.id,
    vendor_name: inv.vendor_name,
    vendor_gstin: inv.vendor_gstin || 'NOT PROVIDED',
    invoice_number: inv.invoice_number,
    invoice_date: inv.invoice_date,
    subtotal: inv.subtotal,
    tax_amount: inv.tax_amount,
    total_amount: inv.total_amount,
    tax_type: inv.tax_type,
    effective_tax_rate: inv.effective_tax_rate,
    cgst_amount: inv.cgst_amount || 0,
    sgst_amount: inv.sgst_amount || 0,
    igst_amount: inv.igst_amount || 0,
    cess_amount: inv.cess_amount || 0,
    tax_mismatch: inv.tax_mismatch || false,
    tax_mismatch_percent: inv.tax_mismatch_percent || 0,
    risk_score: inv.risk_score,
    payment_status: inv.payment_status || 'PENDING'
  }));

  const systemPrompt = `You are a senior Indian GST consultant analyzing actual business invoices for tax-saving opportunities. You MUST base all recommendations strictly on the real invoice data provided. Do NOT invent figures or assume anything not in the data.

For EACH invoice, identify specific, actionable tax-saving tips such as:
- Input Tax Credit (ITC) eligibility: Can the GST paid on this invoice be claimed as ITC?
- GST rate verification: Is the tax rate applied correct for the likely goods/services?
- GSTIN validation: If GSTIN is missing, ITC cannot be claimed — flag this
- Tax mismatch: If tax amounts don't match expected rates, flag potential overcharge
- Reverse charge applicability: Does this transaction require reverse charge?
- Payment timing: For ITC claim, payment must be made within 180 days

CRITICAL RULES:
1. The estimated_saving MUST be a positive number greater than 0 for EVERY tip
2. For ITC tips: estimated_saving = the full GST/tax amount that can be claimed as credit
3. For GSTIN issues: estimated_saving = the tax_amount at risk of not being claimed
4. For GST Rate tips: estimated_saving = difference between charged rate and correct rate applied to subtotal
5. For Payment Timing: estimated_saving = the ITC amount at risk if payment is delayed
6. Savings can NEVER exceed the tax_amount of that invoice
7. NEVER return estimated_saving as 0 — always calculate a real number
8. Every recommendation must reference specific invoice data with real rupee amounts

Portfolio summary:
- Total invoices: ${invoices.length}
- Total processed value: ₹${totalValue.toFixed(2)}
- Total tax paid: ₹${totalTax.toFixed(2)}

Return ONLY a valid JSON array. No markdown. No explanation outside JSON. Each element:
{
  "invoice_id": string (the actual invoice id from the data),
  "vendor_name": string,
  "invoice_number": string,
  "tip_title": string (short, actionable title),
  "explanation": string (2-3 sentences explaining the saving, referencing real ₹ numbers from invoice),
  "estimated_saving": number (MUST be > 0, realistic INR amount based on actual tax paid on this invoice),
  "priority": "high" | "medium" | "low",
  "category": "ITC" | "GST Rate" | "Compliance" | "GSTIN" | "Payment Timing"
}`;

  try {
    const response = await aiClient.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 2000,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(invoiceSummaries) }
      ],
    });

    const raw = response.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("[TaxEngine] AI API Error:", error.message || error);
    // Fallback: generate basic tips from invoice data directly
    return generateFallbackTips(invoices);
  }
}

/**
 * Fallback: generate tips without AI based on invoice analysis
 */
function generateFallbackTips(invoices) {
  const tips = [];

  for (const inv of invoices) {
    // Tip 1: ITC claim opportunity
    if (inv.tax_amount > 0) {
      tips.push({
        invoice_id: inv.id,
        vendor_name: inv.vendor_name,
        invoice_number: inv.invoice_number,
        tip_title: "Claim Input Tax Credit (ITC)",
        explanation: `You paid ₹${inv.tax_amount.toFixed(2)} in GST on invoice ${inv.invoice_number} from ${inv.vendor_name}. If this is a business purchase, you can claim this entire amount as ITC in your GST return, reducing your tax liability.`,
        estimated_saving: Math.round(inv.tax_amount * 0.9), // Conservative: 90% of tax
        priority: inv.tax_amount > 1000 ? "high" : "medium",
        category: "ITC"
      });
    }

    // Tip 2: Missing GSTIN warning
    if (!inv.vendor_gstin || inv.vendor_gstin === 'NOT PROVIDED' || inv.vendor_gstin === 'N/A') {
      tips.push({
        invoice_id: inv.id,
        vendor_name: inv.vendor_name,
        invoice_number: inv.invoice_number,
        tip_title: "Missing Vendor GSTIN — ITC at Risk",
        explanation: `Invoice ${inv.invoice_number} from ${inv.vendor_name} has no GSTIN. Without a valid vendor GSTIN, you CANNOT claim ITC of ₹${inv.tax_amount.toFixed(2)}. Request the vendor to provide their GSTIN immediately.`,
        estimated_saving: Math.round(inv.tax_amount),
        priority: "high",
        category: "GSTIN"
      });
    }

    // Tip 3: Tax mismatch flag
    if (inv.tax_mismatch) {
      tips.push({
        invoice_id: inv.id,
        vendor_name: inv.vendor_name,
        invoice_number: inv.invoice_number,
        tip_title: "Tax Rate Mismatch Detected",
        explanation: `Invoice ${inv.invoice_number} has a tax mismatch of ${(inv.tax_mismatch_percent || 0).toFixed(1)}%. The effective rate of ${inv.effective_tax_rate}% may be incorrect. Verify with the vendor — you could be overpaying by ₹${Math.round(inv.total_amount * 0.02)}.`,
        estimated_saving: Math.round(inv.total_amount * 0.02),
        priority: "high",
        category: "GST Rate"
      });
    }

    // Tip 4: High tax rate verification
    if (inv.effective_tax_rate > 18) {
      tips.push({
        invoice_id: inv.id,
        vendor_name: inv.vendor_name,
        invoice_number: inv.invoice_number,
        tip_title: "Verify High GST Rate",
        explanation: `Invoice ${inv.invoice_number} has an effective tax rate of ${inv.effective_tax_rate}%, which is above the standard 18% GST slab. Verify if the HSN code classification is correct — many items attract only 12% or 18%.`,
        estimated_saving: Math.round(inv.subtotal * ((inv.effective_tax_rate - 18) / 100)),
        priority: "medium",
        category: "GST Rate"
      });
    }
  }

  return tips;
}

/**
 * Main Entry Point — Analyze invoices and return per-invoice tax tips
 */
export async function runRecommendationEngine(businessId = null) {
  console.log('[TaxEngine] Analyzing real invoices for tax savings...');

  const invoices = await getAllInvoices();
  console.log(`[TaxEngine] Found ${invoices.length} invoices to analyze`);

  if (invoices.length === 0) {
    return { 
      count: 0, 
      tips: [],
      total_saving: 0,
      total_processed: 0,
      total_tax_paid: 0
    };
  }

  const totalProcessed = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalTaxPaid = invoices.reduce((sum, inv) => sum + inv.tax_amount, 0);

  const tips = await analyzeInvoicesWithAI(invoices);
  
  // Post-process: ensure every tip has a real savings figure
  const validatedTips = tips.map(tip => {
    const invoice = invoices.find(i => i.id === tip.invoice_id);
    if (!invoice) return tip;

    // If AI returned 0 or no saving, calculate a reasonable one
    if (!tip.estimated_saving || tip.estimated_saving <= 0) {
      switch (tip.category) {
        case 'ITC':
          tip.estimated_saving = Math.round(invoice.tax_amount * 0.9); // 90% of tax as ITC
          break;
        case 'GSTIN':
          tip.estimated_saving = Math.round(invoice.tax_amount); // Full tax at risk
          break;
        case 'GST Rate':
          tip.estimated_saving = Math.round(invoice.subtotal * 0.02); // ~2% rate diff
          break;
        case 'Payment Timing':
          tip.estimated_saving = Math.round(invoice.tax_amount * 0.85); // ITC at risk
          break;
        default:
          tip.estimated_saving = Math.round(invoice.tax_amount * 0.5); // Conservative 50%
      }
    }

    // Cap at invoice's tax amount
    if (tip.estimated_saving > invoice.tax_amount) {
      tip.estimated_saving = Math.round(invoice.tax_amount * 0.9);
    }

    // Ensure it's always at least ₹1
    if (tip.estimated_saving <= 0) {
      tip.estimated_saving = Math.max(1, Math.round(invoice.tax_amount * 0.1));
    }

    return tip;
  });

  const totalSaving = validatedTips.reduce((sum, t) => sum + (t.estimated_saving || 0), 0);

  console.log(`[TaxEngine] Generated ${validatedTips.length} tips. Total potential saving: ₹${totalSaving}`);

  return {
    count: validatedTips.length,
    tips: validatedTips,
    total_saving: totalSaving,
    total_processed: totalProcessed,
    total_tax_paid: totalTaxPaid
  };
}

// Export both names for compatibility with different parts of the system
export const runInvoiceTaxAnalysis = runRecommendationEngine;

