// ============================================
// AUTH TYPES - Matching Backend DTOs
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  roleId?: string;
  department: UserDepartment;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  uuid: string;
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

export interface RoleInfo {
  name: string;
  permissions: Permission[];
  isActive: boolean;
  level: number;
}

// ============================================
// ENUMS - Matching Backend
// ============================================

export enum UserRole {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export enum UserDepartment {
  ENGINEERING = 'Engineering',
  MARKETING = 'Marketing',
  SALES = 'Sales',
  HR = 'HR',
  FINANCE = 'Finance',
  OPERATIONS = 'Operations',
  PRODUCT = 'Product',
  SUPPORT = 'Support',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_LIST = 'user:list',

  // Role Management
  ROLE_CREATE = 'role:create',
  ROLE_READ = 'role:read',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',
  ROLE_LIST = 'role:list',

  // Audit Logs
  AUDIT_READ = 'audit:read',
  AUDIT_LIST = 'audit:list',

  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',

  // Dashboard Access
  DASHBOARD_ADMIN = 'dashboard:admin',
  DASHBOARD_MANAGER = 'dashboard:manager',
  DASHBOARD_USER = 'dashboard:user',
}
