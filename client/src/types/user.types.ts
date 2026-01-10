// ============================================
// USER MANAGEMENT TYPES
// ============================================

import { UserDepartment, UserRole, UserStatus, RoleInfo } from './auth.types';

export interface CreateUserDto {
  organizationId?: string;
  fullName: string;
  email: string;
  password: string;
  roleId?: string;
  managerId: string;
  department: UserDepartment;
}

export interface UpdateUserDto {
  organizationId?: string;
  fullName?: string;
  email?: string;
  roleId?: string;
  department?: UserDepartment;
  managerId?: string;
  status?: UserStatus;
}

export interface UserListItem {
  uuid: string;
  organizationId: string | null;
  email: string;
  fullName: string;
  roleId: RoleInfo;
  role: UserRole;
  department: UserDepartment;
  status: UserStatus;
  lastLoginAt: Date | string;
  emailVerifiedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserFilters {
  role?: UserRole;
  department?: UserDepartment;
  status?: UserStatus;
  search?: string;
}

export interface PaginatedUsers {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
}
