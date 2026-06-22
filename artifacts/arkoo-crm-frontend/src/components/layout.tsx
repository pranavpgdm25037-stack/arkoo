import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Settings, LogOut, FileText, Layers, Scale, FileSpreadsheet, ClipboardList, FilePlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleComingSoon = (feature: string) => {
    toast({
      title: "Coming Soon",
      description: `The ${feature} module is currently under development.`,
    });
  };

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 premium-sidebar flex flex-col hidden md:flex shrink-0 no-print">
        <div className="h-14 premium-sidebar-logo flex items-center px-6 shrink-0">
          <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-white">
            <img src="/logo.png" alt="Arkoo Logo" className="h-6 w-auto object-contain rounded brightness-125" />
            <span className="bg-gradient-to-r from-white via-indigo-200 to-indigo-100 bg-clip-text text-transparent">Arkoo CRM</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <Link href="/dashboard">
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer premium-sidebar-link ${location === '/dashboard' ? 'premium-sidebar-link-active' : ''}`}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </div>
            </Link>
            <Link href="/contacts">
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer premium-sidebar-link ${location === '/contacts' ? 'premium-sidebar-link-active' : ''}`}>
                <Users className="w-4 h-4" />
                Manage Data
              </div>
            </Link>
            <Link href="/landing-leads">
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer premium-sidebar-link ${location === '/landing-leads' ? 'premium-sidebar-link-active' : ''}`}>
                <FileSpreadsheet className="w-4 h-4" />
                Landing Page Data
              </div>
            </Link>
          </div>

          {/* Quotations category with three independent links */}
          <div className="space-y-1">
            <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quotations
            </div>
            <Link href="/quotations/handmade">
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer premium-sidebar-link ${location === '/quotations/handmade' ? 'premium-sidebar-link-active' : ''}`}>
                <Layers className="w-3.5 h-3.5 shrink-0" />
                Handmade drawing
              </div>
            </Link>
            <Link href="/quotations/ga">
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer premium-sidebar-link ${location === '/quotations/ga' ? 'premium-sidebar-link-active' : ''}`}>
                <Scale className="w-3.5 h-3.5 shrink-0" />
                GA drawing
              </div>
            </Link>
            <Link href="/quotations/pif">
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer premium-sidebar-link ${location === '/quotations/pif' ? 'premium-sidebar-link-active' : ''}`}>
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                PIF Quotation
              </div>
            </Link>
            <Link href="/quotations/generate-pif">
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer premium-sidebar-link ${location === '/quotations/generate-pif' ? 'premium-sidebar-link-active' : ''}`}>
                <FilePlus className="w-3.5 h-3.5 shrink-0" />
                Generate PIF
              </div>
            </Link>
          </div>

          {/* Project Form Link */}
          <div className="space-y-1.5">
            <Link href="/apply">
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer premium-sidebar-link ${location === '/apply' ? 'premium-sidebar-link-active' : ''}`}>
                <ClipboardList className="w-4 h-4" />
                Project Form
              </div>
            </Link>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <Link href="/settings">
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer premium-sidebar-link ${location === '/settings' ? 'premium-sidebar-link-active' : ''}`}>
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-white/5 shrink-0">
          <div onClick={() => signOut()} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
            <LogOut className="w-4 h-4" />
            Logout
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-14 border-b bg-card flex items-center px-4 md:hidden shrink-0 no-print">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <img src="/logo.png" alt="Arkoo Logo" className="h-6 w-auto object-contain rounded" />
            Arkoo CRM
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto bg-background/50">
          <div className="p-4 md:p-8 pb-20 md:pb-8 max-w-[1400px] mx-auto print-container">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-card/95 border-t flex md:hidden items-center justify-around px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] backdrop-blur-md no-print">
        <Link href="/dashboard">
          <div className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${location === '/dashboard' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Dashboard</span>
          </div>
        </Link>
        <Link href="/contacts">
          <div className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${location === '/contacts' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Manage Data</span>
          </div>
        </Link>
        <Link href="/quotations/handmade">
          <div className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${location.startsWith('/quotations') ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
            <FileText className="w-5 h-5" />
            <span className="text-[10px]">Quotations</span>
          </div>
        </Link>
        <Link href="/settings">
          <div className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${location === '/settings' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">Settings</span>
          </div>
        </Link>
        <div onClick={() => signOut()} className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer text-red-500 hover:text-red-600">
          <LogOut className="w-5 h-5" />
          <span className="text-[10px]">Logout</span>
        </div>
      </nav>
    </div>
  );
}
