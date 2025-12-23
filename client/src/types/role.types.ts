// ============================================
// ROLE MANAGEMENT TYPES
// ============================================

import { Permission } from './auth.types';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
  level: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateRoleDto {
  name: string;
  description: string;
  permissions: Permission[];
  isActive?: boolean;
  level: number;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: Permission[];
  isActive?: boolean;
  level?: number;
}

export interface RoleListItem {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
  level: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}
