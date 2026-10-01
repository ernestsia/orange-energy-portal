import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FilePlus, 
  FileText, 
  Send, 
  Users, 
  LogOut, 
  Wifi 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: (props: { activeTab: string }) => React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const { profile, signOut } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-contract', label: 'New Contract', icon: FilePlus },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'submissions', label: 'Submissions', icon: Send },
    { id: 'users', label: 'User Management', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-sm">
            OE
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide leading-none">Orange Energy</h1>
            <span className="text-[10px] text-slate-400 font-medium">Liberia Digital Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-full">
            <Wifi className="w-3 h-3" />
            <span>ONLINE</span>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-slate-100">{profile?.full_name || 'Agent'}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{profile?.role || 'FIELD_AGENT'}</div>
          </div>

          <button
            onClick={signOut}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 p-6 gap-6 max-w-[1600px] w-full mx-auto">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm h-fit space-y-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Agent & Admin Workflow
            </span>
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {children({ activeTab })}
        </main>
      </div>
    </div>
  );
};