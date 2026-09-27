/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SpecialAccessGrant, UserSession } from '../types/regulatory.ts';
import {
  OROMIA_BANK_DEPARTMENTS,
  getReportsForDepartment,
  getDepartmentForReport,
} from '../data/organizationHierarchy.ts';

export type UserRole = 'ADMIN' | 'MAKER' | 'CHECKER';
export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'DISABLED';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  institutionCode: string;
  department: string;
  employeeId: string;
  phoneNumber?: string;
  specialAccessGrants: SpecialAccessGrant[];
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  lastLoginAt?: string;
}

class UserServiceClass {
  private users: Map<string, UserAccount> = new Map();

  constructor() {
    this.seedUsers();
  }

  private seedUsers(): void {
    const initialUsers: UserAccount[] = [
      {
        id: 'usr_admin_1',
        name: 'Dawit Bekele',
        email: 'admin@oromiabank.com',
        password: 'password',
        role: 'ADMIN',
        status: 'ACTIVE',
        institutionCode: '0000013',
        department: 'Compliance & Legal Governance',
        employeeId: 'OB-ADM-001',
        phoneNumber: '+251 91 123 4567',
        specialAccessGrants: [],
        createdAt: '2026-01-10T08:00:00Z',
        approvedAt: '2026-01-10T08:00:00Z',
        approvedBy: 'National Bank of Ethiopia / OB Board',
      },
      // 1. Credit Operations & Portfolio Management (Maker & Checker from same department)
      {
        id: 'usr_maker_1',
        name: 'Abebe Kebede',
        email: 'abebe.kebede@oromiabank.com',
        password: 'password',
        role: 'MAKER',
        status: 'ACTIVE',
        institutionCode: '0000013',
        department: 'Credit Operations & Portfolio Management',
        employeeId: 'OB-MKR-104',
        phoneNumber: '+251 91 234 5678',
        specialAccessGrants: [],
        createdAt: '2026-02-01T09:00:00Z',
        approvedAt: '2026-02-02T10:00:00Z',
        approvedBy: 'Dawit Bekele (ADMIN)',
      },
      {
        id: 'usr_checker_1',
        name: 'Chala Desta',
        email: 'chala.desta@oromiabank.com',
        password: 'password',
        role: 'CHECKER',
        status: 'ACTIVE',
        institutionCode: '0000013',
        department: 'Credit Operations & Portfolio Management',
        employeeId: 'OB-CHK-055',
        phoneNumber: '+251 91 456 7890',
        specialAccessGrants: [],
        createdAt: '2026-01-15T08:30:00Z',
        approvedAt: '2026-01-16T09:15:00Z',
        approvedBy: 'Dawit Bekele (ADMIN)',
      },

      // 2. Trade Services & International Banking (Maker & Checker from same department)
      {
        id: 'usr_maker_2',
        name: 'Tigist Alemu',
        email: 'tigist.alemu@oromiabank.com',
        password: 'password',
        role: 'MAKER',
        status: 'ACTIVE',
        institutionCode: '0000013',
        department: 'Trade Services & International Banking',
        employeeId: 'OB-MKR-219',
        phoneNumber: '+251 91 345 6789',
        specialAccessGrants: [
          // Demonstration of Admin-granted cross-department special access
          {
            id: 'grant_demo_1',
            reportKey: 'DigitalLendingDL001',
            department: 'Digital Banking & Fintech Operations',
            grantedBy: 'Dawit Bekele (ADMIN)',
            grantedAt: '2026-03-01T10:00:00Z',
            reason: 'Temporary delegation for Fintech & Digital Trade micro-lending returns (Approved by VP Operations).',
          },
        ],
        createdAt: '2026-02-15T11:00:00Z',
        approvedAt: '2026-02-16T14:30:00Z',
        approvedBy: 'Dawit Bekele (ADMIN)',
      },
      {
        id: 'usr_checker_2',
        name: 'Meron Worku',
        email: 'meron.worku@oromiabank.com',
        password: 'password',
        role: 'CHECKER',
        status: 'ACTIVE',
        institutionCode: '0000013',
        department: 'Trade Services & International Banking',
        employeeId: 'OB-CHK-112',
        phoneNumber: '+251 91 789 0123',
        specialAccessGrants: [],
        createdAt: '2026-02-18T10:00:00Z',
        approvedAt: '2026-02-19T11:00:00Z',
        approvedBy: 'Dawit Bekele (ADMIN)',
      },

      // 3. Specialized Asset Recovery & Workout (Maker & Checker from same department)
      {
        id: 'usr_maker_3',
        name: 'Bekele Desta',
        email: 'bekele.desta@oromiabank.com',
        password: 'password',
        role: 'MAKER',
        status: 'ACTIVE',
        institutionCode: '0000013',
        department: 'Specialized Asset Recovery & Workout',
        employeeId: 'OB-MKR-305',
        phoneNumber: '+251 91 890 1234',
        specialAccessGrants: [],
        createdAt: '2026-02-20T08:00:00Z',
        approvedAt: '2026-02-21T09:00:00Z',
        approvedBy: 'Dawit Bekele (ADMIN)',
      },
      {
        id: 'usr_checker_3',
        name: 'Getachew Feyisa',
        email: 'getachew.feyisa@oromiabank.com',
        password: 'password',
        role: 'CHECKER',
        status: 'ACTIVE',
        institutionCode: '0000013',
        department: 'Specialized Asset Recovery & Workout',
        employeeId: 'OB-CHK-144',
        phoneNumber: '+251 91 901 2345',
        specialAccessGrants: [],
        createdAt: '2026-02-22T08:30:00Z',
        approvedAt: '2026-02-23T09:15:00Z',
        approvedBy: 'Dawit Bekele (ADMIN)',
      },

      // 4. Pending Approval Registrations
      {
        id: 'usr_pending_1',
        name: 'Lemlem Tadesse',
        email: 'lemlem.tadesse@oromiabank.com',
        password: 'password',
        role: 'MAKER',
        status: 'PENDING_APPROVAL',
        institutionCode: '0000013',
        department: 'Digital Banking & Fintech Operations',
        employeeId: 'OB-MKR-388',
        phoneNumber: '+251 91 567 8901',
        specialAccessGrants: [],
        createdAt: '2026-09-24T14:20:00Z',
      },
      {
        id: 'usr_pending_2',
        name: 'Fikadu Tolosa',
        email: 'fikadu.tolosa@oromiabank.com',
        password: 'password',
        role: 'CHECKER',
        status: 'PENDING_APPROVAL',
        institutionCode: '0000013',
        department: 'Credit Risk & Prudential Reporting',
        employeeId: 'OB-CHK-092',
        phoneNumber: '+251 91 678 9012',
        specialAccessGrants: [],
        createdAt: '2026-09-25T07:45:00Z',
      },
    ];

    initialUsers.forEach((u) => this.users.set(u.id, u));
  }

