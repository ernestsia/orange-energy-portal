import React, { useState, useEffect } from 'react';
import { supabase } from './Lib/supabase';
import { Sidebar } from './components/Sidebar';
import Dashboard from './Pages/Dashboard';
import { ContractsView } from './Pages/ContractsView';
import Login from './components/Login';
import UserManagementView from './Pages/UserManagementView';
import Drafts from './Pages/Drafts';
import { NewContract } from './Pages/NewContract';
import  Submissions  from './Pages/Submissions';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setCurrentUser({
        id: authUser.id,
        email: authUser.email,
        fullName: data?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        username: data?.username || authUser.email?.split('@')[0],
        role: data?.role?.toUpperCase() || 'INSTALLER',
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setCurrentUser({
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.email?.split('@')[0],
        username: authUser.email?.split('@')[0],
        role: 'INSTALLER',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white text-xs font-bold">
        Loading Orange Energy Portal...
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen max-w-full bg-slate-100 flex flex-col lg:flex-row overflow-x-hidden font-sans">
      {/* Mobile Drawer & Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Responsive Content Area */}
      <main className="flex-1 w-full max-w-full p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        {activeTab === 'dashboard' && <Dashboard currentUser={currentUser} />}
        {activeTab === 'new-contract' && <NewContract currentUser={currentUser} />}
        {activeTab === 'drafts' && <Drafts currentUser={currentUser} />}
        {activeTab === 'submissions' && <Submissions currentUser={currentUser} />}
        {activeTab === 'contracts' && <ContractsView currentUser={currentUser} />}
        {activeTab === 'users' && currentUser?.role?.toUpperCase() === 'ADMIN' && (
          <UserManagementView />
        )}
      </main>
    </div>
  );
}