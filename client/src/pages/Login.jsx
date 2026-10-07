import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Shield, Key, Mail, ArrowRight, UserCheck, Lock, Activity, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_ACCOUNTS = [
  { label: 'Admin (IT)', email: 'admin@enterprisenet.local', pass: 'Admin@123', role: 'ADMIN', dept: 'IT', trust: 5, color: 'text-purple-300 border-purple-500/40 bg-purple-950/40 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]' },
  { label: 'HR Member', email: 'hr@enterprisenet.local', pass: 'Demo@123', role: 'MEMBER', dept: 'HR', trust: 3, color: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/40 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]' },
  { label: 'Finance Member', email: 'finance@enterprisenet.local', pass: 'Demo@123', role: 'MEMBER', dept: 'Finance', trust: 4, color: 'text-blue-300 border-blue-500/40 bg-blue-950/40 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]' },
  { label: 'IT Member', email: 'it@enterprisenet.local', pass: 'Demo@123', role: 'MEMBER', dept: 'IT', trust: 5, color: 'text-indigo-300 border-indigo-500/40 bg-indigo-950/40 hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]' },
  { label: 'Sales Member', email: 'sales@enterprisenet.local', pass: 'Demo@123', role: 'MEMBER', dept: 'Sales', trust: 2, color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]' },
  { label: 'Management', email: 'mgmt@enterprisenet.local', pass: 'Demo@123', role: 'MEMBER', dept: 'Management', trust: 5, color: 'text-amber-300 border-amber-500/40 bg-amber-950/40 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]' }
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      toast.success('Authenticated successfully');
    } catch (err) {
      toast.error('Authentication failed', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillAccount = (acct) => {
    setEmail(acct.email);
    setPassword(acct.pass);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#030712] text-slate-100 relative overflow-y-auto">
      {/* Brand Side Panel */}
      <div className="w-full md:w-1/2 p-6 md:p-10 lg:p-14 flex flex-col justify-between surface-panel !rounded-none !border-y-0 !border-l-0 border-r border-cyan-500/20 relative z-10 bg-slate-950/80 backdrop-blur-2xl">
        <div>
          <div className="flex items-center gap-3.5 mb-10">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
                <Shield className="w-7 h-7 text-cyan-300" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
                EnterpriseNet
              </h1>
              <p className="text-[11px] font-mono tracking-widest text-cyan-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                ZERO-TRUST FIREWALL ACCESS PORTAL
              </p>
            </div>
          </div>

          <div className="space-y-5 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next-Gen Security Operations Console</span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Dynamic ACL Engine & Stateful Network Access
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time multi-factor risk assessment, automated Cisco IOS configuration generation, and instantaneous sub-second Server-Sent Events policy synchronization.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">802.1Q VLAN Isolation</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">L7 Stateful Inspection</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Safe-Change Risk Guard</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Cisco IOS Auto-Compile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Accounts Panel */}
        <div className="mt-10 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400 uppercase">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <UserCheck className="w-4 h-4" />
              <span>One-Click Demo Credentials:</span>
            </div>
            <span className="text-[10px] text-slate-500">CLICK TO POPULATE</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {DEMO_ACCOUNTS.map((acct) => (
              <button
                key={acct.email}
                type="button"
                onClick={() => fillAccount(acct)}
                className={`p-3 rounded-lg text-left border text-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer backdrop-blur-md ${acct.color}`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>{acct.label}</span>
                  <span className="text-[9px] font-mono opacity-80">T:{acct.trust}</span>
                </div>
                <div className="text-[10px] opacity-75 font-mono truncate mt-0.5">{acct.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="w-full md:w-1/2 p-6 md:p-12 lg:p-16 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md surface-panel p-8 shadow-2xl border-cyan-500/30 rounded-xl relative overflow-hidden bg-slate-900/90 backdrop-blur-2xl">
          {/* Subtle Cyber Scanner Light */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />

          <div className="mb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-purple-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto mb-3 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <Lock className="w-6 h-6 text-cyan-300" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Console Authentication</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">Sign in with your department credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@enterprisenet.local"
                  className="w-full bg-slate-950 border border-slate-700/80 hover:border-cyan-500/40 focus:border-cyan-500 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 hover:border-cyan-500/40 focus:border-cyan-500 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isSubmitting ? (
                <>
                  <Activity className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In To Portal Console</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
