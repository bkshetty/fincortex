import { listInvoices } from "@/lib/invoiceStore";
import { InvoiceData } from "@/lib/types";

const EXPORT_HEADERS = ["vendor_name", "invoice_number", "currency", "tax_amount", "total_amount", "risk_score", "invoice_date"];

function escapeCsvValue(value: string | number) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildExportCsv(invoices: InvoiceData[]) {
  const rows = invoices.map((invoice) =>
    [
      invoice.vendor_name || "",
      invoice.invoice_number || "",
      invoice.currency || "",
      Number(invoice.tax_amount || 0).toFixed(2),
      Number(invoice.total_amount || 0).toFixed(2),
      invoice.risk_score || "",
      invoice.invoice_date || ""
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  return [EXPORT_HEADERS.join(","), ...rows].join("\n");
}

export async function GET() {
  try {
    const invoices = await listInvoices();
    const csv = buildExportCsv(invoices);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="invoices-export.csv"'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error instanceof Error ? error.message : "Failed to export invoices" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
