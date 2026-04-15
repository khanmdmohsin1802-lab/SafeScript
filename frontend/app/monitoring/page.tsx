import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { Construction } from "lucide-react";

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Navbar />
      
      <main className="ml-20 p-8 w-[calc(100%-5rem)] text-white">
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl bg-surface/50">
          <Construction size={48} className="text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Monitoring Dashboard</h2>
          <p className="text-muted-foreground">Advanced API traffic charts and timeline views are currently under development.</p>
        </div>
      </main>
    </div>
  );
}
