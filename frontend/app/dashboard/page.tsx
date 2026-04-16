"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, ShieldAlert, Key, Mail, AlertTriangle,
  CheckCircle2, RefreshCw, Activity, Lock, HelpCircle,
  BarChart2, Sparkles, MessageSquare,
} from "lucide-react";

/* ─── Types ─── */
type LogEntry = {
  action: string;
  user: string;
  risk_level: string;
  timestamp: string;
  exact_prompt?: string;
  sensitive_items: string[];
};

type Stats = {
  total_prompts: number;
  high_risk: number;
  low_risk: number;
  total_masked: number;
  api_key_count: number;
  email_count: number;
  avg_risk_score: number;
  timeline: { day: string; count: number }[];
};

const API = "http://127.0.0.1:8000";

/* ─── Helpers ─── */
function RiskPill({ level }: { level: string }) {
  if (level === "High")
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> HIGH
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold text-[#16342b]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#16342b]" /> LOW
    </span>
  );
}

function StatusBadge({ action }: { action: string }) {
  if (action === "Sensitive Override Sent")
    return (
      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
        OVERRIDDEN
      </span>
    );
  return (
    <span className="px-3 py-1 rounded-full bg-[#c8eadc] text-[#16342b] text-xs font-bold">
      PII MASKED
    </span>
  );
}

