"use client"

import { Shield, Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/prompt");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md p-8 bg-surface border border-border rounded-2xl shadow-lg relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 border border-primary/20">
            <Shield size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome to SafeScript</h1>
          <p className="text-muted-foreground text-sm text-center">
            Sign in to securely analyze and mask sensitive data before connecting to external AI endpoints.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="you@company.com" 
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] flex items-center justify-center gap-2 mt-2"
          >
             Sign In
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="h-px bg-border flex-1"></div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Or continue with</span>
          <div className="h-px bg-border flex-1"></div>
        </div>

        <button 
          onClick={() => router.push("/prompt")}
          className="w-full mt-6 bg-background border border-border hover:bg-surface text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Fingerprint size={18} className="text-muted-foreground" />
          Single Sign-On (SSO)
        </button>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Secure AI Gateway. Built for Enterprise.
      </p>
    </div>
  );
}
