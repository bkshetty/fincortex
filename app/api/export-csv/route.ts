import { listInvoices, getInvoiceById, getLatestInvoiceByVendorAndNumber } from "@/lib/invoiceStore";
import { InvoiceData } from "@/lib/types";

const CSV_HEADERS = [
  "Vendor",
  "Invoice Number",
  "Date",
  "Currency",
  "Subtotal",
  "Tax Amount",
  "Total Amount",
  "Effective Tax Rate",
  "Risk Level"
];

function escapeCsvValue(value: string | number) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCsv(invoices: InvoiceData[]) {
  return [
    CSV_HEADERS.join(","),
    ...invoices.map((invoice) =>
      [
        invoice.vendor_name,
        invoice.invoice_number,
        invoice.invoice_date,
        invoice.currency,
        invoice.subtotal.toFixed(2),
        invoice.tax_amount.toFixed(2),
        invoice.total_amount.toFixed(2),
        `${invoice.effective_tax_rate.toFixed(2)}%`,
        invoice.risk_score
      ]
        .map(escapeCsvValue)
        .join(",")
    )
  ].join("\n");
}

function writePdf(invoice: InvoiceData) {
  return import("pdfkit/js/pdfkit.standalone").then(({ default: PDFDocument }) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks: Buffer[] = [];

    return new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.font("Helvetica-Bold").fontSize(22).text("Compliance Report");
      doc.moveDown();

      doc.font("Helvetica-Bold").fontSize(14).text("Invoice Summary");
      doc.font("Helvetica").fontSize(11);
      doc.text(`Vendor: ${invoice.vendor_name || "Not detected"}`);
      doc.text(`Invoice Number: ${invoice.invoice_number || "Not detected"}`);
      doc.text(`Invoice Date: ${invoice.invoice_date || "Not detected"}`);
      doc.text(`Currency: ${invoice.currency}`);
      doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)}`);
      doc.text(`Tax Amount: ${invoice.tax_amount.toFixed(2)}`);
      doc.text(`Total Amount: ${invoice.total_amount.toFixed(2)}`);
      doc.moveDown();

      doc.font("Helvetica-Bold").text("Tax Breakdown");
      doc.font("Helvetica");
      doc.text(`Effective Tax Rate: ${invoice.effective_tax_rate.toFixed(2)}%`);
      doc.text(`CGST: ${invoice.cgst_rate?.toFixed(2) ?? "0.00"}%`);
      doc.text(`SGST: ${invoice.sgst_rate?.toFixed(2) ?? "0.00"}%`);
      doc.text(`IGST: ${invoice.igst_rate?.toFixed(2) ?? "0.00"}%`);
      doc.text(`CESS: ${invoice.cess_rate?.toFixed(2) ?? "0.00"}%`);
      doc.moveDown();

      doc.font("Helvetica-Bold").text("Compliance Analysis");
      doc.font("Helvetica");
      invoice.compliance_advisor.checks.forEach((item) => doc.text(`- ${item}`));
      invoice.compliance_advisor.warnings.forEach((item) => doc.text(`- ${item}`));
      doc.text(`Recommendation: ${invoice.compliance_advisor.recommendation}`);
      doc.moveDown();

      doc.font("Helvetica-Bold").text("Fraud Signals");
      doc.font("Helvetica");
      if (invoice.fraud_signals.length === 0) {
        doc.text("- No major fraud signals detected");
      } else {
        invoice.fraud_signals.forEach((signal) => doc.text(`- ${signal.label}`));
      }
      doc.moveDown();

      doc.font("Helvetica-Bold").text(`Risk Score: ${invoice.risk_score}`);
      doc.end();
    });
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    if (format === "pdf") {
      const id = searchParams.get("id");
      const invoiceNumber = searchParams.get("invoice_number") || "";
      const vendorName = searchParams.get("vendor_name") || "";

      if (!id && (!invoiceNumber.trim() || !vendorName.trim())) {
        return new Response(JSON.stringify({ message: "Invoice id is required for PDF export" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      let invoice: InvoiceData | null = null;
      if (id) {
        invoice = await getInvoiceById(id);
      }
      if (!invoice && invoiceNumber.trim() && vendorName.trim()) {
        invoice = await getLatestInvoiceByVendorAndNumber(invoiceNumber, vendorName);
      }

      if (!invoice) {
        return new Response(JSON.stringify({ message: "Invoice not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      const pdf = await writePdf(invoice);
      return new Response(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="compliance-report-${invoice.invoice_number || invoice.id}.pdf"`
        }
      });
    }

    const invoices = await listInvoices();
    const csv = buildCsv(invoices);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="compliancepilot-invoices.csv"'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error instanceof Error ? error.message : "Failed to export report" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
