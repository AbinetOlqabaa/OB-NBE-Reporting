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
import { UserRole, userService } from '../services/userService';

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
    <div className="h-screen max-h-screen overflow-y-auto bg-[#0D0F1F] flex flex-col justify-between relative font-sans text-slate-100 selection:bg-ob-indigo-600 selection:text-white">
      {/* Harmonious Oromia Bank Brand Background Accents */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-ob-indigo-600/15 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-ob-green-500/10 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32"></div>

      {/* Top Header */}
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
              User Registration · Maker-Checker Governance Enrollment
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateLogin}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181C3B] border border-[#262D55] text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#20254D] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 min-h-0">
        <div className="max-w-xl w-full bg-[#161933]/90 border border-[#262D55] rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-4 my-auto">
          {successSubmitted ? (
            /* Success confirmation screen */
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-ob-green-500/20 border border-ob-green-500/40 text-ob-green-400 flex items-center justify-center mx-auto shadow-lg">
                <FileCheck className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Registration Awaiting Administrator Review
                </h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Your registration has been queued in the Oromia Bank Regulatory Portal.
                </p>
              </div>

              {createdUserSummary && (
                <div className="bg-[#101226]/80 border border-[#22284D] rounded-xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-[#22284D]">
                    <span className="text-slate-400">Applicant:</span>
                    <span className="font-bold text-white">{createdUserSummary.name}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#22284D]">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-mono text-slate-300">{createdUserSummary.email}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#22284D]">
                    <span className="text-slate-400">Requested Role:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      createdUserSummary.role === 'MAKER'
                        ? 'bg-ob-green-500/20 text-ob-green-300 border border-ob-green-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {createdUserSummary.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      PENDING_APPROVAL
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-[#101226]/60 border border-[#22284D] rounded-xl text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-amber-400 inline mr-1 -mt-0.5" />
                <span className="font-semibold text-slate-200">NBE Directive BSD/03/2020:</span> All Maker and Checker user accounts require review and activation by a Compliance Administrator before credentials can be used to log in.
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#181C3B] hover:bg-[#20254D] text-white font-bold text-xs rounded-xl border border-[#262D55] transition-colors shadow-sm"
                >
                  Return to Sign In
                </button>

                {onFastLoginAdmin && (
                  <button
                    type="button"
                    onClick={onFastLoginAdmin}
                    className="w-full sm:w-auto px-5 py-2.5 bg-ob-indigo-600 hover:bg-ob-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Log In as Administrator to Authorize</span>
                    <ArrowRight className="w-3.5 h-3.5 text-ob-green-300" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Registration Form */
            <>
              <div className="space-y-1">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Register New Regulatory User
                </h1>
                <p className="text-xs text-slate-300">
                  Select your role (Maker or Checker) and enter your official banking information.
                </p>
              </div>

              {/* Directive Notice */}
              <div className="p-2.5 bg-[#1B2042] border border-[#2B3369] rounded-xl text-ob-indigo-200 text-xs flex items-center gap-2">
                <Shield className="w-4 h-4 text-ob-green-400 shrink-0" />
                <span className="leading-snug">
                  New accounts require Administrator authorization per NBE Directive BSD/03/2020 before sign-in is allowed.
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {/* Role Option Selection */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Select Your Assigned Regulatory Role:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('MAKER')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        role === 'MAKER'
                          ? 'bg-ob-green-950/70 border-ob-green-500 text-white ring-1 ring-ob-green-500/50'
                          : 'bg-[#101226]/80 border-[#22284D] text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-ob-green-400">MAKER</span>
                        {role === 'MAKER' && <CheckCircle2 className="w-4 h-4 text-ob-green-400" />}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Reporting Officer: Prepares 24 NBE returns, inputs schedules, runs formulas.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('CHECKER')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        role === 'CHECKER'
                          ? 'bg-amber-950/70 border-amber-500 text-white ring-1 ring-amber-500/50'
                          : 'bg-[#101226]/80 border-[#22284D] text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-amber-400">CHECKER</span>
                        {role === 'CHECKER' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Review Officer: 4-eyes oversight, verifies balances, signs off & delivers to NBE.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Full Legal Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tolera Gemechu"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#101226]/90 border border-[#2B3369] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-ob-indigo-400 focus:ring-1 focus:ring-ob-indigo-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Corporate Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="username@oromiabank.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#101226]/90 border border-[#2B3369] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-ob-indigo-400 focus:ring-1 focus:ring-ob-indigo-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-2.5 py-2 bg-[#101226]/90 border border-[#2B3369] rounded-xl text-white focus:outline-none focus:border-ob-indigo-400 focus:ring-1 focus:ring-ob-indigo-400 font-medium cursor-pointer"
                    >
                      <option value="Compliance & Regulatory Governance">Compliance & Regulatory</option>
                      <option value="Credit Risk & Portfolio Management">Credit Risk & Lending</option>
                      <option value="Financial Reporting & Tax">Financial Reporting</option>
                      <option value="Treasury & International Banking">Treasury & FX</option>
                      <option value="Risk Management & Internal Audit">Risk Management</option>
                      <option value="Branch Operations & Retail Banking">Branch Operations</option>
                      <option value="Information Technology & Core Banking">IT & Core Banking</option>
                      <option value="Digital Banking & EthSwitch Operations">Digital Banking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. OB-0428"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#101226]/90 border border-[#2B3369] rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-ob-indigo-400 focus:ring-1 focus:ring-ob-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+251 9..."
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-[#101226]/90 border border-[#2B3369] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-ob-indigo-400 focus:ring-1 focus:ring-ob-indigo-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Create Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#101226]/90 border border-[#2B3369] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-ob-indigo-400 focus:ring-1 focus:ring-ob-indigo-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#101226]/90 border border-[#2B3369] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-ob-indigo-400 focus:ring-1 focus:ring-ob-indigo-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-ob-indigo-600 hover:bg-ob-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
                >
                  <span>{loading ? 'Submitting Application...' : 'Submit Registration for Approval'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-ob-green-300" />
                </button>
              </form>
            </>
          )}
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
