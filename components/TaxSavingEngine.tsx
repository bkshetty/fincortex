"use client";

import React, { useState, useEffect } from "react";
import { 
  Loader2, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight,
  Briefcase,
  IndianRupee,
  FileText,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

interface TaxTip {
  invoice_id: string;
  vendor_name: string;
  invoice_number: string;
  tip_title: string;
  explanation: string;
  estimated_saving: number;
  priority: string;
  category: string;
}

export default function TaxSavingEngine() {
  const [tips, setTips] = useState<TaxTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [totalSaving, setTotalSaving] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalTaxPaid, setTotalTaxPaid] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/tax-recommendations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setTips(data.tips || []);
      setTotalSaving(data.total_saving || 0);
      setTotalProcessed(data.total_processed || 0);
      setTotalTaxPaid(data.total_tax_paid || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      setDismissedIds(new Set());
      setFlaggedIds(new Set());
      const res = await fetch("/api/tax-recommendations", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setTips(data.tips || []);
      setTotalSaving(data.total_saving || 0);
      setTotalProcessed(data.total_processed || 0);
      setTotalTaxPaid(data.total_tax_paid || 0);
    } catch (err: any) {
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const flagToCA = (tipKey: string) => {
    setFlaggedIds(prev => new Set([...prev, tipKey]));
  };

  const dismiss = (tipKey: string) => {
    setDismissedIds(prev => new Set([...prev, tipKey]));
  };

  const visibleTips = tips.filter(t => {
    const key = `${t.invoice_id}-${t.category}`;
    return !dismissedIds.has(key);
  });

  const activeSaving = visibleTips.reduce((sum, t) => sum + (t.estimated_saving || 0), 0);

  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    "ITC": { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-500/20" },
    "GSTIN": { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-500/20" },
    "GST Rate": { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/20" },
    "Compliance": { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-500/20" },
    "Payment Timing": { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/20" },
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-white/5 rounded-2xl p-6 h-72 animate-pulse border border-slate-100 dark:border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* 1. Top Banner — Only show when we have tips */}
      {visibleTips.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-5 rounded-3xl backdrop-blur-md border border-white/20">
                <ShieldCheck size={48} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  💡 ₹{activeSaving.toLocaleString('en-IN')} potential tax savings
                </h2>
                <p className="text-emerald-50 opacity-90 font-medium text-base mt-1">
                  Based on {tips.length} tips from your {new Set(tips.map(t => t.invoice_id)).size} invoices • Total tax paid: ₹{totalTaxPaid.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                </p>
              </div>
            </div>
            <button 
              onClick={runAnalysis}
              disabled={analyzing}
              className="relative z-10 bg-white text-emerald-700 px-10 py-5 rounded-[1.5rem] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-black/10 disabled:opacity-70 disabled:scale-100 shrink-0"
            >
              {analyzing ? <Loader2 size={24} className="animate-spin" /> : <TrendingUp size={24} />}
              {analyzing ? "Re-analyzing..." : "Re-analyze"}
            </button>
          </div>
        </div>
      )}

      {/* 2. Action Bar */}
      <div className="flex justify-between items-center px-4">
        <div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Per-Invoice Tax Tips</p>
           {totalProcessed > 0 && (
             <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
               Total processed value: ₹{totalProcessed.toLocaleString('en-IN', {maximumFractionDigits: 2})}
             </p>
           )}
        </div>
        {visibleTips.length === 0 && !analyzing && (
          <button 
            onClick={runAnalysis}
            disabled={analyzing}
            className="bg-[#0A0F2C] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#151a3a] transition-all flex items-center gap-2 shadow-xl disabled:opacity-70"
          >
            {analyzing ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
            {analyzing ? "Analyzing invoices..." : "🔍 Analyze Invoices"}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 p-6 rounded-3xl text-rose-700 dark:text-rose-400 flex items-center justify-between mx-4">
          <div className="flex items-center gap-3 font-semibold">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
          <button onClick={runAnalysis} className="bg-rose-100 dark:bg-rose-900/30 px-4 py-2 rounded-xl text-rose-800 dark:text-rose-300 font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors">Retry</button>
        </div>
      )}

      {/* 3. Per-Invoice Tax Tip Cards */}
      <div className="grid gap-6 md:grid-cols-2 px-4">
        {visibleTips.map((tip, index) => {
          const key = `${tip.invoice_id}-${tip.category}`;
          const isFlagged = flaggedIds.has(key);
          const catStyle = categoryColors[tip.category] || categoryColors["Compliance"];

          return (
            <div key={key} className="bg-white dark:bg-[#111111] rounded-[2rem] p-7 shadow-[0px_8px_32px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-white/5 transition-all hover:translate-y-[-4px] hover:shadow-xl relative overflow-hidden group">
              
              {/* Header: Priority + Category */}
              <div className="flex justify-between items-start mb-5">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  tip.priority === 'high' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 
                  tip.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 
                  'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {tip.priority === 'high' ? '🔴 HIGH' : tip.priority === 'medium' ? '🟡 MEDIUM' : '🟢 LOW'}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                  {tip.category}
                </div>
              </div>

              {/* Invoice Reference */}
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500 mb-3 font-semibold">
                <FileText size={14} />
                <span>{tip.vendor_name}</span>
                <span className="text-slate-300 dark:text-gray-700">•</span>
                <span className="font-mono">{tip.invoice_number}</span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-extrabold text-[#1B254B] dark:text-white mb-3 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {tip.tip_title}
              </h3>
              
              {/* Explanation */}
              <p className="text-[13px] text-slate-600 dark:text-gray-400 leading-relaxed min-h-[44px]">
                {tip.explanation}
              </p>

              {/* Estimated Saving */}
              <div className="mt-5 bg-emerald-50/50 dark:bg-emerald-950/10 border-l-[6px] border-emerald-500 p-5 rounded-r-2xl">
                 <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Estimated Saving</p>
                 <div className="flex items-center gap-1">
                   <IndianRupee size={24} className="text-emerald-700 dark:text-emerald-300" />
                   <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                     {tip.estimated_saving > 0 ? tip.estimated_saving.toLocaleString('en-IN') : "Review needed"}
                   </p>
                 </div>
              </div>

              {/* Actions */}
              <div className="mt-7 flex gap-3">
                 {!isFlagged ? (
                   <>
                      <button 
                        onClick={() => flagToCA(key)}
                        className="flex-[2] bg-indigo-600 text-white py-3.5 rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/20 flex items-center justify-center gap-2 group/btn"
                      >
                          Flag to CA <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                      <button 
                        onClick={() => dismiss(key)}
                        className="flex-1 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 py-3.5 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-center"
                      >
                          Dismiss
                      </button>
                   </>
                 ) : (
                   <div className="w-full flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 px-6 py-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                      <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-black">
                          <CheckCircle2 size={20} />
                          <span className="text-sm uppercase tracking-wider">✔ Flagged to CA</span>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Empty State */}
      {visibleTips.length === 0 && !analyzing && (
        <div className="mx-4 flex flex-col items-center justify-center py-32 bg-white dark:bg-[#0c0f1e]/40 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem]">
            <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[2rem] mb-8 text-slate-300 dark:text-gray-700 transition-colors">
                <Briefcase size={64} />
            </div>
            <h3 className="text-2xl font-black text-[#1B254B] dark:text-white mb-3">No tax saving opportunities analyzed yet.</h3>
            <p className="text-slate-500 dark:text-gray-400 max-w-sm text-center mb-10 font-medium leading-relaxed">
              Click below to scan your uploaded invoices for GST savings, ITC claims, and compliance tips.
            </p>
            <button 
                onClick={runAnalysis}
                disabled={analyzing}
                className="bg-[#0A0F2C] text-white px-12 py-5 rounded-[1.5rem] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-500/20"
            >
                <TrendingUp size={24} />
                Analyze My Invoices
            </button>
        </div>
      )}
    </div>
  );
}
