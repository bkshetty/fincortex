"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 animate-pulse" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500
        bg-white/80 dark:bg-white/10 backdrop-blur-md border border-slate-200/50 dark:border-white/20
        shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.1)]
        group overflow-hidden
      `}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-5 h-5 transition-transform duration-500 ease-spring group-hover:scale-110 group-active:scale-95">
        {isDark ? (
          <Sun className="w-full h-full text-amber-500 animate-in zoom-in-50 fade-in duration-500 rotate-0" />
        ) : (
          <Moon className="w-full h-full text-indigo-600 animate-in zoom-in-50 fade-in duration-500 rotate-0" />
        )}
      </div>

      {/* Subtle glow effect */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none
        ${isDark ? 'bg-amber-400/10' : 'bg-indigo-400/10'}
      `} />
    </button>
  );
}
