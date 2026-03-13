import { listInvoices } from "@/lib/invoiceStore";
import { InvoiceData } from "@/lib/types";

export const runtime = "nodejs";

const DEFAULT_GSTIN = process.env.DEFAULT_GSTIN || "22AAAAA0000A1Z5";

function hasRequiredFields(invoice: InvoiceData) {
  const hasInvoiceNumber = Boolean(invoice.invoice_number?.trim());
  const hasSubtotal = Number.isFinite(invoice.subtotal);
  const hasTaxAmount = Number.isFinite(invoice.tax_amount);
  return hasInvoiceNumber && hasSubtotal && hasTaxAmount;
}

function normalizeTaxColumns(invoice: InvoiceData) {
  const cgstAmount = Number(invoice.cgst_amount || 0);
  const sgstAmount = Number(invoice.sgst_amount || 0);
  const igstAmount = Number(invoice.igst_amount || 0);
  const hasExplicitBreakdown = cgstAmount > 0 || sgstAmount > 0 || igstAmount > 0;
  const taxAmount = Number(invoice.tax_amount || 0);
  const normalizedType = (invoice.tax_type || "").trim().toUpperCase();

  if (hasExplicitBreakdown) {
    return {
      cgst: Number(cgstAmount.toFixed(2)),
      sgst: Number(sgstAmount.toFixed(2)),
      igst: Number(igstAmount.toFixed(2))
    };
  }

  if (normalizedType === "GST") {
    const halfTax = Number((taxAmount / 2).toFixed(2));
    return { cgst: halfTax, sgst: halfTax, igst: 0 };
  }

  if (normalizedType === "VAT") {
    return { cgst: 0, sgst: 0, igst: Number(taxAmount.toFixed(2)) };
  }

  return { cgst: 0, sgst: 0, igst: Number(taxAmount.toFixed(2)) };
}

function buildGstPayload(invoices: InvoiceData[]) {
  return {
    gstin: DEFAULT_GSTIN,
    invoices: invoices.map((invoice) => {
      const tax = normalizeTaxColumns(invoice);

      return {
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date || "",
        vendor: invoice.vendor_name || "",
        taxable_value: Number(invoice.subtotal.toFixed(2)),
        cgst: tax.cgst,
        sgst: tax.sgst,
        igst: tax.igst,
        total: Number(invoice.total_amount.toFixed(2))
      };
    })
  };
}

export async function GET() {
  try {
    const allInvoices = await listInvoices();

    const validInvoices: InvoiceData[] = [];
    const skippedInvoiceIds: string[] = [];

    allInvoices.forEach((invoice) => {
      if (hasRequiredFields(invoice)) {
        validInvoices.push(invoice);
        return;
      }

      skippedInvoiceIds.push(invoice.id || invoice.invoice_number || "unknown");
    });

    if (skippedInvoiceIds.length > 0) {
      console.warn(`[gst-upload] Skipped ${skippedInvoiceIds.length} invoice(s): ${skippedInvoiceIds.join(", ")}`);
    }

    const payload = buildGstPayload(validInvoices);
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="gst-upload-ready.json"'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error instanceof Error ? error.message : "Failed to generate GST upload file" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
