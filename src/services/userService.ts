/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
        department: 'Compliance & Regulatory Governance',
        employeeId: 'OB-ADM-001',
        phoneNumber: '+251 91 123 4567',
        createdAt: '2026-01-10T08:00:00Z',
        approvedAt: '2026-01-10T08:00:00Z',
        approvedBy: 'National Bank of Ethiopia / OB Board',
      },
      {
        id: 'usr_maker_1',
        name: 'Abebe Kebede',
        email: 'abebe.kebede@oromiabank.com',
        password: 'password',
        role: 'MAKER',
        status: 'ACTIVE',
        institutionCode: '0000013',
        department: 'Credit Operations & Portfolio',
        employeeId: 'OB-MKR-104',
        phoneNumber: '+251 91 234 5678',
        createdAt: '2026-02-01T09:00:00Z',
        approvedAt: '2026-02-02T10:00:00Z',
        approvedBy: 'Dawit Bekele (ADMIN)',
      },
      {
        id: 'usr_maker_2',
        name: 'Tigist Alemu',
        email: 'tigist.alemu@oromiabank.com',
        password: 'password',
        role: 'MAKER',
        status: 'ACTIVE',
        institutionCode: '0000013',
        department: 'Off-Balance Sheet & Trade Finance',
        employeeId: 'OB-MKR-219',
        phoneNumber: '+251 91 345 6789',
        createdAt: '2026-02-15T11:00:00Z',
        approvedAt: '2026-02-16T14:30:00Z',
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
        department: 'Internal Audit & Regulatory Control',
        employeeId: 'OB-CHK-055',
        phoneNumber: '+251 91 456 7890',
        createdAt: '2026-01-15T08:30:00Z',
        approvedAt: '2026-01-16T09:15:00Z',
        approvedBy: 'Dawit Bekele (ADMIN)',
      },
      {
        id: 'usr_pending_1',
        name: 'Lemlem Tadesse',
        email: 'lemlem.tadesse@oromiabank.com',
        password: 'password',
        role: 'MAKER',
        status: 'PENDING_APPROVAL',
        institutionCode: '0000013',
        department: 'Financial Risk Management',
        employeeId: 'OB-MKR-388',
        phoneNumber: '+251 91 567 8901',
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
        department: 'Risk & Prudential Compliance',
        employeeId: 'OB-CHK-092',
        phoneNumber: '+251 91 678 9012',
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
      return { success: false, message: 'Role must be either MAKER or CHECKER.' };
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
      status: 'PENDING_APPROVAL', // Requires Administrator authorization per banking regulation
      institutionCode: '0000013',
      department: data.department || 'Regulatory Operations',
      employeeId: data.employeeId || `OB-${Math.floor(100 + Math.random() * 900)}`,
      phoneNumber: data.phoneNumber || '',
      createdAt: new Date().toISOString(),
    };

    this.users.set(newId, newUser);
    const { password, ...safe } = newUser;
    return {
      success: true,
      user: safe as UserAccount,
      message: 'Registration submitted successfully. Your account is pending Administrator review and authorization.',
    };
  }

  public login(email: string, password?: string): {
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
}

export const userService = new UserServiceClass();
