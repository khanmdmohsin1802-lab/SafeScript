"use client";

import {
  Send, Shield, Brain, ChevronDown, Bot, Plus,
  HelpCircle, Lock, Pencil, Check, X, Trash2, LogOut,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, authHeader } from "../../context/AuthContext";

const API = "http://127.0.0.1:8000";

/* ─────────────────────── Types ─────────────────────── */
type Segment = {
  id: number;
  type: "text" | "API Key" | "Email";
  rawText: string;
  maskedText: string;
  isMasked: boolean;
};

type Message = {
  id?: string;
  role: "user" | "ai";
  content: string;
  isFlagged?: boolean;
};

type Session = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

/* ─────────────────────── Markdown Parser ─────────────────────── */
function parseMessage(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.trim() === "***" || line.trim() === "---")
      return <hr key={i} className="my-5 border-[#c1c8c4]" />;
    if (line.trim().startsWith("### "))
      return (
        <h3 key={i} className="text-base font-bold text-[#16342b] mt-4 mb-2 animate-in fade-in slide-in-from-bottom-2"
          style={{ animationFillMode: "both", animationDelay: `${i * 35}ms`, animationDuration: "600ms" }}>
          {line.replace("### ", "")}
        </h3>
      );
    let isListItem = false;
    if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
      isListItem = true;
      line = line.substring(2);
    }
    const parts = line.split(/(\*\*.*?\*\*|\*[^\*]+\*)/g);
    const formattedLine = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={j} className="font-bold text-[#16342b]">{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={j} className="italic text-[#414845]">{part.slice(1, -1)}</em>;
      return <span key={j}>{part}</span>;
    });
    if (isListItem)
      return (
        <div key={i} className="flex gap-2.5 my-1.5 animate-in fade-in slide-in-from-bottom-2"
          style={{ animationFillMode: "both", animationDelay: `${i * 35}ms`, animationDuration: "600ms" }}>
          <span className="text-[#16342b]/60 mt-0.5">•</span>
          <span>{formattedLine}</span>
        </div>
      );
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <div key={i} className="my-1.5 animate-in fade-in slide-in-from-bottom-2 leading-relaxed"
        style={{ animationFillMode: "both", animationDelay: `${i * 35}ms`, animationDuration: "600ms" }}>
        {formattedLine}
      </div>
    );
  });
}

