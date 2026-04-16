"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Plus, Trash2, FileText, Upload,
  AlertCircle, Loader2, LogOut, ChevronDown, X, Check,
  Download, Zap,
} from "lucide-react";
import { useAuth, authHeader } from "../../context/AuthContext";
import UnauthorizedView from "../../components/UnauthorizedView";

const API = "http://127.0.0.1:8000";

type PolicyDoc = {
  id: string;
  title: string;
  content: string;
  file_name: string | null;
  created_by: string | null;
  created_at: string;
};

/** Parse RULE blocks from policy content — mirrors the backend parser */
function parsedRules(content: string): { label: string; pattern: string; score: number; mask: string }[] {
  const rules: { label: string; pattern: string; score: number; mask: string }[] = [];
  let cur: { label: string; pattern: string; score: number; mask: string } | null = null;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("RULE:")) {
      if (cur?.pattern) rules.push(cur);
      cur = { label: line.slice(5).trim(), pattern: "", score: 50, mask: "[MASKED]" };
    } else if (line.startsWith("PATTERN:") && cur) {
      cur.pattern = line.slice(8).trim();
    } else if (line.startsWith("SCORE:") && cur) {
      const n = parseInt(line.slice(6).trim(), 10);
      if (!isNaN(n)) cur.score = n;
    } else if (line.startsWith("MASK:") && cur) {
      cur.mask = line.slice(5).trim();
    }
  }
  if (cur?.pattern) rules.push(cur);
  return rules;
}

const SAMPLE_CONTENT = `SAFESCRIPT POLICY DOCUMENT
Title: GDPR Redaction Rules
Version: 1.0

RULE: Email Address
PATTERN: [a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+
SCORE: 40
MASK: [EMAIL_MASKED]

RULE: API Key / Secret Token
PATTERN: sk-[a-zA-Z0-9_\\-]{20,}
SCORE: 90
MASK: [API_KEY_MASKED]

RULE: Credit Card Number
PATTERN: \\b(?:\\d[ -]?){13,16}\\b
SCORE: 95
MASK: [CREDIT_CARD_MASKED]

RULE: Indian Aadhaar Number
PATTERN: \\b[2-9]\\d{3}[\\s\\-]?\\d{4}[\\s\\-]?\\d{4}\\b
SCORE: 85
MASK: [AADHAAR_MASKED]

RULE: Indian PAN Card
PATTERN: \\b[A-Z]{5}[0-9]{4}[A-Z]\\b
SCORE: 80
MASK: [PAN_MASKED]

RULE: Phone Number
PATTERN: (?:\\+?\\d{1,3}[\\s\\-]?)?(?:\\(?\\d{2,4}\\)?[\\s\\-]?)?\\d{3,4}[\\s\\-]?\\d{4}
SCORE: 50
MASK: [PHONE_MASKED]

RULE: IPv4 Address
PATTERN: \\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b
SCORE: 45
MASK: [IP_ADDRESS_MASKED]

RULE: Social Security Number
PATTERN: \\b\\d{3}[-\\s]?\\d{2}[-\\s]?\\d{4}\\b
SCORE: 95
MASK: [SSN_MASKED]

RULE: Passport Number
PATTERN: \\b[A-Z]{1,2}[0-9]{6,9}\\b
SCORE: 85
MASK: [PASSPORT_MASKED]

RULE: IBAN Bank Account
PATTERN: \\b[A-Z]{2}\\d{2}[A-Z0-9]{4}\\d{7}([A-Z0-9]?){0,16}\\b
SCORE: 90
MASK: [BANK_ACCOUNT_MASKED]
`;


