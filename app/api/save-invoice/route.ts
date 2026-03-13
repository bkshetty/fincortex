import { NextResponse } from "next/server";
import { saveInvoice } from "@/lib/invoiceStore";
import { withCors, handlePreflight } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handlePreflight(request);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try {
    const body = await request.json();
    const { invoice } = body;

    if (!invoice) {
      return withCors(
        NextResponse.json({ success: false, message: "No invoice data provided" }, { status: 400 }),
        origin
      );
    }

    console.log(`[save-invoice] Received save request for Vendor: ${invoice.vendor_name}, Invoice: ${invoice.invoice_number}`);
    
    // TRIPLE CHECK: Final check before writing to DB
    const { findDuplicateInvoice } = await import("@/lib/invoiceStore");
    const isDuplicate = await findDuplicateInvoice(invoice.invoice_number, invoice.vendor_name);
    
    if (isDuplicate) {
      console.warn(`[save-invoice] BLOCKING DUPLICATE at final save step: ${invoice.invoice_number}`);
      return withCors(
        NextResponse.json({ success: false, message: "CRITICAL: This invoice has already been saved by another session." }, { status: 409 }),
        origin
      );
    }

    const saved = await saveInvoice(invoice);
    console.log(`[save-invoice] Successfully saved invoice ID: ${saved.id}`);

    return withCors(
      NextResponse.json({ 
        success: true, 
        message: "Invoice approved and saved successfully",
        invoice: saved 
      }),
      origin
    );
  } catch (error) {
    console.error("[save-invoice] Error saving invoice:", error);
    return withCors(
      NextResponse.json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to save invoice" 
      }, { status: 500 }),
      origin
    );
  }
}
