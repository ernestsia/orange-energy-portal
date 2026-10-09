import React, { useState } from 'react';
import { 
  LayoutDashboard, FilePlus, FileText, Send, ScrollText, 
  Users, LogOut, Menu, X 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: any;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-contract', label: 'New Contract', icon: FilePlus },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'submissions', label: 'Submissions', icon: Send },
    { id: 'contracts', label: 'Contracts View', icon: ScrollText },
    ...(currentUser?.role?.toUpperCase() === 'ADMIN' 
      ? [{ id: 'users', label: 'User Management', icon: Users }] 
      : []),
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    setIsOpen(false); // Auto-close drawer on mobile selection
  };

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="lg:hidden bg-[#0B0F19] text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-black text-white text-sm">
            OE
          </div>
          <span className="font-black text-sm uppercase tracking-tight">Orange Energies</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static top-0 left-0 z-50 h-full w-64 bg-[#0B0F19] text-white flex flex-col justify-between p-6 border-r border-slate-800/80 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-500/20">
              OE
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight text-white leading-none">Orange Energies</h2>
              <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider mt-1">Liberia Operations</p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center font-black text-white text-sm shrink-0">
              {currentUser?.fullName?.charAt(0) || currentUser?.username?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{currentUser?.fullName || currentUser?.username}</div>
              <div className="text-[10px] font-extrabold text-orange-400 uppercase tracking-wider">{currentUser?.role || 'User'}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors mt-6"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </aside>
    </>
  );
};