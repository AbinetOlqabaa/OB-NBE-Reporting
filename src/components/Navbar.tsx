/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserSession } from '../types/regulatory';
import { DEMO_USERS } from '../services/submissionService';
import {
  Building2,
  Shield,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Users,
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserSession;
  onSwitchUser: (user: UserSession) => void;
  activeView: string;
  pendingCheckerCount: number;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  pendingCheckerCount,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onLogout,
}) => {
  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 shadow-2xs shrink-0 select-none">
      {/* Zone 1: Sidebar Toggle + Official Oromia Bank Brand */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:text-ob-indigo-700 hover:bg-ob-indigo-50 transition-colors focus:outline-none focus:ring-1 focus:ring-ob-indigo-400"
            title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            aria-label="Toggle navigation sidebar"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-ob-indigo-700" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-slate-600" />
            )}
          </button>
        )}

        {/* Authentic Oromia Bank Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img
            src="/brand/oromia-logo-full.png"
            alt="Oromia Bank"
            className="h-8 sm:h-9 w-auto object-contain shrink-0"
            onError={(e) => {
              // Graceful fallback to mark if full has issue
              (e.target as HTMLImageElement).src = '/brand/oromia-logo-mark-transparent.png';
            }}
          />

          <div className="hidden md:block h-6 w-px bg-slate-200"></div>

          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-ob-indigo-900 leading-tight">
                Regulatory Reporting & Simulation
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-ob-green-50 text-ob-green-800 border border-ob-green-300">
                0000013
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              National Bank of Ethiopia · Directive BSD/03/2020
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Regulatory Status / Quick stats */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-ob-green-500 animate-pulse"></span>
          <span className="font-semibold text-slate-800">NBE Gateway: Connected</span>
        </div>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <div className="flex items-center gap-1.5 font-medium">
          <Building2 className="w-3.5 h-3.5 text-ob-indigo-600" />
          <span>FinYear 2026</span>
        </div>
        {pendingCheckerCount > 0 && (
          <>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>{pendingCheckerCount} pending 4-eyes review</span>
            </span>
          </>
        )}
      </div>

      {/* Zone 3: Active User & Logout */}
      <div className="flex items-center gap-2">
        {/* User Role Switcher Dropdown (Testing convenience) */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 px-2.5">
          {currentUser.role === 'ADMIN' ? (
            <Users className="w-3.5 h-3.5 text-ob-indigo-600 shrink-0" />
          ) : currentUser.role === 'CHECKER' ? (
            <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-ob-green-600 shrink-0" />
          )}

          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 truncate max-w-[100px] sm:max-w-[130px]">
              {currentUser.name}
            </span>
            <span
              className={`text-[9px] uppercase font-bold tracking-wider ${
                currentUser.role === 'ADMIN'
                  ? 'text-ob-indigo-700'
                  : currentUser.role === 'CHECKER'
                  ? 'text-amber-700'
                  : 'text-ob-green-700'
              }`}
            >
              {currentUser.role}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          {/* Quick Role Switch for testing */}
          <select
            value={currentUser.id}
            onChange={(e) => {
              const u = DEMO_USERS.find((user) => user.id === e.target.value);
              if (u) onSwitchUser(u);
            }}
            aria-label="Switch User Role"
            className="text-xs bg-transparent text-slate-700 font-semibold cursor-pointer focus:outline-none focus:ring-0 pr-1"
            title="Switch User Role to test Maker-Checker segregation"
          >
            {DEMO_USERS.map((u) => (
              <option key={u.id} value={u.id}>
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
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
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
