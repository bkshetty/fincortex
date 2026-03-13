import prisma from "./prisma";
import { InvoiceData } from "./types";

export async function listInvoices(): Promise<InvoiceData[]> {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { created_at: "desc" },
      take: 100,
    });
    return invoices as unknown as InvoiceData[];
  } catch (error) {
    console.error("[invoiceStore] Failed to list invoices from Prisma", error);
    return [];
  }
}

export async function findInvoiceById(id: string): Promise<InvoiceData | null> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });
    return invoice as unknown as InvoiceData | null;
  } catch (error) {
    console.error("[invoiceStore] Failed to find invoice by ID", error);
  }
  return null;
}

export async function getInvoiceById(id: string): Promise<InvoiceData | null> {
  return findInvoiceById(id);
}

export async function getLatestInvoiceByVendorAndNumber(
  invoiceNumber: string,
  vendorName: string
): Promise<InvoiceData | null> {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        invoice_number: invoiceNumber.trim(),
        vendor_name: vendorName.trim(),
      },
      orderBy: { created_at: "desc" },
    });
    return invoice as unknown as InvoiceData | null;
  } catch (error) {
    console.error("[invoiceStore] Failed to get latest invoice by vendor/number", error);
  }
  return null;
}

export async function findDuplicateInvoice(
  invoiceNumber: string,
  vendorName: string
): Promise<boolean> {
  try {
    const count = await prisma.invoice.count({
      where: {
        invoice_number: { equals: invoiceNumber.trim(), mode: 'insensitive' },
        vendor_name: { equals: vendorName.trim(), mode: 'insensitive' },
      },
    });
    return count > 0;
  } catch (error) {
    console.error("[invoiceStore] Failed to check for duplicate invoice", error);
    return false;
  }
}

export async function findByImageHash(hash: string): Promise<InvoiceData | undefined> {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { image_hash: hash },
    });
    return (invoice as unknown as InvoiceData) || undefined;
  } catch (error) {
    console.error("[invoiceStore] Failed to find invoice by image hash", error);
  }
  return undefined;
}

export async function saveInvoice(invoice: InvoiceData): Promise<InvoiceData> {
  try {
    const id = invoice.id;
    const data: any = {
      ...invoice,
      created_at: invoice.created_at ? new Date(invoice.created_at) : new Date(),
    };
    
    // Remove ID for creation or use it for update
    delete data.id;

    if (id) {
      console.log(`[invoiceStore] Updating existing invoice: ${id}`);
      const updated = await prisma.invoice.update({
        where: { id },
        data,
      });
      return updated as unknown as InvoiceData;
    } else {
      console.log(`[invoiceStore] Creating new invoice in Prisma database...`);
      const created = await prisma.invoice.create({
        data,
      });
      console.log(`[invoiceStore] New invoice created with ID: ${created.id}`);
      return created as unknown as InvoiceData;
    }
  } catch (error) {
    console.error("[invoiceStore] Failed to save invoice to Prisma", error);
    throw error;
  }
}

export async function clearAllInvoices(): Promise<void> {
  try {
    await prisma.invoice.deleteMany({});
    console.log(`[invoiceStore] Cleared all invoices from Prisma`);
  } catch (error) {
    console.error("[invoiceStore] Failed to clear all invoices from Prisma", error);
    throw error;
  }
}
