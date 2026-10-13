import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../Lib/supabase';
import { UserPlus, Key, Phone, User, Mail, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Users, Copy, Lock } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'orange-temp-auth-instance',
  },
});

export default function UserManagementView() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'OE Installer' | 'Admin'>('OE Installer');
  const [defaultPassword, setDefaultPassword] = useState('Orange@1234');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [usersList, setUsersList] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  useEffect(() => {
    fetchUsersList();
  }, []);

  const fetchUsersList = async () => {
    setFetchingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const uniqueUsers = Array.from(
        new Map(data.map((item) => [item.id || item.email, item])).values()
      );
      setUsersList(uniqueUsers);
    }
    setFetchingUsers(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const usernamePrefix = cleanEmail.split('@')[0];

    try {
      const { data, error } = await tempClient.auth.signUp({
        email: cleanEmail,
        password: defaultPassword,
        options: {
          data: {
            full_name: fullName,
            username: usernamePrefix,
            phone_number: phone,
            role: role,
            must_change_password: true,
          },
        },
      });

      if (error) {
        setStatusMessage({ type: 'error', text: `Supabase Error: ${error.message}` });
        setLoading(false);
        return;
      }

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: fullName,
          username: usernamePrefix,
          phone_number: phone,
          role: role,
          must_change_password: true,
        });

        setStatusMessage({
          type: 'success',
          text: `Account created for ${cleanEmail}! Temporary Password: ${defaultPassword}.`,
        });

        setFullName('');
        setEmail('');
        setPhone('');
        setRole('OE Installer');
        setDefaultPassword('Orange@1234');
        fetchUsersList();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Unexpected error: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForcePasswordReset = async (usr: any) => {
    if (!window.confirm(`Force password change for ${usr.full_name} (${usr.email}) on next login?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ must_change_password: true })
        .eq('id', usr.id);

      if (error) throw error;

      setStatusMessage({
        type: 'success',
        text: `Successfully enabled force password change flag for ${usr.email}.`,
      });
      fetchUsersList();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to update: ${err.message}` });
    }
  };

  const copyCredentials = (usr: any) => {
    const userEmail = usr.email;
    const text = `Orange Energy Portal Credentials:\nEmail: ${userEmail}\nTemporary Password: Orange@1234\nPlease log in and update your password.`;
    navigator.clipboard.writeText(text);
    alert(`Credentials copied for ${usr.full_name} (${userEmail})!`);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Create User Form */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <UserPlus size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Create User Account</h3>
            <p className="text-xs text-slate-500">Register user with their email address and assign temporary credentials.</p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-start gap-3 text-xs font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span className="font-mono">{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="e.g. Gerald Scotland"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="e.g. geraldscotland7@gmail.com"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">User Role</label>
              <div className="relative">
                <ShieldCheck size={18} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'OE Installer' | 'Admin')}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none"
                >
                  <option value="OE Installer">OE Installer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="0770731138"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Temporary Password</label>
              <div className="relative">
                <Key size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create User Account'}
          </button>
        </form>
      </div>

      {/* User Directory */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">User Directory & Credentials</h3>
              <p className="text-xs text-slate-500">Manage user accounts and password reset flags.</p>
            </div>
          </div>
          <button onClick={fetchUsersList} className={`p-2 text-slate-400 hover:text-orange-500 transition ${fetchingUsers ? 'animate-spin' : ''}`}>
            <RefreshCw size={18} />
          </button>
        </div>

        {usersList.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">No registered users found.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {usersList.map((usr) => (
              <div key={usr.id || usr.email} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <span>{usr.full_name || 'Unnamed User'}</span>
                    {usr.must_change_password && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">
                        Must Change PW
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium mt-0.5">
                    <span className="font-bold text-orange-600">{usr.email}</span>
                    <span>•</span>
                    <span className="uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">{usr.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleForcePasswordReset(usr)}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition border border-amber-200"
                    title="Require password change on next login"
                  >
                    <Lock size={14} />
                    <span>Require PW Change</span>
                  </button>

                  <button
                    onClick={() => copyCredentials(usr)}
                    className="px-3 py-2 bg-slate-50 hover:bg-orange-500 hover:text-white text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition border border-slate-200"
                  >
                    <Copy size={14} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}