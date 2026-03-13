import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutDashboard, UploadCloud, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinCortex | Enterprise Compliance",
  description: "Autonomous Accounts Payable",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0a] text-white flex h-screen overflow-hidden`}>
        
        {/* THE SIDEBAR */}
        <aside className="w-64 bg-[#111111] border-r border-white/10 flex flex-col hidden md:flex">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FinCortex</h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <UploadCloud size={20} />
              <span className="font-medium">Upload Hub</span>
            </Link>
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <LayoutDashboard size={20} />
              <span className="font-medium">Audit Dashboard</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                CA
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Admin User</span>
                <span className="text-xs text-gray-500">Pro Tier</span>
              </div>
            </div>
          </div>
        </aside>

        {/* THE MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>

      </body>
    </html>
  );
}