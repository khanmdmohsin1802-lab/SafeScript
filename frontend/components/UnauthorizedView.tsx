"use client";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UnauthorizedView({ pageName = "this page" }: { pageName?: string }) {
  const router = useRouter();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Plus+Jakarta+Sans:wght@400;600&display=swap');
        .font-body { font-family: 'Manrope', sans-serif; }
        .font-label { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}} />
      <div className="font-body min-h-screen bg-[#f8faf5] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-[#ffdad6] rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <ShieldOff className="w-10 h-10 text-[#ba1a1a]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#191c1a] tracking-tight mb-2">
              Access Restricted
            </h1>
            <p className="text-[#414845] leading-relaxed font-label">
              You don&apos;t have permission to access <strong>{pageName}</strong>. This area is reserved for SafeScript administrators only.
            </p>
          </div>
          <div className="bg-[#f2f4ef] border border-[#c1c8c4]/20 rounded-2xl p-5 text-left space-y-2">
            <p className="text-xs font-label font-bold text-[#414845]/60 uppercase tracking-widest">Why am I seeing this?</p>
            <p className="text-sm text-[#414845]">Your account has <span className="font-semibold text-[#16342b]">User</span> level access. Admin features like audit logs, policy management, and user settings require an admin account.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/prompt")}
              className="flex items-center gap-2 bg-[#16342b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d4b41] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Gateway
            </button>
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#414845] bg-[#ecefea] hover:bg-[#e1e3de] transition-colors"
            >
              Go Back
            </button>
          </div>
          <p className="text-xs text-[#414845]/40 font-label">
            Need admin access? Contact your SafeScript administrator.
          </p>
        </div>
      </div>
    </>
  );
}
