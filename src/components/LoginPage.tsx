/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { UserSession } from '../types/regulatory';
import { userService } from '../services/userService';

interface LoginPageProps {
  onLoginSuccess: (user: UserSession, redirectTab?: string) => void;
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateRegister,
}) => {
  const [email, setEmail] = useState('admin@oromiabank.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Preset Selector for 1-Click Testing
  const handleQuickPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('password');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your Oromia Bank email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        onLoginSuccess(data.user, data.redirectTab);
        return;
      } else if (data.message) {
        setErrorMessage(data.message);
        return;
      }
    } catch {
      // Standalone / client-side fallback
      const localResult = userService.login(email.trim(), password);
      if (localResult.success && localResult.user) {
        onLoginSuccess(localResult.user, localResult.redirectTab);
        return;
      } else {
        setErrorMessage(localResult.message || 'Login failed. Please verify credentials.');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-y-auto sm:overflow-hidden bg-[#0D0F1F] flex flex-col justify-between relative font-sans text-slate-100 selection:bg-ob-indigo-600 selection:text-white">
      {/* Harmonious Oromia Bank Brand Background Accents (Indigo & Leaf Green) */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-ob-indigo-600/15 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-ob-green-500/10 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32"></div>

      {/* Top Brand Bar */}
      <header className="px-5 sm:px-8 py-3.5 flex items-center justify-between border-b border-[#22284D] bg-[#121428]/80 backdrop-blur-md relative z-10 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-9 sm:h-10 bg-white/95 px-2.5 py-1 rounded-xl shadow-md border border-white/20 flex items-center justify-center">
            <img
              src="/brand/oromia-logo-full.png"
              alt="Oromia Bank"
              className="h-7 sm:h-8 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/brand/oromia-logo-mark-transparent.png';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white">
                Oromia Bank
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-ob-green-500/20 text-ob-green-300 border border-ob-green-500/40">
                0000013
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              National Bank of Ethiopia (NBE) Prudential Reporting Gateway
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 font-medium bg-[#1B2042] px-3 py-1.5 rounded-lg border border-[#2B3369]">
          <ShieldCheck className="w-4 h-4 text-ob-green-400" />
          <span>Directive BSD/03/2020 Compliant</span>
        </div>
      </header>

      {/* Main Login Card Viewport */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 min-h-0">
        <div className="max-w-md w-full bg-[#161933]/90 border border-[#262D55] rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-4">
          {/* Card Header with Oromia Bank Emblem */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex p-2 rounded-2xl bg-white shadow-md border border-ob-indigo-200 mb-1">
              <img
                src="/brand/oromia-logo-mark-transparent.png"
                alt="Oromia Bank Emblem"
                className="w-8 h-8 object-contain"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Sign In to OB Regulatory Portal
            </h1>
            <p className="text-xs text-slate-300">
              Enter credentials to navigate to your role dashboard
            </p>
          </div>

          {/* Quick Demo Role Fill Selector */}
          <div className="bg-[#101226]/80 border border-[#22284D] rounded-xl p-3 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-ob-green-400" />
              <span>One-Click Role Login (Testing):</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset('admin@oromiabank.com')}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border text-center ${
                  email.includes('admin')
                    ? 'bg-ob-indigo-600 text-white border-ob-indigo-400 shadow-sm ring-1 ring-ob-indigo-400/40'
                    : 'bg-[#181C3B] text-slate-300 border-[#262D55] hover:bg-[#20254D]'
                }`}
              >
                Administrator
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('abebe.kebede@oromiabank.com')}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border text-center ${
                  email.includes('abebe')
                    ? 'bg-ob-green-600 text-white border-ob-green-400 shadow-sm ring-1 ring-ob-green-400/40'
                    : 'bg-[#181C3B] text-slate-300 border-[#262D55] hover:bg-[#20254D]'
                }`}
              >
                Maker
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('chala.desta@oromiabank.com')}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border text-center ${
                  email.includes('chala')
                    ? 'bg-amber-600 text-white border-amber-400 shadow-sm ring-1 ring-amber-400/40'
                    : 'bg-[#181C3B] text-slate-300 border-[#262D55] hover:bg-[#20254D]'
                }`}
              >
                Checker
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="username@oromiabank.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#101226]/90 border border-[#2B3369] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-ob-indigo-400 focus:ring-1 focus:ring-ob-indigo-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#101226]/90 border border-[#2B3369] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-ob-indigo-400 focus:ring-1 focus:ring-ob-indigo-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-ob-indigo-600 hover:bg-ob-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-ob-indigo-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-ob-green-300" />
            </button>
          </form>

          {/* Registration Link */}
          <div className="pt-3 border-t border-[#22284D] text-center space-y-1.5">
            <p className="text-xs text-slate-400">
              Need access as a new Maker or Checker?
            </p>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ob-green-400 hover:text-ob-green-300 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register for Maker / Checker Account</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-[#22284D] bg-[#121428]/80 text-center text-slate-400 text-xs relative z-10 flex flex-col sm:flex-row items-center justify-between gap-1 shrink-0">
        <div>
          © 2026 Oromia Bank S.C. All rights reserved.
        </div>
        <div className="text-[11px] text-slate-400">
          Authorized for National Bank of Ethiopia Commercial Banking Supervision
        </div>
      </footer>
    </div>
  );
};
