"use client"

import Navbar from "../../components/Navbar";
import { ShieldAlert, AlertTriangle, Key, Mail, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-8 w-full max-w-7xl mx-auto text-white">
        <h2 className="text-2xl font-bold mb-6">Security Overview</h2>
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-muted-foreground font-medium">Safe Prompts</h3>
              <CheckCircle2 className="text-success" size={20} />
            </div>
            <div className="text-4xl font-bold mb-2">94.2%</div>
            <p className="text-sm text-muted-foreground">+2.1% from last week</p>
          </div>
          
          <div className="p-6 bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-muted-foreground font-medium">Risky Prompts Masked</h3>
              <ShieldAlert className="text-warning" size={20} />
            </div>
            <div className="text-4xl font-bold mb-2">5.8%</div>
            <p className="text-sm text-muted-foreground">-0.4% from last week</p>
          </div>

          <div className="p-6 bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-muted-foreground font-medium">Threats Detected</h3>
              <AlertTriangle className="text-danger" size={20} />
            </div>
            <div className="text-4xl font-bold mb-2">1,245</div>
            <p className="text-sm text-muted-foreground">Total exact matches blocked</p>
          </div>
        </div>

        {/* Breakdown & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 p-6 bg-surface border border-border rounded-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-primary" /> Data Masked Breakdown
            </h3>
            <div className="space-y-4">
              {/* Fake bars for MVP */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><Key size={14} className="text-muted-foreground"/> API Keys</span>
                  <span>45%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><Mail size={14} className="text-muted-foreground"/> PII / Emails</span>
                  <span>35%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-warning h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><AlertTriangle size={14} className="text-muted-foreground"/> Financial Data</span>
                  <span>20%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-danger h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-surface border border-border rounded-2xl flex flex-col">
            <h3 className="text-lg font-bold mb-4">Activity Logs</h3>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-64 pr-2">
              <div className="flex flex-col gap-1 border-b border-border pb-3">
                <span className="text-xs text-muted-foreground">12:01 PM</span>
                <span className="text-sm font-medium">API Key Masked</span>
                <span className="text-xs text-muted-foreground">dev@company.com</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-border pb-3">
                <span className="text-xs text-warning">12:03 PM (Medium Risk)</span>
                <span className="text-sm font-medium">Email Masked</span>
                <span className="text-xs text-muted-foreground">intern@company.com</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-border pb-3">
                <span className="text-xs text-danger">12:05 PM (High Risk)</span>
                <span className="text-sm font-medium">Override Approved & Sent</span>
                <span className="text-xs text-muted-foreground">manager@company.com</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
