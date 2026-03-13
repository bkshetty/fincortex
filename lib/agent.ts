import { InvoiceData, VendorEmailDraft } from "./types";
import { generateGeminiContent, resolveAIConfig, getOpenAIClient } from "./ai";

function parseBetterJson(text: string) {
    try {
        return JSON.parse(text);
    } catch (e) {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
            const jsonCandidate = text.substring(start, end + 1);
            try {
                return JSON.parse(jsonCandidate);
            } catch (e2) {
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

export async function generateVendorResolutionEmail(invoice: Omit<InvoiceData, "draft_vendor_email">): Promise<VendorEmailDraft | undefined> {
    // Only generate for Medium/High risk
    if (invoice.risk_score === "LOW") return undefined;

    const aiConfig = resolveAIConfig();

    const prompt = `
    You are an AI Compliance Resolution Agent. 
    An invoice has been flagged with compliance issues.
    
    INVOICE DETAILS:
    Vendor: ${invoice.vendor_name}
    Invoice #: ${invoice.invoice_number}
    Total Amount: ${invoice.total_amount} ${invoice.currency}
    Issues Found: ${invoice.compliance_advisor.warnings.join(", ")}
    Fraud Signals: ${invoice.fraud_signals.map(s => s.label).join(", ")}
    
    TASK:
    Draft a professional, firm but polite email to the vendor's billing department.
    1. Reference the specific invoice number and date.
    2. Clearly explain the discrepancies or missing information (e.g., GST mismatch, invalid format).
    3. Ask for a corrected version of the invoice to process payment.
    4. Sign off as "Compliance Team, CompliancePilot AI".
    
    RETURN ONLY JSON in this format:
    {
      "subject": "Action Required: Compliance Issue with Invoice [Invoice Number]",
      "body": "Dear [Vendor Name] team..."
    }
  `;

    try {
        let resultText = "";

        if (!aiConfig) {
            return {
                subject: `Discrepancy Notification: Invoice ${invoice.invoice_number}`,
                body: `Dear ${invoice.vendor_name} Team,\n\nWe are writing to notify you that Invoice #${invoice.invoice_number} for ${invoice.total_amount} ${invoice.currency} has been flagged during our automated compliance check.\n\nIssue: ${invoice.compliance_advisor.warnings[0] || "General compliance discrepancy"}.\n\nPlease provide a corrected invoice so we can proceed with the payment.\n\nRegards,\nCompliance Team`,
                generated_at: new Date().toISOString()
            };
        }

        if (aiConfig.provider === "gemini") {
            resultText = await generateGeminiContent({
                config: aiConfig,
                prompt,
                temperature: 0.7
            });
        } else {
            const openai = getOpenAIClient(aiConfig);
            const response = await openai.chat.completions.create({
                model: aiConfig.model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                response_format: { type: "json_object" }
            });
            resultText = response.choices[0]?.message?.content || "";
        }

        const parsed = parseBetterJson(resultText);

        return {
            subject: parsed.subject,
            body: parsed.body,
            generated_at: new Date().toISOString()
        };
    } catch (error) {
        console.error("Failed to generate vendor email:", error);
        return undefined;
    }
}
