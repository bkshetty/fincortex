"use client";

import { useState, useMemo, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, File as FileIcon, Loader2, Send, MessageSquare, Search, Trash2 } from 'lucide-react';
import { InvoiceData } from '@/lib/types';

export default function UploadHub() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [history, setHistory] = useState<InvoiceData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- FETCH HISTORY ON LOAD ---
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (data.invoices) {
        setHistory(data.invoices);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;
    const lower = searchTerm.toLowerCase();
    return history.filter(inv =>
      (inv.vendor_name || "").toLowerCase().includes(lower) ||
      (inv.invoice_number || "").toLowerCase().includes(lower)
    );
  }, [searchTerm, history]);

  const formatCurrency = (val: number, currency = "INR") => {
    try {
      const validCurrency = typeof currency === 'string' && /^[A-Z]{3}$/i.test(currency) ? currency.toUpperCase() : "INR";
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: validCurrency, maximumFractionDigits: 0 }).format(val);
    } catch {
      return `₹${Number(val).toFixed(2)}`;
    }
  };

  // --- REAL PROCESSING LOGIC ---
  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/process-invoice', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to process invoice");
      }

      const inv = result.invoice;

      setExtractedData({
        vendorName: inv.vendor_name,
        invoiceNumber: inv.invoice_number,
        date: inv.invoice_date,
        amount: formatCurrency(inv.total_amount, inv.currency),
        gstin: inv.vendor_gstin,
        riskScore: inv.risk_score,
        fileUrl: URL.createObjectURL(file), // Still show local preview
        compliance_advisor: inv.compliance_advisor,
        fraud_signals: inv.fraud_signals
      });

      // Refresh history list
      fetchHistory();
    } catch (err: any) {
      console.error("Processing error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all analysis history?")) return;
    try {
      await fetch('/api/invoices', { method: 'DELETE' });
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-full flex flex-col justify-center transition-colors duration-300">

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertTriangle size={20} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {!extractedData ? (
        /* STATE 1: THE UPLOAD DROPZONE */
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-12">

          <div>
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors">Bill Analysis Intake</h2>
              <p className="text-slate-500 dark:text-gray-400 text-lg transition-colors">Drag and drop invoices to extract, validate, and secure.</p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[3rem] p-16 flex flex-col items-center justify-center transition-all group relative max-w-2xl mx-auto ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-[1.02]' : 'border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10'}`}
            >
              <input
                type="file"
                accept=".pdf,.jpg,.png,.jpeg"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              {loading ? (
                <div className="flex flex-col items-center animate-in fade-in duration-300">
                  <Loader2 size={48} className="text-blue-500 animate-spin mb-6" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Agentic AI Processing...</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-0 transition-colors">Running compliance checks and OCR</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                  <div className="bg-green-100 dark:bg-green-500/20 p-4 rounded-full mb-6 text-green-600 dark:text-green-400">
                    <FileIcon size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center break-all transition-colors">{file.name}</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-8 transition-colors">Ready for analysis</p>
                  <button
                    onClick={(e) => { e.preventDefault(); handleProcess(); }}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 hover:scale-105 transition-all shadow-lg z-20 relative"
                  >
                    Analyze Document <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-blue-100 dark:bg-blue-600/20 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform">
                    <UploadCloud size={48} className="text-blue-600 dark:text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Select or drop file here</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-0 transition-colors">Supports PDF, PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* HISTORY TABLE */}
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden transition-colors duration-300">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Invoices</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400">View previously analyzed bills.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                  <input
                    type="text"
                    placeholder="Search vendor or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white w-full sm:w-64 transition-all"
                  />
                </div>
                {history.length > 0 && (
                  <button onClick={handleClearAll} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Clear History">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 transition-colors">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Invoice / Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {filteredHistory.map((inv, i) => (
                    <tr key={inv.id || i} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{inv.invoice_number}</div>
                        <div className="text-xs text-slate-500 dark:text-gray-500">{inv.invoice_date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-gray-300">
                        {inv.vendor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(inv.total_amount, inv.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 w-max ${inv.risk_score === 'HIGH' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20' :
                          inv.risk_score === 'MEDIUM' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20' :
                            'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20'
                          }`}>
                          {inv.risk_score === 'HIGH' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                          {inv.risk_score}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-gray-400">
                        {searchTerm ? `No invoices found matching "${searchTerm}"` : "No analyzed invoices in history."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      ) : (
        /* STATE 2: THE SPLIT-SCREEN VERIFICATION */
        <div className="flex flex-col lg:flex-row h-[85vh] bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500 transition-colors">

          {/* LEFT: Document Viewer */}
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/50 p-6 flex flex-col transition-colors">
            <h3 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4 transition-colors">Source Document</h3>
            <div className="flex-1 rounded-xl overflow-hidden bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent flex items-center justify-center p-2 transition-colors shadow-inner text-slate-400 text-xs">
              {extractedData.fileUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={extractedData.fileUrl} alt="Invoice" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <FileIcon size={64} className="opacity-20 text-slate-400" />
                  <p>PDF/Document Viewer</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-[#111111] transition-colors relative">
            <div className="p-8 pb-4 flex-1 overflow-y-auto">

              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1 transition-colors">Analysis Complete</h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400 transition-colors">Review the AI extraction and compliance flags.</p>
                </div>

                <span className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border shadow-sm transition-colors ${extractedData.riskScore === 'LOW'
                  ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20'
                  : extractedData.riskScore === 'MEDIUM'
                    ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'
                  }`}>
                  {extractedData.riskScore === 'LOW' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {extractedData.riskScore} RISK
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                  <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">Vendor</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{extractedData.vendorName || "N/A"}</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                  <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{extractedData.amount}</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                  <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">Invoice #</p>
                  <p className="text-base font-semibold text-slate-700 dark:text-gray-300">{extractedData.invoiceNumber || "N/A"}</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                  <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-base font-semibold text-slate-700 dark:text-gray-300">{extractedData.date || "N/A"}</p>
                </div>
              </div>

              {extractedData.compliance_advisor?.checks && extractedData.compliance_advisor.checks.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 transition-colors">
                    <CheckCircle2 size={18} className="text-green-500" /> Compliance Checks Passed
                  </h3>
                  <ul className="space-y-2">
                    {extractedData.compliance_advisor.checks.map((check: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-300 transition-colors">
                        <span className="text-green-500 mt-0.5">•</span> {check}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {extractedData.compliance_advisor?.warnings && extractedData.compliance_advisor.warnings.length > 0 && (
                <div className="mb-8 p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-2xl transition-colors">
                  <h3 className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} /> Advisories & Warnings
                  </h3>
                  <ul className="space-y-3">
                    {extractedData.compliance_advisor.warnings.map((warning: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300/90 font-medium">
                        <span className="mt-0.5">-</span> {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#151515] transition-colors rounded-br-2xl">

              <div className="relative flex items-center mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MessageSquare size={16} className="text-slate-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask AI about this bill..."
                  className="w-full bg-white dark:bg-black border border-slate-300 dark:border-white/10 rounded-full py-3 pl-10 pr-12 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
                <button
                  className={`absolute right-1 top-1 bottom-1 p-2 rounded-full transition-colors flex items-center justify-center ${chatMessage ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-transparent text-slate-300 dark:text-gray-600 cursor-not-allowed'}`}
                >
                  <Send size={14} />
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setExtractedData(null)} className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all font-semibold text-sm bg-white dark:bg-transparent shadow-sm dark:shadow-none">
                  Discard
                </button>
                <button onClick={() => setExtractedData(null)} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 text-sm">
                  Commit to Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}