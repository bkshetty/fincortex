"use client";

import { useState } from "react";
import { 
  FileText, IndianRupee, AlertTriangle, Calculator, 
  Download, Activity, CheckCircle2, ShieldAlert,
  Search, Filter, ChevronDown, Check, X
} from "lucide-react";
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from "recharts";

// --- MOCK DATA FOR CA DASHBOARD ---
const CA_METRICS = {
  pendingItc: 1245000,
  complianceScore: 92,
  flaggedCount: 18,
  totalAudited: 45000000
};

const COMPLIANCE_DISTRIBUTION = [
  { name: 'Matched (GSTR-2B)', value: 85, color: '#22c55e' }, // Green
  { name: 'Partial Match', value: 10, color: '#f59e0b' }, // Amber
  { name: 'Missing in GSTR', value: 5, color: '#ef4444' } // Red
];

const MONTHLY_RECONCILIATION = [
  { name: 'Oct', claimedItc: 1200000, actualItc: 1150000 },
  { name: 'Nov', claimedItc: 1450000, actualItc: 1400000 },
  { name: 'Dec', claimedItc: 1100000, actualItc: 1080000 },
  { name: 'Jan', claimedItc: 1560000, actualItc: 1560000 },
  { name: 'Feb', claimedItc: 1800000, actualItc: 1720000 },
];

const ANOMALY_LOG = [
  { id: "INV-9021", vendor: "TechCorp India", amount: 450000, issue: "GSTIN Suspended", severity: "High", date: "Mar 12, 2026" },
  { id: "INV-8832", vendor: "Acme Supplies", amount: 12500, issue: "HSN Code Mismatch", severity: "Medium", date: "Mar 11, 2026" },
  { id: "INV-8799", vendor: "Global Logistics", amount: 89000, issue: "Duplicate Invoice No.", severity: "High", date: "Mar 10, 2026" },
  { id: "INV-8654", vendor: "SaaS Partners", amount: 24000, issue: "Date > 6 Months Old", severity: "Medium", date: "Mar 08, 2026" },
  { id: "INV-8501", vendor: "Office Depot", amount: 5600, issue: "Missing Digital Signature", severity: "Low", date: "Mar 05, 2026" },
];
// ----------------------------------