export default function PoliciesPage() {
  const router = useRouter();
  const { user, logout, isAdmin, isLoading: authLoading } = useAuth();

  const [policies, setPolicies] = useState<PolicyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Add form */
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formFile, setFormFile] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Delete confirm */
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/policies`, { headers: authHeader(user.token) });
      const data = await res.json();
      setPolicies(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/"); return; }
    fetchPolicies();
  }, [fetchPolicies, user, authLoading, router]);

  if (!authLoading && !isAdmin) return <UnauthorizedView pageName="Policy Management" />;

  /* ── File upload handler ── */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormFile(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormContent(ev.target?.result as string ?? "");
      if (!formTitle) setFormTitle(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsText(file);
  };

  /* ── Submit new policy ── */
  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setError("Title and content are required."); return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader(user!.token) },
        body: JSON.stringify({ title: formTitle.trim(), content: formContent.trim(), file_name: formFile }),
      });
      if (!res.ok) throw new Error("Failed to create policy");
      await fetchPolicies();
      setFormTitle(""); setFormContent(""); setFormFile(null); setShowForm(false);
    } catch {
      setError("Failed to save policy.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/policies/${id}`, {
        method: "DELETE",
        headers: authHeader(user!.token),
      });
      setPolicies((p) => p.filter((d) => d.id !== id));
    } catch {
      setError("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ────── Render ────── */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        .font-body  { font-family: 'Manrope', sans-serif; }
        .font-label { font-family: 'Plus Jakarta Sans', sans-serif; }
        .bouncy-hover { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .bouncy-hover:hover { transform: scale(1.015); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="font-body min-h-screen bg-[#f8faf5] text-[#191c1a]">

        {/* NAV */}
        <nav className="sticky top-0 z-40 flex items-center justify-between px-8 h-16 bg-[#f8faf5]/90 backdrop-blur-xl border-b border-[#c1c8c4]/20">
          <div className="flex items-center gap-10">
            <span className="text-xl font-bold text-[#16342b] tracking-tight">SafeScript</span>
            <div className="hidden md:flex gap-7">
              <span onClick={() => router.push("/prompt")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Gateway</span>
              <span onClick={() => router.push("/dashboard")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Dashboard</span>
              <span className="text-[#16342b] font-bold border-b-2 border-[#16342b] pb-0.5 text-sm cursor-pointer">Policies</span>
              <span onClick={() => router.push("/logs")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Audit Logs</span>
              <span onClick={() => router.push("/admin/users")} className="text-[#16342b]/50 hover:text-[#16342b] transition-colors text-sm cursor-pointer">Users</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { logout(); router.push("/"); }} className="p-2 hover:bg-red-50 rounded-full transition-colors" title="Sign out">
              <LogOut className="w-4 h-4 text-[#414845]" />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#302a4e] flex items-center justify-center text-[#cac1ee] font-bold text-sm" title={user?.name}>
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-[#16342b] tracking-tight">Policy Management</h1>
              <p className="text-[#414845] text-sm mt-1 font-label">Upload redaction rules — they are applied automatically to every prompt.</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Download sample template */}
              <button
                onClick={() => {
                  setFormTitle("GDPR Redaction Rules");
                  setFormContent(SAMPLE_CONTENT);
                  setFormFile("gdpr_redaction_rules.txt");
                  setShowForm(true);
                }}
                className="flex items-center gap-2 bg-[#ecefea] text-[#16342b] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e1e3de] transition-all"
              >
                <Download className="w-4 h-4" />
                Load Sample
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-[#16342b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold bouncy-hover shadow-lg shadow-[#16342b]/10 transition-all"
              >
                {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showForm ? "Cancel" : "Add Policy"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
              <p className="text-sm text-[#ba1a1a] font-label">{error}</p>
            </div>
          )}

          {/* Add form */}
          {showForm && (
            <form onSubmit={handleAddPolicy} className="bg-white border border-[#c1c8c4]/30 rounded-2xl p-6 shadow-sm space-y-5 animate-in slide-in-from-top-4 duration-300">
              <h2 className="font-bold text-[#16342b] text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> New Policy Document</h2>
              <div className="space-y-1.5">
                <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975]">Title</label>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required
                  className="w-full h-12 px-4 bg-[#f2f4ef] border-0 rounded-xl text-sm text-[#191c1a] placeholder:text-[#727975] focus:outline-none focus:ring-2 focus:ring-[#16342b]/20"
                  placeholder="e.g. GDPR Redaction Rules" />
              </div>
              {/* File upload */}
              <div className="space-y-1.5">
                <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975]">Import from File (optional)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-[#c1c8c4]/40 hover:border-[#16342b]/30 rounded-xl p-5 text-center cursor-pointer transition-colors group"
                >
                  <Upload className="w-6 h-6 text-[#414845]/40 group-hover:text-[#16342b] mx-auto mb-2 transition-colors" />
                  <p className="text-sm text-[#414845]/60 font-label">{formFile ? `✓ ${formFile}` : "Click to upload .txt or .md file"}</p>
                  <input ref={fileRef} type="file" accept=".txt,.md,.text" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975]">Policy Content</label>
                <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} required rows={8}
                  className="w-full px-4 py-3 bg-[#f2f4ef] border-0 rounded-xl text-sm text-[#191c1a] placeholder:text-[#727975] focus:outline-none focus:ring-2 focus:ring-[#16342b]/20 resize-none font-mono leading-relaxed"
                  placeholder="Paste your policy content here, or upload a file above…" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-[#414845] bg-[#ecefea] hover:bg-[#e1e3de] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-[#16342b] text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#2d4b41] transition-colors">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {submitting ? "Saving…" : "Save Policy"}
                </button>
              </div>
            </form>
          )}

          {/* Policy list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#16342b] animate-spin" />
            </div>
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#c1c8c4]/30 rounded-2xl gap-4">
              <Shield className="w-12 h-12 text-[#414845]/20" />
              <div className="text-center">
                <h3 className="font-bold text-[#191c1a] mb-1">No policies yet</h3>
                <p className="text-sm text-[#414845]/60 font-label max-w-xs">Click <strong>Load Sample</strong> to instantly load a 10-rule GDPR policy, or add your own rules.</p>
              </div>
              <button
                onClick={() => { setFormTitle("GDPR Redaction Rules"); setFormContent(SAMPLE_CONTENT); setFormFile("gdpr_redaction_rules.txt"); setShowForm(true); }}
                className="flex items-center gap-2 bg-[#16342b] text-white px-4 py-2 rounded-xl text-sm font-semibold"
              >
                <Download className="w-4 h-4" /> Load GDPR Sample
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {policies.map((doc) => {
                const rules = parsedRules(doc.content);
                const highRiskRules = rules.filter(r => r.score >= 80);
                return (
                  <div key={doc.id} className="bg-white border border-[#c1c8c4]/20 rounded-2xl shadow-sm overflow-hidden transition-all">
                    {/* Row header */}
                    <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-[#f8faf5]" onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#c8eadc] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-[#16342b]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#16342b] text-sm">{doc.title}</p>
                            {rules.length > 0 && (
                              <span className="flex items-center gap-1 bg-[#c8eadc] text-[#16342b] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <Zap className="w-2.5 h-2.5" />{rules.length} rules active
                              </span>
                            )}
                            {highRiskRules.length > 0 && (
                              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {highRiskRules.length} high-risk
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-label text-[#414845]/60 mt-0.5">
                            {doc.file_name && <span className="mr-2">📎 {doc.file_name}</span>}
                            {new Date(doc.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`w-4 h-4 text-[#414845]/50 transition-transform duration-200 ${expandedId === doc.id ? "rotate-180" : ""}`} />
                        {deletingId === doc.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#ba1a1a] font-label font-bold">Confirm?</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                              className="px-2 py-1 bg-[#ba1a1a] text-white text-xs rounded-lg font-bold hover:bg-red-800 transition-colors">Yes</button>
                            <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                              className="px-2 py-1 bg-[#ecefea] text-[#414845] text-xs rounded-lg font-bold transition-colors">No</button>
                          </div>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setDeletingId(doc.id); }}
                            className="p-2 hover:bg-red-50 hover:text-red-600 text-[#414845]/50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {expandedId === doc.id && (
                      <div className="px-6 pb-5 border-t border-[#c1c8c4]/10">
                        {rules.length > 0 ? (
                          <div className="mt-4 space-y-3">
                            <p className="text-xs font-label font-bold text-[#414845] uppercase tracking-widest">
                              Active Detection Rules
                            </p>
                            <div className="rounded-xl overflow-hidden border border-[#c1c8c4]/20">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="bg-[#f2f4ef]">
                                    {["Type", "Mask Token", "Risk Score"].map(h => (
                                      <th key={h} className="px-4 py-2 text-[10px] font-label font-bold text-[#414845]/60 uppercase tracking-widest">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {rules.map((rule, i) => (
                                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#f8faf5]"}>
                                      <td className="px-4 py-2.5 text-sm font-semibold text-[#16342b]">{rule.label}</td>
                                      <td className="px-4 py-2.5">
                                        <code className="text-xs bg-[#ecefea] text-[#2d4b41] px-2 py-0.5 rounded-lg font-mono">{rule.mask}</code>
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                          rule.score >= 80 ? "bg-red-100 text-red-700" :
                                          rule.score >= 50 ? "bg-amber-100 text-amber-700" :
                                          "bg-[#c8eadc] text-[#16342b]"
                                        }`}>{rule.score}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <pre className="mt-4 bg-[#f2f4ef] rounded-xl p-4 text-xs font-mono text-[#191c1a] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto scrollbar-hide">
                            {doc.content}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
