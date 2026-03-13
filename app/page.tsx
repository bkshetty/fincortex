"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowRight, Activity, FileText, Lock } from "lucide-react";
import Image from "next/image";
import GlassNavbar from "./components/GlassNavbar";

export default function LandingPage() {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-x-hidden transition-colors duration-300 text-slate-900 dark:text-white">
      
      {/* ANIMATED SMOKY TEXTURE BACKGROUND */}
      {/* This uses an SVG radial gradient layered with a subtle noise filter to create a premium "smoky/frosted" texture */}
      <div 
        className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none mix-blend-multiply dark:mix-blend-screen" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opactiy='0.5'/%3E%3C/svg%3E")`,
        }}
      ></div>
      <div className="absolute top-0 w-full h-full bg-gradient-to-br from-white via-slate-50/80 to-slate-200/50 dark:from-[#0a0a0a] dark:via-[#111111]/80 dark:to-[#1a1a1a]/50 pointer-events-none z-0 transition-colors duration-300"></div>

      {/* PROFESSIONAL FLOATING NAVBAR COMPONENT */}
      <GlassNavbar />

      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-blue-100/50 dark:bg-blue-600/10 blur-[100px] dark:blur-[150px] rounded-full pointer-events-none z-0 transition-all duration-300"></div>

      {/* HERO SECTION */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-40 pb-24 flex flex-col items-center text-center relative z-10 mt-10">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold text-sm mb-8 animate-in slide-in-from-bottom-5 duration-700 shadow-sm transition-colors duration-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-500"></span>
          </span>
          Next-Gen Autonomous AP is Live
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tighter max-w-4xl leading-[1.1] mb-8 animate-in slide-in-from-bottom-10 duration-700 delay-150 fill-mode-both drop-shadow-sm transition-colors duration-300">
          Enterprise Compliance, <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-purple-400">
            Powered by Agentic AI.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-gray-400 max-w-2xl mb-12 animate-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both font-medium transition-colors duration-300">
          Automate invoice processing, validate GSTINs, and detect fraud in milliseconds. The ultimate autonomous Accounts Payable intake hub for modern finance teams.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-500 fill-mode-both">
          <Link 
            href={user ? "/dashboard" : "/login"}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-800 dark:hover:bg-gray-200 hover:scale-105 transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/5"
          >
            {user ? "Access Dashboard" : "Start Free Trial"}
            <ArrowRight size={20} />
          </Link>
          <button className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-slate-200 dark:border-transparent bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
            Book a Demo
          </button>
        </div>

      </main>

      {/* FEATURE GRIDS (Visual eye-candy) */}
      <section id="features" className="w-full max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-slate-200/60 dark:border-white/5 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl dark:hover:border-blue-500/50 hover:border-blue-200 transition-all group">
            <div className="bg-blue-50 dark:bg-blue-600/10 w-14 h-14 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner dark:shadow-none">
              <Activity className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors duration-300">Real-time Risk Scoring</h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed font-medium transition-colors duration-300">Instantly analyze invoices against millions of ledger records to detect anomalies, duplicate spending, and vendor fraud immediately.</p>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl dark:hover:border-purple-500/50 hover:border-indigo-200 transition-all group">
            <div className="bg-indigo-50 dark:bg-purple-600/10 w-14 h-14 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner dark:shadow-none">
              <FileText className="text-indigo-600 dark:text-purple-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors duration-300">Autonomous Extraction</h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed font-medium transition-colors duration-300">Our multi-modal agentic AI reads PDFs, JPGs, and PNGs with 99.8% accuracy—eliminating manual data entry entirely.</p>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl dark:hover:border-green-500/50 hover:border-emerald-200 transition-all group">
            <div className="bg-emerald-50 dark:bg-green-600/10 w-14 h-14 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner dark:shadow-none">
              <Lock className="text-emerald-600 dark:text-green-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors duration-300">Enterprise Security</h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed font-medium transition-colors duration-300">Built on Google Cloud with end-to-end encryption. Granular access controls and immutable audit logs by default.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-200/60 dark:border-white/5 mt-auto bg-white/30 dark:bg-transparent backdrop-blur-sm relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="compliance.ai Logo" width={24} height={24} className="object-contain opacity-70 grayscale dark:invert" />
            <span className="text-sm font-bold text-slate-500 dark:text-gray-400 tracking-tight transition-colors duration-300">compliance.ai</span>
          </Link>
          <p className="text-xs text-slate-500 dark:text-gray-600 font-medium transition-colors duration-300">© 2026 compliance.ai Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
