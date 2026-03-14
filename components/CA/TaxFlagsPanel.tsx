"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, IndianRupee, Filter, LayoutGrid } from "lucide-react";

export default function TaxFlagsPanel() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const res = await fetch("/api/ca/tax-flags");
      const data = await res.json();
      setFlags(data.flags || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const markApplied = async (id: string) => {
    try {
        const res = await fetch(`/api/ca/tax-flags/${id}/applied`, { method: 'PATCH' });
        if (res.ok) fetchFlags();
    } catch (e) {
        console.error(e);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Scanning strategy flags...</div>;

  return (
    <div className="bg-white dark:bg-[#111111]/80 backdrop-blur-md rounded-[2rem] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50/30 dark:bg-white/5">
         <div>
            <h2 className="text-xl font-extrabold text-[#1B254B] dark:text-white tracking-tight">Tax Strategy Review Queue</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Opportunities flagged by clients for professional validation.</p>
         </div>
         <div className="flex gap-2">
            <button className="p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 hover:bg-white dark:hover:bg-white/5 transition-all">
                <Filter size={20} />
            </button>
            <button className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                <LayoutGrid size={20} />
            </button>
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-white/10">
               <th className="px-8 py-5">Origin / Section</th>
               <th className="px-8 py-5">Estimated Net Saving</th>
               <th className="px-8 py-5">Status</th>
               <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {flags.map((flag) => (
              <tr key={flag.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all group">
                <td className="px-8 py-6">
                   <div className="font-extrabold text-[#1B254B] dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{flag.business?.name}</div>
                   <div className="text-xs text-indigo-500 font-black mt-1 uppercase tracking-wider">{flag.rule?.section_name}</div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 text-lg">
                      <IndianRupee size={18} />
                      {flag.estimated_saving_inr.toLocaleString('en-IN')}
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Projected Benefit</p>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="px-3 py-1 rounded-full text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest border border-amber-200 dark:border-amber-900/50 whitespace-nowrap">
                        Awaiting Verification
                      </span>
                   </div>
                </td>
                <td className="px-8 py-6 text-right">
                   <button 
                     onClick={() => markApplied(flag.id)}
                     className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-emerald-700 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2 ml-auto"
                   >
                     <CheckCircle2 size={16} /> Mark as Applied
                   </button>
                </td>
              </tr>
            ))}
            {!flags.length && (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-gray-700">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Queue is Clear</h4>
                  <p className="text-sm text-slate-500 dark:text-gray-500 max-w-xs mx-auto">No flagged tax saving strategies currently require your review.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
