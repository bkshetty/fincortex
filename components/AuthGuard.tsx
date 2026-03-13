"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && pathname !== "/" && pathname !== "/login") {
        router.push("/login");
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && pathname !== "/" && pathname !== "/login") {
        router.push("/login");
      } else if (session && pathname === "/login") {
        router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (loading && pathname !== "/" && pathname !== "/login") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#070b19]">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-gray-400 font-medium">Verifying Session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
