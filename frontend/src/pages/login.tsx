import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, TrendingUp, Users, Compass } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      showToast('Authentication successful', 'Welcome back to LoyaltyLens SaaS platform', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password. Please try again.';
      setError(msg);
      showToast('Authentication failed', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* LEFT SIDE: Brand & Value Proposition */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border-r border-slate-800/80 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          {/* Logo Header */}
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900 shrink-0 flex items-center justify-center">
              <img src="/logo/loyaltylens-logo.png" alt="LoyaltyLens Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-tight text-white leading-none">LoyaltyLens</h1>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mt-1">Customer Intelligence SaaS</p>
            </div>
          </div>

          {/* Hero Tagline & Description */}
          <div className="space-y-4 max-w-lg">
            <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Turn Customer Insights into <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Lasting Relationships</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Predict customer churn, understand why customers leave, and take the right action before loyalty is lost.
            </p>
          </div>
        </div>

        {/* Visual Workflow Pipeline Diagram */}
        <div className="relative z-10 py-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Autonomous Intelligence Pipeline</p>
          <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-1">
              <Users className="w-4 h-4 text-emerald-400 mx-auto" />
              <span>Customer</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-1">
              <Compass className="w-4 h-4 text-teal-400 mx-auto" />
              <span>Insight</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-1">
              <Sparkles className="w-4 h-4 text-cyan-400 mx-auto" />
              <span>Prediction</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-1">
              <ShieldCheck className="w-4 h-4 text-blue-400 mx-auto" />
              <span>Retention</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-1">
              <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto" />
              <span>Growth</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 text-slate-400 text-xs flex justify-between items-center">
          <span>&copy; 2026 LoyaltyLens SaaS Platform</span>
          <span className="text-emerald-400 font-semibold">v2.0 Production Engine</span>
        </div>
      </div>

      {/* RIGHT SIDE: SaaS Authentication Form */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h3 className="text-2xl font-bold text-white tracking-tight">Sign In to LoyaltyLens</h3>
            <p className="text-slate-400 text-xs">Enter your user credentials to access your retention dashboard</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Quick Demo Login Credentials */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Demo Logins:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@loyaltylens.com', 'admin')}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 text-xs font-semibold transition-all text-left truncate"
              >
                Sign as Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('analyst@loyaltylens.com', 'analyst123')}
                className="px-3 py-1.5 rounded-lg bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 border border-teal-800/50 text-xs font-semibold transition-all text-left truncate"
              >
                Sign as Analyst
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white absolute right-3.5 top-3 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => alert('For password recovery, please contact your Organization Super Admin.')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to LoyaltyLens</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
