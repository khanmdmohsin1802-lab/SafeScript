"use client"

import Navbar from "../../components/Navbar";
import { ScrollText, ShieldAlert, CheckCircle2, Shield } from "lucide-react";
import { useEffect, useState } from "react";

type LogEntry = {
  action: string;
  user: string;
  risk_level: string;
  timestamp: string;
  exact_prompt?: string;
  sensitive_items?: string[];
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/logs");
        const data = await response.json();
        setLogs(data.logs || []);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-8 w-full max-w-7xl mx-auto text-white">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-surface border border-border rounded-lg">
            <ScrollText size={24} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Admin Audit Logs</h2>
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="px-6 py-4 font-medium tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 font-medium tracking-wider">User</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Action</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Risk Level</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Sensitive Items</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Payload Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground animate-pulse">
                      Loading secure logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Shield className="mx-auto mb-4 opacity-50" size={32} />
                      No security logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, i) => (
                    <tr key={i} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                          log.action.includes('Override') 
                            ? 'bg-danger/10 text-danger border border-danger/20' 
                            : 'bg-success/10 text-success border border-success/20'
                        }`}>
                          {log.action.includes('Override') ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} />}
                          {log.action}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {log.risk_level === 'High' ? (
                          <span className="text-danger font-bold">{log.risk_level}</span>
                        ) : log.risk_level === 'Medium' ? (
                          <span className="text-warning font-bold">{log.risk_level}</span>
                        ) : (
                          <span className="text-muted-foreground">{log.risk_level}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {log.sensitive_items && log.sensitive_items.length > 0 ? (
                           <div className="flex flex-wrap gap-1">
                             {log.sensitive_items.map((item, idx) => (
                               <span key={idx} className="bg-surface border border-border text-xs px-2 py-0.5 rounded text-muted-foreground">
                                 {item}
                               </span>
                             ))}
                           </div>
                        ) : (
                          <span className="text-muted-foreground opacity-50">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-muted-foreground truncate max-w-xs relative group cursor-help">
                        {log.exact_prompt || '-'}
                        {log.exact_prompt && (
                          <div className="absolute hidden group-hover:block z-50 bg-surface border border-border p-3 rounded-lg shadow-2xl mt-1 left-0 w-80 whitespace-pre-wrap font-sans text-white">
                            {log.exact_prompt}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
