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

  // Organization Management
  ORGANIZATION_CREATE = 'organization:create',
  ORGANIZATION_READ = 'organization:read',
  ORGANIZATION_UPDATE = 'organization:update',
  ORGANIZATION_DELETE = 'organization:delete',
  ORGANIZATION_LIST = 'organization:list',
  ORGANIZATION_MANAGE_USERS = 'organization:manage_users',

  // Project Management
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  PROJECT_LIST = 'project:list',
  PROJECT_MANAGE_USERS = 'project:manage_users',

  // Task Management
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_LIST = 'task:list',
  TASK_ASSIGN = 'task:assign',
}
