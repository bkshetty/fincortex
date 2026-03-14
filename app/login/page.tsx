"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Login failed:", error.message);
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const emailValue = email.trim();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password,
        });
        if (error) throw error;
        console.log("Logged in user via email");
      } else {
        const { error } = await supabase.auth.signUp({
          email: emailValue,
          password,
        });
        if (error) throw error;
        console.log("Created new user via email");
        setErrorMsg("Success! Please check your email for a confirmation link.");
      }
      if (isLogin) router.push("/dashboard");
    } catch (error: any) {
      console.error("Email auth failed:", error.message);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 text-slate-900 dark:text-white">
      
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/50 dark:bg-blue-600/20 blur-[100px] dark:blur-[120px] rounded-full pointer-events-none transition-all duration-300"></div>

      <div className="w-full max-w-md bg-white/80 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/10 p-10 rounded-[2.5rem] shadow-xl dark:shadow-2xl relative z-10 text-center transition-all duration-300">
        
        <Link href="/" className="inline-block">
          <div className="bg-slate-50 dark:bg-white/10 w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-6 border border-slate-200 dark:border-white/5 p-2 shadow-sm dark:shadow-lg transition-colors duration-300 hover:scale-105 transition-transform">
            <Image src="/Logo.png" alt="compliance.ai Logo" width={48} height={48} className="object-contain w-full h-full" />
          </div>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 transition-colors duration-300">compliance.ai</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mb-8 transition-colors duration-300">Enterprise Compliance & Accounts Payable</p>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6 relative">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Mail className="h-5 w-5 text-slate-400 dark:text-gray-500" />
                </div>
                <input 
                    type="email" 
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    required
                />
            </div>

             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Lock className="h-5 w-5 text-slate-400 dark:text-gray-500" />
                </div>
                <input 
                    type="password" 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    required
                />
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 shadow-md"
            >
                {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Create Account")}
                {!loading && <ArrowRight size={18} />}
            </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 transition-colors duration-300"></div>
            <span className="text-slate-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-wider transition-colors duration-300">Or continue with</span>
            <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 transition-colors duration-300"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-bold py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm dark:shadow-none"
        >
          {loading ? (
            "Authenticating..."
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </>
          )}
        </button>

        <div className="mt-8 text-sm text-slate-500 dark:text-gray-400 transition-colors duration-300">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
                onClick={() => setIsLogin(!isLogin)}
                type="button"
                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                disabled={loading}
            >
                {isLogin ? "Sign up" : "Sign in"}
            </button>
        </div>

        {errorMsg && (
          <div className="mt-6 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-sm text-center transition-colors duration-300">
            {errorMsg}
          </div>
        )}

      </div>
    </div>
  );
}