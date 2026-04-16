"use client"

import Navbar from "../../components/Navbar";
import { Send, Shield, AlertOctagon, Cpu, Brain, Sparkles, AlertTriangle, ChevronDown, User as UserIcon, Bot } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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

export default function PromptPage() {
  const [prompt, setPrompt] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [isSending, setIsSending] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, analyzed]);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;

    let score = 0;
    const newSegments: Segment[] = [];
    const regex = /(sk-[a-zA-Z0-9_]+|[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g;
    
    let match;
    let lastIndex = 0;
    let idCounter = 0;

    while ((match = regex.exec(prompt)) !== null) {
      if (match.index > lastIndex) {
        newSegments.push({
          id: idCounter++,
          type: "text",
          rawText: prompt.substring(lastIndex, match.index),
          maskedText: "",
          isMasked: false
        });
      }

      const raw = match[0];
      const type = raw.startsWith("sk-") ? "API Key" : "Email";
      const maskedText = type === "API Key" ? "[API_KEY_MASKED]" : "[EMAIL_MASKED]";
      score += type === "API Key" ? 85 : 30;

      newSegments.push({ id: idCounter++, type, rawText: raw, maskedText, isMasked: true });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < prompt.length) {
      newSegments.push({
        id: idCounter++, type: "text", rawText: prompt.substring(lastIndex), maskedText: "", isMasked: false
      });
    }

    setSegments(newSegments);
    setRiskScore(Math.min(score, 100));
    setAnalyzed(true);
  };

  const toggleMask = (id: number) => {
    setSegments(prev => prev.map(seg => seg.id === id ? { ...seg, isMasked: !seg.isMasked } : seg));
  };

  const currentUnmaskedItems = segments.filter(s => s.type !== "text" && !s.isMasked);

  const handleSend = async () => {
    setIsSending(true);
    
    // Stitch payload together dynamically
    const finalPayload = segments.map(seg => 
      seg.type === "text" ? seg.rawText : (seg.isMasked ? seg.maskedText : seg.rawText)
    ).join("");

    const isOverride = currentUnmaskedItems.length > 0;
    const sensitiveItemsList = currentUnmaskedItems.map(s => s.type);

    // Optimistically add user bubble to chat UI immediately
    setMessages(prev => [...prev, { role: "user", content: finalPayload, isFlagged: isOverride }]);

    // Dismiss validation UI
    setAnalyzed(false);
    setPrompt("");
    setSegments([]);

    try {
      const resp = await fetch("http://127.0.0.1:8000/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          final_prompt: finalPayload,
          original_prompt: isOverride ? finalPayload : prompt,
          override: isOverride,
          sensitive_items: sensitiveItemsList
        })
      });
      
      const data = await resp.json();
      
      // Append exact Gemini response to UI
      setMessages(prev => [...prev, { role: "ai", content: data.ai_response || "Received empty response from API." }]);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "ai", content: "Error: Failed to connect to SafeScript backend API." }]);
    } finally {
      setIsSending(false);
    }
  };

  const loadSample = () => {
    setPrompt("Please summarize this user data: email is john.doe@company.com and the temporary API key is sk-v1abc9X_2L!");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <Navbar />
      
      {/* Background glow matching the image aesthetic */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="flex-1 flex flex-col items-center justify-between pt-6 px-6 w-full max-w-4xl mx-auto text-white z-10 relative overflow-hidden h-[calc(100vh-64px)]">
        
        {/* Model Selector Top Bar */}
        <div className="w-full flex justify-between items-center mb-4 pl-2">
          <div className="relative group inline-block">
             <button className="flex items-center gap-2 bg-surface hover:bg-surface/80 border border-border px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer">
                Gemini Model <ChevronDown size={14} className="text-muted-foreground" />
             </button>
             <div className="absolute top-12 left-0 w-48 bg-surface border border-border rounded-xl p-2 hidden group-hover:block shadow-2xl z-50">
                <div className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg font-medium text-white cursor-pointer flex items-center justify-between">
                   Gemini 3.1 Flash Lite <div className="w-2 h-2 rounded-full bg-success"></div>
                </div>
                <div className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg font-medium text-muted-foreground cursor-pointer flex justify-between">
                   Claude 3.5 Sonnet <span className="text-[10px] uppercase border border-border px-1.5 py-0.5 rounded text-muted-foreground">Pro</span>
                </div>
                <div className="px-3 py-2 text-sm hover:bg-white/5 rounded-lg font-medium text-muted-foreground cursor-pointer flex justify-between">
                   GPT-4o <span className="text-[10px] uppercase border border-border px-1.5 py-0.5 rounded text-muted-foreground">Pro</span>
                </div>
             </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Shield size={14} className="text-success" /> Gateway Active
          </div>
        </div>

        {/* Chat Stream Area */}
        <div className="flex-1 w-full overflow-y-auto mb-6 scrollbar-hide pr-2 flex flex-col">
           {messages.length === 0 && !analyzed ? (
             <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="relative mb-8">
                 <div className="absolute -left-36 -top-4 bg-surface border border-border px-4 py-2 rounded-2xl rounded-tr-none text-sm text-muted-foreground shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
                   Hey there! Need a boost?
                 </div>
                 <div className="absolute -right-36 -top-4 bg-surface border border-border px-4 py-2 rounded-2xl rounded-tl-none text-sm text-muted-foreground shadow-lg animate-bounce" style={{ animationDuration: '3.5s' }}>
                   Ready to secure data?
                 </div>
                 <div className="w-24 h-24 bg-gradient-to-b from-surface to-background border border-primary/30 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                   <Cpu size={48} className="text-primary" />
                 </div>
               </div>
               <h2 className="text-4xl font-bold text-center tracking-tight leading-tight">
                 <span className="text-muted-foreground font-medium mr-3">Hello User</span><br/>
                 Ready to Achieve Great Things?
               </h2>
             </div>
           ) : (
             <div className="w-full flex flex-col gap-6 pt-4 pb-12">
               {messages.map((msg, idx) => (
                  <div key={idx} className={`w-full flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     
                     {msg.role === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-1 shrink-0 text-primary">
                          <Bot size={18} />
                        </div>
                     )}

                     <div className={`max-w-[80%] whitespace-pre-wrap leading-relaxed ${
                         msg.role === 'user' 
                           ? 'bg-surface/60 border border-border/50 px-5 py-3.5 rounded-2xl rounded-tr-sm text-white relative' 
                           : 'text-gray-200'
                       }`}>
                         {msg.content}
                         
                         {/* Optional warning badge underneath user msg if it overrode policies */}
                         {msg.role === 'user' && msg.isFlagged && (
                           <div className="absolute -bottom-5 right-0 text-[10px] text-danger font-medium flex items-center gap-1 opacity-80">
                             <Shield size={10} /> Sent with Override
                           </div>
                         )}
                     </div>
                  </div>
               ))}
               
               {isSending && (
                 <div className="w-full flex justify-start animate-fade-in">
                   <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 shrink-0 text-primary animate-pulse">
                      <Bot size={18} />
                   </div>
                   <div className="text-muted-foreground flex space-x-1 items-center mt-2 h-4">
                     <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                     <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                     <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></div>
                   </div>
                 </div>
               )}

               {/* Dynamic SafeScript Interception Block */}
               {analyzed && (
                  <div className="w-full my-4 flex justify-end animate-in slide-in-from-bottom-4 duration-300">
                    <div className="w-[90%] bg-surface border border-border shadow-2xl rounded-2xl p-6 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                       <div className="flex justify-between items-start mb-4">
                         <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                               <Shield size={20} className="text-primary"/> SafeScript Verification
                            </h2>
                            <p className="text-muted-foreground text-sm mt-1">Review the payload before it streams to Gemini.</p>
                         </div>
                       </div>
                       
                       <div className="w-full bg-background border border-border/50 rounded-xl p-4 text-white font-mono text-sm leading-8">
                         {segments.map((seg) => {
                           if (seg.type === "text") return <span key={seg.id}>{seg.rawText}</span>;
                           return (
                             <button
                               key={seg.id}
                               onClick={() => toggleMask(seg.id)}
                               className={`inline-flex px-1.5 py-0.5 mx-1 rounded text-sm font-mono tracking-tight transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 ${
                                 seg.isMasked 
                                   ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30" 
                                   : "bg-danger text-white border border-danger shadow-danger/20"
                               }`}
                             >
                               {seg.isMasked ? seg.maskedText : seg.rawText}
                             </button>
                           );
                         })}
                       </div>

                       <div className="flex justify-between items-center mt-4">
                          <button 
                            onClick={() => setAnalyzed(false)} 
                            className="text-xs font-semibold text-muted-foreground hover:text-white px-3 py-1.5 transition-colors"
                          >
                            Return to Editor
                          </button>
                          
                          <div className="flex items-center gap-3">
                            {currentUnmaskedItems.length > 0 && (
                              <div className="flex items-center text-danger text-xs font-bold bg-danger/10 px-3 py-1.5 rounded-lg mr-2">
                                 ⚠️ Flagged ({currentUnmaskedItems.length})
                              </div>
                            )}
                            <button 
                              onClick={handleSend}
                              className={`${currentUnmaskedItems.length > 0 ? 'bg-danger hover:bg-danger/90' : 'bg-primary hover:bg-primary/90'} text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg`}
                            >
                              <Send size={16} /> Confirm & Dispatch
                            </button>
                          </div>
                       </div>
                    </div>
                  </div>
               )}
               <div ref={chatEndRef} />
             </div>
           )}
        </div>

        {/* Persistent Bottom Chat Input */}
        <div className={`w-full max-w-4xl pb-8 transition-all duration-500 ease-in-out ${analyzed ? 'opacity-30 pointer-events-none saturate-0' : 'opacity-100'}`}>
           <div className="w-full bg-surface border border-border rounded-t-2xl p-2 flex items-center justify-between shadow-lg">
             <div className="flex items-center gap-2 text-xs text-muted-foreground pl-3">
               <Sparkles size={14} className="text-primary" /> Gateway Policy Applied
             </div>
           </div>

           <div className="w-full bg-background border border-border border-t-0 rounded-b-2xl p-4 shadow-2xl relative">
             <textarea
               className="w-full bg-transparent text-white focus:outline-none resize-none placeholder:text-muted-foreground text-[16px] mb-2 min-h-[50px] max-h-[200px]"
               placeholder="Chat with Gemini 1.5. Prohibited phrases will be safely caught..."
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnalyze(); }}}
             />
             
             <div className="flex items-center justify-between pt-2">
               <div className="flex items-center gap-2">
                 <button onClick={loadSample} className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-muted-foreground hover:text-white bg-surface hover:bg-white/5 border border-border px-3 py-1.5 rounded-full transition-all">
                   <Brain size={12} /> Inject Test Vector
                 </button>
               </div>
               
               <div className="flex items-center gap-3">
                 <button 
                   onClick={handleAnalyze}
                   disabled={!prompt.trim() || isSending}
                   className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/30"
                 >
                   <Send size={18} className="translate-x-0.5" />
                 </button>
               </div>
             </div>
           </div>
        </div>
        
      </main>
    </div>
  );
}
