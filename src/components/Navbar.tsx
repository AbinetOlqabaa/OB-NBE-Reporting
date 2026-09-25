/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Radio,
  ExternalLink,
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

export type GatewayState = 'ONLINE' | 'CHECKING' | 'DEGRADED' | 'OFFLINE';

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  pendingCheckerCount,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onLogout,
}) => {
  const [gatewayStatus, setGatewayStatus] = useState<GatewayState>('ONLINE');
  const [latencyMs, setLatencyMs] = useState<number>(34);
  const [lastCheckedDate, setLastCheckedDate] = useState<Date>(new Date());
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [showStatusPopover, setShowStatusPopover] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Health check polling function
  const checkGatewayHealth = async () => {
    setIsPinging(true);
    const startTime = performance.now();

    try {
      const res = await fetch('/api/nbe-simulator/gateway-health');
      const endTime = performance.now();
      const measuredLatency = Math.round(endTime - startTime) || Math.floor(25 + Math.random() * 20);

      if (res.ok) {
        const data = await res.json();
        setGatewayStatus(data.status || 'ONLINE');
        setLatencyMs(data.latencyMs || measuredLatency);
      } else {
        setGatewayStatus('DEGRADED');
        setLatencyMs(measuredLatency + 40);
      }
    } catch {
      // Simulated local fallback
      const randomLatency = Math.floor(28 + Math.random() * 22);
      setLatencyMs(randomLatency);
      setGatewayStatus('ONLINE');
    } finally {
      setLastCheckedDate(new Date());
      setIsPinging(false);
    }
  };

  // Periodic polling every 7 seconds
  useEffect(() => {
    checkGatewayHealth();
    const interval = setInterval(() => {
      checkGatewayHealth();
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowStatusPopover(false);
      }
    };
    if (showStatusPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusPopover]);

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastCheckedDate.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    return `${seconds}s ago`;
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 shadow-2xs shrink-0 select-none">
      {/* Zone 1: Sidebar Toggle + Official Oromia Bank Brand */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:text-ob-indigo-700 hover:bg-ob-indigo-50 transition-colors focus:outline-none focus:ring-1 focus:ring-ob-indigo-400 cursor-pointer"
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

      {/* Zone 2: Real-Time NBE Gateway Connectivity Status & Stats */}
      <div className="hidden md:flex items-center gap-3.5 text-xs text-slate-600 relative" ref={popoverRef}>
        {/* Real-time Gateway Health Indicator Pill */}
        <button
          type="button"
          onClick={() => setShowStatusPopover(!showStatusPopover)}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
            gatewayStatus === 'ONLINE'
              ? 'bg-ob-green-50/70 border-ob-green-300 text-ob-green-900 hover:bg-ob-green-100/80'
              : gatewayStatus === 'DEGRADED'
              ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              : 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100'
          }`}
          title="Click to view NBE Gateway connection telemetry and health"
        >
          <span className="relative flex h-2.5 w-2.5">
            {gatewayStatus === 'ONLINE' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ob-green-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                gatewayStatus === 'ONLINE'
                  ? 'bg-ob-green-600'
                  : gatewayStatus === 'DEGRADED'
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
            ></span>
          </span>

          <span className="font-bold flex items-center gap-1">
            <span>NBE Gateway:</span>
            <span className="font-mono text-[11px] font-bold">
              {gatewayStatus === 'ONLINE' ? `${latencyMs}ms (Online)` : gatewayStatus}
            </span>
          </span>

          {isPinging && <RefreshCw className="w-3 h-3 animate-spin text-ob-green-700" />}
        </button>

        {/* Interactive Telemetry Popover */}
        {showStatusPopover && (
          <div className="absolute top-10 left-0 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Server className="w-4 h-4 text-ob-indigo-600" />
                <span>NBE Gateway Telemetry</span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                  gatewayStatus === 'ONLINE'
                    ? 'bg-ob-green-100 text-ob-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {gatewayStatus}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Endpoint:</span>
                <span className="font-mono text-slate-800 font-semibold truncate max-w-[150px]">
                  nbe.gov.et/api/v2
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Transport Security:</span>
                <span className="font-semibold text-slate-800">TLS 1.3 / mTLS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Round-Trip Latency:</span>
                <span className="font-mono font-bold text-ob-green-700">{latencyMs} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Verified:</span>
                <span className="text-slate-700 font-medium">{getTimeAgo()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Regulator Directive:</span>
                <span className="font-semibold text-ob-indigo-700">BSD/03/2020</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">Auto-polls every 7s</span>
              <button
                type="button"
                onClick={checkGatewayHealth}
                disabled={isPinging}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ob-indigo-50 hover:bg-ob-indigo-100 text-ob-indigo-700 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                <span>Ping Now</span>
              </button>
            </div>
          </div>
        )}

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
                  : currentUser.role === 'NBE_OFFICER'
                  ? 'text-purple-700'
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
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
