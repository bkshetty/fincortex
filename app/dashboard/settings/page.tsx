"use client";

import { useState, useEffect } from "react";
import { Bell, Calendar, Repeat, Save, CheckCircle2, Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [taxFrequency, setTaxFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState("2026-03-01");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/settings", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();

        setNotificationsEnabled(data.notifications_enabled);
        setTaxFrequency(data.tax_frequency);
        if (data.period_start_date) {
          setStartDate(data.period_start_date.split("T")[0]);
        }
      } catch (err) {
        console.error("[Settings] Failed to load preferences:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not logged in");

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          notifications_enabled: notificationsEnabled,
          tax_frequency: taxFrequency,
          period_start_date: startDate,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("[Settings] Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestReminder = async () => {
    setSendingTest(true);
    setTestResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not logged in");

      const res = await fetch(`/api/cron/tax-reminder?test=true`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed");
      setTestResult(
        data.emails_sent > 0
          ? `✅ Test email sent successfully! (${data.emails_sent} email${data.emails_sent > 1 ? 's' : ''})`
          : `⚠️ No emails sent. Make sure you've saved your settings first.`
      );
    } catch (err: any) {
      setTestResult(`❌ Failed: ${err.message}`);
    } finally {
      setSendingTest(false);
      setTimeout(() => setTestResult(null), 6000);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-black dark:text-white tracking-tight transition-colors">Settings</h1>
        <p className="text-black dark:text-white font-bold transition-colors">Configure your compliance alerts and tax reporting schedules.</p>
      </div>

      {loading ? (
        <div className="glass-panel p-12 shadow-2xl flex items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span className="text-black/60 dark:text-white/60 font-bold">Loading your preferences...</span>
        </div>
      ) : (
        <div className="glass-panel p-8 shadow-2xl space-y-10">
          
          {/* Notification Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200/50 dark:border-white/10">
              <Bell size={20} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-black dark:text-white uppercase tracking-wider">Notifications</h2>
            </div>
            
            <div className="glass-card p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold text-black dark:text-white transition-colors">Enable Notifications</p>
                <p className="text-xs text-black/60 dark:text-white/60 font-bold transition-colors">Receive email reminders before your tax filing deadlines.</p>
              </div>
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-6 rounded-full transition-all relative ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </section>

          {/* Tax Return Settings */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200/50 dark:border-white/10">
              <Repeat size={20} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-black dark:text-white uppercase tracking-wider">Tax Return Scheduling</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Frequency Selector */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Repeat size={16} className="text-slate-400" />
                  <label className="text-sm font-bold text-black dark:text-white uppercase tracking-widest transition-colors">Option</label>
                </div>
                <div className="flex bg-slate-100/50 dark:bg-black/20 p-1.5 rounded-xl border border-white/20">
                  <button 
                    onClick={() => setTaxFrequency("monthly")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${taxFrequency === 'monthly' ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-white' : 'text-black dark:text-white hover:text-black/70 dark:hover:text-white'}`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setTaxFrequency("quarterly")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${taxFrequency === 'quarterly' ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-white' : 'text-black dark:text-white hover:text-black/70 dark:hover:text-white'}`}
                  >
                    Quarterly
                  </button>
                </div>
                <p className="text-[10px] text-black/60 dark:text-white/60 font-bold italic transition-colors">Select how often you process tax returns.</p>
              </div>

              {/* Date Picker */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  <label className="text-sm font-bold text-black dark:text-white uppercase tracking-widest transition-colors">Period Start Date</label>
                </div>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-100/50 dark:bg-black/20 p-3 rounded-xl border border-white/20 text-sm font-bold text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <p className="text-[10px] text-black/60 dark:text-white/60 font-bold italic transition-colors">Choose the start date for the current reporting cycle.</p>
              </div>
            </div>
          </section>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-slate-200/50 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-black/60 dark:text-white/60 font-bold transition-colors italic">Last updated: {today}</p>
              {testResult && (
                <p className={`text-xs font-bold ${testResult.startsWith('✅') ? 'text-emerald-600' : testResult.startsWith('⚠') ? 'text-amber-600' : 'text-red-600'}`}>
                  {testResult}
                </p>
              )}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={handleSendTestReminder}
                disabled={sendingTest}
                className="flex-1 sm:flex-none px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50"
              >
                {sendingTest ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {sendingTest ? "Sending..." : "Send Test Email"}
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className={`flex-1 sm:flex-none px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl group ${saved ? 'bg-green-600 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95'}`}
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : saved ? (
                  <>
                    <CheckCircle2 size={18} />
                    Settings Saved
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Floating Alert Message */}
      {saved && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full border-green-500/50 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-green-500 w-2 h-2 rounded-full animate-pulse" />
          <p className="text-sm font-bold text-black dark:text-white">Your preferences have been synced successfully.</p>
        </div>
      )}

    </div>
  );
}
