import React from 'react';
import { 
  LayoutDashboard, FilePlus, FileText, Send, ScrollText, Users, LogOut 
} from 'lucide-react';
import oeLogo from '../assets/oe.png';

interface SidebarProps {
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
  currentUser?: any;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  setActiveTab,
  onSelectTab,
  currentUser,
  onSignOut,
}) => {
  // Support both currentTab and activeTab prop names
  const selectedTab = currentTab || activeTab || 'dashboard';

  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  // Flexible handler that checks all possible function prop names
  const handleTabClick = (tab: string) => {
    if (typeof setCurrentTab === 'function') {
      setCurrentTab(tab);
    } else if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    } else if (typeof onSelectTab === 'function') {
      onSelectTab(tab);
    } else {
      console.warn('No tab switcher function prop was provided to Sidebar component.');
    }
  };

  const userInitials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : currentUser?.username
    ? currentUser.username[0].toUpperCase()
    : 'OE';

  return (
    <div className="w-64 bg-[#0B1120] min-h-screen p-4 flex flex-col justify-between text-white font-sans shrink-0 border-r border-slate-800">
      <div className="space-y-6">
        
        {/* Sidebar Logo Header - Orange Energies Logo */}
        <div className="flex items-center justify-center p-3 rounded-xl bg-white shadow-sm border border-slate-200">
          <img 
            src={oeLogo} 
            alt="Orange Energies Logo" 
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* User Info Card */}
        <div className="bg-[#131C2E] p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center shrink-0">
            {userInitials}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-xs text-white truncate">
              {currentUser?.fullName || currentUser?.username || 'User'}
            </h4>
            <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-wider block mt-0.5">
              {currentUser?.role || 'OE INSTALLER'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === 'dashboard'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleTabClick('new-contract')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === 'new-contract'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FilePlus className="w-4 h-4" />
            <span>New Contract</span>
          </button>

          <button
            onClick={() => handleTabClick('drafts')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === 'drafts'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Drafts</span>
          </button>

          <button
            onClick={() => handleTabClick('submissions')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === 'submissions'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Submissions</span>
          </button>

          <button
            onClick={() => handleTabClick('contracts-view')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === 'contracts-view'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Contracts View</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => handleTabClick('user-management')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedTab === 'user-management'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </button>
          )}
        </nav>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={() => onSignOut && onSignOut()}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors mt-6"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
};

export default Sidebar;