/* ─── Chart ─── */
function TimelineChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Pad to 7 bars
  const padded = Array.from({ length: 7 }, (_, i) => data[i] || { day: "", count: 0 });

  return (
    <div className="h-52 flex items-end justify-between gap-3 px-2 relative">
      {/* Gridlines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-t border-[#414845]" />
        ))}
      </div>

      {padded.map((bar, i) => {
        const pct = Math.round((bar.count / max) * 100);
        const isHigh = bar.count === Math.max(...data.map((d) => d.count));
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            {bar.count > 0 && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#16342b] text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10">
                {bar.count} event{bar.count !== 1 ? "s" : ""}
              </div>
            )}
            <div
              className={`w-full rounded-t-xl transition-all duration-700 ${
                isHigh ? "bg-[#2d4b41]" : "bg-[#2d4b41]/30"
              } hover:bg-[#2d4b41]/80`}
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
            <span className="text-[9px] font-label font-bold text-[#414845]/60 uppercase tracking-widest">
              {days[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ─── */
export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch(`${API}/stats`),
        fetch(`${API}/logs`),
      ]);
      const statsData = await statsRes.json();
      const logsData = await logsRes.json();
      setStats(statsData);
      setLogs(logsData.logs || []);
      setLastRefresh(new Date());
    } catch {
      // backend may not be running
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000); // poll every 10 s
    return () => clearInterval(interval);
  }, [fetchData]);

  /* Derived */
  const riskScore = stats?.avg_risk_score ?? 0;
  const circumference = 2 * Math.PI * 88; // r=88
  const dashOffset = circumference - (riskScore / 100) * circumference;
  const riskLabel = riskScore < 30 ? "Low Risk" : riskScore < 70 ? "Medium Risk" : "High Risk";
  const riskColor = riskScore < 30 ? "#16342b" : riskScore < 70 ? "#e09c3d" : "#ba1a1a";

  /* Breakdown bars */
  const total = (stats?.api_key_count ?? 0) + (stats?.email_count ?? 0);
  const apiPct = total > 0 ? Math.round(((stats?.api_key_count ?? 0) / total) * 100) : 0;
  const emailPct = total > 0 ? Math.round(((stats?.email_count ?? 0) / total) * 100) : 0;
  const financialPct = 0; // not tracked yet – kept for visual balance

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        .font-body  { font-family: 'Manrope', sans-serif; }
        .font-label { font-family: 'Plus Jakarta Sans', sans-serif; }
        .bouncy-hover { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .bouncy-hover:hover { transform: scale(1.015); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="font-body min-h-screen bg-[#f8faf5] text-[#191c1a]">

        {/* ══════ TOP NAV ══════ */}
        <nav className="sticky top-0 z-50 w-full flex items-center justify-between px-8 h-16 bg-[#f8faf5]/90 backdrop-blur-xl border-b border-[#c1c8c4]/20 shadow-sm">
          <div className="flex items-center gap-10">
            <span className="text-xl font-bold text-[#16342b] tracking-tight">SafeScript</span>
            <div className="hidden md:flex gap-7 text-sm">
              <span onClick={() => router.push("/prompt")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors cursor-pointer">Gateway</span>
              <span className="text-[#16342b] font-bold border-b-2 border-[#16342b] pb-0.5 cursor-pointer">Dashboard</span>
              <span onClick={() => router.push("/policies")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors cursor-pointer">Policies</span>
              <span onClick={() => router.push("/logs")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors cursor-pointer">Audit Logs</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="p-2 hover:bg-[#f2f4ef] rounded-full transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4 text-[#16342b]" />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#2d4b41] flex items-center justify-center text-[#c8eadc] font-bold text-sm">M</div>
          </div>
        </nav>

        <div className="flex min-h-[calc(100vh-4rem)]">

          {/* ══════ SIDEBAR ══════ */}
          <aside className="w-64 shrink-0 bg-[#f2f4ef] flex flex-col p-4 border-r border-[#c1c8c4]/20 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <div className="flex items-center gap-3 px-3 py-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#16342b] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#c8eadc]" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#16342b]">InsightShield</p>
                <p className="text-[10px] text-[#414845]/60 font-label">Security Dashboard</p>
              </div>
            </div>

            <div className="space-y-1 flex-1">
              {[
                { label: "Security Audit", icon: <ShieldAlert className="w-4 h-4" />, active: true },
                { label: "Threat Map", icon: <Activity className="w-4 h-4" /> },
                { label: "Model Config", icon: <Sparkles className="w-4 h-4" /> },
                { label: "Access Control", icon: <Lock className="w-4 h-4" /> },
              ].map(({ label, icon, active }) => (
                <button key={label} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${active ? "bg-[#ecefea] text-[#16342b] font-semibold" : "text-[#16342b]/60 hover:bg-[#e1e3de] hover:text-[#16342b]"}`}>
                  {icon}<span className="font-label">{label}</span>
                </button>
              ))}
            </div>

            <div className="mt-auto border-t border-[#c1c8c4]/20 pt-3 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#16342b]/60 hover:bg-[#e1e3de] rounded-xl transition-all text-sm">
                <HelpCircle className="w-4 h-4" /><span className="font-label">Help Center</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#16342b]/60 hover:bg-[#e1e3de] rounded-xl transition-all text-sm">
                <Lock className="w-4 h-4" /><span className="font-label">Privacy</span>
              </button>
            </div>
          </aside>

          {/* ══════ MAIN ══════ */}
          <main className="flex-1 p-8 overflow-y-auto">

            {/* Header */}
            <header className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-4xl font-extrabold text-[#16342b] tracking-tighter">InsightShield Dashboard</h1>
                <p className="text-[#414845] mt-1 text-sm">Security status for SafeScript Gateway</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#ecefea] px-4 py-2 rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#16342b] animate-pulse" />
                  <span className="text-xs font-label font-bold text-[#16342b] uppercase tracking-wide">Live Monitoring</span>
                </div>
                <span className="text-[10px] text-[#414845]/50 font-label">
                  Updated {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
            </header>

            {/* ── Bento Metric Cards ── */}
            <div className="grid grid-cols-12 gap-5 mb-8">

              {/* Global Risk Score — radial gauge */}
              <div className="col-span-12 lg:col-span-4 bg-[#f2f4ef] rounded-2xl p-7 flex flex-col justify-between min-h-[300px] bouncy-hover">
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-bold text-[#16342b]">Global Risk Score</h3>
                  <BarChart2 className="w-5 h-5 text-[#16342b]/30" />
                </div>
                <div className="relative flex items-center justify-center py-4">
                  <svg className="w-44 h-44 -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="88" fill="transparent" stroke="#e7e9e4" strokeWidth="12" />
                    <circle
                      cx="100" cy="100" r="88" fill="transparent"
                      stroke={riskColor}
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={loading ? circumference : dashOffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-extrabold" style={{ color: riskColor }}>
                      {loading ? "—" : riskScore}
                    </span>
                    <span className="text-xs font-label font-bold text-[#414845]/60 uppercase tracking-widest mt-1">
                      {riskLabel}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#414845] font-body">
                  Computed from <strong>{stats?.total_prompts ?? 0}</strong> logged prompts.
                </p>
              </div>

              {/* PII Masked + Integrity stack */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
                <div className="bg-[#ffdbca] rounded-2xl p-6 flex-1 bouncy-hover">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl">
                      <Shield className="w-5 h-5 text-[#73594b]" />
                    </div>
                    <div>
                      <p className="text-xs font-label font-bold text-[#795f51] uppercase tracking-tight">PII Masked Count</p>
                      <h4 className="text-3xl font-extrabold text-[#29170d]">{loading ? "—" : (stats?.total_masked ?? 0).toLocaleString()}</h4>
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-[#795f51]/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#29170d] transition-all duration-700 rounded-full"
                      style={{ width: stats?.total_masked ? `${Math.min((stats.total_masked / 100) * 100, 100)}%` : "0%" }} />
                  </div>
                </div>

                <div className="bg-[#e6deff] rounded-2xl p-6 flex-1 bouncy-hover">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-[#302a4e]" />
                    </div>
                    <div>
                      <p className="text-xs font-label font-bold text-[#484267] uppercase tracking-tight">High-Risk Events</p>
                      <h4 className="text-3xl font-extrabold text-[#1c1639]">{loading ? "—" : stats?.high_risk ?? 0}</h4>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i < Math.min(stats?.high_risk ?? 0, 4) ? "bg-[#302a4e]" : "bg-[#302a4e]/20"}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Breakdown */}
              <div className="col-span-12 lg:col-span-4 bg-[#ecefea] rounded-2xl p-7 bouncy-hover flex flex-col">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-[#16342b]">Data Breakdown</h3>
                  <span className="text-[10px] font-label bg-[#e1e3de] px-2 py-1 rounded-lg text-[#414845]">Live</span>
                </div>
                <div className="space-y-5 flex-1 flex flex-col justify-center">
                  {[
                    { label: "API Keys", count: stats?.api_key_count ?? 0, pct: apiPct, icon: <Key className="w-3.5 h-3.5" />, color: "#16342b" },
                    { label: "Emails / PII", count: stats?.email_count ?? 0, pct: emailPct, icon: <Mail className="w-3.5 h-3.5" />, color: "#2d4b41" },
                    { label: "Financial", count: 0, pct: financialPct, icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "#73594b" },
                  ].map(({ label, count, pct, icon, color }) => (
                    <div key={label} className="space-y-1.5">
                      <div className="flex justify-between text-sm font-label">
                        <span className="font-semibold flex items-center gap-1.5 text-[#191c1a]">{icon}{label}</span>
                        <span className="text-[#414845]">{count.toLocaleString()}</span>
                      </div>
                      <div className="h-2.5 bg-[#d8dbd6] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Threat Activity Timeline ── */}
            <section className="mb-8">
              <div className="bg-white rounded-2xl p-7 shadow-sm border border-[#c1c8c4]/10">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#16342b]">Threat Activity Timeline</h3>
                    <p className="text-[#414845] text-xs mt-0.5">Anomalous behavior detection patterns (live data)</p>
                  </div>
                  <div className="flex gap-2">
                    {["Day", "Week", "Month"].map((label) => (
                      <button key={label} className={`px-3 py-1.5 rounded-lg text-xs font-bold font-label transition-all ${label === "Week" ? "bg-[#16342b] text-white" : "bg-[#ecefea] text-[#414845] hover:bg-[#e1e3de]"}`}>
                        {label.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="h-52 flex items-center justify-center text-[#414845]/40 text-sm font-label">Loading timeline…</div>
                ) : stats?.timeline && stats.timeline.length > 0 ? (
                  <TimelineChart data={stats.timeline} />
                ) : (
                  <div className="h-52 flex flex-col items-center justify-center text-[#414845]/40 text-sm font-label gap-2">
                    <Activity className="w-8 h-8 opacity-30" />
                    <span>No activity yet — send a prompt via the Gateway to see data here.</span>
                  </div>
                )}
              </div>
            </section>

            {/* ── Recent Prompt Activity Table ── */}
            <section>
              <div className="bg-[#ecefea] rounded-2xl overflow-hidden border border-[#c1c8c4]/10">
                <div className="px-7 py-5 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-[#16342b]">Recent Prompt Activity</h3>
                  <button onClick={() => router.push("/logs")} className="text-[#16342b] text-sm font-bold font-label hover:underline underline-offset-4">
                    View All Logs →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#c1c8c4]/30">
                        {["Timestamp", "User / Agent", "Action", "Sensitive Items", "Risk"].map((h) => (
                          <th key={h} className="px-7 py-3 font-label font-bold text-[10px] text-[#414845] uppercase tracking-widest">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-7 py-8 text-center text-sm text-[#414845]/40 font-label">
                            Connecting to SafeScript backend…
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-7 py-12 text-center">
                            <div className="flex flex-col items-center gap-2 text-[#414845]/40">
                              <MessageSquare className="w-8 h-8 opacity-30" />
                              <span className="text-sm font-label">No logged prompts yet. Send something via the Gateway.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        logs.slice(0, 8).map((log, idx) => (
                          <tr key={idx} className={`${idx % 2 === 1 ? "bg-[#f2f4ef]/60" : ""} hover:bg-[#e7e9e4]/60 transition-colors`}>
                            <td className="px-7 py-4 text-xs font-label text-[#414845]">{log.timestamp}</td>
                            <td className="px-7 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#e1e3de] flex items-center justify-center text-[#414845] font-bold text-xs">
                                  {log.user?.[0]?.toUpperCase() ?? "U"}
                                </div>
                                <span className="text-sm font-semibold text-[#191c1a]">{log.user}</span>
                              </div>
                            </td>
                            <td className="px-7 py-4">
                              <StatusBadge action={log.action} />
                            </td>
                            <td className="px-7 py-4 text-xs font-label text-[#414845]">
                              {log.sensitive_items.length > 0 ? log.sensitive_items.join(", ") : "—"}
                            </td>
                            <td className="px-7 py-4">
                              <RiskPill level={log.risk_level} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </main>
        </div>

        {/* FAB */}
        <button
          onClick={() => router.push("/prompt")}
          className="fixed bottom-7 right-7 w-14 h-14 bg-[#16342b] text-[#c8eadc] rounded-2xl shadow-2xl shadow-[#16342b]/30 flex items-center justify-center bouncy-hover group overflow-hidden"
          title="Go to Gateway"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
          <Sparkles className="w-6 h-6 relative z-10" />
        </button>
      </div>
    </>
  );
}
