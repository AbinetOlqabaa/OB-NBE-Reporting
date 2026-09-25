/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserCheck,
  UserX,
  UserPlus,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Edit2,
  Trash2,
  Building2,
  KeyRound,
  FileText,
  Inbox,
  Send,
  Database,
  History,
  Check,
  X,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { UserAccount, UserRole, UserStatus, userService } from '../services/userService';
import { UserSession } from '../types/regulatory';
import { Pagination } from './Pagination';
import { ViewTab } from './Sidebar';

interface AdminDashboardProps {
  currentUser: UserSession;
  onNavigateTab: (tab: ViewTab) => void;
  onUserStatusChanged?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigateTab,
  onUserStatusChanged,
}) => {
  const [users, setUsers] = useState<UserAccount[]>(userService.getAll());
  const [activeSubTab, setActiveSubTab] = useState<'PENDING' | 'ALL_USERS' | 'GOVERNANCE'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Pagination for all users table
  const [allUsersPage, setAllUsersPage] = useState(1);
  const [allUsersPageSize, setAllUsersPageSize] = useState(5);

  // Pagination for pending users table
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(5);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    department: string;
    employeeId: string;
    phoneNumber: string;
    role: UserRole;
    status: UserStatus;
  }>({
    name: '',
    department: '',
    employeeId: '',
    phoneNumber: '',
    role: 'MAKER',
    status: 'ACTIVE',
  });

  // Action feedback message
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
          return;
        }
      }
    } catch {}
    setUsers(userService.getAll());
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter pending users
  const pendingUsers = users.filter((u) => u.status === 'PENDING_APPROVAL');

  // Filter all users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Paginated Slices
  const paginatedAllUsers = filteredUsers.slice(
    (allUsersPage - 1) * allUsersPageSize,
    allUsersPage * allUsersPageSize
  );

  const paginatedPending = pendingUsers.slice(
    (pendingPage - 1) * pendingPageSize,
    pendingPage * pendingPageSize
  );

  // Authorize & Activate User
  const handleAuthorizeUser = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', adminName: currentUser.name }),
      });
      if (res.ok) {
        const result = await res.json();
        showNotice('success', `User account ${result.user?.name || ''} has been authorized and activated.`);
      } else {
        // Fallback local
        userService.updateUserStatus(userId, 'ACTIVE', currentUser.name);
        showNotice('success', 'User account authorized and activated successfully.');
      }
      await fetchUsers();
      onUserStatusChanged?.();
    } catch (err: any) {
      userService.updateUserStatus(userId, 'ACTIVE', currentUser.name);
      showNotice('success', 'User account authorized and activated.');
      await fetchUsers();
      onUserStatusChanged?.();
    } finally {
      setLoading(false);
    }
  };

  // Toggle Disable / Enable User
  const handleToggleDisable = async (user: UserAccount) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, adminName: currentUser.name }),
      });
      if (res.ok) {
        showNotice('success', `Account for ${user.name} is now ${nextStatus}.`);
      } else {
        userService.updateUserStatus(user.id, nextStatus, currentUser.name);
        showNotice('success', `Account for ${user.name} is now ${nextStatus}.`);
      }
      await fetchUsers();
      onUserStatusChanged?.();
    } catch {
      userService.updateUserStatus(user.id, nextStatus, currentUser.name);
      showNotice('success', `Account for ${user.name} is now ${nextStatus}.`);
      await fetchUsers();
      onUserStatusChanged?.();
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === 'usr_admin_1') {
      showNotice('error', 'Cannot delete the primary System Administrator account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user account "${userName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        showNotice('success', `User account "${userName}" deleted.`);
      } else {
        const r = userService.deleteUser(userId);
        if (r.success) {
          showNotice('success', `User account "${userName}" deleted.`);
        } else {
          showNotice('error', r.message || 'Failed to delete user.');
        }
      }
      await fetchUsers();
      onUserStatusChanged?.();
    } catch {
      userService.deleteUser(userId);
      showNotice('success', `User account "${userName}" deleted.`);
      await fetchUsers();
      onUserStatusChanged?.();
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      department: user.department,
      employeeId: user.employeeId,
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      status: user.status,
    });
  };

  // Save Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        showNotice('success', `User profile for "${editFormData.name}" updated successfully.`);
      } else {
        userService.updateUser(editingUser.id, editFormData);
        showNotice('success', `User profile for "${editFormData.name}" updated successfully.`);
      }
      setEditingUser(null);
      await fetchUsers();
      onUserStatusChanged?.();
    } catch {
      userService.updateUser(editingUser.id, editFormData);
      showNotice('success', `User profile updated.`);
      setEditingUser(null);
      await fetchUsers();
      onUserStatusChanged?.();
    }
  };

  // Metrics summary
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const makerCount = users.filter((u) => u.role === 'MAKER' && u.status === 'ACTIVE').length;
  const checkerCount = users.filter((u) => u.role === 'CHECKER' && u.status === 'ACTIVE').length;
  const pendingCount = pendingUsers.length;

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-3 font-sans">
      {/* 1. Top Ribbon Metrics (Compact, Fixed Height) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Users</span>
            <span className="text-xl font-bold text-slate-900 leading-tight">{totalCount}</span>
            <span className="text-[10px] text-slate-500 block">{activeCount} active</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className={`border rounded-xl p-3 shadow-2xs flex items-center justify-between transition-colors ${
          pendingCount > 0 ? 'bg-amber-50/80 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block flex items-center gap-1">
              <span>Pending Review</span>
              {pendingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
            </span>
            <span className="text-xl font-bold text-amber-700 leading-tight">{pendingCount}</span>
            <span className="text-[10px] text-amber-600 block">Awaiting Authorization</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Active Makers</span>
            <span className="text-xl font-bold text-blue-700 leading-tight">{makerCount}</span>
            <span className="text-[10px] text-slate-500 block">Returns Preparation</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Active Checkers</span>
            <span className="text-xl font-bold text-amber-700 leading-tight">{checkerCount}</span>
            <span className="text-[10px] text-slate-500 block">Prudential Review</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ob-indigo-700 block">NBE Compliance</span>
            <span className="text-xs font-bold text-ob-green-700 flex items-center gap-1 leading-tight mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-ob-green-600" />
              <span>BSD/03/2020</span>
            </span>
            <span className="text-[10px] text-slate-500 block">4-Eyes Enforced</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-ob-indigo-50 text-ob-indigo-700 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Notification Toast if active */}
      {actionNotice && (
        <div
          className={`shrink-0 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs ${
            actionNotice.type === 'success'
              ? 'bg-ob-green-900 text-white'
              : 'bg-rose-900 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-ob-green-300" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-white/80 hover:text-white text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Controls & Navigation Sub-Tabs (Fixed Height) */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('PENDING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'PENDING'
                ? 'bg-ob-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Authorizations</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeSubTab === 'PENDING'
                  ? 'bg-ob-indigo-700 text-white'
                  : pendingCount > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('ALL_USERS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'ALL_USERS'
                ? 'bg-ob-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Users & Roles</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeSubTab === 'ALL_USERS'
                  ? 'bg-ob-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {filteredUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('GOVERNANCE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'GOVERNANCE'
                ? 'bg-ob-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Segregation & Health</span>
          </button>
        </div>

        {/* Search & Actions Bar (for All Users) */}
        {activeSubTab === 'ALL_USERS' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, employee ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAllUsersPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 focus:bg-white"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setAllUsersPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="MAKER">Maker</option>
              <option value="CHECKER">Checker</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setAllUsersPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        )}
      </div>

      {/* 4. Tab 1: Pending Authorizations View (Fixed Box, No Window Extension) */}
      {activeSubTab === 'PENDING' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
          {/* Section Sub-Header */}
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Awaiting Administrator Review & Authorization
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                (Mandatory 4-Eyes Segregation of Duties Control)
              </span>
            </div>
            <button
              onClick={fetchUsers}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
              title="Refresh list"
            >
              <RotateCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Table Container - Strict overflow-y-auto inside fixed container */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {pendingUsers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">All Registrations Authorized</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  There are currently no new Maker or Checker registrations pending authorization. New user signups will appear here immediately for administrator sign-off.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold sticky top-0 z-10">
                    <th className="py-2 px-3">Applicant Name & Email</th>
                    <th className="py-2 px-3">Requested Role</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Employee ID</th>
                    <th className="py-2 px-3">Registered Date</th>
                    <th className="py-2 px-3 text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPending.map((user) => (
                    <tr key={user.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'MAKER'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {user.role} (Reporting)
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-700">
                        {user.department || 'Regulatory Operations'}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-700 font-medium">
                        {user.employeeId}
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString()}{' '}
                        <span className="text-slate-400">
                          {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleAuthorizeUser(user.id)}
                          disabled={loading}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all inline-flex items-center gap-1"
                          title="Authorize and grant access to OB Regulatory Portal"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Authorize & Activate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Edit role or details before activating"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Reject and delete this registration"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {pendingUsers.length > 0 && (
            <div className="shrink-0 p-2 border-t border-slate-200 bg-slate-50/50">
              <Pagination
                currentPage={pendingPage}
                totalItems={pendingUsers.length}
                pageSize={pendingPageSize}
                onPageChange={setPendingPage}
                onPageSizeChange={setPendingPageSize}
                pageSizeOptions={[5, 10, 20]}
              />
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: All Users & Roles Management (Fixed Box, No Window Extension) */}
      {activeSubTab === 'ALL_USERS' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Users className="w-8 h-8 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No Users Found</h3>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold sticky top-0 z-10">
                    <th className="py-2 px-3">Name & Email</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Department & Employee ID</th>
                    <th className="py-2 px-3">Authorized By</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAllUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {user.id === 'usr_admin_1' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700">
                              SUPER USER
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : user.role === 'CHECKER'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : user.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : user.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          ></span>
                          <span>{user.status === 'PENDING_APPROVAL' ? 'PENDING' : user.status}</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="text-slate-800 font-medium">{user.department}</div>
                        <div className="text-[11px] font-mono text-slate-500">ID: {user.employeeId}</div>
                      </td>

                      <td className="py-2.5 px-3 text-[11px] text-slate-600">
                        {user.approvedBy ? (
                          <span>{user.approvedBy}</span>
                        ) : (
                          <span className="text-slate-400 italic">Pending authorization</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {user.status === 'PENDING_APPROVAL' ? (
                          <button
                            type="button"
                            onClick={() => handleAuthorizeUser(user.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Authorize</span>
                          </button>
                        ) : (
                          user.id !== 'usr_admin_1' && (
                            <button
                              type="button"
                              onClick={() => handleToggleDisable(user)}
                              className={`px-2 py-1 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1 ${
                                user.status === 'ACTIVE'
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={user.status === 'ACTIVE' ? 'Disable this user' : 'Re-enable this user'}
                            >
                              {user.status === 'ACTIVE' ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                              <span>{user.status === 'ACTIVE' ? 'Disable' : 'Enable'}</span>
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Edit user information"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        {user.id !== 'usr_admin_1' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Delete this user account"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="shrink-0 p-2 border-t border-slate-200 bg-slate-50/50">
            <Pagination
              currentPage={allUsersPage}
              totalItems={filteredUsers.length}
              pageSize={allUsersPageSize}
              onPageChange={setAllUsersPage}
              onPageSizeChange={setAllUsersPageSize}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          </div>
        </div>
      )}

      {/* 6. Tab 3: Governance & Cross-Role Quick Jump */}
      {activeSubTab === 'GOVERNANCE' && (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {/* Segregation of Duties Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-ob-indigo-600" />
              <span>NBE Banking Directive BSD/03/2020: Maker-Checker Role Matrix</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              The National Bank of Ethiopia mandates strict segregation of duties for all prudential and statistical returns. The Administrator oversees user lifecycle, while Maker and Checker responsibilities remain strictly partitioned:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="border border-ob-indigo-200 bg-ob-indigo-50/50 rounded-xl p-3">
                <div className="font-bold text-ob-indigo-900 mb-1 flex items-center justify-between">
                  <span>Administrator (Super User)</span>
                  <span className="text-[10px] bg-ob-indigo-200 text-ob-indigo-800 px-1.5 py-0.2 rounded font-mono font-bold">SUPREME</span>
                </div>
                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                  <li>Review & authorize new Maker/Checker signups</li>
                  <li>Enable, disable, edit, and delete user profiles</li>
                  <li>Configure NBE Gateway Simulator & failure modes</li>
                  <li>Full oversight of all 24 Return schedules & logs</li>
                </ul>
              </div>

              <div className="border border-ob-green-200 bg-ob-green-50/50 rounded-xl p-3">
                <div className="font-bold text-ob-green-900 mb-1 flex items-center justify-between">
                  <span>Maker (Reporting Officer)</span>
                  <span className="text-[10px] bg-ob-green-200 text-ob-green-800 px-1.5 py-0.2 rounded font-mono font-bold">PREPARATION</span>
                </div>
                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                  <li>Initiate drafts for 24 NBE Return Templates</li>
                  <li>Input return items & dynamic rosters (loans, etc.)</li>
                  <li>Run mathematical formula validation engine</li>
                  <li>Submit prepared returns to Checker queue</li>
                </ul>
              </div>

              <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3">
                <div className="font-bold text-amber-900 mb-1 flex items-center justify-between">
                  <span>Checker (Review Officer)</span>
                  <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">4-EYES APPROVAL</span>
                </div>
                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                  <li>Inspect Maker drafts against GL & balance sheets</li>
                  <li>Approve or Request Corrections with comments</li>
                  <li>Sign off and deliver returns to NBE Gateway</li>
                  <li>Receive official digital intake receipt tokens</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Jump Links for Administrator */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Super User Navigation & Direct Oversight
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('MAKER_WORKSPACE')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <FileText className="w-4 h-4 text-ob-green-600 mb-1" />
                <span className="font-bold text-slate-800">Maker Workspace</span>
                <span className="text-[10px] text-slate-500">Inspect drafts</span>
              </button>

              <button
                onClick={() => onNavigateTab('CHECKER_INBOX')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <Inbox className="w-4 h-4 text-amber-600 mb-1" />
                <span className="font-bold text-slate-800">Checker Inbox</span>
                <span className="text-[10px] text-slate-500">Sign-off queue</span>
              </button>

              <button
                onClick={() => onNavigateTab('NBE_SIMULATOR')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <Send className="w-4 h-4 text-ob-indigo-600 mb-1" />
                <span className="font-bold text-slate-800">NBE Simulator</span>
                <span className="text-[10px] text-slate-500">Gateway intake</span>
              </button>

              <button
                onClick={() => onNavigateTab('PHASE2_SSOT')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <Database className="w-4 h-4 text-purple-600 mb-1" />
                <span className="font-bold text-slate-800">SSOT Pipeline</span>
                <span className="text-[10px] text-slate-500">GL reconcile</span>
              </button>

              <button
                onClick={() => onNavigateTab('AUDIT_TRAIL')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <History className="w-4 h-4 text-slate-600 mb-1" />
                <span className="font-bold text-slate-800">Audit Trail</span>
                <span className="text-[10px] text-slate-500">Immutable ledger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Edit User Floating Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-ob-indigo-50 text-ob-indigo-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit User Profile</h3>
                  <span className="text-xs text-slate-500 font-mono">{editingUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                    disabled={editingUser.id === 'usr_admin_1'}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500"
                  >
                    <option value="MAKER">MAKER (Reporting)</option>
                    <option value="CHECKER">CHECKER (Prudential)</option>
                    <option value="ADMIN">ADMINISTRATOR</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as UserStatus })}
                    disabled={editingUser.id === 'usr_admin_1'}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={editFormData.employeeId}
                    onChange={(e) => setEditFormData({ ...editFormData, employeeId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phoneNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ob-indigo-600 hover:bg-ob-indigo-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
