import fs from 'fs';
import path from 'path';
import { randomUUID } from "crypto";
import { InvoiceData } from "./types";

const DATA_FILE = path.join(process.cwd(), 'data', 'invoices.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

function readInvoices(): InvoiceData[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("[invoiceStore] Failed to read invoices data file", error);
  }
  return [];
}

function writeInvoices(invoices: InvoiceData[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(invoices, null, 2), 'utf-8');
  } catch (error) {
    console.error("[invoiceStore] Failed to write invoices data file", error);
  }
}

function sortInvoices(invoices: InvoiceData[]): InvoiceData[] {
  return [...invoices].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db2 = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db2 - da;
  });
}

export async function listInvoices(): Promise<InvoiceData[]> {
  const invoices = readInvoices();
  return sortInvoices(invoices).slice(0, 100);
}

export async function findInvoiceById(id: string): Promise<InvoiceData | null> {
  const invoices = readInvoices();
  return invoices.find((inv) => inv.id === id) || null;
}

export async function getInvoiceById(id: string): Promise<InvoiceData | null> {
  return findInvoiceById(id);
}

export async function getLatestInvoiceByVendorAndNumber(
  invoiceNumber: string,
  vendorName: string
): Promise<InvoiceData | null> {
  const invoices = sortInvoices(readInvoices());
  const matches = invoices.filter(
    (inv) =>
      inv.invoice_number.trim().toLowerCase() === invoiceNumber.trim().toLowerCase() &&
      inv.vendor_name.trim().toLowerCase() === vendorName.trim().toLowerCase()
  );
  return matches[0] ?? null;
}

export async function findDuplicateInvoice(
  invoiceNumber: string,
  vendorName: string
): Promise<boolean> {
  const invoices = readInvoices();
  return invoices.some(
    (inv) =>
      inv.invoice_number.trim().toLowerCase() === invoiceNumber.trim().toLowerCase() &&
      inv.vendor_name.trim().toLowerCase() === vendorName.trim().toLowerCase()
  );
}

export async function findByImageHash(hash: string): Promise<InvoiceData | undefined> {
  const invoices = readInvoices();
  return invoices.find((inv) => inv.image_hash === hash);
}

export async function saveInvoice(invoice: InvoiceData): Promise<InvoiceData> {
  const invoices = readInvoices();
  const id = invoice.id || randomUUID();
  const row: InvoiceData = {
    ...invoice,
    id,
    created_at: invoice.created_at || new Date().toISOString(),
  };

  const existingIndex = invoices.findIndex((inv) => inv.id === id);
  if (existingIndex >= 0) {
    invoices[existingIndex] = { ...invoices[existingIndex], ...row };
  } else {
    invoices.push(row);
  }

  writeInvoices(invoices);
  console.log(`[invoiceStore] Saved invoice to local data file: ${id}`);
  return row;
}

export async function clearAllInvoices(): Promise<void> {
  writeInvoices([]);
  console.log(`[invoiceStore] Cleared all invoices from local data file`);
}
