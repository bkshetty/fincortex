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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="compliance-theme">
          <AuthGuard>
            {/* PREMIUM LIQUID FLOW ANIMATED BACKGROUND */}
            <div className="fixed inset-0 z-[-1] w-full h-full overflow-hidden bg-slate-50 dark:bg-[#070b19] transition-colors duration-700">
              
              {/* Animated Liquid Blobs */}
              <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[120px] animate-flow-slow" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[140px] animate-flow-medium" />
              <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-pink-400/10 dark:bg-pink-600/10 blur-[100px] animate-flow-fast" />
              <div className="absolute bottom-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-cyan-400/10 dark:bg-cyan-600/10 blur-[120px] animate-flow-slow reverse" />

              {/* Light Mode subtle warmth overlay */}
              <div className="absolute inset-0 bg-white/40 dark:bg-transparent transition-opacity duration-500 pointer-events-none" />

              {/* Dark Mode deep void gradient */}
              <div className="absolute inset-0 bg-transparent dark:bg-[radial-gradient(circle_at_center,_transparent_0%,_#070b19_100%)] opacity-0 dark:opacity-40 transition-opacity duration-500 pointer-events-none" />
              
              {/* Premium Grain Texture Overlay */}
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none mix-blend-overlay" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} />
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