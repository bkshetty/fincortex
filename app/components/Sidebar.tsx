"use client";

import { LayoutDashboard, Search, Settings, LogOut, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "./ThemeToggle";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on path change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Do not render sidebar on landing page or login page
  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  const NavLinks = () => (
    <>
      <Link href="/upload" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === '/upload' ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-white font-semibold' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}>
        <Search size={20} />
        <span className="font-medium">Upload & Analyze</span>
      </Link>
      <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === '/dashboard' ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-white font-semibold' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}>
        <LayoutDashboard size={20} />
        <span className="font-medium">Dashboard</span>
      </Link>
      <Link href="/dashboard/settings" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === '/dashboard/settings' ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-white font-semibold' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}>
        <Settings size={20} />
        <span className="font-medium">Settings</span>
      </Link>
    </>
  );

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#070b19]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 z-50 transition-colors">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-white/10 p-1.5 rounded-xl h-9 w-9 flex items-center justify-center">
            <Image src="/Logo.png" alt="Logo" width={24} height={24} className="object-contain" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">compliance.ai</span>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <div className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
        <aside className={`absolute top-0 left-0 bottom-0 w-72 bg-white dark:bg-[#111111] p-6 flex flex-col shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center gap-3 mb-8">
             <div className="bg-slate-100 dark:bg-white/10 p-2 rounded-2xl h-12 w-12 flex items-center justify-center">
               <Image src="/Logo.png" alt="Logo" width={32} height={32} className="object-contain" />
             </div>
             <h1 className="text-xl font-bold text-slate-900 dark:text-white">compliance.ai</h1>
          </div>
          
          <nav className="space-y-2">
            <NavLinks />
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/10">
             <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Theme</span>
                <ThemeToggle />
             </div>
             <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                <p className="text-sm font-bold truncate mb-1">{userEmail || "User"}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Enterprise Tier</p>
             </div>
             <button 
               onClick={handleLogout}
               className="w-full mt-4 flex items-center justify-center gap-2 py-4 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-2xl font-bold"
             >
               <LogOut size={20} />
               <span>Sign Out</span>
             </button>
          </div>
        </aside>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-[#111111] border-r border-slate-200 dark:border-white/10 flex flex-col hidden md:flex transition-colors duration-300 relative z-30">
        <Link href="/" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="bg-slate-100 dark:bg-white/10 p-2 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center h-12 w-12 transition-colors">
            <Image src="/Logo.png" alt="Logo" width={32} height={32} className="object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">compliance.ai</h1>
        </Link>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLinks />
        </nav>

        <div className="mt-auto border-t border-slate-200 dark:border-white/10 p-4">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Appearance</span>
            <ThemeToggle />
          </div>
          <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-2xl p-4 flex items-center gap-3 border border-slate-200 dark:border-white/5 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
              {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{userEmail || "Loading..."}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Enterprise Tier</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full mt-4 flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
