import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Compass,
  CheckCircle2,
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col lg:flex-row">
      {/* LEFT SIDE: Brand & Value Proposition */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between bg-white border-r border-[#E2E8F0]">
        <div>
          {/* Logo Header */}
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-card border border-[#E2E8F0] bg-[#EFF6FF] shrink-0 flex items-center justify-center p-1">
              <img src="/logo/loyaltylens-logo.png" alt="LoyaltyLens Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-2xl tracking-tight text-[#172033] leading-none">
                  LoyaltyLens
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  Enterprise SaaS
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">Customer Churn Intelligence Platform</p>
            </div>
          </div>

          {/* Hero Headline & Subtitle */}
          <div className="space-y-4 max-w-lg">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#172033] tracking-tight leading-tight">
              Turn Customer Insights into <span className="text-[#2563EB]">Lasting Retention</span>
            </h2>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Predict customer churn before it happens, understand the exact behavioral drivers causing friction, and execute targeted win-back playbooks.
            </p>
          </div>

          {/* Value Highlights */}
          <div className="mt-8 space-y-3.5 max-w-md">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#172033]">Machine Learning Churn Scoring</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">Real-time logistic probability predictions calibrated across Indian operating cohorts.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488] shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-[#0D9488]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#172033]">Gemini AI Strategic Synthesis</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">Autonomous weekly executive action briefs with deterministic business fallback.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-7 h-7 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#172033]">Playbook Campaign Sandbox</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">Simulate concession and offer impacts prior to active live campaign deployment.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-8 mt-6 border-t border-[#E2E8F0] text-[#64748B] text-xs flex justify-between items-center">
          <span>&copy; 2026 LoyaltyLens Retention SaaS</span>
          <span className="font-semibold text-[#2563EB]">v2.0 Production</span>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-card">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-[#172033] tracking-tight">Sign In to Dashboard</h3>
            <p className="text-[#64748B] text-xs">Enter your user credentials to access your retention intelligence</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Quick Demo Login Credentials */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              Quick Demo One-Click Fill:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@loyaltylens.com', 'admin')}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-[#2563EB] border border-[#BFDBFE] text-xs font-semibold transition-all text-center shadow-subtle"
              >
                Sign as Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('analyst@loyaltylens.com', 'analyst123')}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-teal-50 text-[#0D9488] border border-teal-200 text-xs font-semibold transition-all text-center shadow-subtle"
              >
                Sign as Analyst
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#172033] font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@loyaltylens.com"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-10 pr-4 py-2.5 text-[#172033] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#172033] font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-10 pr-10 py-2.5 text-[#172033] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#94A3B8] hover:text-[#172033] absolute right-3.5 top-3 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-[#64748B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Password recovery: Contact Super Admin or use quick login buttons above.')}
                className="text-[#2563EB] hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
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
