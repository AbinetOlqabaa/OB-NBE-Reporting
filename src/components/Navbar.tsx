/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserSession } from '../types/regulatory.ts';
import { DEMO_USERS } from '../services/submissionService.ts';
import {
  Building2,
  Shield,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Users,
} from 'lucide-react';
import { NbeHealthIndicator } from './NbeHealthIndicator.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';

interface NavbarProps {
  currentUser: UserSession;
  onSwitchUser: (user: UserSession) => void;
  activeView: string;
  pendingCheckerCount: number;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  onNavigateToSimulator?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  pendingCheckerCount,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onLogout,
  onNavigateToSimulator,
}) => {
  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-[#121428] border-b border-slate-200 dark:border-[#22284D] px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 shadow-2xs shrink-0 select-none transition-colors">
      {/* Zone 1: Sidebar Toggle + Official Oromia Bank Brand */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-ob-indigo-700 dark:hover:text-ob-indigo-300 hover:bg-ob-indigo-50 dark:hover:bg-ob-indigo-950/50 transition-colors focus:outline-none focus:ring-1 focus:ring-ob-indigo-400 cursor-pointer"
            title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            aria-label="Toggle navigation sidebar"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-ob-indigo-700 dark:text-ob-indigo-400" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            )}
          </button>
        )}

        {/* Authentic Oromia Bank Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="bg-white/95 dark:bg-white/90 p-1 rounded-xl shadow-xs border border-slate-200/60 dark:border-white/20 shrink-0">
            <img
              src="/brand/oromia-logo-full.png"
              alt="Oromia Bank"
              className="h-7 sm:h-8 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/brand/oromia-logo-mark-transparent.png';
              }}
            />
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-ob-indigo-900 dark:text-white leading-tight">
                Regulatory Reporting & Simulation
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-ob-green-50 dark:bg-ob-green-950/60 text-ob-green-800 dark:text-ob-green-300 border border-ob-green-300 dark:border-ob-green-800">
                0000013
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
              National Bank of Ethiopia · Directive BSD/03/2020
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Context Ribbon & Pending 4-Eyes Queue Counter */}
      <div className="hidden md:flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5 font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl">
          <Building2 className="w-3.5 h-3.5 text-ob-indigo-600 dark:text-ob-indigo-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">Financial Year 2026</span>
        </div>

        {pendingCheckerCount > 0 && (
          <span className="font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-xl text-[11px] flex items-center gap-1.5 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>{pendingCheckerCount} awaiting 4-eyes review</span>
          </span>
        )}
      </div>

      {/* Zone 3: Health Indicator + Theme Switcher + User Profile + Logout */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Dedicated NBE API Gateway Health Indicator (Polls every 30s) */}
        <NbeHealthIndicator onOpenSimulator={onNavigateToSimulator} />

        {/* Theme Switcher Dropdown (Light / Dark / Device) */}
        <ThemeToggle align="right" />

        {/* User Role Switcher Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl p-1 px-2.5 shadow-2xs">
          {currentUser.role === 'ADMIN' ? (
            <Users className="w-3.5 h-3.5 text-ob-indigo-600 dark:text-ob-indigo-400 shrink-0" />
          ) : currentUser.role === 'CHECKER' ? (
            <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-ob-green-600 dark:text-ob-green-400 shrink-0" />
          )}

          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[80px] sm:max-w-[120px]">
              {currentUser.name}
            </span>
            <span
              className={`text-[9px] uppercase font-bold tracking-wider ${
                currentUser.role === 'ADMIN'
                  ? 'text-ob-indigo-700 dark:text-ob-indigo-300'
                  : currentUser.role === 'CHECKER'
                  ? 'text-amber-700 dark:text-amber-400'
                  : currentUser.role === 'NBE_OFFICER'
                  ? 'text-purple-700 dark:text-purple-400'
                  : 'text-ob-green-700 dark:text-ob-green-400'
              }`}
            >
              {currentUser.role}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          {/* Quick Role Switch for testing */}
          <select
            value={currentUser.id}
            onChange={(e) => {
              const u = DEMO_USERS.find((user) => user.id === e.target.value);
              if (u) onSwitchUser(u);
            }}
            aria-label="Switch User Role"
            className="text-xs bg-transparent text-slate-700 dark:text-slate-300 font-semibold cursor-pointer focus:outline-none focus:ring-0 pr-1"
            title="Switch User Role to test Maker-Checker segregation"
          >
            {DEMO_USERS.map((u) => (
              <option key={u.id} value={u.id} className="dark:bg-slate-900 dark:text-slate-200">
                Switch: {u.role}
              </option>
            ))}
          </select>
        </div>

        {/* Prominent Log Out Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-600 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 hover:border-rose-200 dark:border-slate-700 dark:hover:border-rose-800 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Log Out and return to Login Screen"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        )}
      </div>
    </header>
  );
};