  public getAll(): UserAccount[] {
    return Array.from(this.users.values()).map((u) => {
      const { password, ...safe } = u;
      return safe as UserAccount;
    });
  }

  public getById(id: string): UserAccount | undefined {
    return this.users.get(id);
  }

  public getByEmail(email: string): UserAccount | undefined {
    const normalized = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) {
        return u;
      }
    }
    return undefined;
  }

  public register(data: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    department: string;
    employeeId: string;
    phoneNumber?: string;
  }): { success: boolean; user?: UserAccount; message?: string } {
    if (!data.name || !data.email) {
      return { success: false, message: 'Full name and email address are required.' };
    }

    if (!data.role || (data.role !== 'MAKER' && data.role !== 'CHECKER')) {
      return { success: false, message: 'Registration role must be either MAKER or CHECKER.' };
    }

    if (!data.department) {
      return { success: false, message: 'Department selection is mandatory pursuant to OB segregation policy.' };
    }

    const existing = this.getByEmail(data.email);
    if (existing) {
      return { success: false, message: 'An account with this email address already exists.' };
    }

    const newId = `usr_${data.role.toLowerCase()}_${Date.now()}`;
    const newUser: UserAccount = {
      id: newId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password || 'password',
      role: data.role,
      status: 'PENDING_APPROVAL', // Strict Admin authorization required per NBE Directive BSD/03/2020
      institutionCode: '0000013',
      department: data.department.trim(),
      employeeId: data.employeeId || `OB-${Math.floor(100 + Math.random() * 900)}`,
      phoneNumber: data.phoneNumber || '',
      specialAccessGrants: [],
      createdAt: new Date().toISOString(),
    };

    this.users.set(newId, newUser);
    const { password, ...safe } = newUser;
    return {
      success: true,
      user: safe as UserAccount,
      message: `Registration submitted for ${newUser.department}. Account requires Administrator authorization before access is enabled.`,
    };
  }

  public login(
    email: string,
    password?: string
  ): {
    success: boolean;
    user?: UserAccount;
    message?: string;
    redirectTab?: string;
  } {
    const user = this.getByEmail(email);
    if (!user) {
      return { success: false, message: 'Invalid credentials. User not found.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Invalid password. Please check your credentials.' };
    }

    if (user.status === 'PENDING_APPROVAL') {
      return {
        success: false,
        message: 'Account pending authorization by Compliance Administrator pursuant to NBE Directive BSD/03/2020.',
      };
    }

    if (user.status === 'DISABLED') {
      return {
        success: false,
        message: 'Account has been disabled. Please contact the Compliance Administrator.',
      };
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();

    // Determine redirect tab
    let redirectTab = 'MAKER_WORKSPACE';
    if (user.role === 'ADMIN') redirectTab = 'ADMIN_DASHBOARD';
    else if (user.role === 'CHECKER') redirectTab = 'CHECKER_INBOX';
    else if (user.role === 'MAKER') redirectTab = 'MAKER_WORKSPACE';

    const { password: pw, ...safe } = user;
    return {
      success: true,
      user: safe as UserAccount,
      redirectTab,
      message: 'Login successful.',
    };
  }

  public updateUserStatus(
    userId: string,
    status: UserStatus,
    adminName: string
  ): { success: boolean; user?: UserAccount; message?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    user.status = status;
    if (status === 'ACTIVE') {
      user.approvedAt = new Date().toISOString();
      user.approvedBy = `${adminName} (ADMIN)`;
    }

    const { password, ...safe } = user;
    return { success: true, user: safe as UserAccount };
  }

  public updateUser(
    userId: string,
    updates: Partial<UserAccount>
  ): { success: boolean; user?: UserAccount; message?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    if (updates.name) user.name = updates.name.trim();
    if (updates.department) user.department = updates.department.trim();
    if (updates.employeeId) user.employeeId = updates.employeeId.trim();
    if (updates.phoneNumber) user.phoneNumber = updates.phoneNumber.trim();
    if (updates.role && ['ADMIN', 'MAKER', 'CHECKER'].includes(updates.role)) {
      user.role = updates.role;
    }
    if (updates.status && ['ACTIVE', 'PENDING_APPROVAL', 'DISABLED'].includes(updates.status)) {
      user.status = updates.status;
    }

    const { password, ...safe } = user;
    return { success: true, user: safe as UserAccount };
  }

  public deleteUser(userId: string): { success: boolean; message?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    if (user.role === 'ADMIN' && user.id === 'usr_admin_1') {
      return { success: false, message: 'Cannot delete the primary System Administrator account.' };
    }

    this.users.delete(userId);
    return { success: true, message: 'User account removed.' };
  }

  // -------------------------------------------------------------
  // SPECIAL ACCESS / CROSS-DEPARTMENT DELEGATION METHODS
  // -------------------------------------------------------------

  public grantSpecialAccess(
    userId: string,
    grantData: {
      reportKey?: string;
      department?: string;
      reason: string;
      expiresAt?: string;
    },
    adminName: string
  ): { success: boolean; user?: UserAccount; message?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: 'Target user not found.' };
    }

    if (!grantData.reportKey && !grantData.department) {
      return { success: false, message: 'Either a reportKey or a target department must be specified.' };
    }

    if (!grantData.reason || grantData.reason.trim().length < 5) {
      return { success: false, message: 'A regulatory business justification reason is mandatory.' };
    }

    const newGrant: SpecialAccessGrant = {
      id: `grant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      reportKey: grantData.reportKey?.trim(),
      department: grantData.department?.trim(),
      grantedBy: `${adminName} (ADMIN)`,
      grantedAt: new Date().toISOString(),
      reason: grantData.reason.trim(),
      expiresAt: grantData.expiresAt,
    };

    if (!Array.isArray(user.specialAccessGrants)) {
      user.specialAccessGrants = [];
    }

    user.specialAccessGrants.push(newGrant);

    const { password, ...safe } = user;
    return {
      success: true,
      user: safe as UserAccount,
      message: `Special access granted to ${user.name} for ${grantData.reportKey || grantData.department}.`,
    };
  }

  public revokeSpecialAccess(
    userId: string,
    grantId: string,
    adminName: string
  ): { success: boolean; user?: UserAccount; message?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    if (!Array.isArray(user.specialAccessGrants)) {
      return { success: false, message: 'No special access grants exist on this user.' };
    }

    const beforeCount = user.specialAccessGrants.length;
    user.specialAccessGrants = user.specialAccessGrants.filter((g) => g.id !== grantId);

    if (user.specialAccessGrants.length === beforeCount) {
      return { success: false, message: 'Grant ID not found on user.' };
    }

    const { password, ...safe } = user;
    return {
      success: true,
      user: safe as UserAccount,
      message: `Special access grant revoked by ${adminName}.`,
    };
  }

  /**
   * Evaluates the complete set of report keys that this user is authorized to access.
   * - ADMIN: returns all 24 reports
   * - MAKER / CHECKER:
   *     1. All reports belonging to their home department
   *     2. Any specific reportKey explicitly granted by Admin
   *     3. All reports in any external department explicitly granted by Admin
   */
  public getAllowedReportKeysForUser(user: UserAccount | UserSession): string[] {
    if (user.role === 'ADMIN') {
      const all: string[] = [];
      OROMIA_BANK_DEPARTMENTS.forEach((d) => all.push(...d.reportKeys));
      return Array.from(new Set(all));
    }

    const allowed = new Set<string>();

    // 1. Home department reports
    if (user.department) {
      const deptReports = getReportsForDepartment(user.department);
      deptReports.forEach((k) => allowed.add(k));
    }

    // 2. Special access grants
    const grants: SpecialAccessGrant[] =
      (user as UserAccount).specialAccessGrants ||
      (user as UserSession).specialAccessGrants ||
      [];

    const now = new Date();
    for (const grant of grants) {
      // Check expiration if present
      if (grant.expiresAt) {
        const exp = new Date(grant.expiresAt);
        if (exp < now) continue;
      }

      if (grant.reportKey) {
        allowed.add(grant.reportKey);
      }
      if (grant.department) {
        const extReports = getReportsForDepartment(grant.department);
        extReports.forEach((k) => allowed.add(k));
      }
    }

    return Array.from(allowed);
  }

  /**
   * Verifies if a Maker is authorized to create/fill/submit a specific report.
   */
  public canMakerAccessReport(user: UserAccount | UserSession, reportKey: string): boolean {
    if (user.role !== 'MAKER' && user.role !== 'ADMIN') return false;
    const allowed = this.getAllowedReportKeysForUser(user);
    return allowed.includes(reportKey);
  }

  /**
   * Verifies if a Checker can review a submission:
   * Rule: Maker and Checker must be from the same department,
   * OR the Checker has been granted special cross-department access by the Admin.
   */
  public canCheckerReviewSubmission(
    user: UserAccount | UserSession,
    submission: {
      department?: string;
      makerDepartment?: string;
      reportKey: string;
    }
  ): { allowed: boolean; reason?: string } {
    if (user.role === 'ADMIN') {
      // Admin has oversight view but should not apply review changes directly
      return { allowed: false, reason: 'Administrator has read-only compliance oversight. Review sign-off must be performed by an authorized Checker.' };
    }

    if (user.role !== 'CHECKER') {
      return { allowed: false, reason: 'Only registered Checkers can perform 4-eyes reviews.' };
    }

    // Rule: Segregation of Duties - Maker cannot review or approve their own submission
    if ((submission as any).makerId && user.id === (submission as any).makerId) {
      return {
        allowed: false,
        reason: 'Segregation of duties violation: The Maker who created this submission cannot review or sign off on it as Checker.',
      };
    }

    const subDept = submission.department || submission.makerDepartment || getDepartmentForReport(submission.reportKey);
    const userDept = user.department;

    // Rule 1: Same Department Check
    if (userDept && subDept && userDept.trim().toLowerCase() === subDept.trim().toLowerCase()) {
      return { allowed: true };
    }

    // Rule 2: Special Access Check
    const grants: SpecialAccessGrant[] =
      (user as UserAccount).specialAccessGrants ||
      (user as UserSession).specialAccessGrants ||
      [];

    const now = new Date();
    for (const grant of grants) {
      if (grant.expiresAt && new Date(grant.expiresAt) < now) continue;

      if (grant.reportKey && grant.reportKey === submission.reportKey) {
        return { allowed: true, reason: `Special Access granted by Admin: ${grant.reason}` };
      }
      if (grant.department && grant.department.toLowerCase() === subDept.toLowerCase()) {
        return { allowed: true, reason: `Cross-department review permission granted: ${grant.reason}` };
      }
    }

    return {
      allowed: false,
      reason: `Checker department (${userDept || 'Unassigned'}) does not match return department (${subDept}). Cross-department review requires Administrator authorization.`,
    };
  }
}

export const userService = new UserServiceClass();