export default function CAAuditDashboard() {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const handleApproveLedger = () => {
    console.log("Ledger Approved and locked for month.");
    setShowApproveConfirm(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-full flex flex-col transition-colors duration-300">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">CA Audit & Compliance</h1>
            <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/30 tracking-wide uppercase">
              Financial Year 2025-26
            </span>
          </div>
          <p className="text-slate-500 dark:text-gray-400 max-w-2xl transition-colors">
            Deep-dive automated compliance. Review GSTR-2B reconciliations, manage Input Tax Credit (ITC), and resolve AI-flagged ledger anomalies.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm dark:shadow-none text-sm">
            <Download size={16} /> Export GSTR-2B Recon
          </button>
          <button 
            onClick={() => setShowApproveConfirm(true)}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-gray-200 transition-all shadow-lg text-sm"
          >
            <CheckCircle2 size={16} /> Approve Monthly Ledger
          </button>
        </div>
      </div>

      {/* TOP METRICS FOR CA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-[#111111]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-slate-500 dark:text-gray-400 tracking-wider uppercase">Pending ITC</p>
            <div className="bg-purple-50 dark:bg-purple-500/10 p-2 rounded-lg text-purple-600 dark:text-purple-400"><IndianRupee size={18} /></div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{formatCurrency(CA_METRICS.pendingItc)}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-500">Unreconciled against GSTR-2B</p>
        </div>

        <div className="bg-white dark:bg-[#111111]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-slate-500 dark:text-gray-400 tracking-wider uppercase">Compliance Score</p>
            <div className="bg-green-50 dark:bg-green-500/10 p-2 rounded-lg text-green-600 dark:text-green-400"><Activity size={18} /></div>
          </div>
          <div className="flex items-end gap-2 mb-1">
            <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{CA_METRICS.complianceScore}</p>
            <p className="text-lg font-bold text-slate-400 dark:text-gray-600 mb-0.5">/ 100</p>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-500">Based on AI vendor checks</p>
        </div>

        <div className="bg-white dark:bg-[#111111]/80 backdrop-blur-md p-6 rounded-2xl border border-red-200 dark:border-red-500/30 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 dark:bg-red-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-xs font-bold text-red-600 dark:text-red-400 tracking-wider uppercase">Action Required</p>
            <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-lg text-red-600 dark:text-red-400"><ShieldAlert size={18} /></div>
          </div>
          <p className="text-3xl font-extrabold text-red-600 dark:text-red-400 mb-1 relative z-10">{CA_METRICS.flaggedCount} Anomalies</p>
          <p className="text-xs font-semibold text-red-500 dark:text-red-400/80 relative z-10">Invoices halted by AI</p>
        </div>

        <div className="bg-white dark:bg-[#111111]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-slate-500 dark:text-gray-400 tracking-wider uppercase">Total Audited (YTD)</p>
            <div className="bg-blue-50 dark:bg-blue-500/10 p-2 rounded-lg text-blue-600 dark:text-blue-400"><Calculator size={18} /></div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{formatCurrency(CA_METRICS.totalAudited)}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-500">Across 3,402 invoices</p>
        </div>
      </div>

      {/* CHARTS LAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* COMPLIANCE PIE CHART */}
        <div className="bg-white dark:bg-[#111111]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors duration-300 lg:col-span-1 flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">ITC Match Status (Current Mo)</h2>
          <div className="flex-1 min-h-[250px] w-full relative -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={COMPLIANCE_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {COMPLIANCE_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {COMPLIANCE_DISTRIBUTION.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                   <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">{item.name}</span>
                 </div>
                 <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* RECONCILIATION AREA CHART */}
        <div className="bg-white dark:bg-[#111111]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors duration-300 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">ITC Claimed vs Actual Recon (YTD)</h2>
            <button className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
              Last 6 Months <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_RECONCILIATION} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClaimed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(value) => `₹${value/100000}L`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }} />
                <Area type="monotone" dataKey="claimedItc" name="Claimed ITC" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorClaimed)" />
                <Area type="monotone" dataKey="actualItc" name="Actual GSTR-2B" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ANOMALY DETECTION TABLE */}
      <div className="bg-white dark:bg-[#111111]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors duration-300 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 tracking-tight">AI-Flagged Ledger Anomalies</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400">Invoices suspended from processing awaiting CA approval.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
              <input type="text" placeholder="Search invoices..." className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white w-full md:w-64 transition-all" />
            </div>
            <button className="p-2 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Invoice / Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Flagged Issue</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {ANOMALY_LOG.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{log.id}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-500">{log.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-gray-300">
                    {log.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(log.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 w-max ${
                      log.severity === 'High' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20' :
                      log.severity === 'Medium' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20' :
                      'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20'
                    }`}>
                      {log.severity === 'High' && <AlertTriangle size={12} />}
                      {log.issue}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="Review Invoice">
                        <Search size={18} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/20 rounded-lg transition-colors" title="Force Approve">
                        <Check size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL OVERLAY */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
           <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-3xl p-8 animate-in zoom-in-95 duration-200 relative shadow-2xl">
              <button 
                onClick={() => setShowApproveConfirm(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mb-6 mx-auto">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">Approve Monthly Ledger?</h2>
              <p className="text-slate-500 dark:text-gray-400 text-center mb-8">This will lock the current ledger entries, trigger the GSTR-2B compliance reconciliations, and prepare the final tax export ready for filing.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowApproveConfirm(false)}
                  className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApproveLedger}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-600/20"
                >
                  Confirm & Lock
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