/* ─────────────────────── Component ─────────────────────── */
export default function PromptPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();

  /* Redirect to login if not authenticated */
  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  /* Chat state */
  const [prompt, setPrompt] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  /* Model selector */
  const [selectedModel, setSelectedModel] = useState("Gemini 3.1 Flash Lite");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  /* Sidebar / DB sessions */
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  /* Rename state */
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  /* ── Auto-scroll ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, analyzed]);

  /* ── Focus rename input when it appears ── */
  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  /* ── Fetch sessions from DB ── */
  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/sessions`, { headers: authHeader(user.token) });
      const data: Session[] = await res.json();
      setSessions(data);
    } catch {
      /* backend offline */
    } finally {
      setSessionsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /* ── Create new session in DB ── */
  const handleNewChat = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader(user.token) },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const newSession: Session = await res.json();
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    } catch {
      /* fallback: just clear messages */
    }
    setMessages([]);
    setPrompt("");
    setAnalyzed(false);
    setSegments([]);
  };

  /* ── Load historic session from DB ── */
  const loadSession = async (sessionId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/sessions/${sessionId}`, { headers: authHeader(user.token) });
      const data = await res.json();
      // Map DB messages to local format
      const mapped: Message[] = (data.messages || []).map((m: { id: string; role: "user" | "ai"; content: string; is_flagged: boolean }) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        isFlagged: m.is_flagged,
      }));
      setMessages(mapped);
      setActiveSessionId(sessionId);
      setAnalyzed(false);
      setPrompt("");
      setSegments([]);
    } catch {
      /* silently fail */
    }
  };

  /* ── Delete session ── */
  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await fetch(`${API}/sessions/${sessionId}`, { method: "DELETE", headers: authHeader(user.token) });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setMessages([]);
        setActiveSessionId(null);
      }
    } catch { /* ignore */ }
  };

  /* ── Start rename ── */
  const startRename = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(session.id);
    setRenameValue(session.title);
  };

  /* ── Commit rename ── */
  const commitRename = async (sessionId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingId(null); return; }
    if (!user) return;
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader(user.token) },
        body: JSON.stringify({ title: trimmed }),
      });
      const updated: Session = await res.json();
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
    } catch { /* ignore */ }
    setRenamingId(null);
  };

  /* ── Core send logic ── */
  const executeSend = async (currentSegments: Segment[], currentPrompt: string, override: boolean) => {
    setIsSending(true);
    const finalPayload = currentSegments
      .map((seg) => (seg.type === "text" ? seg.rawText : seg.isMasked ? seg.maskedText : seg.rawText))
      .join("");
    const currentUnmaskedItems = currentSegments.filter((s) => s.type !== "text" && !s.isMasked);
    const isOverride = override || currentUnmaskedItems.length > 0;
    const sensitiveItemsList = currentUnmaskedItems.map((s) => s.type);
    const hasSensitiveData = currentSegments.some((s) => s.type !== "text");

    setMessages((prev) => [...prev, { role: "user", content: finalPayload, isFlagged: isOverride }]);
    setAnalyzed(false);
    setPrompt("");
    setSegments([]);

    /* If no active session, create one first */
    let sessionId = activeSessionId;
    if (!sessionId && user) {
      try {
        const res = await fetch(`${API}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader(user.token) },
          body: JSON.stringify({ title: finalPayload.slice(0, 40) || "New Chat" }),
        });
        const newSession: Session = await res.json();
        sessionId = newSession.id;
        setActiveSessionId(newSession.id);
        setSessions((prev) => [newSession, ...prev]);
      } catch { /* ignore */ }
    }

    try {
      const resp = await fetch(`${API}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader(user?.token) },
        body: JSON.stringify({
          final_prompt: finalPayload,
          original_prompt: isOverride ? finalPayload : currentPrompt,
          override: isOverride,
          sensitive_items: sensitiveItemsList,
          has_sensitive_data: hasSensitiveData,
          session_id: sessionId,
        }),
      });
      const data = await resp.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.ai_response || "Received empty response from API." }]);

      /* Refresh session list so auto-title from backend is reflected */
      fetchSessions();
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "ai", content: "Error: Failed to connect to SafeScript backend API." }]);
    } finally {
      setIsSending(false);
    }
  };

  /* ── Analyze + detect PII (unchanged logic) ── */
  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    let score = 0;
    const newSegments: Segment[] = [];
    const regex = /(sk-[a-zA-Z0-9_]+|[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g;
    let match;
    let lastIndex = 0;
    let idCounter = 0;
    while ((match = regex.exec(prompt)) !== null) {
      if (match.index > lastIndex)
        newSegments.push({ id: idCounter++, type: "text", rawText: prompt.substring(lastIndex, match.index), maskedText: "", isMasked: false });
      const raw = match[0];
      const type = raw.startsWith("sk-") ? "API Key" : "Email";
      const maskedText = type === "API Key" ? "[API_KEY_MASKED]" : "[EMAIL_MASKED]";
      score += type === "API Key" ? 85 : 30;
      newSegments.push({ id: idCounter++, type, rawText: raw, maskedText, isMasked: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < prompt.length)
      newSegments.push({ id: idCounter++, type: "text", rawText: prompt.substring(lastIndex), maskedText: "", isMasked: false });
    if (score === 0) {
      setSegments(newSegments);
      executeSend(newSegments, prompt, false);
      return;
    }
    setSegments(newSegments);
    setRiskScore(Math.min(score, 100));
    setAnalyzed(true);
  };

  const toggleMask = (id: number) =>
    setSegments((prev) => prev.map((seg) => (seg.id === id ? { ...seg, isMasked: !seg.isMasked } : seg)));

  const currentUnmaskedItems = segments.filter((s) => s.type !== "text" && !s.isMasked);
  const handleSend = () => executeSend(segments, prompt, false);
  const loadSample = () =>
    setPrompt("Please summarize this user data: email is john.doe@company.com and the temporary API key is sk-v1abc9X_2L!");

  /* ────────────────────── Render ────────────────────── */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        .font-body  { font-family: 'Manrope', sans-serif; }
        .font-label { font-family: 'Plus Jakarta Sans', sans-serif; }
        .bouncy-hover { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .bouncy-hover:hover { transform: scale(1.02); }
        .glass-panel { background: rgba(248,250,245,0.85); backdrop-filter: blur(24px); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .session-row:hover .session-actions { opacity: 1; }
        .session-actions { opacity: 0; transition: opacity 0.2s; }
      `}} />

      <div className="font-body flex h-screen w-screen overflow-hidden bg-[#f8faf5] text-[#191c1a] fixed inset-0">

        {/* ═══════════════ TOP NAV ═══════════════ */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-16 bg-[#f8faf5]/90 backdrop-blur-xl border-b border-[#c1c8c4]/20 shadow-sm shadow-stone-200/40">
          <div className="flex items-center gap-10">
            <span className="text-xl font-bold text-[#16342b] tracking-tight">SafeScript</span>
            <div className="hidden md:flex gap-7">
              <span className="text-[#16342b] font-bold border-b-2 border-[#16342b] pb-0.5 text-sm cursor-pointer">Gateway</span>
              {user?.role === "admin" && <>
                <span onClick={() => router.push("/dashboard")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Dashboard</span>
                <span onClick={() => router.push("/policies")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Policies</span>
                <span onClick={() => router.push("/logs")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Audit Logs</span>
              </>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-[#f2f4ef] rounded-full transition-colors" title="Secure channel active">
              <Shield className="w-5 h-5 text-[#16342b]" />
            </button>
            <button onClick={() => { logout(); router.push("/"); }} className="p-2 hover:bg-red-50 rounded-full transition-colors" title="Sign out">
              <LogOut className="w-4 h-4 text-[#414845] hover:text-red-500" />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#2d4b41] flex items-center justify-center text-[#c8eadc] font-bold text-sm" title={user?.name}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
        </nav>

        {/* ═══════════════ BODY ═══════════════ */}
        <div className="flex w-full h-full pt-16">

          {/* ═══ LEFT SIDEBAR ═══ */}
          <aside className="w-64 shrink-0 flex flex-col bg-[#f2f4ef] h-full overflow-y-auto scrollbar-hide border-r border-[#c1c8c4]/20">
            {/* New Chat */}
            <div className="p-4">
              <button
                onClick={handleNewChat}
                className="w-full bg-[#16342b] text-[#ffffff] py-3 px-5 rounded-xl font-semibold flex items-center justify-center gap-2 bouncy-hover shadow-lg shadow-[#16342b]/10 text-sm transition-all"
              >
                <Plus className="w-4 h-4" /> New Chat
              </button>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-1">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-[#414845]/50 px-2 mb-3 mt-1">Recent History</p>

              {sessionsLoading ? (
                <div className="px-3 py-2 text-xs text-[#414845]/40 font-label animate-pulse">Loading chats…</div>
              ) : sessions.length === 0 ? (
                <div className="px-3 py-4 text-xs text-[#414845]/40 font-label text-center">No chats yet.<br/>Click &ldquo;New Chat&rdquo; to begin.</div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`session-row group w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      activeSessionId === session.id
                        ? "bg-[#ecefea] text-[#16342b] font-semibold"
                        : "text-[#16342b]/60 hover:bg-[#e1e3de] hover:text-[#16342b]"
                    }`}
                    onClick={() => loadSession(session.id)}
                  >
                    {renamingId === session.id ? (
                      /* ── Inline rename input ── */
                      <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(session.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="flex-1 bg-white border border-[#c1c8c4]/50 rounded-lg px-2 py-0.5 text-xs text-[#191c1a] outline-none focus:ring-1 focus:ring-[#16342b]/30"
                        />
                        <button onClick={() => commitRename(session.id)} className="p-1 hover:text-[#16342b]">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setRenamingId(null)} className="p-1 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate font-label text-sm flex-1">{session.title}</span>
                        {/* Action icons — visible on hover */}
                        <div className="session-actions flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => startRename(session, e)}
                            className="p-1 rounded hover:bg-[#c1c8c4]/30 transition-colors"
                            title="Rename"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => deleteSession(session.id, e)}
                            className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer links */}
            <div className="mt-auto border-t border-[#c1c8c4]/20 p-3 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#16342b]/60 hover:bg-[#e1e3de] hover:text-[#16342b] rounded-xl transition-all text-sm">
                <HelpCircle className="w-4 h-4" /><span className="font-label">Help Center</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#16342b]/60 hover:bg-[#e1e3de] hover:text-[#16342b] rounded-xl transition-all text-sm">
                <Lock className="w-4 h-4" /><span className="font-label">Privacy</span>
              </button>
            </div>
          </aside>

          {/* ═══ MAIN CHAT ═══ */}
          <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[#f8faf5] via-[#f2f4ef] to-[#e6deff]/10 relative">
            {/* Background art */}
            <div className="absolute top-[10%] right-[-10%] w-[35rem] h-[35rem] bg-[#ffdbca]/10 blur-[100px] -z-0 rounded-full pointer-events-none" />
            <div className="absolute bottom-[-5%] left-[5%] w-[25rem] h-[25rem] bg-[#cac1ee]/10 blur-[120px] -z-0 rounded-full pointer-events-none" />

            {/* Model selector sub-header */}
            <header className="z-10 h-14 px-6 flex items-center justify-between border-b border-[#c1c8c4]/20 bg-[#f8faf5]/60 backdrop-blur-md shrink-0">
              <div className="relative">
                <button
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ecefea] hover:bg-[#e1e3de] rounded-full cursor-pointer transition-all text-sm font-semibold text-[#16342b]"
                >
                  <span className="w-2 h-2 rounded-full bg-[#16342b] inline-block" />
                  {selectedModel}
                  <ChevronDown className="w-3.5 h-3.5 text-[#414845]" />
                </button>
                {isModelMenuOpen && (
                  <div className="absolute top-11 left-0 w-52 bg-[#ffffff] border border-[#c1c8c4]/30 rounded-xl p-2 shadow-2xl z-50">
                    {["Gemini 3.1 Flash Lite", "Claude 3.5 Sonnet", "GPT-4o"].map((model) => (
                      <button
                        key={model}
                        onClick={() => { setSelectedModel(model); setIsModelMenuOpen(false); }}
                        className="w-full px-3 py-2.5 text-sm hover:bg-[#f2f4ef] rounded-lg font-medium text-[#16342b] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        {model}
                        {selectedModel === model && <div className="w-2 h-2 rounded-full bg-[#16342b]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                {activeSessionId && (
                  <span className="text-[10px] font-label text-[#414845]/50 uppercase tracking-wider">
                    Session active • auto-saving
                  </span>
                )}
                <div className="flex items-center gap-2 text-xs font-label text-[#414845] font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Secure Channel Active
                </div>
              </div>
            </header>

            {/* Conversation area */}
            <section className="flex-1 overflow-y-auto scrollbar-hide px-8 py-6 space-y-6 z-10">

              {/* Empty state */}
              {messages.length === 0 && !analyzed && (
                <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="w-16 h-16 bg-[#2d4b41] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#16342b]/20">
                    <Bot className="w-8 h-8 text-[#c8eadc]" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-[#16342b] tracking-tight mb-2">Hello, User</h2>
                  <p className="text-[#414845] text-sm mb-8 max-w-sm text-center leading-relaxed">
                    I&apos;m monitoring your session for PII and sensitive data. All outgoing requests are scrubbed through the Gateway.
                  </p>
                  <button
                    onClick={loadSample}
                    className="flex items-center gap-2 text-xs font-label uppercase tracking-widest font-bold text-[#16342b] bg-[#ecefea] hover:bg-[#e1e3de] border border-[#c1c8c4]/40 px-4 py-2.5 rounded-full transition-all"
                  >
                    <Brain className="w-3.5 h-3.5" /> Inject Test Vector
                  </button>
                </div>
              )}

              {/* Messages */}
              {(messages.length > 0 || analyzed) && (
                <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
                  {messages.map((msg, idx) =>
                    msg.role === "ai" ? (
                      <div key={msg.id ?? idx} className="flex gap-3 items-start animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-9 h-9 rounded-xl bg-[#16342b] flex items-center justify-center shrink-0 shadow-md">
                          <Bot className="w-5 h-5 text-[#c8eadc]" />
                        </div>
                        <div className="max-w-[82%] space-y-1">
                          <div className="p-4 bg-[#ffffff] shadow-sm rounded-2xl rounded-tl-none border border-[#c1c8c4]/20 text-[#191c1a] text-sm leading-relaxed">
                            {parseMessage(msg.content)}
                          </div>
                          <span className="text-[10px] font-label font-bold text-[#414845]/40 ml-1">SAVED</span>
                        </div>
                      </div>
                    ) : (
                      <div key={msg.id ?? idx} className="flex gap-3 items-start flex-row-reverse animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-9 h-9 rounded-xl bg-[#ffdbca] flex items-center justify-center shrink-0">
                          <span className="text-[#795f51] font-bold text-sm">U</span>
                        </div>
                        <div className="max-w-[82%] space-y-1 flex flex-col items-end">
                          <div className="p-4 bg-[#16342b] text-[#ffffff] shadow-lg shadow-[#16342b]/10 rounded-2xl rounded-tr-none text-sm leading-relaxed whitespace-pre-wrap relative">
                            {msg.content}
                            {msg.isFlagged && (
                              <div className="absolute -bottom-5 right-0 text-[10px] text-red-500 font-medium flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Sent with Override
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-label font-bold text-[#414845]/40 mr-1">SAVED</span>
                        </div>
                      </div>
                    )
                  )}

                  {/* Typing indicator */}
                  {isSending && (
                    <div className="flex gap-3 items-start animate-in fade-in duration-300">
                      <div className="w-9 h-9 rounded-xl bg-[#16342b] flex items-center justify-center shrink-0 shadow-md relative">
                        <div className="absolute inset-0 rounded-xl border-2 border-[#16342b]/30 animate-ping" />
                        <Bot className="w-5 h-5 text-[#c8eadc] relative z-10" />
                      </div>
                      <div className="p-4 bg-[#ffffff] border border-[#c1c8c4]/20 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#16342b]/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-[#16342b]/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-[#16342b]/60 rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}

                  {/* SafeScript Verification popup (colour scheme only updated, logic intact) */}
                  {analyzed && (
                    <div className="w-full flex justify-end animate-in slide-in-from-bottom-4 duration-300">
                      <div className="w-[92%] bg-[#ffffff] border border-[#c1c8c4]/30 shadow-2xl shadow-[#16342b]/5 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#16342b] rounded-l-2xl" />
                        <div className="flex justify-between items-start mb-4 pl-2">
                          <div>
                            <h2 className="text-base font-bold flex items-center gap-2 text-[#16342b]">
                              <Shield className="w-5 h-5" /> SafeScript Verification
                            </h2>
                            <p className="text-[#414845] text-xs mt-1">Review the payload before it streams to {selectedModel}.</p>
                          </div>
                          {riskScore > 0 && (
                            <span className="text-[10px] font-label bg-[#302a4e] text-[#cac1ee] px-2.5 py-1 rounded-full uppercase tracking-tight font-bold">
                              Risk: {riskScore}%
                            </span>
                          )}
                        </div>

                        <div className="w-full bg-[#f2f4ef] border border-[#c1c8c4]/20 rounded-xl p-4 text-[#191c1a] font-mono text-sm leading-8 pl-4">
                          {segments.map((seg) => {
                            if (seg.type === "text") return <span key={seg.id}>{seg.rawText}</span>;
                            return (
                              <button
                                key={seg.id}
                                onClick={() => toggleMask(seg.id)}
                                className={`inline-flex px-2 py-0.5 mx-1 rounded-lg text-sm font-mono tracking-tight transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 ${
                                  seg.isMasked
                                    ? "bg-[#2d4b41]/20 text-[#16342b] border border-[#2d4b41]/30 hover:bg-[#2d4b41]/30"
                                    : "bg-red-100 text-red-700 border border-red-200"
                                }`}
                              >
                                {seg.isMasked ? seg.maskedText : seg.rawText}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex justify-between items-center mt-4 pl-2">
                          <button onClick={() => setAnalyzed(false)} className="text-xs font-semibold text-[#414845] hover:text-[#16342b] px-3 py-1.5 transition-colors">
                            Return to Editor
                          </button>
                          <div className="flex items-center gap-3">
                            {currentUnmaskedItems.length > 0 && (
                              <div className="flex items-center text-red-600 text-xs font-bold bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                                ⚠️ Flagged ({currentUnmaskedItems.length})
                              </div>
                            )}
                            <button
                              onClick={handleSend}
                              className={`${
                                currentUnmaskedItems.length > 0
                                  ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                                  : "bg-[#16342b] hover:bg-[#2d4b41] shadow-[#16342b]/20"
                              } text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg bouncy-hover`}
                            >
                              <Send className="w-4 h-4" /> Confirm & Dispatch
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              )}
            </section>

            {/* Input area */}
            <footer className={`z-10 p-5 pt-0 bg-transparent transition-all duration-500 ${analyzed ? "opacity-30 pointer-events-none saturate-0" : "opacity-100"}`}>
              <div className="max-w-3xl mx-auto">
                <div className="glass-panel rounded-xl shadow-2xl shadow-[#16342b]/5 p-2 border border-[#c1c8c4]/30">
                  <textarea
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[#191c1a] placeholder-[#414845]/50 p-4 font-body resize-none text-sm leading-relaxed"
                    placeholder={`Type a message or paste data for review via ${selectedModel}…`}
                    rows={2}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAnalyze();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between px-2 pb-2">
                    <div className="flex items-center gap-1">
                      <button onClick={loadSample} className="flex items-center gap-1.5 text-[11px] font-label uppercase tracking-wider font-bold text-[#414845] hover:text-[#16342b] bg-[#ecefea] hover:bg-[#e1e3de] border border-[#c1c8c4]/30 px-3 py-1.5 rounded-full transition-all">
                        <Brain className="w-3 h-3" /> Test Vector
                      </button>
                    </div>
                    <button
                      onClick={handleAnalyze}
                      disabled={!prompt.trim() || isSending}
                      className="bg-[#16342b] text-[#ffffff] px-5 py-2 rounded-xl font-bold flex items-center gap-2 bouncy-hover shadow-lg shadow-[#16342b]/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-all"
                    >
                      Send <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-center mt-2 text-[10px] font-label text-[#414845]/50 uppercase tracking-[0.2em]">
                  SafeScript Gateway Active • Chats auto-saved to database
                </p>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}
