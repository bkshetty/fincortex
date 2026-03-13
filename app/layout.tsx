import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import { ThemeProvider } from "./components/ThemeProvider";
import AuthGuard from "@/components/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "compliance.ai | Enterprise Compliance",
  description: "Autonomous Accounts Payable",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body suppressHydrationWarning className={`${inter.className} text-slate-900 dark:text-white flex h-screen overflow-hidden transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="fincortex-theme">
          <AuthGuard>
            {/* DEEP BLUE & CYAN ABSTRACT MESH BACKGROUND */}
            <div className="fixed inset-0 z-[-1] w-full h-full overflow-hidden bg-slate-50 dark:bg-[#070b19] transition-colors duration-500">
              
              {/* Dark mode deep indigo base layer */}
              <div className="absolute inset-0 bg-transparent dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-[#150f38] dark:via-[#0c102a] dark:to-[#070b19] opacity-0 dark:opacity-100 transition-opacity duration-500"></div>

              {/* Fluid gradient blobs matching the reference */}
              <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-200/40 dark:bg-cyan-400/30 blur-[120px] dark:blur-[180px] mix-blend-multiply dark:mix-blend-screen animate-fluid-1"></div>
              
              <div className="absolute bottom-[-10%] right-[-20%] w-[70vw] h-[70vw] rounded-[100%] bg-cyan-200/40 dark:bg-blue-600/30 blur-[120px] dark:blur-[180px] mix-blend-multiply dark:mix-blend-screen animate-fluid-2"></div>
              
              <div className="absolute top-[20%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-200/40 dark:bg-indigo-600/20 blur-[120px] dark:blur-[180px] mix-blend-multiply dark:mix-blend-screen animate-fluid-3"></div>
              
              {/* Overlay to reduce noise and blend smoothly */}
              <div className="absolute inset-0 bg-transparent dark:bg-[#070b19]/20 pointer-events-none mix-blend-overlay"></div>
            </div>

            {/* THE DYNAMIC SIDEBAR (Hides on login and landing page) */}
            <Sidebar />

            {/* THE MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto relative bg-transparent pt-16 md:pt-0">
              {children}
            </main>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}