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
  ArrowLeft,
  Briefcase,
  Phone,
  FileCheck,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { UserRole, userService } from '../services/userService.ts';
import { ThemeToggle } from './ThemeToggle.tsx';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onNavigateLogin: () => void;
  onFastLoginAdmin?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateLogin,
  onFastLoginAdmin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Credit Operations & Portfolio');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('MAKER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSubmitted, setSuccessSubmitted] = useState<boolean>(false);
  const [createdUserSummary, setCreatedUserSummary] = useState<{
    name: string;
    email: string;
    role: UserRole;
    employeeId: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      department,
      employeeId: employeeId.trim() || `OB-${Math.floor(100 + Math.random() * 900)}`,
      phoneNumber: phoneNumber.trim(),
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedUserSummary({
          name: payload.name,
          email: payload.email,
          role: payload.role,
          employeeId: payload.employeeId,
        });
        setSuccessSubmitted(true);
        return;
      } else if (data.message) {
        setErrorMessage(data.message);
        return;
      }
    } catch {
      // Local fallback
      const localResult = userService.register({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        department: payload.department,
        employeeId: payload.employeeId,
        phoneNumber: payload.phoneNumber,
      });

      if (localResult.success) {
        setCreatedUserSummary({
          name: payload.name,
          email: payload.email,
          role: payload.role,
          employeeId: payload.employeeId,
        });
        setSuccessSubmitted(true);
        return;
      } else {
        setErrorMessage(localResult.message || 'Registration failed.');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-y-auto bg-slate-50 dark:bg-[#0D0F1F] flex flex-col justify-between relative font-sans text-slate-900 dark:text-slate-100 selection:bg-ob-indigo-600 selection:text-white transition-colors">
      {/* Harmonious Oromia Bank Brand Background Accents */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-ob-indigo-500/10 dark:bg-ob-indigo-600/15 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-ob-green-500/10 dark:bg-ob-green-500/10 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32"></div>

      {/* Top Header */}
      <header className="px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-200 dark:border-[#22284D] bg-white/80 dark:bg-[#121428]/80 backdrop-blur-md relative z-10 shrink-0 transition-colors">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-9 sm:h-10 bg-white/95 dark:bg-white/90 px-2.5 py-1 rounded-xl shadow-xs border border-slate-200 dark:border-white/20 flex items-center justify-center">
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
              <span className="text-sm sm:text-base font-bold tracking-tight text-ob-indigo-900 dark:text-white">
                Oromia Bank
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-ob-green-50 dark:bg-ob-green-500/20 text-ob-green-800 dark:text-ob-green-300 border border-ob-green-300 dark:border-ob-green-500/40">
                0000013
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              National Bank of Ethiopia · User Onboarding & Governance
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onNavigateLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1B2042] hover:bg-slate-200 dark:hover:bg-[#252C5C] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2B3369] text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>

          {/* Theme Selector Dropdown */}
          <ThemeToggle align="right" showLabelOnMobile={true} />
        </div>
      </header>

      {/* Main Registration Form Viewport */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 min-h-0">
        <div className="max-w-xl w-full bg-white dark:bg-[#161933]/90 border border-slate-200 dark:border-[#262D55] rounded-2xl p-6 sm:p-7 shadow-xl dark:shadow-2xl backdrop-blur-md space-y-4 transition-colors">
          {successSubmitted && createdUserSummary ? (
            /* Success Approval State Screen */
            <div className="text-center space-y-4 py-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-ob-green-500/20 border border-emerald-300 dark:border-ob-green-400/40 text-emerald-600 dark:text-ob-green-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Registration Submitted Successfully
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-300 max-w-sm mx-auto">
                  Your registration has been recorded and submitted to the Oromia Bank System Administrator for four-eyes activation.
                </p>
              </div>

              {/* Summary Pill */}
              <div className="bg-slate-50 dark:bg-[#101226]/80 border border-slate-200 dark:border-[#22284D] rounded-xl p-4 text-left space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{createdUserSummary.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{createdUserSummary.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Requested Role:</span>
                  <span className="font-bold text-ob-indigo-700 dark:text-ob-indigo-400 bg-ob-indigo-50 dark:bg-ob-indigo-950 px-2 py-0.5 rounded border border-ob-indigo-200 dark:border-ob-indigo-800">
                    {createdUserSummary.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee ID:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{createdUserSummary.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Compliance Status:</span>
                  <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Pending Super Admin Activation</span>
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-[#1B2042] dark:hover:bg-[#252C5C] text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-[#2B3369] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>

                {onFastLoginAdmin && (
                  <button
                    type="button"
                    onClick={onFastLoginAdmin}
                    className="flex-1 py-2.5 px-4 bg-ob-indigo-600 hover:bg-ob-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-ob-green-300" />
                    <span>Login as Admin to Approve</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Registration Form */
            <>
              <div className="text-center space-y-1">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Request Maker / Checker Credentials
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Fill in your official bank officer details for supervisory registration
                </p>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-200 text-xs flex items-start gap-2.5 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tolera Bekele"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#101226]/90 border border-slate-200 dark:border-[#2B3369] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-ob-indigo-500 dark:focus:border-ob-indigo-400 transition-colors font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="t.bekele@oromiabank.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#101226]/90 border border-slate-200 dark:border-[#2B3369] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-ob-indigo-500 dark:focus:border-ob-indigo-400 transition-colors font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Employee ID / Badge #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. OB-8841"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#101226]/90 border border-slate-200 dark:border-[#2B3369] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-ob-indigo-500 dark:focus:border-ob-indigo-400 transition-colors font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Regulatory Segregation Role *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#101226]/90 border border-slate-200 dark:border-[#2B3369] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-ob-indigo-500 dark:focus:border-ob-indigo-400 transition-colors font-medium cursor-pointer"
                    >
                      <option value="MAKER">Maker (Prepare returns, enter data & formulas)</option>
                      <option value="CHECKER">Checker (4-Eyes verification & sign-off)</option>
                      <option value="NBE_OFFICER">NBE Supervisory Officer (Audit & View)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department / Business Unit
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#101226]/90 border border-slate-200 dark:border-[#2B3369] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-ob-indigo-500 dark:focus:border-ob-indigo-400 transition-colors font-medium cursor-pointer"
                  >
                    <option value="Credit Operations & Portfolio">Credit Operations & Portfolio</option>
                    <option value="Finance, Treasury & ALM">Finance, Treasury & ALM</option>
                    <option value="Risk Management & Compliance">Risk Management & Compliance</option>
                    <option value="International Banking & FX">International Banking & FX</option>
                    <option value="Internal Audit Directorate">Internal Audit Directorate</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password (min 6 chars) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#101226]/90 border border-slate-200 dark:border-[#2B3369] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-ob-indigo-500 dark:focus:border-ob-indigo-400 transition-colors font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#101226]/90 border border-slate-200 dark:border-[#2B3369] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-ob-indigo-500 dark:focus:border-ob-indigo-400 transition-colors font-medium"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-ob-indigo-600 hover:bg-ob-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
                >
                  <span>{loading ? 'Submitting Registration...' : 'Submit Registration Request'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-ob-green-300" />
                </button>
              </form>

              <div className="pt-2.5 border-t border-slate-200 dark:border-[#22284D] text-center">
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-ob-indigo-600 dark:hover:text-ob-green-300 font-medium transition-colors cursor-pointer"
                >
                  Already registered? <span className="font-bold underline">Sign In instead</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-200 dark:border-[#22284D] bg-white/80 dark:bg-[#121428]/80 text-center text-slate-500 dark:text-slate-400 text-xs relative z-10 flex flex-col sm:flex-row items-center justify-between gap-1 shrink-0 transition-colors">
        <div>
          © 2026 Oromia Bank S.C. All rights reserved.
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Supervisory Governance Directive BSD/03/2020
        </div>
      </footer>
    </div>
  );
};
