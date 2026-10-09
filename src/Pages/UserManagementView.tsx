import React, { useState, useEffect } from 'react';
import { supabase } from '../Lib/supabase';
import { UserPlus, Key, Phone, User, AtSign, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Send, Users } from 'lucide-react';

export default function UserManagementView() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'OE Installer' | 'Admin'>('OE Installer');
  const [defaultPassword, setDefaultPassword] = useState('Orange@1234');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Registered Users list
  const [usersList, setUsersList] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  useEffect(() => {
    fetchUsersList();
  }, []);

  // Fetch unique users from public.profiles table
  const fetchUsersList = async () => {
    setFetchingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // De-duplicate users by unique ID or unique Email
      const uniqueUsers = Array.from(
        new Map(data.map((item) => [item.id || item.email, item])).values()
      );
      setUsersList(uniqueUsers);
    }
    setFetchingUsers(false);
  };

  const formatPhoneNumber = (inputPhone: string) => {
    let cleaned = inputPhone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '231' + cleaned.slice(1);
    } else if (cleaned.length === 8 || cleaned.length === 9) {
      cleaned = '231' + cleaned;
    }
    return cleaned;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    const generatedEmail = `${cleanUsername}@orange.lr`;
    const formattedPhone = formatPhoneNumber(phone);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: generatedEmail,
        password: defaultPassword,
        options: {
          data: {
            full_name: fullName,
            username: cleanUsername,
            phone_number: formattedPhone,
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
        // Upsert into profiles table with explicit username field
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: generatedEmail,
          full_name: fullName,
          username: cleanUsername,
          phone_number: formattedPhone,
          role: role,
        });

        sendWhatsAppCredentials(fullName, cleanUsername, role, defaultPassword, formattedPhone);

        setStatusMessage({
          type: 'success',
          text: `Account created for ${fullName} (${role})! Launching WhatsApp...`,
        });

        setFullName('');
        setUsername('');
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

  const sendWhatsAppCredentials = (
    name: string,
    uname: string,
    userRole: string,
    pass: string,
    phoneNum: string
  ) => {
    const rawMessage =
      `*Orange Energy Portal Credentials*\n\n` +
      `Hello ${name},\n` +
      `Your account credentials have been updated.\n\n` +
      `*Full Name:* ${name}\n` +
      `*Username:* ${uname}\n` +
      `*Role:* ${userRole}\n` +
      `*Temporary Password:* ${pass}\n\n` +
      `Please log in to the portal and update your password immediately.`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodeURIComponent(rawMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleResendPassword = async (targetUser: any) => {
    const newTempPassword = `Orange@${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedPhone = formatPhoneNumber(targetUser.phone_number || targetUser.phone || '');
    const activeUsername = targetUser.username || targetUser.email?.split('@')[0] || 'user';

    setStatusMessage({
      type: 'success',
      text: `New password (${newTempPassword}) generated for ${targetUser.full_name}. Launching WhatsApp...`,
    });

    sendWhatsAppCredentials(
      targetUser.full_name || 'User',
      activeUsername,
      targetUser.role || 'OE Installer',
      newTempPassword,
      formattedPhone
    );
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
            <p className="text-xs text-slate-500">Dispatch login credentials straight to user's WhatsApp.</p>
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
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="e.g. Mary Johnson"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <AtSign size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="e.g. mary"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                User Role
              </label>
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                WhatsApp Phone
              </label>
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Temporary Password
              </label>
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
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account & Launch WhatsApp'}
          </button>
        </form>
      </div>

      {/* Directory & Password Recovery Panel */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">User Directory & Password Recovery</h3>
              <p className="text-xs text-slate-500">Resend credentials via WhatsApp if a user forgets their password.</p>
            </div>
          </div>
          <button
            onClick={fetchUsersList}
            className={`p-2 text-slate-400 hover:text-orange-500 transition ${fetchingUsers ? 'animate-spin' : ''}`}
            title="Refresh Directory"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {usersList.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">No registered users found.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {usersList.map((usr) => {
              // Extract username safely from username field OR email prefix
              const displayUsername = usr.username || (usr.email ? usr.email.split('@')[0] : 'user');

              return (
                <div key={usr.id || usr.email} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">{usr.full_name || 'Unnamed User'}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium mt-0.5">
                      <span className="font-bold text-slate-700">@{displayUsername}</span>
                      <span>•</span>
                      <span className="font-extrabold text-orange-600 uppercase text-[10px] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        {usr.role || 'OE Installer'}
                      </span>
                      <span>•</span>
                      <span>{usr.phone_number || usr.phone || 'No Phone'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResendPassword(usr)}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-orange-500 hover:text-white text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition border border-slate-200 shadow-sm"
                  >
                    <Send size={14} />
                    <span>Resend Password (WhatsApp)</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}