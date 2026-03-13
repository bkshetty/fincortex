"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardCharts from "@/components/DashboardCharts";
import RiskBadge from "@/components/RiskBadge";
import { formatCurrency, formatCurrencyTotals } from "@/lib/formatCurrency";
import { InvoiceData } from "@/lib/types";
import { ExternalLink, FileIcon } from "lucide-react";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [gstExporting, setGstExporting] = useState(false);
  const [gstSuccessMessage, setGstSuccessMessage] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const res = await fetch(`/api/invoices?t=${Date.now()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load invoices");
        setInvoices(data.invoices || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    void loadInvoices();
  }, []);

  const summary = useMemo(() => {
    return {
      totalInvoices: invoices.length,
      totalProcessedValue: formatCurrencyTotals(invoices.map((invoice) => ({ amount: invoice.total_amount, currency: invoice.currency }))),
      highRiskInvoices: invoices.filter((invoice) => invoice.risk_score === "HIGH").length,
      totalTaxCollected: formatCurrencyTotals(invoices.map((invoice) => ({ amount: invoice.tax_amount, currency: invoice.currency })))
    };
  }, [invoices]);

  const onExportCsv = async () => {
    try {
      setExporting(true);
      setGstSuccessMessage(null);
      // Fallback to the known export api route
      const res = await fetch(window.location.origin + "/api/export-csv");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to export invoices");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "invoices-export.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export invoices");
    } finally {
      setExporting(false);
    }
  };

  const onGenerateGstUpload = async () => {
    try {
      setGstExporting(true);
      setGstSuccessMessage(null);
      const res = await fetch("/api/gst-upload"); // assuming user will build this or we'll mock it
      if (!res.ok) {
        throw new Error("Failed to generate GST upload file. Route not yet implemented.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "gst-upload-ready.json";
      link.click();
      URL.revokeObjectURL(url);
      setGstSuccessMessage("GST Upload File Generated Successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate GST upload file. Make sure the API exists.");
    } finally {
      setGstExporting(false);
    }
  };

  const onClearAll = async () => {
    if (!window.confirm("Delete all saved invoices? This cannot be undone.")) return;
    try {
      setClearing(true);
      setError(null);
      setGstSuccessMessage(null);
      const res = await fetch("/api/invoices", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to clear invoices");
      }
      setInvoices([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear invoices");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 pt-10 sm:pt-4 px-4 sm:px-12 max-w-7xl mx-auto h-full pb-10">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Compliance analytics at a glance</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Track invoice volume, processed value, GST totals, and risk concentration in one simple dashboard.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <button
            onClick={onExportCsv}
            disabled={exporting || loading}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <button
            onClick={onGenerateGstUpload}
            disabled={gstExporting || loading}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {gstExporting ? "Generating..." : "Generate GST Upload File"}
          </button>
          <button
            onClick={onClearAll}
            disabled={clearing || loading || invoices.length === 0}
            className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {clearing ? "Clearing..." : "Clear All"}
          </button>
          <p className="max-w-sm text-xs text-slate-500 sm:text-right">
            This file follows GST invoice upload structure and can be used to assist in filing returns such as GSTR-1.
          </p>
          {gstSuccessMessage && <p className="max-w-sm text-xs font-medium text-emerald-700 sm:text-right">{gstSuccessMessage}</p>}
        </div>
      </section>

      {loading && <p className="rounded-[1.5rem] bg-white/80 p-5 text-sm text-slate-600">Loading dashboard...</p>}
      {error && <p className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</p>}

      {!loading && !error && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Total Invoices" value={String(summary.totalInvoices)} />
            <SummaryCard label="Total Processed Value" value={summary.totalProcessedValue} />
            <SummaryCard label="High Risk Invoices" value={String(summary.highRiskInvoices)} />
            <SummaryCard label="Total Tax Collected" value={summary.totalTaxCollected} />
          </section>

          <DashboardCharts invoices={invoices} />

          <section className="rounded-[2rem] border border-white/60 bg-white/85 p-4 shadow-lg shadow-slate-900/5 backdrop-blur sm:p-6">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Invoice Table</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Processed invoices</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Vendor</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Invoice Number</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Total Amount</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Risk Level</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-center">View</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, index) => (
                    <tr key={invoice.id ?? `${invoice.invoice_number}-${index}`} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-4 font-semibold text-slate-900">{invoice.vendor_name || "Not detected"}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{invoice.invoice_number || "Not detected"}</td>
                      <td className="px-4 py-4 font-medium text-slate-700">{formatCurrency(invoice.total_amount, invoice.currency)}</td>
                      <td className="px-4 py-4">
                        <RiskBadge score={invoice.risk_score} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        {invoice.image_url ? (
                          <a href={invoice.image_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded-lg transition-all" title="View Invoice">
                            <ExternalLink size={18} />
                          </a>
                        ) : (
                          <span className="text-slate-300 dark:text-gray-700" title="No file available">
                            <FileIcon size={18} className="mx-auto" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No invoices processed yet. Upload one from the Upload page to start tracking metrics.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    </article>
  );
}
