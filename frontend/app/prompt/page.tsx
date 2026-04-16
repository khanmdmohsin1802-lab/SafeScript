"use client";

import { Send, Shield, Brain, ChevronDown, Bot, MessageSquare, Database, Terminal, ShieldCheck, Plus, HelpCircle, Lock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ─────────────────────── types ─────────────────────── */
type Segment = {
  id: number;
  type: "text" | "API Key" | "Email";
  rawText: string;
  maskedText: string;
  isMasked: boolean;
};

type Message = {
  role: "user" | "ai";
  content: string;
  isFlagged?: boolean;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  icon: string;
};

/* ─────────────────────── markdown parser ─────────────────────── */
function parseMessage(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.trim() === "***" || line.trim() === "---")
      return <hr key={i} className="my-5 border-[#c1c8c4]" />;
    if (line.trim().startsWith("### "))
      return (
        <h3 key={i} className="text-base font-bold text-[#16342b] mt-4 mb-2 animate-in fade-in slide-in-from-bottom-2" style={{ animationFillMode: "both", animationDelay: `${i * 35}ms`, animationDuration: "600ms" }}>
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
        <div key={i} className="flex gap-2.5 my-1.5 animate-in fade-in slide-in-from-bottom-2" style={{ animationFillMode: "both", animationDelay: `${i * 35}ms`, animationDuration: "600ms" }}>
          <span className="text-[#16342b]/60 mt-0.5">•</span>
          <span>{formattedLine}</span>
        </div>
      );
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <div key={i} className="my-1.5 animate-in fade-in slide-in-from-bottom-2 leading-relaxed" style={{ animationFillMode: "both", animationDelay: `${i * 35}ms`, animationDuration: "600ms" }}>
        {formattedLine}
      </div>
    );
  });
}

