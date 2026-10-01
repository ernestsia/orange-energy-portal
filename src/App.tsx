import React, { useEffect, useState } from 'react';
import { supabase } from './Lib/supabase';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { DashboardView } from './Pages/Dashboard';
import { DraftsView } from './Pages/Drafts';
import { NewContractView } from './Pages/NewContract';
import { SubmissionsView } from './Pages/Submissions';
import UserManagementView from './Pages/UserManagementView';

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch current auth session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Subscribe to auth state updates (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initial authentication loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-orange-500 font-extrabold text-xs tracking-wider">
        Initializing Orange Energies Portal...
      </div>
    );
  }

  // If user is not authenticated, render Login view
  if (!session) {
    return <Login onLoginSuccess={() => setLoading(false)} />;
  }

  // If user is authenticated, render the main dashboard layout
  return (
    <Layout>
      {({ activeTab }) => {
        switch (activeTab) {
          case 'dashboard':
            return <DashboardView />;
          case 'drafts':
            return <DraftsView />;
          case 'new-contract':
            return <NewContractView />;
          case 'submissions':
            return <SubmissionsView />;
          case 'users':
            return <UserManagementView />;
          default:
            return <DashboardView />;
        }
      }}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}