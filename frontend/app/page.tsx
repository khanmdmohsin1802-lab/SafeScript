"use client";

import { useRouter } from "next/navigation";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/prompt");
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .bouncy-transition {
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .font-body {
          font-family: 'Manrope', sans-serif;
        }
        .font-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      `}} />
      <main className="flex min-h-[100dvh] w-[100vw] bg-[#f8faf5] font-body text-[#191c1a] overflow-hidden fixed inset-0 m-0 p-0 !max-w-[none]">
        {/* Left Column: Visual Expanse */}
        <section className="hidden lg:flex lg:w-7/12 bg-[#2d4b41] relative flex-col justify-end p-20 overflow-hidden m-0">
          {/* Abstract Illustration Background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-[#2d4b41] to-[#16342b]"></div>
            <div className="w-full h-full flex items-center justify-center relative">
               {/* Abstract Geometric Vault Concept */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#c8eadc]/20 rounded-xl rotate-12 backdrop-blur-xl border border-[#99baad]/10"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#ffdbca]/10 rounded-xl -rotate-6 backdrop-blur-2xl border border-[#99baad]/20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#99baad]/10 rounded-xl rotate-45 backdrop-blur-3xl border border-[#99baad]/30 shadow-2xl"></div>
                <img alt="abstract 3d visualization" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 object-cover rounded-xl mix-blend-overlay opacity-80" data-alt="abstract 3D geometric glass structures interlocking like a secure vault in deep sage green and metallic tones with soft volumetric lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKHRdAokMnRdFXXb0E_B19CWmfXsuTeWHUIYr9y4t2uqYvAKE9mBuEPf0gsDcIjhaMXZUNJhl1PKytBeMXVQOPFGrxE7lMXSTz0-dnqqjH5_3w87Mu_qWnbCJzASfGNcAyVuJrd7z4TDQu_jRU9Qv16LwQ-5q7DHuGu1sXD7WYm6YENcz2FHLvJwV4UBahY_VIMEF9eqE26WyG0s6wOgF-nXb2jNzkuMglgvs_nyaGZf0a-s_W9PKKwa68DB5LvsKa4A85iKGbCUPP"/>
            </div>
          </div>
          {/* Left Text Content */}
          <div className="relative z-10 space-y-6 max-w-xl">
            <div className="flex items-center gap-3 mb-12">
              <span className="material-symbols-outlined text-[#c8eadc] text-4xl" data-weight="fill">security</span>
              <span className="text-[#c8eadc] font-bold text-2xl tracking-tight">SafeScript</span>
            </div>
            <h1 className="text-[#c8eadc] text-6xl font-extrabold tracking-tighter leading-[1.1]">
              Zero-Trust AI Adoption
            </h1>
            <p className="text-[#99baad] text-lg font-light leading-relaxed max-w-md">
              Secure your enterprise intelligence with automated PII masking and sovereign gateway controls.
            </p>
          </div>
        </section>
        
        {/* Right Column: Authentication Card */}
        <section className="w-full lg:w-5/12 bg-[#f8faf5] flex items-center justify-center p-6 md:p-12 lg:p-24 m-0">
          <div className="w-full max-w-md space-y-10">
            {/* Branding Mobile Only */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-[#16342b] text-3xl" data-weight="fill">security</span>
              <span className="text-[#16342b] font-bold text-xl tracking-tight">SafeScript</span>
            </div>
            
            <div className="bg-[#f2f4ef] p-1.5 rounded-full flex items-center w-fit mx-auto mb-10 shadow-sm">
              <button className="px-8 py-2.5 rounded-full text-sm font-semibold bg-[#16342b] text-[#ffffff] bouncy-transition shadow-lg">Sign In</button>
              <button className="px-8 py-2.5 rounded-full text-sm font-medium text-[#414845] hover:text-[#191c1a] transition-colors">Create Account</button>
            </div>
            
            <div className="space-y-8">
              <header className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-[#191c1a]">Welcome back</h2>
                <p className="text-[#414845] font-light">Access your secure intelligence portal</p>
              </header>
              
              {/* Form */}
              <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-1.5 flex flex-col items-start w-full">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975] ml-4">Corporate Identity</label>
                  <input className="w-full h-14 px-6 bg-[#e7e9e4] border-0 rounded-xl text-[#191c1a] placeholder:text-[#727975] focus:outline-none focus:ring-2 focus:ring-[#2d4b41]/30 transition-all duration-300" placeholder="name@company.com" type="email" required />
                </div>
                <div className="space-y-1.5 flex flex-col items-start w-full">
                  <div className="flex justify-between items-center px-4 w-full">
                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-[#727975]">Access Key</label>
                    <a className="text-[10px] uppercase tracking-[0.1em] text-[#16342b] font-semibold hover:underline" href="#">Reset</a>
                  </div>
                  <input className="w-full h-14 px-6 bg-[#e7e9e4] border-0 rounded-xl text-[#191c1a] placeholder:text-[#727975] focus:outline-none focus:ring-2 focus:ring-[#2d4b41]/30 transition-all duration-300" placeholder="••••••••" type="password" required />
                </div>
                <button type="submit" className="w-full h-14 bg-gradient-to-r from-[#16342b] to-[#2d4b41] text-[#ffffff] rounded-xl font-semibold tracking-wide shadow-xl hover:shadow-[#2d4b41]/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                  Secure Login
                </button>
              </form>
              
              {/* SSO */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center justify-center p-0 m-0"><div className="w-full border-t border-[#c1c8c4]/30"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-label"><span className="bg-[#f8faf5] px-4 text-[#727975]">Enterprise Federation</span></div>
              </div>
              <button className="w-full h-14 flex items-center justify-center gap-3 bg-[#f8faf5] border border-[#c1c8c4]/40 rounded-xl font-medium text-[#191c1a] hover:bg-[#f2f4ef] hover:border-[#c1c8c4] transition-all duration-300 group">
                <span className="material-symbols-outlined text-[#727975] group-hover:text-[#16342b] transition-colors">corporate_fare</span>
                Authenticate with SSO
              </button>
            </div>
            
            <footer className="pt-8 flex flex-col items-center gap-4">
              <p className="text-xs text-[#414845]/60 font-label tracking-wide uppercase">
                Secured by The Mindful Guardian Protocol
              </p>
              <div className="flex gap-6">
                <a className="text-[10px] uppercase tracking-[0.1em] text-[#727975] hover:text-[#16342b] transition-colors" href="#">Privacy Architecture</a>
                <a className="text-[10px] uppercase tracking-[0.1em] text-[#727975] hover:text-[#16342b] transition-colors" href="#">Compliance</a>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </>
  );
}
