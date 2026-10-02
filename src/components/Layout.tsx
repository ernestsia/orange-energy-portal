import React, { useState } from 'react';
import { supabase } from '../Lib/supabase';
import { 
  LayoutDashboard, 
  FilePlus, 
  FileText, 
  Send, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Wifi 
} from 'lucide-react';

interface LayoutProps {
  children: (props: { activeTab: string }) => React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-contract', label: 'New Contract', icon: FilePlus },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'submissions', label: 'Submissions', icon: Send },
    { id: 'users', label: 'User Management', icon: Users },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white text-sm">
            OE
          </div>
          <span className="font-bold text-sm tracking-wide">Orange Energy</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar / Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col justify-between transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 space-y-6">
          {/* Header Branding */}
          <div className="hidden md:flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-orange-500/20">
              OE
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight text-white">Orange Energy</h1>
              <p className="text-[11px] text-slate-400 font-medium">Liberia Digital Portal</p>
            </div>
          </div>

          {/* User Badge */}
          <div className="bg-slate-800/80 rounded-xl p-3 flex items-center justify-between border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-orange-400 font-bold text-xs">
                EK
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-100">Ernest Kezelee</p>
                <span className="inline-block text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  ADMIN
                </span>
              </div>
            </div>
            <span className="flex items-center text-[10px] text-emerald-400 gap-1 bg-emerald-950/40 px-2 py-1 rounded-full border border-emerald-800/30">
              <Wifi size={10} /> Online
            </span>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3 mb-2">
              Main Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150
                    ${isActive 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-semibold' 
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Signout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden p-4 md:p-8">
        {children({ activeTab })}
      </main>
    </div>
  );
}