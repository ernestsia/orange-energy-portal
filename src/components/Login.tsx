import React, { useState } from 'react';
import { supabase } from '../Lib/supabase';
import { User, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState(''); // Accepts username or email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let loginEmail = identifier.trim();

      // If input does not contain '@', treat it as a username and resolve the email
      if (!loginEmail.includes('@')) {
        const { data: resolvedEmail, error: rpcError } = await supabase
          .rpc('get_email_by_identifier', { identifier: loginEmail });

        if (rpcError || !resolvedEmail) {
          throw new Error('Username not found. Please check your username.');
        }

        loginEmail = resolvedEmail;
      }

      // Authenticate with Supabase using resolved email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) throw error;

      console.log('Login successful:', data.user);

      if (onLoginSuccess) {
        onLoginSuccess();
      }

    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0B0F19] font-sans overflow-hidden">
      {/* Left Section: Centered Branding & Title */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0B0F19] p-12 text-white relative z-10 border-r border-slate-800/60">
        {/* Subtle Gradient Glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Brand Header (Top Left) */}
        <div className="flex items-center gap-3">
          {/* OE Logo Image / Icon */}
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center font-extrabold text-white text-2xl shadow-lg shadow-orange-500/30 overflow-hidden">
            <img 
              src="/oe.png" 
              alt="Orange Energy Logo" 
              className="w-full h-full object-contain p-1" 
              onError={(e) => {
                // Fallback to text logo if image fails to load
                e.currentTarget.style.display = 'none';
              }} 
            />
            <span className="font-black text-white text-xl">OE</span>
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white leading-none">Orange Energy</h2>
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mt-1">Liberia Digital Portal</p>
          </div>
        </div>

        {/* Centralized Heading Wording */}
        <div className="my-auto text-center px-6">
          <h1 className="text-5xl font-black text-white tracking-tight leading-tight max-w-xl mx-auto">
            Orange Energy Subscriber Contract
          </h1>
        </div>

        {/* Footer Text */}
        <div className="text-[11px] text-slate-500 font-bold tracking-widest uppercase text-center lg:text-left">
          Authorized Field & Admin Operations
        </div>
      </div>

      {/* Right Section: Installer & Customer Background Image */}
      <div 
        className="flex-1 flex items-center justify-center p-6 sm:p-12 relative bg-cover bg-center bg-no-repeat bg-slate-900"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(11, 15, 25, 0.95) 0%, rgba(11, 15, 25, 0.4) 40%, rgba(11, 15, 25, 0.6) 100%), url('/installer-signing.jpg'), url('/installer-signing.jfif')`
        }}
      >
        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Mobile Header Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-extrabold text-white text-xl shadow-md overflow-hidden">
              <img 
                src="/oe.png" 
                alt="Orange Energy Logo" 
                className="w-full h-full object-contain p-1" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} 
              />
              <span className="font-black text-white text-lg">OE</span>
            </div>
            <div className="text-left">
              <h2 className="text-lg font-black uppercase text-white tracking-tight">Orange Energy</h2>
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Subscriber Contract</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-[#111625]/90 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl space-y-6">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Sign In</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials to access your field portal.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. ernest"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19]/90 border border-slate-800 rounded-xl text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19]/90 border border-slate-800 rounded-xl text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center text-[11px] text-slate-500 font-medium">
            Orange Energy Liberia • Field Operations Portal
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;