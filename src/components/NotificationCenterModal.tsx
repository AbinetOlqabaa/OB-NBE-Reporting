/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Inbox,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { UserSession } from '../types/regulatory.ts';
import {
  notificationService,
  AppNotification,
  NotificationCategory,
} from '../services/notificationService.ts';
import { ViewTab } from './Sidebar.tsx';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onNavigateTab?: (tab: ViewTab) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'UNREAD' | NotificationCategory>('ALL');

  const loadNotifications = () => {
    if (!currentUser) return;
    const res = notificationService.getNotificationsForUser(currentUser);
    setNotifications(res.notifications);
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    const handleUpdate = () => {
      loadNotifications();
    };
    notificationService.on('notificationCreated', handleUpdate);
    notificationService.on('notificationsUpdated', handleUpdate);
    return () => {
      notificationService.off('notificationCreated', handleUpdate);
      notificationService.off('notificationsUpdated', handleUpdate);
    };
  }, [currentUser]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'UNREAD') return !n.isRead;
    return n.category === selectedFilter;
  });

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.markAsRead(id, currentUser);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead(currentUser);
    loadNotifications();
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      notificationService.markAsRead(notif.id, currentUser);
    }
    const tab = notif.actionTab || (notif as any).linkTab;
    if (tab && onNavigateTab) {
      onNavigateTab(tab as ViewTab);
      onClose();
    }
  };

  const getCategoryBadge = (category: NotificationCategory | string) => {
    switch (category) {
      case 'WORKFLOW':
      case 'REGULATORY_WORKFLOW':
        return {
          label: 'Workflow',
          className: 'bg-ob-indigo-50 dark:bg-ob-indigo-950/60 text-ob-indigo-700 dark:text-ob-indigo-300 border-ob-indigo-200 dark:border-ob-indigo-800',
          icon: Inbox,
        };
      case 'GOVERNANCE':
      case 'GOVERNANCE_CHANGE':
        return {
          label: 'Governance',
          className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: Shield,
        };
      case 'SECURITY':
      case 'SYSTEM_SECURITY':
      case 'AUDIT_COMPLIANCE':
        return {
          label: 'Security',
          className: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: ShieldAlert,
        };
      case 'SYSTEM':
      default:
        return {
          label: 'System',
          className: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          icon: Info,
        };
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end sm:p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
    >
      <div
        className="w-full sm:max-w-md h-full sm:h-[calc(100vh-2rem)] sm:max-h-[720px] bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-ob-indigo-50 dark:bg-ob-indigo-950/60 border border-ob-indigo-200 dark:border-ob-indigo-800 flex items-center justify-center text-ob-indigo-700 dark:text-ob-indigo-300">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="notification-center-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  Notification Center
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentUser.role} scope · {currentUser.department || 'Oromia Bank Head Office'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-ob-indigo-700 dark:text-ob-indigo-300 hover:bg-ob-indigo-50 dark:hover:bg-ob-indigo-950/50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close notification center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              selectedFilter === 'ALL'
                ? 'bg-ob-indigo-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('UNREAD')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              selectedFilter === 'UNREAD'
                ? 'bg-ob-indigo-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('WORKFLOW')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              selectedFilter === 'WORKFLOW'
                ? 'bg-ob-indigo-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Workflow
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('GOVERNANCE')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              selectedFilter === 'GOVERNANCE'
                ? 'bg-ob-indigo-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Governance
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredNotifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Bell className="w-6 h-6 stroke-1" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                No notifications to display
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                You're completely caught up! New 4-eyes workflow updates and governance notices will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const badge = getCategoryBadge(notif.category);
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 transition-colors relative flex gap-3 cursor-pointer group ${
                    notif.isRead
                      ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      : 'bg-ob-indigo-50/40 dark:bg-ob-indigo-950/20 hover:bg-ob-indigo-50/70 dark:hover:bg-ob-indigo-950/40'
                  }`}
                >
                  {/* Unread dot indicator */}
                  {!notif.isRead && (
                    <span className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-ob-indigo-600 dark:bg-ob-indigo-400"></span>
                  )}

                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${badge.className}`}
                  >
                    <BadgeIcon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4
                        className={`text-xs sm:text-sm font-bold truncate ${
                          notif.isRead
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-ob-indigo-950 dark:text-white'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        {notif.targetReportKey && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                            {notif.targetReportKey}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-ob-indigo-600 dark:hover:text-ob-indigo-400 px-2 py-0.5 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors"
                            title="Mark as read"
                          >
                            Mark read
                          </button>
                        )}
                        {notif.actionTab && (
                          <span className="text-ob-indigo-600 dark:text-ob-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-center text-[11px] text-slate-500 dark:text-slate-400">
          Cross-department isolation enforced under NBE Directive BSD/03/2020
        </div>
      </div>
    </div>
  );
};
