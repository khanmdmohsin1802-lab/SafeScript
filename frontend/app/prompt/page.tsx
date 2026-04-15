"use client"

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { Send, Shield, AlertOctagon } from "lucide-react";
import { useState } from "react";

export default function PromptPage() {
  const [prompt, setPrompt] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [maskedPrompt, setMaskedPrompt] = useState("");
  const [riskScore, setRiskScore] = useState(0);

  const handleAnalyze = async () => {
    // In a real app, this calls our mapped POST /analyze backend URL
    // For now we will replicate the basic logic client side before fetch
    const p = prompt;
    let m = p;
    let score = 0;
    
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Navbar />
      
      <main className="ml-20 p-8 w-[calc(100%-5rem)] text-white max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">New Prompt Integration</h2>
        <p className="text-muted-foreground mb-8">Type your prompt below. InsightShield will analyze and mask sensitive data before it reaches the external AI.</p>
        
        {!analyzed ? (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <textarea
              className="w-full h-48 bg-background border border-border rounded-xl p-4 text-white focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground"
              placeholder="E.g., Summarize this user data: email is john@doe.com and API key is sk-12345ABC..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex justify-between items-center mt-4">
              <button 
                onClick={() => setPrompt("Please summarize this user data: email is john.doe@company.com and the temporary API key is sk-v1abc9X_2L!")} 
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Load Sample Data
              </button>
              <button 
                onClick={handleAnalyze} 
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                disabled={!prompt}
              >
                <Shield size={18} /> Analyze Prompt
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            
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
                  className="w-full h-48 bg-background border border-primary/50  rounded-xl p-4 text-white focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground"
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
                <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                  <Send size={18} /> Send to AI Gateway
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
