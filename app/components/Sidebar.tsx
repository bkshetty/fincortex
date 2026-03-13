"use client";

import { LayoutDashboard, Search, Settings, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ThemeToggle } from "./ThemeToggle";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Do not render sidebar on landing page or login page
  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  return (
    <aside className="w-64 bg-white dark:bg-[#111111] border-r border-slate-200 dark:border-white/10 flex flex-col hidden md:flex transition-colors duration-300">
      <Link href="/" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="bg-slate-100 dark:bg-white/10 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center h-10 w-10">
          <Image src="/logo.png" alt="compliance.ai Logo" width={28} height={28} className="object-contain w-full h-full" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">compliance.ai</h1>
      </Link>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === '/dashboard' ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-white font-semibold' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}>
          <Search size={20} />
          <span className="font-medium">Bill Analysis</span>
        </Link>
        <Link href="/dashboard/audit" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === '/dashboard/audit' ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-white font-semibold' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}>
          <LayoutDashboard size={20} />
          <span className="font-medium">Audit Dashboard</span>
        </Link>
        <Link href="/dashboard/settings" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === '/dashboard/settings' ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-white font-semibold' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}>
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </Link>
      </nav>

      {/* User Section & Logout */}
      <div className="mt-auto border-t border-slate-200 dark:border-white/10 p-4">
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">Appearance</span>
          <ThemeToggle />
        </div>
        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-2xl p-4 flex items-center gap-3 border border-slate-200 dark:border-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white mb-2 shadow-sm">
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
  );
}
