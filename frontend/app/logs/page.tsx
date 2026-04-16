"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, History, RefreshCw, ChevronDown,
  Sparkles, X, ScrollText, LogOut,
} from "lucide-react";
import { useAuth, authHeader } from "../../context/AuthContext";
import UnauthorizedView from "../../components/UnauthorizedView";

/* ─── Types ─── */
type LogEntry = {
  action: string;
  user: string;
  user_name: string;
  tag: string;
  risk_level: string;
  timestamp: string;
  exact_prompt?: string;
  sensitive_items?: string[];
};

const API = "http://127.0.0.1:8000";

/* ─── Sub-components ─── */
function RiskBadge({ level }: { level: string }) {
  if (level === "High")
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold font-label uppercase tracking-wide">
        High Risk
      </span>
    );
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#e1e3de] text-[#414845] text-[10px] font-bold font-label uppercase tracking-wide">
      Low Risk
    </span>
  );
}

function ActionStatus({ action }: { action: string }) {
  const isOverride = action.includes("Override");
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${isOverride ? "text-red-600" : "text-[#16342b]"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOverride ? "bg-red-500 animate-pulse" : "bg-[#16342b]"}`} />
      {isOverride ? "Overridden" : "Masked & Allowed"}
    </span>
  );
}

/* ─── Payload modal ─── */
function PayloadModal({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#c1c8c4]/30 max-w-xl w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-[#f2f4ef] rounded-full transition-colors">
          <X className="w-4 h-4 text-[#414845]" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${log.risk_level === "High" ? "bg-red-100" : "bg-[#c8eadc]"}`}>
            <Shield className={`w-5 h-5 ${log.risk_level === "High" ? "text-red-600" : "text-[#16342b]"}`} />
          </div>
          <div>
            <p className="font-bold text-sm text-[#16342b]">Exact Payload</p>
            <p className="text-[10px] font-label text-[#414845]/60">{log.timestamp} · {log.user_name || log.user}</p>
          </div>
        </div>
        <div className="bg-[#f2f4ef] rounded-xl p-4 font-mono text-sm text-[#191c1a] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
          {log.exact_prompt || "— No payload captured —"}
        </div>
        {log.sensitive_items && log.sensitive_items.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-[10px] font-label font-bold text-[#414845]/60 uppercase tracking-widest w-full">Sensitive items detected:</span>
            {log.sensitive_items.map((item, i) => (
              <span key={i} className="px-2.5 py-1 bg-[#ffdbca] text-[#795f51] text-xs font-label font-bold rounded-full">
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function LogsPage() {
  const router = useRouter();
  const { user, logout, isAdmin, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTimeframe, setActiveTimeframe] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [riskMenuOpen, setRiskMenuOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/logs`, { headers: authHeader(user.token) });
      const data = await res.json();
      setLogs(data.logs || []);
      setLastRefresh(new Date());
    } catch {
      // backend may not be running
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/"); return; }
    fetchLogs();
    const interval = setInterval(fetchLogs, 10_000);
    return () => clearInterval(interval);
  }, [fetchLogs, user, authLoading, router]);

  if (!authLoading && !isAdmin) return <UnauthorizedView pageName="Audit Logs" />;

  /* Filtering */
  const filtered = logs.filter((log) => {
    if (riskFilter !== "All" && log.risk_level !== riskFilter) return false;
    return true;
  });

  /* Stats derived from real logs */
  const totalLogs = logs.length;
  const highRisk = logs.filter((l) => l.risk_level === "High").length;
  const successRate = totalLogs > 0 ? Math.round(((totalLogs - highRisk) / totalLogs) * 100) : 100;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        .font-body  { font-family: 'Manrope', sans-serif; }
        .font-label { font-family: 'Plus Jakarta Sans', sans-serif; }
        .bouncy-row { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .bouncy-row:hover { transform: translateY(-2px); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {selectedLog && <PayloadModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

      <div className="font-body min-h-screen bg-[#f8faf5] text-[#191c1a]">

        {/* ════ TOP NAV ════ */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-[#f8faf5]/90 backdrop-blur-xl border-b border-[#c1c8c4]/20 shadow-sm">
          <div className="flex items-center gap-10">
            <span className="text-xl font-bold tracking-tight text-[#16342b]">SafeScript</span>
            <nav className="hidden md:flex gap-7 text-sm">
              <span onClick={() => router.push("/prompt")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors cursor-pointer">Gateway</span>
              <span onClick={() => router.push("/dashboard")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors cursor-pointer">Dashboard</span>
              <span onClick={() => router.push("/policies")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors cursor-pointer">Policies</span>
              <span className="text-[#16342b] font-bold border-b-2 border-[#16342b] pb-0.5 cursor-pointer">Audit Trail</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchLogs} className="p-2 hover:bg-[#f2f4ef] rounded-full transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4 text-[#16342b]" />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#2d4b41] flex items-center justify-center text-[#c8eadc] font-bold text-sm">M</div>
          </div>
        </header>

        <div className="flex pt-16 min-h-[calc(100vh-4rem)]">

          {/* ════ SIDEBAR ════ */}
          <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 flex flex-col bg-[#f2f4ef] border-r border-[#c1c8c4]/20 p-4 z-40">
            {/* Header */}
            <div className="flex items-center gap-3 px-3 py-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#2d4b41] flex items-center justify-center">
                <ScrollText className="w-5 h-5 text-[#c8eadc]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#16342b]">Audit Trail</h3>
                <p className="text-[10px] font-label text-[#414845]/60">AI Interaction Streams</p>
              </div>
            </div>

            {/* Only Full History nav item as requested */}
            <nav className="flex-1 space-y-1">
              <button className="w-full flex items-center gap-3 bg-[#ecefea] text-[#16342b] font-semibold rounded-xl px-4 py-3 transition-all text-sm">
                <History className="w-4 h-4" />
                <span className="font-label">Full History</span>
              </button>
            </nav>

            {/* Footer links */}
            <div className="mt-auto border-t border-[#c1c8c4]/20 pt-3 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#16342b]/60 hover:bg-[#e1e3de] rounded-xl transition-all text-sm">
                <HelpCircle className="w-4 h-4" /><span className="font-label">Help Center</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#16342b]/60 hover:bg-[#e1e3de] rounded-xl transition-all text-sm">
                <Lock className="w-4 h-4" /><span className="font-label">Privacy</span>
              </button>
            </div>
          </aside>

          {/* ════ MAIN ════ */}
          <main className="ml-64 flex-1 px-10 py-8 pb-16">

            {/* Page header */}
            <header className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-[#191c1a] mb-1">Audit Trail</h1>
                <p className="text-[#414845] text-sm font-label">
                  Monitoring all gateway interactions · Updated {lastRefresh.toLocaleTimeString()}
                </p>
              </div>

              {/* Filters */}
              <div className="flex gap-3 items-center">
                {/* Timeframe tabs */}
                <div className="bg-[#f2f4ef] p-1 rounded-xl flex gap-1">
                  {["All", "24h", "7d", "30d"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setActiveTimeframe(tf)}
                      className={`px-4 py-1.5 text-xs font-label font-bold rounded-lg transition-all ${
                        activeTimeframe === tf
                          ? "bg-white shadow-sm text-[#16342b]"
                          : "text-[#414845] hover:text-[#16342b]"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* Risk filter */}
                <div className="relative">
                  <button
                    onClick={() => setRiskMenuOpen(!riskMenuOpen)}
                    className="flex items-center gap-1.5 bg-[#f2f4ef] px-4 py-2 rounded-xl text-xs font-label font-bold text-[#414845] hover:bg-[#e7e9e4] transition-all"
                  >
                    Risk: {riskFilter} <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {riskMenuOpen && (
                    <div className="absolute top-10 right-0 w-36 bg-white border border-[#c1c8c4]/30 rounded-xl shadow-2xl p-2 z-50">
                      {["All", "High", "Low"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setRiskFilter(opt); setRiskMenuOpen(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#f2f4ef] rounded-lg text-[#16342b] font-medium transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* ── Audit Table (no-line style from Stitch) ── */}
            <section className="mb-14">
              {/* Column headers */}
              <div className="grid grid-cols-6 px-6 py-3 text-[10px] font-label font-bold text-[#414845]/60 uppercase tracking-widest mb-1">
                <div>Timestamp</div>
                <div>User Identity</div>
                <div>Sensitive Items</div>
                <div>Risk Indicator</div>
                <div>Action Taken</div>
                <div className="text-right">Context</div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#414845]/40">
                  <div className="w-8 h-8 border-2 border-[#16342b]/20 border-t-[#16342b] rounded-full animate-spin" />
                  <span className="text-sm font-label">Loading secure logs…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#414845]/40">
                  <Shield className="w-10 h-10 opacity-30" />
                  <span className="text-sm font-label">No logs yet — send a prompt via the Gateway.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((log, i) => (
                    <div
                      key={i}
                      className={`group relative grid grid-cols-6 items-center px-6 py-4 rounded-xl transition-all bouncy-row cursor-default hover:z-10 hover:shadow-lg hover:shadow-[#16342b]/5 ${
                        i % 2 === 0 ? "bg-white" : "bg-[#f2f4ef]"
                      } hover:bg-[#e6deff]/20`}
                    >
                      {/* Timestamp */}
                      <div className="text-xs font-label text-[#414845]">{log.timestamp}</div>

                      {/* User */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#ffdbca] flex items-center justify-center text-[#795f51] font-bold text-xs shrink-0">
                          {(log.user_name || log.user)?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[#191c1a] truncate block">{log.user_name || log.user}</span>
                          <span className={`text-[9px] font-label font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${log.tag === "admin" ? "bg-[#302a4e]/10 text-[#302a4e]" : "bg-[#ecefea] text-[#414845]"}`}>{log.tag || "user"}</span>
                        </div>
                      </div>


                      {/* Sensitive items */}
                      <div className="flex flex-wrap gap-1">
                        {log.sensitive_items && log.sensitive_items.length > 0 ? (
                          log.sensitive_items.map((item, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-[#ecefea] text-[#414845] text-[10px] font-label font-bold rounded-full">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#414845]/30 text-xs">—</span>
                        )}
                      </div>

                      {/* Risk badge */}
                      <div><RiskBadge level={log.risk_level} /></div>

                      {/* Action */}
                      <div><ActionStatus action={log.action} /></div>

                      {/* View payload button — appears on hover */}
                      <div className="text-right">
                        {log.exact_prompt && (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#16342b] text-white px-4 py-1.5 rounded-full text-xs font-label font-bold hover:bg-[#2d4b41]"
                          >
                            View Exact Payload
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── AI Audit Insights bento ── */}
            <section className="grid grid-cols-12 gap-6">
              {/* Left: Intelligence card */}
              <div className="col-span-12 lg:col-span-8 bg-[#e6deff]/40 rounded-2xl p-8 border border-[#c1c8c4]/10">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-5 h-5 text-[#302a4e]" />
                  <h2 className="text-lg font-bold text-[#302a4e]">AI Audit Intelligence</h2>
                </div>
                <p className="text-[#484267] text-sm leading-relaxed mb-6 max-w-2xl">
                  {highRisk > 0
                    ? `SafeScript has detected ${highRisk} high-risk override event${highRisk > 1 ? "s" : ""} in the current session. These have been logged for administrative review. All other prompts were safely masked and dispatched.`
                    : "No high-risk events detected in the current session. All prompts have been safely masked before transmission. Gateway protocols are operating within normal parameters."}
                </p>
                <div className="flex gap-4">
                  <div className="bg-white/60 p-4 rounded-xl flex-1">
                    <div className="text-[10px] font-bold text-[#414845]/60 uppercase tracking-wider mb-1">Success Rate</div>
                    <div className="text-2xl font-extrabold text-[#16342b]">{successRate}%</div>
                  </div>
                  <div className="bg-white/60 p-4 rounded-xl flex-1">
                    <div className="text-[10px] font-bold text-[#414845]/60 uppercase tracking-wider mb-1">Total Events</div>
                    <div className="text-2xl font-extrabold text-[#16342b]">{totalLogs}</div>
                  </div>
                  <div className="bg-white/60 p-4 rounded-xl flex-1">
                    <div className="text-[10px] font-bold text-[#414845]/60 uppercase tracking-wider mb-1">High Risk</div>
                    <div className={`text-2xl font-extrabold ${highRisk > 0 ? "text-red-600" : "text-[#16342b]"}`}>{highRisk}</div>
                  </div>
                </div>
              </div>

              {/* Right: Risk topology card */}
              <div className="col-span-12 lg:col-span-4 bg-[#ffdbca] rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#e1c0af]/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#e1c0af]/20 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <h2 className="text-lg font-bold text-[#29170d] mb-2">Risk Topology</h2>
                  <p className="text-[#594235] text-sm leading-relaxed">
                    Distribution of masked vs. overridden requests logged during your session.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="relative self-start bg-[#29170d] text-[#ffdbca] px-5 py-2 rounded-full text-sm font-bold font-label hover:opacity-90 transition-opacity mt-6"
                >
                  View Dashboard →
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
