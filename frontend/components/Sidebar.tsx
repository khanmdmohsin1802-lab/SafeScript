import { Home, BarChart2, Shield, ScrollText, Settings } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="w-20 bg-surface border-r border-border h-screen flex flex-col items-center py-6 gap-8 fixed left-0 top-0 text-muted-foreground z-10">
      <Link href="/dashboard" className="p-3 bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-colors">
        <Shield size={24} />
      </Link>
      
      <nav className="flex flex-col gap-6 w-full items-center mt-4">
        <Link href="/dashboard" className="hover:text-primary transition-colors hover:bg-white/5 p-3 rounded-xl" title="Dashboard">
          <Home size={22} />
        </Link>
        <Link href="/monitoring" className="hover:text-primary transition-colors hover:bg-white/5 p-3 rounded-xl" title="Monitoring">
          <BarChart2 size={22} />
        </Link>
        <Link href="/policies" className="hover:text-primary transition-colors hover:bg-white/5 p-3 rounded-xl" title="Policies">
          <Shield size={22} />
        </Link>
        <Link href="/logs" className="hover:text-primary transition-colors hover:bg-white/5 p-3 rounded-xl" title="Logs">
          <ScrollText size={22} />
        </Link>
      </nav>
      
      <div className="mt-auto mb-4">
        <Link href="/settings" className="hover:text-primary transition-colors hover:bg-white/5 p-3 rounded-xl" title="Settings">
          <Settings size={22} />
        </Link>
      </div>
    </div>
  );
}
