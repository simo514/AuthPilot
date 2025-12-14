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
