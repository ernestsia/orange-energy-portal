import React, { useState } from 'react';
import { supabase } from '../Lib/supabase';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          window.location.reload();
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(
        err.message || 'Failed to authenticate. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900 font-sans text-slate-800">
      {/* Left Branding & Visual Hero Column with Contract Sheet & Pen Focus */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center flex-col justify-between p-12 overflow-hidden border-r border-slate-800"
        style={{
          // High quality image featuring paper contract, clipboard, and pen (no people)
          backgroundImage: `url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80')`
        }}
      >
        {/* Dark Gradient Overlay for optimal contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/65 pointer-events-none" />

        {/* Top Tag Header */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 backdrop-blur-md">
            Liberia Operations Portal
          </span>
        </div>

        {/* Hero Branding Content */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <img
            src="/oe.png"
            alt="Orange Energies Logo"
            className="h-16 w-auto object-contain filter drop-shadow-md brightness-0 invert"
          />
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
            Seamless Digital Subscriptions & Field Onboarding
          </h1>
          <p className="text-slate-200 text-sm leading-relaxed font-medium">
            Digitize customer subscription contracts, authorize solar system installations, and manage field agent workflows across Liberia in real time.
          </p>

          <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-700/80">
            <div>
              <div className="text-orange-500 font-black text-lg">Instant</div>
              <div className="text-slate-300 text-xs font-medium">Contract Signings</div>
            </div>
            <div>
              <div className="text-orange-500 font-black text-lg">Verified</div>
              <div className="text-slate-300 text-xs font-medium">Subscriptions</div>
            </div>
            <div>
              <div className="text-orange-500 font-black text-lg">Field</div>
              <div className="text-slate-300 text-xs font-medium">Installer Sync</div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Orange Energies Liberia. All rights reserved.
        </div>
      </div>

      {/* Right Form Column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/80">
          {/* Form Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <img
                src="/oe.png"
                alt="Orange Energies Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Secure Access Portal
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Sign in to manage customer contracts, agents, and system installations.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleLogin} className="space-y-5 text-xs font-medium">
            <div>
              <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@orange.lr"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-semibold">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 w-3.5 h-3.5"
                />
                <span>Remember me</span>
              </label>

              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Please contact your System Administrator to reset your password.');
                }}
                className="text-orange-600 font-bold hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Portal</span>
              )}
            </button>
          </form>

          {/* Footer Assistance */}
          <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 font-semibold">
            Need account authorization? <span className="text-slate-600">Contact IT Operations Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;