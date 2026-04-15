"use client"

import { Search, Bell, User, Menu, X, Home, BarChart2, Shield, ScrollText, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 -ml-2 text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-surface"
          >
            <Menu size={24} />
          </button>
          
          <h1 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
            Safe<span className="text-primary font-normal">Script</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search policies, logs..." 
              className="pl-10 pr-4 py-1.5 bg-surface text-sm rounded-full border border-border focus:outline-none focus:border-primary transition-colors w-64 text-white"
            />
          </div>
          
          <button className="text-muted-foreground hover:text-white transition-colors relative hidden sm:block">
            <Bell size={20} />
            <span className="absolute 0 right-0 w-2 h-2 bg-danger rounded-full"></span>
          </button>
          
          <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-white cursor-pointer hover:border-primary transition-colors">
            <User size={16} />
          </div>
        </div>
      </header>

      {/* Slide-out Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          <div className="relative w-64 h-full bg-surface border-r border-border shadow-2xl flex flex-col pt-6 z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-6 mb-8">
              <h2 className="font-bold text-lg text-white flex items-center gap-2">
                Menu
              </h2>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-1 text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-2 px-4">
              <Link href="/prompt" className="flex items-center gap-3 text-primary bg-primary/10 px-4 py-3 rounded-xl transition-colors font-medium">
                <Shield size={18} /> New Prompt
              </Link>
              <Link href="/dashboard" className="flex items-center gap-3 text-muted-foreground hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-colors">
                <Home size={18} /> Dashboard
              </Link>
              <Link href="/monitoring" className="flex items-center gap-3 text-muted-foreground hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-colors">
                <BarChart2 size={18} /> Monitoring
              </Link>
              <Link href="/policies" className="flex items-center gap-3 text-muted-foreground hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-colors">
                <Shield size={18} /> Policies
              </Link>
              <Link href="/logs" className="flex items-center gap-3 text-muted-foreground hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-colors">
                <ScrollText size={18} /> Logs
              </Link>
            </nav>

            <div className="mt-auto p-4 mb-4">
              <Link href="/settings" className="flex items-center gap-3 text-muted-foreground hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-colors">
                <Settings size={18} /> Settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
