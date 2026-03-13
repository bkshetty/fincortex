"use client";

import { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
// import { storage, db } from '@/lib/firebase'; // Keep this commented out until you test the UI visually

export default function UploadHub() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  // Mock function to simulate the AI processing for UI testing
  const handleProcess = () => {
    if (!file) return;
    setLoading(true);
    
    setTimeout(() => {
      setExtractedData({
        vendorName: "Acme Corp",
        amount: 45000,
        gstin: "29ABCDE1234F1Z5",
        riskScore: "High",
        status: "INVALID_GSTIN_FORMAT",
        fileUrl: URL.createObjectURL(file) // Temporarily show the local file
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto min-h-full flex flex-col justify-center">
      
      {!extractedData ? (
        /* STATE 1: THE UPLOAD DROPZONE */
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Autonomous Intake</h2>
            <p className="text-gray-400 text-lg">Drag and drop invoices to extract, validate, and secure.</p>
          </div>

          <div className="border-2 border-dashed border-white/20 rounded-3xl p-16 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer relative">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="bg-blue-600/20 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform">
              <UploadCloud size={48} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{file ? file.name : "Select or drop file here"}</h3>
            <p className="text-gray-500 text-sm mb-8">Supports PDF, PNG, JPG up to 10MB</p>
            
            <button 
              onClick={(e) => { e.preventDefault(); handleProcess(); }}
              disabled={!file || loading}
              className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50 z-10"
            >
              {loading ? "Agentic AI Processing..." : "Analyze Document"} 
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>

      ) : (

        /* STATE 2: THE SPLIT-SCREEN VERIFICATION */
        <div className="flex h-[80vh] bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
          
          {/* LEFT: Document Viewer */}
          <div className="w-1/2 border-r border-white/10 bg-black/50 p-6 flex flex-col">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Source Document</h3>
            <div className="flex-1 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
               <img src={extractedData.fileUrl} alt="Invoice" className="max-w-full max-h-full object-contain" />
            </div>
          </div>

          {/* RIGHT: Data Extraction Form */}
          <div className="w-1/2 p-10 flex flex-col relative">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Verify Output</h2>
                <p className="text-sm text-gray-400">Review the AI extraction before committing to the database.</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${
                extractedData.riskScore === 'Low' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {extractedData.riskScore === 'Low' ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
                {extractedData.riskScore} Risk
              </span>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Vendor Name</label>
                <input type="text" defaultValue={extractedData.vendorName} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Total Amount (₹)</label>
                <input type="number" defaultValue={extractedData.amount} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">GSTIN Number</label>
                <input type="text" defaultValue={extractedData.gstin} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-red-500 outline-none font-mono" />
                {extractedData.riskScore === 'High' && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={12}/> {extractedData.status}</p>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex gap-4 mt-6">
              <button onClick={() => setExtractedData(null)} className="px-6 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all font-medium">
                Reject
              </button>
              <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20">
                Commit to Ledger
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}