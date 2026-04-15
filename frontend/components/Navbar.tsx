import { Search, Bell, User } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="h-20 border-b border-border bg-background flex items-center justify-between px-8 ml-20 sticky top-0 z-10 w-[calc(100%-5rem)]">
      <div className="flex items-center gap-8">
        <h1 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
          Insight<span className="text-primary font-normal">Shield</span>
        </h1>
        
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/monitoring" className="hover:text-white transition-colors">Monitoring</Link>
          <Link href="/policies" className="hover:text-white transition-colors">Policies</Link>
          <Link href="/prompt" className="text-primary hover:text-primary/80 transition-colors">New Prompt</Link>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 text-muted-foreground" size={16} />
          <input 
            type="text" 
            placeholder="Search policies, logs..." 
            className="pl-10 pr-4 py-2 bg-surface text-sm rounded-full border border-border focus:outline-none focus:border-primary transition-colors w-64 text-white"
          />
        </div>
        
        <button className="text-muted-foreground hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-danger rounded-full"></span>
        </button>
        
        <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-white cursor-pointer hover:border-primary transition-colors">
          <User size={18} />
        </div>
      </div>
    </header>
  );
}