/* ─────────────────────── component ─────────────────────── */
export default function PromptPage() {
  const router = useRouter();

  /* chat state */
  const [prompt, setPrompt] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  /* model selector */
  const [selectedModel, setSelectedModel] = useState("Gemini 3.1 Flash Lite");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  /* sidebar / session history */
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: "1", title: "Financial Analysis Q3", messages: [], icon: "chat" },
    { id: "2", title: "Script Review #42", messages: [], icon: "doc" },
    { id: "3", title: "Database Query", messages: [], icon: "db" },
    { id: "4", title: "API Integration Bugfix", messages: [], icon: "terminal" },
    { id: "5", title: "Security Audit Review", messages: [], icon: "shield" },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, analyzed]);

  /* ── New Chat ── */
  const handleNewChat = () => {
    if (messages.length > 0) {
      const title = messages[0]?.content?.slice(0, 32) || "New Chat";
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title,
        messages,
        icon: "chat",
      };
      setSessions((prev) => [newSession, ...prev]);
    }
    setMessages([]);
    setPrompt("");
    setAnalyzed(false);
    setSegments([]);
    setActiveSessionId(null);
  };

  /* ── Load historic session ── */
  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setActiveSessionId(session.id);
    setAnalyzed(false);
    setPrompt("");
    setSegments([]);
  };

  /* ── Core send logic (unchanged) ── */
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

    try {
      const resp = await fetch("http://127.0.0.1:8000/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          final_prompt: finalPayload,
          original_prompt: isOverride ? finalPayload : currentPrompt,
          override: isOverride,
          sensitive_items: sensitiveItemsList,
          has_sensitive_data: hasSensitiveData,
        }),
      });
      const data = await resp.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.ai_response || "Received empty response from API." }]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "ai", content: "Error: Failed to connect to SafeScript backend API." }]);
    } finally {
      setIsSending(false);
    }
  };

  /* ── Analyze + detect PII (unchanged) ── */
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

  /* ── Icon helper for sidebar ── */
  const SessionIcon = ({ icon }: { icon: string }) => {
    const cls = "w-4 h-4 shrink-0";
    if (icon === "doc") return <MessageSquare className={cls} />;
    if (icon === "db") return <Database className={cls} />;
    if (icon === "terminal") return <Terminal className={cls} />;
    if (icon === "shield") return <ShieldCheck className={cls} />;
    return <MessageSquare className={cls} />;
  };

  /* ────────────────────── render ────────────────────── */
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
      `}} />

      <div className="font-body flex h-screen w-screen overflow-hidden bg-[#f8faf5] text-[#191c1a] fixed inset-0">

        {/* ═══════════════ TOP NAV ═══════════════ */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-16 bg-[#f8faf5]/90 backdrop-blur-xl border-b border-[#c1c8c4]/20 shadow-sm shadow-stone-200/40">
          <div className="flex items-center gap-10">
            <span className="text-xl font-bold text-[#16342b] tracking-tight">SafeScript</span>
            <div className="hidden md:flex gap-7">
              <span className="text-[#16342b] font-bold border-b-2 border-[#16342b] pb-0.5 text-sm cursor-pointer">Gateway</span>
              <span onClick={() => router.push("/dashboard")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Dashboard</span>
              <span onClick={() => router.push("/policies")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Policies</span>
              <span onClick={() => router.push("/logs")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Audit Logs</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-[#f2f4ef] rounded-full transition-colors">
              <Shield className="w-5 h-5 text-[#16342b]" />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#2d4b41] flex items-center justify-center text-[#c8eadc] font-bold text-sm">M</div>
          </div>
        </nav>

        {/* ═══════════════ BODY (below nav) ═══════════════ */}
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

            {/* Recent History */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-1">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-[#414845]/50 px-2 mb-3 mt-1">Recent History</p>
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left text-sm ${
                    activeSessionId === session.id
                      ? "bg-[#ecefea] text-[#16342b] font-semibold"
                      : "text-[#16342b]/60 hover:bg-[#e1e3de] hover:text-[#16342b]"
                  }`}
                >
                  <SessionIcon icon={session.icon} />
                  <span className="truncate font-label">{session.title}</span>
                </button>
              ))}
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

            {/* Background art blobs */}
            <div className="absolute top-[10%] right-[-10%] w-[35rem] h-[35rem] bg-[#ffdbca]/10 blur-[100px] -z-0 rounded-full pointer-events-none" />
            <div className="absolute bottom-[-5%] left-[5%] w-[25rem] h-[25rem] bg-[#cac1ee]/10 blur-[120px] -z-0 rounded-full pointer-events-none" />

            {/* ── model selector sub-header ── */}
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
              <div className="flex items-center gap-2 text-xs font-label text-[#414845] font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Secure Channel Active
              </div>
            </header>

            {/* ── conversation area ── */}
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
                      /* AI bubble */
                      <div key={idx} className="flex gap-3 items-start animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-9 h-9 rounded-xl bg-[#16342b] flex items-center justify-center shrink-0 shadow-md">
                          <Bot className="w-5 h-5 text-[#c8eadc]" />
                        </div>
                        <div className="max-w-[82%] space-y-1">
                          <div className="p-4 bg-[#ffffff] shadow-sm rounded-2xl rounded-tl-none border border-[#c1c8c4]/20 text-[#191c1a] text-sm leading-relaxed">
                            {parseMessage(msg.content)}
                          </div>
                          <span className="text-[10px] font-label font-bold text-[#414845]/40 ml-1">JUST NOW</span>
                        </div>
                      </div>
                    ) : (
                      /* User bubble */
                      <div key={idx} className="flex gap-3 items-start flex-row-reverse animate-in fade-in zoom-in-95 duration-500">
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
                          <span className="text-[10px] font-label font-bold text-[#414845]/40 mr-1">JUST NOW</span>
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

                  {/* ── SafeScript Verification (sanitizer popup — colour scheme updated) ── */}
                  {analyzed && (
                    <div className="w-full flex justify-end animate-in slide-in-from-bottom-4 duration-300">
                      <div className="w-[92%] bg-[#ffffff] border border-[#c1c8c4]/30 shadow-2xl shadow-[#16342b]/5 rounded-2xl p-5 relative overflow-hidden">
                        {/* Left accent bar */}
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

                        {/* Token display */}
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

                        {/* Actions */}
                        <div className="flex justify-between items-center mt-4 pl-2">
                          <button
                            onClick={() => setAnalyzed(false)}
                            className="text-xs font-semibold text-[#414845] hover:text-[#16342b] px-3 py-1.5 transition-colors"
                          >
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

            {/* ── input area ── */}
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
                  SafeScript Gateway Active • Multi-Layer PII Scrubbing Enabled
                </p>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}
