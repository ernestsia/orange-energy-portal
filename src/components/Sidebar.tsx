import React, { useEffect, useState } from 'react';
import { getCurrentUserProfile, UserRole } from '../Lib/auth';
import { Users, FileText, Wrench, Shield } from 'lucide-react';

export const Sidebar: React.FC<{ activeTab: string; setActiveTab: (tab: string) => void }> = ({
  activeTab,
  setActiveTab,
}) => {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    getCurrentUserProfile().then((profile) => setRole(profile?.role || 'OE Installer'));
  }, []);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen p-4 space-y-6">
      <div className="px-3 py-2">
        <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
          Role: {role || 'Loading...'}
        </span>
      </div>

      <nav className="space-y-1">
        {/* Available to both roles */}
        <button
          onClick={() => setActiveTab('contracts')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'contracts' ? 'bg-orange-500 text-white' : 'hover:bg-slate-800'
          }`}
        >
          <FileText size={18} />
          <span>Contracts & Onboarding</span>
        </button>

        <button
          onClick={() => setActiveTab('installations')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'installations' ? 'bg-orange-500 text-white' : 'hover:bg-slate-800'
          }`}
        >
          <Wrench size={18} />
          <span>System Installations</span>
        </button>

        {/* Admin ONLY Item */}
        {role === 'Admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'users' ? 'bg-orange-500 text-white' : 'hover:bg-slate-800'
            }`}
          >
            <Users size={18} />
            <span>User Management</span>
          </button>
        )}
      </nav>
    </aside>
  );
};