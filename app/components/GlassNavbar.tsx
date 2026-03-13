"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ThemeToggle } from "./ThemeToggle";

export default function GlassNavbar() {
  const [user, setUser] = useState<any | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl mx-auto px-6 py-4 flex items-center justify-between bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/20 rounded-3xl z-50 shadow-lg shadow-black/5 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-white dark:bg-white/10 p-1 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-none border border-slate-100 dark:border-white/5 flex items-center justify-center h-10 w-10">
          <Image src="/logo.png" alt="FinCortex Logo" width={32} height={32} className="object-contain w-full h-full" />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">FinCortex</span>
      </div>
      
      <div className="flex items-center gap-6">
        <Link href="#features" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors hidden md:block">
          Platform Features
        </Link>
        <Link href="#security" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors hidden md:block">
          Security
        </Link>

        {!authChecked ? (
          <div className="flex items-center gap-4">
            <div className="w-24 h-10 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"></div>
            <ThemeToggle />
          </div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link 
              href="/dashboard"
              className="bg-slate-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 dark:hover:bg-gray-200 transition-all shadow-md shadow-slate-900/10 dark:shadow-white/10"
            >
              Go to Dashboard
            </Link>
            <div 
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-purple-500 border-2 border-white dark:border-white/20 flex items-center justify-center font-bold text-sm uppercase shadow-md text-white"
              title={user.email}
            >
              {user.email ? user.email.charAt(0) : "U"}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Log in
            </Link>
            <Link 
              href="/login"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 dark:hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
