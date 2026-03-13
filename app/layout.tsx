import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import { ThemeProvider } from "./components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "compliance.ai | Enterprise Compliance",
  description: "Autonomous Accounts Payable",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body className={`${inter.className} bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white flex h-screen overflow-hidden transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="fincortex-theme">
          {/* THE DYNAMIC SIDEBAR (Hides on login and landing page) */}
          <Sidebar />

          {/* THE MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto relative bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}