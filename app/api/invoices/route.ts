import { NextResponse } from "next/server";
import { clearAllInvoices, listInvoices } from "@/lib/invoiceStore";
import { handlePreflight, withCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handlePreflight(request);
}


export async function GET(request: Request) {
  try {
    const invoices = await listInvoices();
    return withCors(
      NextResponse.json({ invoices }),
      request.headers.get("origin")
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { message: error instanceof Error ? error.message : "Failed to load invoices" },
        { status: 500 }
      ),
      request.headers.get("origin")
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await clearAllInvoices();
    return withCors(
      NextResponse.json({ success: true }),
      request.headers.get("origin")
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { message: error instanceof Error ? error.message : "Failed to clear invoices" },
        { status: 500 }
      ),
      request.headers.get("origin")
    );
  }
}

