import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Shield, Key, Mail, ArrowRight, UserCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_ACCOUNTS = [
  { label: 'Admin (IT)', email: 'admin@enterprisenet.local', pass: 'Admin@123', role: 'ADMIN', dept: 'IT', trust: 5, color: 'text-purple-400 border-purple-800 bg-purple-950/40' },
  { label: 'HR Member', email: 'hr@enterprisenet.local', pass: 'Demo@123', role: 'MEMBER', dept: 'HR', trust: 3, color: 'text-blue-500 border-cyan-800 bg-cyan-950/40' },
  { label: 'Finance Member', email: 'finance@enterprisenet.local', pass: 'Demo@123', role: 'MEMBER', dept: 'Finance', trust: 4, color: 'text-blue-400 border-blue-800 bg-blue-950/40' },
  { label: 'IT Member', email: 'it@enterprisenet.local', pass: 'Demo@123', role: 'MEMBER', dept: 'IT', trust: 5, color: 'text-purple-400 border-purple-800 bg-purple-950/40' },
  { label: 'Sales Member', email: 'sales@enterprisenet.local', pass: 'Demo@123', role: 'MEMBER', dept: 'Sales', trust: 2, color: 'text-emerald-400 border-emerald-800 bg-emerald-950/40' },
  { label: 'Management Member', email: 'mgmt@enterprisenet.local', pass: 'Demo@123', role: 'MEMBER', dept: 'Management', trust: 5, color: 'text-amber-400 border-amber-800 bg-amber-950/40' }
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#070b16] text-zinc-100 relative overflow-y-auto">
      {/* Brand Side Panel */}
      <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-12 flex flex-col justify-between surface-panel !rounded-none !border-y-0 !border-l-0 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-sm bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500 shadow-sm border-blue-500/50">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">EnterpriseNet Solutions</h1>
              <p className="text-xs font-mono text-blue-500">ACCESS PORTAL & DYNAMIC FIREWALL CONSOLE</p>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
              Stateful Zero-Trust Access Control & Security Operations
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Real-time ACL evaluation, multi-factor risk assessment, automated Cisco IOS CLI configuration generation, and live Server-Sent Events sync.
            </p>
          </div>
        </div>

        {/* Demo Accounts Panel */}
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-2 mb-3 text-xs font-mono text-zinc-400 uppercase">
            <UserCheck className="w-4 h-4 text-blue-500" />
            <span>One-Click Demo Accounts:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acct) => (
              <button
                key={acct.email}
                type="button"
                onClick={() => fillAccount(acct)}
                className={`p-2.5 rounded-sm text-left border text-xs transition-all hover:scale-[1.02] cursor-pointer ${acct.color}`}
              >
                <div className="font-semibold">{acct.label}</div>
                <div className="text-[10px] opacity-75 font-mono truncate">{acct.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="w-full md:w-1/2 p-8 lg:p-12 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md surface-panel p-8 shadow-2xl border-zinc-700">
          <div className="mb-6 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-blue-500 mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">Console Authentication</h3>
            <p className="text-xs text-zinc-400 mt-1">Sign in with your department user credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@enterprisenet.local"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm pl-9 pr-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm pl-9 pr-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-sm bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold text-xs transition-colors shadow-sm border-blue-500/50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In To Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
