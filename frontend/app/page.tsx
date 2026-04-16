"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, User, KeyRound, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = "http://127.0.0.1:8000";

export default function AuthPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();

  /* Tab state */
  const [tab, setTab] = useState<"login" | "signup">("login");

  /* Login form */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  /* Signup form */
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);

  /* Shared UI */
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* Redirect if already logged in */
  useEffect(() => {
    if (!isLoading && user) {
      router.push(user.role === "admin" ? "/dashboard" : "/prompt");
    }
  }, [user, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Login failed");
      }
      const data = await res.json();
      login(data.access_token, data.role, data.name, data.user_id);
      router.push(data.role === "admin" ? "/dashboard" : "/prompt");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          role: "admin",
          admin_secret: adminSecret,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Signup failed");
      }
      const data = await res.json();
      login(data.access_token, data.role, data.name, data.user_id);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .font-body  { font-family: 'Manrope', sans-serif; }
        .font-label { font-family: 'Plus Jakarta Sans', sans-serif; }
        .bouncy { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}} />

      <main className="flex min-h-[100dvh] w-[100vw] bg-[#f8faf5] font-body text-[#191c1a] fixed inset-0">

        {/* Left visual panel */}
        <section className="hidden lg:flex lg:w-7/12 bg-[#2d4b41] relative flex-col justify-end p-20 overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-[#2d4b41] to-[#16342b]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 bg-[#c8eadc]/20 rounded-xl rotate-12 border border-[#99baad]/10" />
            <div className="absolute w-80 h-80 bg-[#ffdbca]/10 rounded-xl -rotate-6 border border-[#99baad]/20" />
            <div className="absolute w-64 h-64 bg-[#99baad]/10 rounded-xl rotate-45 border border-[#99baad]/30 shadow-2xl" />
          </div>
          <div className="relative z-10 space-y-6 max-w-xl">
            <div className="flex items-center gap-3 mb-12">
              <span className="material-symbols-outlined text-[#c8eadc] text-4xl">security</span>
              <span className="text-[#c8eadc] font-bold text-2xl tracking-tight">SafeScript</span>
            </div>
            <h1 className="text-[#c8eadc] text-5xl font-extrabold tracking-tighter leading-[1.1]">
              Zero-Trust<br />AI Adoption
            </h1>
            <p className="text-[#99baad] text-lg font-light leading-relaxed max-w-md">
              Secure your enterprise intelligence with automated PII masking and sovereign gateway controls.
            </p>
            <div className="flex gap-4 mt-8">
              {["RBAC Protected", "PII Masked", "Audit Trail"].map((badge) => (
                <span key={badge} className="text-[10px] font-label font-bold uppercase tracking-widest text-[#c8eadc]/60 border border-[#c8eadc]/20 px-3 py-1.5 rounded-full">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Right auth panel */}
        <section className="w-full lg:w-5/12 bg-[#f8faf5] flex items-center justify-center p-6 md:p-12 lg:p-16 overflow-y-auto">
          <div className="w-full max-w-md space-y-8">

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3">
              <span className="material-symbols-outlined text-[#16342b] text-3xl">security</span>
              <span className="text-[#16342b] font-bold text-xl tracking-tight">SafeScript</span>
            </div>

            {/* Tabs */}
            <div className="bg-[#f2f4ef] p-1.5 rounded-full flex items-center w-fit mx-auto shadow-sm">
              <button
                onClick={() => { setTab("login"); setError(""); }}
                className={`px-8 py-2.5 rounded-full text-sm font-semibold bouncy ${tab === "login" ? "bg-[#16342b] text-white shadow-lg" : "text-[#414845] hover:text-[#191c1a] transition-colors"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab("signup"); setError(""); }}
                className={`px-8 py-2.5 rounded-full text-sm font-semibold bouncy ${tab === "signup" ? "bg-[#16342b] text-white shadow-lg" : "text-[#414845] hover:text-[#191c1a] transition-colors"}`}
              >
                Admin Register
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
                <p className="text-sm text-[#ba1a1a] font-label">{error}</p>
              </div>
            )}

            {/* ── LOGIN ── */}
            {tab === "login" && (
              <div className="space-y-8">
                <header>
                  <h2 className="text-3xl font-bold tracking-tight text-[#191c1a]">Welcome back</h2>
                  <p className="text-[#414845] font-light mt-1">Access your secure intelligence portal</p>
                </header>
                <form className="space-y-5" onSubmit={handleLogin}>
                  <div className="space-y-1.5">
                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975] ml-4">Corporate Identity</label>
                    <input
                      type="email" required
                      value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full h-14 px-6 bg-[#e7e9e4] border-0 rounded-xl text-[#191c1a] placeholder:text-[#727975] focus:outline-none focus:ring-2 focus:ring-[#2d4b41]/30 transition-all"
                      placeholder="name@company.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975] ml-4">Access Key</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"} required
                        value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full h-14 px-6 pr-14 bg-[#e7e9e4] border-0 rounded-xl text-[#191c1a] placeholder:text-[#727975] focus:outline-none focus:ring-2 focus:ring-[#2d4b41]/30 transition-all"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727975] hover:text-[#16342b] transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting}
                    className="w-full h-14 bg-gradient-to-r from-[#16342b] to-[#2d4b41] text-white rounded-xl font-semibold tracking-wide shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    {isSubmitting ? "Authenticating…" : "Secure Login"}
                  </button>
                </form>
                <p className="text-center text-xs text-[#414845]/60 font-label">
                  Don&apos;t have an account? Contact your SafeScript administrator.
                </p>
              </div>
            )}

            {/* ── ADMIN SIGNUP ── */}
            {tab === "signup" && (
              <div className="space-y-8">
                <header>
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="w-5 h-5 text-[#16342b]" />
                    <h2 className="text-3xl font-bold tracking-tight text-[#191c1a]">Admin Registration</h2>
                  </div>
                  <p className="text-[#414845] font-light">Requires the SafeScript admin authorization key.</p>
                </header>
                <form className="space-y-5" onSubmit={handleSignup}>
                  <div className="space-y-1.5">
                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975] ml-4">Full Name</label>
                    <input type="text" required value={signupName} onChange={(e) => setSignupName(e.target.value)}
                      className="w-full h-14 px-6 bg-[#e7e9e4] border-0 rounded-xl text-[#191c1a] placeholder:text-[#727975] focus:outline-none focus:ring-2 focus:ring-[#2d4b41]/30 transition-all"
                      placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975] ml-4">Work Email</label>
                    <input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full h-14 px-6 bg-[#e7e9e4] border-0 rounded-xl text-[#191c1a] placeholder:text-[#727975] focus:outline-none focus:ring-2 focus:ring-[#2d4b41]/30 transition-all"
                      placeholder="admin@company.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975] ml-4">Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full h-14 px-6 pr-14 bg-[#e7e9e4] border-0 rounded-xl text-[#191c1a] placeholder:text-[#727975] focus:outline-none focus:ring-2 focus:ring-[#2d4b41]/30 transition-all"
                        placeholder="Min. 8 characters" minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727975] hover:text-[#16342b] transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {/* Admin secret key field */}
                  <div className="space-y-1.5">
                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975] ml-4">Admin Authorization Key</label>
                    <div className="relative">
                      <input type={showAdminKey ? "text" : "password"} required value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)}
                        className="w-full h-14 px-6 pr-14 bg-[#302a4e]/10 border border-[#302a4e]/20 rounded-xl text-[#191c1a] placeholder:text-[#727975] focus:outline-none focus:ring-2 focus:ring-[#302a4e]/30 transition-all font-mono"
                        placeholder="Provided by SafeScript" />
                      <button type="button" onClick={() => setShowAdminKey(!showAdminKey)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727975] hover:text-[#302a4e] transition-colors">
                        {showAdminKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-[10px] font-label text-[#414845]/50 ml-2 flex items-center gap-1">
                      <User className="w-3 h-3" /> This key is issued by SafeScript. Regular users are added by admins from the admin panel.
                    </p>
                  </div>
                  <button type="submit" disabled={isSubmitting}
                    className="w-full h-14 bg-gradient-to-r from-[#302a4e] to-[#474065] text-white rounded-xl font-semibold tracking-wide shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                    {isSubmitting ? "Creating Admin Account…" : "Create Admin Account"}
                  </button>
                </form>
                <div className="bg-[#302a4e]/5 border border-[#302a4e]/10 rounded-xl p-4">
                  <p className="text-[10px] font-label text-[#302a4e] uppercase tracking-wider font-bold mb-1">Security Note</p>
                  <p className="text-xs text-[#484267]">Admin accounts have full access to audit logs, policy management, and user control. Only register if you are an authorized SafeScript administrator.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
