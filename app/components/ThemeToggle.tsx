"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-14 h-7 opacity-0 rounded-full" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        relative inline-flex items-center w-14 h-7 rounded-full transition-all duration-300 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${isDark
          ? "bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
          : "bg-gradient-to-r from-amber-300 to-orange-400 shadow-lg shadow-amber-400/30"
        }
      `}
    >
      {/* Track icons */}
      <span className="absolute left-1.5 text-[10px] select-none">
        {isDark ? "🌙" : ""}
      </span>
      <span className="absolute right-1.5 text-[10px] select-none">
        {!isDark ? "☀️" : ""}
      </span>

      {/* Sliding knob */}
      <span
        className={`
          absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md
          flex items-center justify-center text-xs
          transition-transform duration-300 ease-in-out
          ${isDark ? "translate-x-7" : "translate-x-0.5"}
        `}
      >
        {isDark ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2m-4.93 7.07-1.41-1.41M6.34 6.34 4.93 4.93"/>
          </svg>
        )}
      </span>
    </button>
  );
}
