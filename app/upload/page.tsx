"use client";

import { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, File as FileIcon, Loader2, Send, MessageSquare, ShieldAlert, ShieldCheck, Ban } from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDuplicateBlock, setIsDuplicateBlock] = useState(false);

  const formatCurrency = (val: number, currency = "INR") => {
    try {
      const validCurrency = typeof currency === 'string' && /^[A-Z]{3}$/i.test(currency) ? currency.toUpperCase() : "INR";
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: validCurrency, maximumFractionDigits: 2 }).format(val);
    } catch {
      return `₹${Number(val).toFixed(2)}`;
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setExtractedData(null); // Explicitly clear any previous results

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/process-invoice', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      // Intercept 409 DUPLICATE before treating it as a generic error
      if (res.status === 409 && result.isDuplicate) {
        setIsDuplicateBlock(true);
        setLoading(false); // Must call this explicitly since we're returning early before finally
        return;
      }

      if (!res.ok) {
        throw new Error(result.message || "Failed to process invoice");
      }

      const inv = result.invoice;

      setExtractedData({
        vendorName: inv.vendor_name || "Unknown",
        invoiceNumber: inv.invoice_number || "N/A",
        date: inv.invoice_date || "N/A",
        currency: inv.currency || "INR",
        subtotal: inv.subtotal || 0,
        taxAmount: inv.tax_amount || 0,
        amount: inv.total_amount || 0, // renamed to match old ui amount
        effectiveTaxRate: inv.effective_tax_rate || 0,
        cgst_rate: inv.cgst_rate || 0,
        sgst_rate: inv.sgst_rate || 0,
        igst_rate: inv.igst_rate || 0,
        cess_rate: inv.cess_rate || 0,
        gstin: inv.vendor_gstin,
        riskScore: inv.risk_score,
        fileUrl: URL.createObjectURL(file), 
        compliance_advisor: inv.compliance_advisor,
        fraud_signals: inv.fraud_signals,
        draft_vendor_email: inv.draft_vendor_email,
        image_hash: inv.image_hash,
        image_url: inv.image_url,
        id: inv.id,
        isDuplicate: result.isDuplicate || false
      });

    } catch (err: any) {
      console.error("Processing error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setExtractedData(null);
    setError(null);
    setIsDuplicateBlock(false);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!extractedData || saving || success) return;
    setSaving(true);
    setError(null);

    try {
      // Reconstruct the invoice data object for the backend
      const invoiceToSave = {
        vendor_name: extractedData.vendorName,
        vendor_gstin: extractedData.gstin,
        invoice_number: extractedData.invoiceNumber,
        invoice_date: extractedData.date,
        currency: extractedData.currency,
        subtotal: extractedData.subtotal,
        tax_amount: extractedData.taxAmount,
        total_amount: extractedData.amount,
        tax_type: "GST",
        effective_tax_rate: extractedData.effectiveTaxRate,
        cgst_rate: extractedData.cgst_rate,
        sgst_rate: extractedData.sgst_rate,
        igst_rate: extractedData.igst_rate,
        cess_rate: extractedData.cess_rate,
        risk_score: extractedData.riskScore,
        compliance_advisor: extractedData.compliance_advisor,
        fraud_signals: extractedData.fraud_signals,
        draft_vendor_email: extractedData.draft_vendor_email,
        image_hash: extractedData.image_hash,
        image_url: extractedData.image_url,
        payment_status: extractedData.riskScore === "HIGH" ? "BLOCKED" : "PENDING"
      };

      const res = await fetch('/api/save-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice: invoiceToSave }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to save invoice");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setExtractedData(null);
        setFile(null);
      }, 2000);

    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-full flex flex-col justify-start transition-colors duration-300">

      {/* ────────────────────────────────────────────── */}
      {/* FRAUD ALERT HARD-STOP SCREEN                     */}
      {/* ────────────────────────────────────────────── */}
      {isDuplicateBlock && (
        <div className="w-full max-w-2xl mx-auto mt-10 md:mt-20 flex flex-col items-center gap-6 text-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="bg-red-600 p-6 rounded-full shadow-2xl shadow-red-600/40 animate-pulse">
              <ShieldAlert size={56} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-red-500 uppercase tracking-[0.3em] mb-3">Fraud Prevention System</p>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
              Duplicate Invoice Detected
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base max-w-md leading-relaxed">
              This invoice was already processed and saved in a previous session.
              Re-submitting an processed invoice is a potential fraud signal and has been blocked.
            </p>
          </div>
          <div className="w-full max-w-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-5 text-left">
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Why was this blocked?</p>
            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
              <li>Exact Vendor Name match found in ledger</li>
              <li>Exact Invoice Number match found in ledger</li>
              <li>Duplicate payments are a top financial fraud vector</li>
            </ul>
          </div>
          <button
            onClick={handleReset}
            className="mt-2 bg-[#0A0F2C] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#151a3a] transition-all shadow-md flex items-center gap-2"
          >
            <Ban size={18} />
            Discard &amp; Start Over
          </button>
        </div>
      )}

      {error && (
        <div className="w-full max-w-2xl mx-auto mt-10 md:mt-20 flex flex-col items-center gap-6 text-center animate-in fade-in duration-300">
          <div className="bg-red-100 p-5 rounded-full">
            <AlertTriangle size={48} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Upload Rejected</h2>
            <p className="text-red-600 dark:text-red-400 font-semibold text-base max-w-md">{error}</p>
          </div>
          <button
            onClick={handleReset}
            className="mt-2 bg-[#0A0F2C] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#151a3a] transition-all shadow-md"
          >
            Try Again
          </button>
        </div>
      )}

      {!isDuplicateBlock && !error && !extractedData ? (
        /* THE UPLOAD DROPZONE */
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 mt-10 md:mt-20">
          <div>
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1437] dark:text-white mb-4 tracking-tight transition-colors">Bill Analysis Intake</h2>
              <p className="text-slate-500 dark:text-gray-400 text-base md:text-lg transition-colors px-4">Drag and drop invoices to extract, validate, and secure.</p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[2rem] p-16 flex flex-col items-center justify-center transition-all group relative max-w-2xl mx-auto bg-white ${isDragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200 dark:border-white/10 dark:bg-[#111111] hover:border-indigo-300 dark:hover:border-indigo-700'}`}
              style={{ boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.03)' }}
            >
              <input
                type="file"
                accept=".pdf,.jpg,.png,.jpeg"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              {loading ? (
                <div className="flex flex-col items-center animate-in fade-in duration-300">
                  <Loader2 size={48} className="text-indigo-600 animate-spin mb-6" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Agentic AI Processing...</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-0 transition-colors">Running compliance checks and OCR</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-300 w-full">
                  <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-full mb-6 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20">
                    <FileIcon size={40} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-center break-all transition-colors">{file.name}</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-8 transition-colors">Ready for analysis</p>
                  <button
                    onClick={(e) => { e.preventDefault(); handleProcess(); }}
                    className="w-full max-w-sm bg-[#0A0F2C] text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#151a3a] transition-all shadow-md z-20 relative"
                  >
                    Upload and Analyze
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-[#f4f7fe] dark:bg-white/5 p-5 rounded-full mb-6 group-hover:scale-110 transition-transform">
                    <UploadCloud size={40} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 transition-colors">Select or drop file here</h3>
                  <p className="text-slate-400 dark:text-gray-500 text-sm mb-0 transition-colors bg-[#f4f7fe] dark:bg-white/5 px-4 py-1.5 rounded-full mt-2">Supports PDF, PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

      ) : !error && extractedData ? (
        /* THE VERIFICATION CARD - Redesigned to match the screenshot Exactly */
        <div className="flex flex-col gap-6 mx-auto w-full max-w-3xl animate-in fade-in zoom-in-95 duration-500 transition-colors">


          {/* Analysis Result Card (The UI to build exactly) */}
          <div className="w-full flex flex-col gap-6">
            
            <div className={`bg-white dark:bg-[#111111] rounded-[1.5rem] p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.02)] border transition-all ${extractedData.isDuplicate ? 'border-red-500 ring-4 ring-red-500/10' : 'border-[#E9EDF4] dark:border-white/5'}`}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 tracking-wider uppercase mb-1">Analysis Result Card</h4>
                  <h2 className="text-2xl font-extrabold text-[#1B254B] dark:text-white transition-colors">
                    {extractedData.isDuplicate ? "Processing Blocked" : "Invoice analyzed successfully"}
                  </h2>
                </div>

                <div className={`px-4 py-1.5 flex items-center justify-center rounded-lg text-xs font-bold ${
                  extractedData.isDuplicate ? 'bg-red-600 text-white' :
                  extractedData.riskScore === 'LOW' ? 'bg-[#E5F9E9] text-[#05A660]' :
                  extractedData.riskScore === 'MEDIUM' ? 'bg-[#FFF4E5] text-[#FF8A00]' :
                  'bg-[#FFE5E5] text-[#E53935]'
                }`}>
                  {extractedData.isDuplicate ? 'DUPLICATE' : extractedData.riskScore}
                </div>
              </div>

              {/* Grid 2x4 Data Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="border border-[#E9EDF4] dark:border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor Name</span>
                  <span className="text-sm font-bold text-[#1B254B] dark:text-white uppercase truncate">{extractedData.vendorName}</span>
                </div>
                <div className="border border-[#E9EDF4] dark:border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor GSTIN</span>
                  <span className="text-sm font-bold text-[#1B254B] dark:text-white uppercase">{extractedData.gstin || "NOT FOUND"}</span>
                </div>
                <div className="border border-[#E9EDF4] dark:border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice Number</span>
                  <span className="text-sm font-bold text-[#1B254B] dark:text-white uppercase">{extractedData.invoiceNumber}</span>
                </div>
                <div className="border border-[#E9EDF4] dark:border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Currency</span>
                  <span className="text-sm font-bold text-[#1B254B] dark:text-white uppercase">{extractedData.currency}</span>
                </div>
                <div className="border border-[#E9EDF4] dark:border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-bold text-[#1B254B] dark:text-white">{formatCurrency(extractedData.subtotal, extractedData.currency)}</span>
                </div>
                <div className="border border-[#E9EDF4] dark:border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax Amount</span>
                  <span className="text-sm font-bold text-[#1B254B] dark:text-white">{formatCurrency(extractedData.taxAmount, extractedData.currency)}</span>
                </div>
                <div className="border border-[#E9EDF4] dark:border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                  <span className="text-sm font-bold text-[#1B254B] dark:text-white">{formatCurrency(extractedData.amount, extractedData.currency)}</span>
                </div>
                <div className="border border-[#E9EDF4] dark:border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Effective Tax Rate</span>
                  <span className="text-sm font-bold text-[#1B254B] dark:text-white">{extractedData.effectiveTaxRate.toFixed(2)}%</span>
                </div>
              </div>

              {/* Tax Breakdown Grid */}
              <div className="bg-[#F8F9FB] dark:bg-white/[0.02] border border-[#E9EDF4] dark:border-white/5 rounded-2xl p-6 mb-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tax Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-[#111111] border border-[#E9EDF4] dark:border-white/10 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CGST</span>
                    <span className="text-sm font-bold text-[#1B254B] dark:text-white">{extractedData.cgst_rate.toFixed(2)}%</span>
                  </div>
                  <div className="bg-white dark:bg-[#111111] border border-[#E9EDF4] dark:border-white/10 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SGST</span>
                     <span className="text-sm font-bold text-[#1B254B] dark:text-white">{extractedData.sgst_rate.toFixed(2)}%</span>
                  </div>
                  <div className="bg-white dark:bg-[#111111] border border-[#E9EDF4] dark:border-white/10 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IGST</span>
                     <span className="text-sm font-bold text-[#1B254B] dark:text-white">{extractedData.igst_rate.toFixed(2)}%</span>
                  </div>
                  <div className="bg-white dark:bg-[#111111] border border-[#E9EDF4] dark:border-white/10 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CESS</span>
                     <span className="text-sm font-bold text-[#1B254B] dark:text-white">{extractedData.cess_rate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Compliance Advisor */}
              <div className="bg-[#F8F9FB] dark:bg-white/[0.02] border border-[#E9EDF4] dark:border-white/5 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Compliance Advisor</h4>
                  <ul className="space-y-2">
                    {extractedData.compliance_advisor?.checks?.map((check: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="text-[#05A660] font-medium min-w-max">OK</span> {check}
                      </li>
                    ))}
                    {extractedData.compliance_advisor?.warnings?.map((warning: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="text-[#FF8A00] font-medium min-w-max">Warning</span> {warning}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-px bg-[#E9EDF4] dark:bg-white/10 hidden md:block"></div>
                <div className="flex-1">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recommendation</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-300">
                     SYSTEM ALERT: Discrepancies found. Review fraud signals and AI-drafted vendor email before proceeding.
                   </p>
                </div>
              </div>

              {/* Fraud Signals */}
              <div className="bg-[#F8F9FB] dark:bg-white/[0.02] border border-[#E9EDF4] dark:border-white/5 rounded-2xl p-6 mb-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Fraud Signals</h4>
                {extractedData.fraud_signals && extractedData.fraud_signals.length > 0 ? (
                  <ul className="space-y-2">
                    {extractedData.fraud_signals.map((sig: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="text-red-500 font-medium min-w-max">Warning</span> {sig.label}: {sig.description}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic">No fraud signals detected.</p>
                )}
              </div>

              {/* Autonomous Vendor Resolution Email Draft */}
              {extractedData.draft_vendor_email && (
                 <div className="border border-[#E2E8F0] dark:border-[#2D3748] rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-[#111111]">
                   <div className="bg-[#EDF2F7] dark:bg-[#1A202C] px-6 py-4 border-b border-[#E2E8F0] dark:border-[#2D3748] flex justify-between items-center">
                     <div>
                       <h3 className="text-sm font-bold text-[#2A4365] dark:text-[#90CDF4] uppercase tracking-wider mb-1">Autonomous Vendor Resolution</h3>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Agentic AI generated this draft to resolve compliance issues.</p>
                     </div>
                     <span className="bg-[#EBF8FF] text-[#3182CE] text-[10px] font-bold px-3 py-1 rounded-full border border-[#BEE3F8]">AGENT DRAFT</span>
                   </div>
                   <div className="p-6">
                     <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#2D3748] rounded-xl p-5 shadow-inner flex flex-col gap-3">
                       <p className="text-sm font-bold text-slate-900 dark:text-white border-b border-[#E2E8F0] dark:border-[#2D3748] pb-3">
                         Subject: {extractedData.draft_vendor_email.subject}
                       </p>
                       <pre className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                         {extractedData.draft_vendor_email.body}
                       </pre>
                     </div>
                   </div>
                 </div>
              )}

            </div>
            
            {/* Navigation / Actions below card */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#111111]">
                 <button onClick={() => setExtractedData(null)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                   Discard & Try Another
                 </button>
                 
                 <button 
                  disabled={extractedData.isDuplicate || saving || success}
                  onClick={handleSave}
                  className={`flex-[2] py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                    extractedData.isDuplicate 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' 
                    : success ? 'bg-green-600 text-white cursor-default' : 'bg-[#0A0F2C] text-white hover:bg-[#151a3a]'
                  }`}
                 >
                   {saving ? (
                     <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving to Ledger...
                     </>
                   ) : extractedData.isDuplicate ? (
                     <>
                       <Ban size={18} />
                       Cannot Save Duplicate
                     </>
                   ) : success ? (
                     <>
                        <CheckCircle2 size={18} />
                        Invoice Saved!
                     </>
                   ) : (
                     <>
                       <CheckCircle2 size={18} />
                       Approve & Save
                     </>
                   )}
                 </button>
            </div>

          </div>
        </div>
      ) : null}

    </div>
  );
}
