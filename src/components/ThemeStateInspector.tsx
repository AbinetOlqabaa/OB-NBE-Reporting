/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Sun,
  Moon,
  Laptop,
  Maximize2,
  Minimize2,
  Terminal,
  ShieldCheck,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Sliders,
  Bug,
} from 'lucide-react';
import {
  useTheme,
  THEME_STORAGE_KEY,
  THEME_CHANGE_EVENT,
  getSystemPreference,
  ThemeMode,
  ThemeDebugLog,
} from '../contexts/ThemeContext.tsx';

interface LiveDomState {
  htmlClasses: string;
  dataTheme: string | null;
  dataThemeMode: string | null;
  colorScheme: string;
  bodyClasses: string;
  bodyDataTheme: string | null;
  bodyDataThemeMode: string | null;
  localStorageVal: string | null;
  systemMatchesDark: boolean;
}

export const ThemeStateInspector: React.FC = () => {
  const {
    theme,
    resolvedTheme,
    hasOverride,
    mountValidation,
    setTheme,
    toggleTheme,
    forceSync,
    debugLogs,
    mutationCount,
    isObserverActive,
    clearLogs,
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'test'>('status');
  const [filterQuery, setFilterQuery] = useState('');
  const [liveDom, setLiveDom] = useState<LiveDomState>({
    htmlClasses: '',
    dataTheme: null,
    dataThemeMode: null,
    colorScheme: '',
    bodyClasses: '',
    bodyDataTheme: null,
    bodyDataThemeMode: null,
    localStorageVal: null,
    systemMatchesDark: false,
  });

  // Query actual live DOM state directly from window/document
  const updateLiveDom = useCallback(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;
    const storageVal =
      typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null;
    const systemDark =
      typeof window !== 'undefined'
        ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;

    setLiveDom({
      htmlClasses: root.className,
      dataTheme: root.getAttribute('data-theme'),
      dataThemeMode: root.getAttribute('data-theme-mode'),
      colorScheme: root.style.colorScheme,
      bodyClasses: body ? body.className : '',
      bodyDataTheme: body ? body.getAttribute('data-theme') : null,
      bodyDataThemeMode: body ? body.getAttribute('data-theme-mode') : null,
      localStorageVal: storageVal,
      systemMatchesDark: systemDark,
    });
  }, []);

  // Poll DOM state and listen to custom events
  useEffect(() => {
    updateLiveDom();

    const interval = setInterval(updateLiveDom, 500);

    const handleCustomChange = () => {
      updateLiveDom();
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleCustomChange);
    window.addEventListener('storage', updateLiveDom);

    return () => {
      clearInterval(interval);
      window.removeEventListener(THEME_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener('storage', updateLiveDom);
    };
  }, [updateLiveDom]);

  // Evaluate sync integrity between React state, localStorage, and DOM
  const isLocalStorageInSync =
    (liveDom.localStorageVal === theme) ||
    (!liveDom.localStorageVal && theme === 'system');

  const isHtmlClassInSync =
    liveDom.htmlClasses.includes(resolvedTheme) &&
    !liveDom.htmlClasses.includes(resolvedTheme === 'dark' ? 'light' : 'dark');

  const isDataThemeInSync = liveDom.dataTheme === resolvedTheme;

  const isDataThemeModeInSync =
    !liveDom.dataThemeMode || liveDom.dataThemeMode === theme;

  const isColorSchemeInSync =
    !liveDom.colorScheme || liveDom.colorScheme === resolvedTheme;

  const isFullySynchronized =
    isLocalStorageInSync &&
    isHtmlClassInSync &&
    isDataThemeInSync &&
    isDataThemeModeInSync &&
    isColorSchemeInSync;

  // Intentional Desync Test Trigger:
  // Mutates documentElement directly to verify that MutationObserver intercepts and fixes it immediately
  const handleSimulateTamper = (type: 'attr' | 'class') => {
    if (typeof document === 'undefined') return;
    const wrongTheme = resolvedTheme === 'dark' ? 'light' : 'dark';

    if (type === 'attr') {
      document.documentElement.setAttribute('data-theme', wrongTheme);
    } else {
      document.documentElement.className = wrongTheme;
    }
    updateLiveDom();
  };

  const handleClearStorage = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(THEME_STORAGE_KEY);
      updateLiveDom();
      forceSync();
    }
  };

  const filteredLogs = debugLogs.filter((log) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      log.event.toLowerCase().includes(q) ||
      log.theme.toLowerCase().includes(q) ||
      log.resolvedTheme.toLowerCase().includes(q) ||
      (log.domClasses && log.domClasses.toLowerCase().includes(q))
    );
  });

  return (
    <aside
      aria-label="Theme State Inspector"
      className="fixed bottom-3 left-3 z-[9999] font-sans text-xs select-none"
    >
      {/* Floating Toggle Button (Always Available) */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl border cursor-pointer backdrop-blur-md transition-all group ${
            isFullySynchronized
              ? 'bg-slate-900/90 hover:bg-slate-900 text-white border-slate-700/80 hover:border-ob-indigo-500 ring-1 ring-white/10'
              : 'bg-rose-950/90 hover:bg-rose-900 text-rose-100 border-rose-500/80 animate-pulse'
          }`}
          title="Open Theme State Inspector & DOM Mutation HUD"
        >
          <div className="relative flex items-center justify-center">
            <Activity className="w-4 h-4 text-ob-green-400 group-hover:rotate-12 transition-transform" />
            <span
              className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                isFullySynchronized ? 'bg-ob-green-400 animate-ping' : 'bg-rose-400 animate-bounce'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="font-bold text-slate-200">ThemeInspector</span>
            <span
              className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                resolvedTheme === 'dark'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {theme} ({resolvedTheme})
            </span>
          </div>

          {mutationCount > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 border border-purple-400/40 font-mono text-[9px]">
              +{mutationCount} healed
            </span>
          )}
        </motion.button>
      )}

      {/* Expanded Inspector Modal / HUD Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`w-[360px] sm:w-[440px] bg-slate-950/95 text-slate-200 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden ring-1 ring-white/10 ${
              isMinimized ? 'h-auto' : 'max-h-[580px] h-[520px]'
            }`}
          >
            {/* Header */}
            <div className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-ob-indigo-600/30 border border-ob-indigo-500/40 flex items-center justify-center text-ob-indigo-400">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs text-white tracking-tight">
                      ThemeStateInspector
                    </h3>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      v2.0
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Real-time Context, DOM & MutationObserver Diagnostics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    updateLiveDom();
                    forceSync();
                  }}
                  title="Force re-sync and query DOM"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Expand HUD' : 'Minimize HUD'}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {isMinimized ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Inspector"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="px-3.5 py-2 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between text-[11px] shrink-0">
              <div className="flex items-center gap-1.5">
                {isFullySynchronized ? (
                  <div className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Synchronized</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Desynchronized</span>
                  </div>
                )}

                <span className="text-slate-600">|</span>

                <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isObserverActive ? 'bg-ob-green-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <span>Observer {isObserverActive ? 'Active' : 'Off'}</span>
                </div>
              </div>

              {mutationCount > 0 && (
                <div className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-800/50">
                  {mutationCount} Auto-Healed
                </div>
              )}
            </div>

            {!isMinimized && (
              <>
                {/* Navigation Tabs */}
                <div className="flex items-center px-3 pt-2 border-b border-slate-800/80 gap-1 bg-slate-900/30 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('status')}
                    className={`px-3 py-1.5 rounded-t-lg font-medium text-xs border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'status'
                        ? 'border-ob-indigo-500 text-white bg-slate-800/60'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Live State</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('logs')}
                    className={`px-3 py-1.5 rounded-t-lg font-medium text-xs border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'logs'
                        ? 'border-ob-indigo-500 text-white bg-slate-800/60'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Logs ({debugLogs.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('test')}
                    className={`px-3 py-1.5 rounded-t-lg font-medium text-xs border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'test'
                        ? 'border-ob-indigo-500 text-white bg-slate-800/60'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <Bug className="w-3 h-3" />
                    <span>Diagnostics & Tests</span>
                  </button>
                </div>

                {/* Tab 1: Live State HUD */}
                {activeTab === 'status' && (
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-[11px]">
                    {/* Mount Validation & Hydration Status Layer */}
                    {mountValidation && (
                      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <span>0. Hydration & Mount Validation</span>
                          <span className="text-ob-indigo-400 font-mono">
                            {mountValidation.pageContext}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/70 flex items-center justify-between">
                            <span className="text-slate-400 text-[10px]">Head Script & Hydration</span>
                            {mountValidation.hasRaceCondition ? (
                              <span className="text-rose-400 font-bold text-[9px] flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Race Detected
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-bold text-[9px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Race-Free Sync
                              </span>
                            )}
                          </div>
                          <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/70 flex items-center justify-between">
                            <span className="text-slate-400 text-[10px]">Manual User Override</span>
                            <span
                              className={`font-bold text-[10px] ${
                                hasOverride ? 'text-amber-300' : 'text-emerald-300'
                              }`}
                            >
                              {hasOverride ? `Active ("${theme}")` : 'Cleared (System Default)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* React Context Layer */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <span>1. React ThemeContext State</span>
                        <span className="text-ob-indigo-400">Context Source</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/70">
                          <span className="text-slate-500 block text-[9px]">theme mode</span>
                          <span className="text-white font-bold">{theme}</span>
                        </div>
                        <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/70">
                          <span className="text-slate-500 block text-[9px]">resolvedTheme</span>
                          <span
                            className={`font-bold ${
                              resolvedTheme === 'dark' ? 'text-indigo-400' : 'text-amber-400'
                            }`}
                          >
                            {resolvedTheme}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LocalStorage Layer */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <span>2. LocalStorage Persistence</span>
                        {isLocalStorageInSync ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-[9px]">
                            <CheckCircle2 className="w-3 h-3" /> Synced
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 text-[9px]">
                            <AlertTriangle className="w-3 h-3" /> Mismatch
                          </span>
                        )}
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/70 flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] truncate max-w-[200px]">
                          {THEME_STORAGE_KEY}
                        </span>
                        <span className="text-amber-300 font-bold">
                          {liveDom.localStorageVal !== null ? `"${liveDom.localStorageVal}"` : 'null'}
                        </span>
                      </div>
                    </div>

                    {/* DocumentElement DOM Layer */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <span>3. Active documentElement</span>
                        {isHtmlClassInSync && isDataThemeInSync ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-[9px]">
                            <CheckCircle2 className="w-3 h-3" /> Validated
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 text-[9px]">
                            <AlertTriangle className="w-3 h-3" /> Invalid
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/70 flex items-center justify-between">
                          <span className="text-slate-500 text-[9px]">classList</span>
                          <span className="text-emerald-300 font-bold truncate max-w-[220px]">
                            {liveDom.htmlClasses || '<empty>'}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/70 flex items-center justify-between">
                          <span className="text-slate-500 text-[9px]">data-theme</span>
                          <span className="text-indigo-300 font-bold">
                            {liveDom.dataTheme || '<none>'}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/70 flex items-center justify-between">
                          <span className="text-slate-500 text-[9px]">data-theme-mode</span>
                          <span className="text-ob-green-300 font-bold">
                            {liveDom.dataThemeMode || '<none>'}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/70 flex items-center justify-between">
                          <span className="text-slate-500 text-[9px]">style.colorScheme</span>
                          <span className="text-slate-300 font-bold">
                            {liveDom.colorScheme || '<auto>'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* OS Media Query Layer */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <span>4. OS Hardware Preference</span>
                        <span className="text-ob-green-400">matchMedia</span>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/70 flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">
                          (prefers-color-scheme: dark)
                        </span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            liveDom.systemMatchesDark
                              ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700'
                              : 'bg-amber-900/60 text-amber-300 border border-amber-700'
                          }`}
                        >
                          {liveDom.systemMatchesDark ? 'true (dark)' : 'false (light)'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Logs Feed */}
                {activeTab === 'logs' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-2 border-b border-slate-800/80 flex items-center gap-2 shrink-0 bg-slate-900/40">
                      <input
                        type="text"
                        placeholder="Filter theme logs..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-ob-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={clearLogs}
                        title="Clear logs"
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-slate-400" />
                        <span>Clear</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 font-mono text-[10px]">
                      {filteredLogs.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          No theme debug logs recorded yet.
                        </div>
                      ) : (
                        filteredLogs.map((log) => {
                          const isHeal = log.event.includes('MUTATION');
                          return (
                            <div
                              key={log.id}
                              className={`p-2 rounded-lg border ${
                                isHeal
                                  ? 'bg-purple-950/40 border-purple-800/60 text-purple-200'
                                  : 'bg-slate-900/80 border-slate-800/80 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold mb-1">
                                <span
                                  className={isHeal ? 'text-purple-300' : 'text-ob-indigo-400'}
                                >
                                  {log.event}
                                </span>
                                <span className="text-slate-500 text-[9px]">
                                  {log.timestamp.slice(11, 19)}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-400">
                                <div>
                                  mode: <span className="text-white font-bold">{log.theme}</span>
                                </div>
                                <div>
                                  resolved:{' '}
                                  <span
                                    className={
                                      log.resolvedTheme === 'dark'
                                        ? 'text-indigo-400 font-bold'
                                        : 'text-amber-400 font-bold'
                                    }
                                  >
                                    {log.resolvedTheme}
                                  </span>
                                </div>
                                <div className="col-span-2 truncate">
                                  dom:{' '}
                                  <span className="text-emerald-400 font-semibold">
                                    {log.domClasses || 'none'}
                                  </span>{' '}
                                  | data-theme:{' '}
                                  <span className="text-indigo-300 font-semibold">
                                    {log.dataTheme || 'null'}
                                  </span>
                                </div>
                                {log.details?.source && (
                                  <div className="col-span-2 text-slate-500">
                                    source: {log.details.source}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Diagnostics & Testing */}
                {activeTab === 'test' && (
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-xs">
                    {/* Quick Mode Switches */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Direct Theme Switching
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`p-2 rounded-lg font-semibold text-xs border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            theme === 'light'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 ring-1 ring-amber-500/30'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <Sun className="w-3.5 h-3.5" />
                          <span>Light</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`p-2 rounded-lg font-semibold text-xs border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60 ring-1 ring-indigo-500/30'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <Moon className="w-3.5 h-3.5" />
                          <span>Dark</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTheme('system')}
                          className={`p-2 rounded-lg font-semibold text-xs border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            theme === 'system'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 ring-1 ring-emerald-500/30'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <Laptop className="w-3.5 h-3.5" />
                          <span>Device</span>
                        </button>
                      </div>
                    </div>

                    {/* MutationObserver Auto-Healing Verification */}
                    <div className="bg-slate-900/80 border border-purple-900/60 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        <span>Test MutationObserver Self-Healing</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Simulate third-party script or browser caching altering the DOM. The MutationObserver will instantly intercept and re-enforce the correct state.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleSimulateTamper('attr')}
                          className="px-2 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-700/80 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Tamper data-theme
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulateTamper('class')}
                          className="px-2 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-700/80 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Tamper classList
                        </button>
                      </div>
                    </div>

                    {/* Utility Actions */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Storage & DOM Maintenance
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleClearStorage}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-rose-950/50 text-rose-300 border border-slate-800 hover:border-rose-800/80 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear LocalStorage</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            forceSync();
                            updateLiveDom();
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Force DOM Re-Sync</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
