/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  Inbox,
  Send,
  Database,
  History,
  HelpCircle,
  Users,
  X,
  ArrowRight,
  Sparkles,
  Command,
  Zap,
} from 'lucide-react';
import { ViewTab } from './Sidebar';
import { ReportMetadata, UserSession } from '../types/regulatory';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: ViewTab) => void;
  onSelectReturn?: (reportKey: string) => void;
  templates: ReportMetadata[];
  currentUser: UserSession;
  onOpenShortcutsModal: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectReturn,
  templates,
  currentUser,
  onOpenShortcutsModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const navActions = [
    {
      id: 'MAKER_WORKSPACE' as ViewTab,
      title: 'Maker Workspace',
      subtitle: 'Browse 24 NBE returns, prepare and edit drafts',
      icon: FileText,
      shortcut: `${modKey}+M`,
      category: 'Views',
      allowedRoles: ['ADMIN', 'MAKER'],
    },
    {
      id: 'CHECKER_INBOX' as ViewTab,
      title: 'Checker Inbox',
      subtitle: 'Review submissions, 4-eyes approval & NBE delivery',
      icon: Inbox,
      shortcut: `${modKey}+Shift+C`,
      category: 'Views',
      allowedRoles: ['ADMIN', 'CHECKER'],
    },
    {
      id: 'ADMIN_DASHBOARD' as ViewTab,
      title: 'Admin Governance',
      subtitle: 'User management, approval queue & role assignments',
      icon: Users,
      shortcut: `${modKey}+Shift+A`,
      category: 'Views',
      allowedRoles: ['ADMIN'],
    },
    {
      id: 'NBE_SIMULATOR' as ViewTab,
      title: 'NBE Gateway Simulator',
      subtitle: 'API traffic logs, failure injection & schema tests',
      icon: Send,
      shortcut: `${modKey}+Shift+N`,
      category: 'Views',
      allowedRoles: ['ADMIN', 'CHECKER'],
    },
    {
      id: 'PHASE2_SSOT' as ViewTab,
      title: 'Phase 2 SSOT Medallion Lakehouse',
      subtitle: 'Automated data ingestion & GL reconciliation engine',
      icon: Database,
      shortcut: `${modKey}+Shift+S`,
      category: 'Views',
      allowedRoles: ['ADMIN', 'MAKER', 'CHECKER'],
    },
    {
      id: 'AUDIT_TRAIL' as ViewTab,
      title: 'Compliance Audit Trail',
      subtitle: 'Immutable event history & regulatory CSV export',
      icon: History,
      shortcut: `${modKey}+Shift+L`,
      category: 'Views',
      allowedRoles: ['ADMIN', 'MAKER', 'CHECKER', 'NBE_OFFICER'],
    },
    {
      id: 'DOCUMENTATION' as ViewTab,
      title: 'Regulatory Directives & Documentation',
      subtitle: 'BSD/03/2020 guidelines, formula specifications & return catalog',
      icon: HelpCircle,
      shortcut: `${modKey}+Shift+D`,
      category: 'Views',
      allowedRoles: ['ADMIN', 'MAKER', 'CHECKER', 'NBE_OFFICER'],
    },
  ].filter((a) => a.allowedRoles.includes(currentUser.role));

  // Matched Returns
  const matchedTemplates = templates
    .filter(
      (t) =>
        t.Code.toLowerCase().includes(query.toLowerCase()) ||
        t.Title.toLowerCase().includes(query.toLowerCase()) ||
        t.Category.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5);

  const matchedNav = navActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const allResults = [
    ...matchedNav.map((n) => ({ type: 'NAV' as const, data: n })),
    ...matchedTemplates.map((t) => ({ type: 'RETURN' as const, data: t })),
    {
      type: 'ACTION' as const,
      data: {
        id: 'SHORTCUTS',
        title: 'View Keyboard Shortcuts',
        subtitle: 'Show the complete cheatsheet of hotkeys',
        icon: Zap,
        shortcut: '?',
      },
    },
  ];

  const handleSelect = (index: number) => {
    const item = allResults[index];
    if (!item) return;

    if (item.type === 'NAV') {
      onNavigateTab(item.data.id);
      onClose();
    } else if (item.type === 'RETURN') {
      if (onSelectReturn) {
        onSelectReturn(item.data.ReturnKey);
      } else {
        onNavigateTab('MAKER_WORKSPACE');
      }
      onClose();
    } else if (item.type === 'ACTION') {
      onClose();
      onOpenShortcutsModal();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-20 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full max-h-[75vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-2.5 bg-slate-50/50">
          <Search className="w-4 h-4 text-ob-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, view name, or return code (e.g., POBEPE001)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-slate-900 text-xs sm:text-sm font-medium placeholder-slate-400 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200 text-[10px] font-mono shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto max-h-96 space-y-1 text-xs">
          {allResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Search className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No matching commands or returns</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try searching for "Balance", "Maker", or "SSOT".</p>
            </div>
          ) : (
            allResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              if (item.type === 'NAV') {
                const IconComp = item.data.icon;
                return (
                  <button
                    key={`nav_${item.data.id}`}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-ob-indigo-50 border border-ob-indigo-200 text-ob-indigo-950'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected ? 'bg-ob-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>{item.data.title}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-100 text-slate-600">
                            View
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{item.data.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-mono text-[10px] font-semibold">
                        {item.data.shortcut}
                      </kbd>
                    </div>
                  </button>
                );
              }

              if (item.type === 'RETURN') {
                return (
                  <button
                    key={`ret_${item.data.ReturnKey}`}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-ob-indigo-50 border border-ob-indigo-200 text-ob-indigo-950'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected ? 'bg-ob-green-600 text-white' : 'bg-ob-green-50 text-ob-green-700'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span className="font-mono text-ob-indigo-700 font-bold">[{item.data.Code}]</span>
                          <span className="truncate">{item.data.Title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Category: {item.data.Category} · {item.data.Frequency}
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ob-green-100 text-ob-green-800 shrink-0">
                      Open Return
                    </span>
                  </button>
                );
              }

              if (item.type === 'ACTION') {
                const IconComp = item.data.icon;
                return (
                  <button
                    key={`act_${item.data.id}`}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-ob-indigo-50 border border-ob-indigo-200 text-ob-indigo-950'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs">{item.data.title}</div>
                        <div className="text-[11px] text-slate-500">{item.data.subtitle}</div>
                      </div>
                    </div>

                    <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-mono text-[10px] font-bold">
                      {item.data.shortcut}
                    </kbd>
                  </button>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Use <kbd className="font-mono text-slate-700 font-bold">↑</kbd> <kbd className="font-mono text-slate-700 font-bold">↓</kbd> to navigate</span>
            <span>·</span>
            <span><kbd className="font-mono text-slate-700 font-bold">Enter</kbd> to select</span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span>Oromia Bank NBE Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};
