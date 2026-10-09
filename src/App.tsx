import React, { useEffect, useState } from 'react';
import { supabase } from './Lib/supabase';
import { Login } from './components/Login';

// Import all page components
import Dashboard from './Pages/Dashboard';
import { NewContract } from './Pages/NewContract';
import Drafts from './Pages/Drafts';
import Submissions from './Pages/Submissions';
import { ContractsView } from './Pages/ContractsView';
import UserManagementView from './Pages/UserManagementView';

import { 
  LayoutDashboard, 
  PlusCircle, 
  FileEdit, 
  Send, 
  FileText, 
  Users, 
  LogOut, 
  Loader2 
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    fullName: string;
    role: string;
  } | null>(null);

  const syncUserSession = async (user: any) => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role || 'OE Installer';
    const fullName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    setCurrentUser({
      id: user.id,
      email: user.email,
      fullName,
      role,
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) syncUserSession(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        syncUserSession(newSession.user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-sm font-semibold">Connecting to Portal...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  // Handle case-insensitive check for uppercase 'ADMIN' role in database
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* Navigation Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-5 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <img src="/oe.png" alt="Orange Logo" className="h-8 w-auto filter brightness-0 invert" />
            <span className="font-black text-orange-500 text-base tracking-wider uppercase">Orange Energies</span>
          </div>

          {/* User Profile Info Card */}
          <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-2xl flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md shrink-0">
              {currentUser?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="font-extrabold text-xs text-slate-100 truncate">{currentUser?.fullName}</div>
              <div className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider">
                {currentUser?.role}
              </div>
            </div>
          </div>

          {/* Dynamic Sidebar Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('new-contract')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'new-contract'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Contract</span>
            </button>

            <button
              onClick={() => setActiveTab('drafts')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'drafts'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileEdit className="w-4 h-4" />
              <span>Drafts</span>
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'submissions'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Submissions</span>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'contracts'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Contracts View</span>
            </button>

            {/* Admin Exclusive Tab */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'users'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </button>
            )}
          </nav>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            localStorage.clear();
            window.location.reload();
          }}
          className="flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 py-2.5 transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Screen Router */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard currentUser={currentUser} />}
        {activeTab === 'new-contract' && <NewContract currentUser={currentUser} />}
        {activeTab === 'drafts' && <Drafts currentUser={currentUser} />}
        {activeTab === 'submissions' && <Submissions currentUser={currentUser} />}
        {activeTab === 'contracts' && <ContractsView currentUser={currentUser} />}
        {activeTab === 'users' && isAdmin && <UserManagementView />}
      </main>
    </div>
  );
}