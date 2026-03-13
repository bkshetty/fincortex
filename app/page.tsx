"use client";

import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);

    try {
      // 1. Upload the Invoice Image to Firebase Storage
      console.log("Uploading to Firebase Storage...");
      const storageRef = ref(storage, `invoices/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      console.log("Success! File URL:", fileUrl);

      // 2. Call your Requestly Agentic AI API using the .env variable
      console.log("Sending to Requestly AI...");
      const requestlyUrl = process.env.NEXT_PUBLIC_REQUESTLY_API_URL;
      
      if (!requestlyUrl) {
        throw new Error("Missing Requestly API URL in .env.local!");
      }

      const aiResponse = await fetch(requestlyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: fileUrl })
      });
      
      const aiData = await aiResponse.json();
      setResult(aiData);

      // 3. Save the AI's extracted data to Firebase Firestore
      console.log("Saving to Firestore Database...");
      await addDoc(collection(db, "processed_invoices"), {
        vendorName: aiData.vendorName || "Unknown",
        amount: aiData.amount || 0,
        status: aiData.status || "PENDING",
        riskScore: aiData.riskScore || "Medium",
        imageUrl: fileUrl,
        timestamp: new Date()
      });

      console.log("🎉 Pipeline Complete!");

    } catch (error) {
      console.error("Pipeline Error:", error);
      alert("Something went wrong. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-sans">
      <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">COMPLIANCEPILOT.ai</h1>
      <p className="text-gray-400 mb-10">Agentic Invoice Processing</p>

      <div className="bg-gray-900 border border-gray-800 p-10 rounded-2xl shadow-2xl w-full max-w-md text-center transition-all">
        <input 
          type="file" 
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 mb-8 cursor-pointer"
        />
        
        <button 
          onClick={handleProcess}
          disabled={!file || loading}
          className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Processing Pipeline..." : "Upload & Analyze"}
        </button>
      </div>

      {result && (
        <div className="mt-8 p-6 bg-green-900/20 border border-green-800 rounded-xl text-green-400 max-w-md w-full shadow-lg">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <span>✅</span> Extraction Success!
          </h3>
          <pre className="text-xs overflow-x-auto mt-4 bg-black/50 p-4 rounded-lg border border-green-900/50">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}