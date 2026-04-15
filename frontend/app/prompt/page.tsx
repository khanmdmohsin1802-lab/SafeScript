"use client"

import Navbar from "../../components/Navbar";
import { Send, Shield, AlertOctagon, Cpu, Brain, Sparkles } from "lucide-react";
import { useState } from "react";

export default function PromptPage() {
  const [prompt, setPrompt] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [maskedPrompt, setMaskedPrompt] = useState("");
  const [riskScore, setRiskScore] = useState(0);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;

    let m = prompt;
    let score = 0;
    
    // Core regex from MVP
    if (m.includes("sk-")) {
      m = m.replace(/sk-[a-zA-Z0-9_]+/g, "[API_KEY_MASKED]");
      score += 85;
    }
    
    if (m.includes("@")) {
      m = m.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[EMAIL_MASKED]");
      score += 30;
    }

    setMaskedPrompt(m);
    setRiskScore(Math.min(score, 100));
    setAnalyzed(true);
  };

  const loadSample = () => {
    setPrompt("Please summarize this user data: email is john.doe@company.com and the temporary API key is sk-v1abc9X_2L!");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <Navbar />
      
      {/* Background glow matching the image aesthetic */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto text-white z-10 relative">
        
        {!analyzed ? (
          <>
            {/* Center Graphic & Greeting */}
            <div className="flex flex-col items-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <div className="relative mb-8">
                {/* Floating chat bubbles */}
                <div className="absolute -left-36 -top-4 bg-surface border border-border px-4 py-2 rounded-2xl rounded-tr-none text-sm text-muted-foreground shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
                  Hey there! Need a boost?
                </div>
                <div className="absolute -right-36 -top-4 bg-surface border border-border px-4 py-2 rounded-2xl rounded-tl-none text-sm text-muted-foreground shadow-lg animate-bounce" style={{ animationDuration: '3.5s' }}>
                  Ready to secure data?
                </div>
                
                {/* Robot/Bot Mascot Mock */}
                <div className="w-24 h-24 bg-gradient-to-b from-surface to-background border border-primary/30 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  <Cpu size={48} className="text-primary" />
                </div>
              </div>

              <h2 className="text-4xl font-bold text-center tracking-tight leading-tight">
                <span className="text-muted-foreground font-medium mr-3">Hello User</span><br/>
                Ready to Achieve Great Things?
              </h2>
            </div>

            {/* Bottom Floating Input Section */}
            <div className="w-full absolute bottom-12 px-6 max-w-4xl animate-in slide-in-from-bottom-12 duration-500">
              
              {/* Pro Upgrade Banner */}
              <div className="w-full bg-surface border border-border rounded-t-2xl p-3 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-2 text-sm text-muted-foreground pl-2">
                  <Sparkles size={16} className="text-primary" /> 
                  Unlock real-time monitoring with Pro Plan
                </div>
                <button className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">
                  Upgrade Now
                </button>
              </div>

              {/* Main Input Box */}
              <div className="w-full bg-background border border-border border-t-0 rounded-b-2xl p-4 shadow-2xl">
                <textarea
                  className="w-full bg-transparent text-white focus:outline-none resize-none placeholder:text-muted-foreground text-lg mb-2 min-h-[60px]"
                  placeholder="Initiate a query or send a command to the AI..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnalyze(); }}}
                />
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={loadSample} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-white bg-surface hover:bg-white/5 border border-border px-3 py-1.5 rounded-full transition-all">
                      <Brain size={14} /> Load Sample
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleAnalyze}
                      disabled={!prompt.trim()}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/30"
                    >
                      <Send size={18} className="translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Intercepted/Analyzed State */
          <div className="w-full bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold mb-2">SafeScript Validation</h2>
            <p className="text-muted-foreground mb-6">Review the masked prompt before it's sent to the AI endpoint.</p>

            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
              {riskScore > 50 ? (
                <div className="bg-danger/20 text-danger px-4 py-2 rounded-lg flex items-center gap-2 font-bold">
                  <AlertOctagon size={20} /> High Risk Detected ({riskScore} Score)
                </div>
              ) : riskScore > 0 ? (
                <div className="bg-warning/20 text-warning px-4 py-2 rounded-lg flex items-center gap-2 font-bold">
                  <AlertOctagon size={20} /> Medium Risk Detected ({riskScore} Score)
                </div>
              ) : (
                <div className="bg-success/20 text-success px-4 py-2 rounded-lg flex items-center gap-2 font-bold">
                  <Shield size={20} /> Safe to Send
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Original */}
              <div>
                <h3 className="text-sm text-muted-foreground font-medium mb-2">Original Prompt (Read-only)</h3>
                <div className="w-full h-48 bg-background/50 border border-border/50 rounded-xl p-4 text-muted-foreground whitespace-pre-wrap overflow-y-auto">
                  {prompt}
                </div>
              </div>
              
              {/* Sanitized */}
              <div>
                <h3 className="text-sm text-primary font-medium mb-2">Sanitized Prompt (AI will see this)</h3>
                <textarea
                  className="w-full h-48 bg-background border border-primary/50  rounded-xl p-4 text-white focus:outline-none focus:border-primary resize-none"
                  value={maskedPrompt}
                  onChange={(e) => setMaskedPrompt(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
              <button 
                onClick={() => setAnalyzed(false)} 
                className="text-muted-foreground hover:text-white px-4 py-2 transition-colors"
              >
                Cancel & Edit
              </button>
              
              <div className="flex gap-4">
                {riskScore > 50 && (
                   <button className="text-danger border border-danger/30 hover:bg-danger/10 px-6 py-2 rounded-lg font-medium transition-colors">
                     Override & Unmask
                   </button>
                )}
                <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-primary/20">
                  <Send size={18} /> Confirm & Send
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
