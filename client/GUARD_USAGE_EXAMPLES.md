# Role & Permission Guards - Usage Examples

## Components Created

1. **RoleGuard** - Restricts access based on user roles
2. **PermissionGuard** - Restricts access based on user permissions
3. **usePermissions** - Hook for programmatic permission checks

---

## 1. RoleGuard Usage

### Protect Entire Routes
```tsx
import { RoleGuard } from './components/Auth/RoleGuard';
import { UserRole } from './types/auth.types';

// In App.tsx or your router
<Route
  path="/admin"
  element={
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <AdminDashboard />
    </RoleGuard>
  }
/>

// Allow multiple roles
<Route
  path="/management"
  element={
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <ManagementPanel />
    </RoleGuard>
  }
/>
```

### Protect Components Within a Page
```tsx
import { RoleGuard } from '../components/Auth/RoleGuard';
import { UserRole } from '../types/auth.types';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Only admins can see this section */}
      <RoleGuard allowedRoles={[UserRole.ADMIN]}>
        <AdminControls />
      </RoleGuard>
      
      {/* Admins and managers can see this */}
      <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
        <ManagementReports />
      </RoleGuard>
    </div>
  );
}
```

### With Custom Fallback
```tsx
<RoleGuard 
  allowedRoles={[UserRole.ADMIN]}
  fallback={
    <div className="p-4 bg-red-100 text-red-700 rounded">
      Access denied. Admin role required.
    </div>
  }
>
  <AdminPanel />
</RoleGuard>
```

### With Custom Redirect
```tsx
<RoleGuard 
  allowedRoles={[UserRole.MANAGER]}
  redirectTo="/unauthorized"
>
  <ManagerTools />
</RoleGuard>
```

---

## 2. PermissionGuard Usage

### Protect Based on Single Permission
```tsx
import { PermissionGuard } from './components/Auth/PermissionGuard';
import { Permission } from './types/auth.types';

<PermissionGuard requiredPermissions={[Permission.USER_CREATE]}>
  <button>Create User</button>
</PermissionGuard>
```

### Require ALL Permissions (AND logic)
```tsx
// User must have BOTH permissions
<PermissionGuard 
  requiredPermissions={[Permission.USER_UPDATE, Permission.USER_DELETE]}
  requireAll={true}
>
  <UserManagementPanel />
</PermissionGuard>
```

### Require ANY Permission (OR logic)
```tsx
// User needs at least ONE of these permissions
<PermissionGuard 
  requiredPermissions={[Permission.USER_READ, Permission.USER_LIST]}
  requireAll={false}
>
  <UserList />
</PermissionGuard>
```

### Protect Specific Buttons/Actions
```tsx
function UserManagement() {
  return (
    <div>
      <h2>Users</h2>
      <UserList />
      
      <div className="actions">
        <PermissionGuard requiredPermissions={[Permission.USER_CREATE]}>
          <button onClick={handleCreate}>Create User</button>
        </PermissionGuard>
        
        <PermissionGuard requiredPermissions={[Permission.USER_UPDATE]}>
          <button onClick={handleEdit}>Edit User</button>
        </PermissionGuard>
        
        <PermissionGuard requiredPermissions={[Permission.USER_DELETE]}>
          <button onClick={handleDelete}>Delete User</button>
        </PermissionGuard>
      </div>
    </div>
  );
}
```

### With Custom Fallback Message
```tsx
<PermissionGuard 
  requiredPermissions={[Permission.ROLE_CREATE]}
  fallback={
    <div className="text-gray-500 italic">
      You don't have permission to create roles
    </div>
  }
>
  <CreateRoleButton />
</PermissionGuard>
```

### Protect Routes
```tsx
<Route
  path="/roles"
  element={
    <PermissionGuard 
      requiredPermissions={[Permission.ROLE_READ, Permission.ROLE_LIST]}
      requireAll={false}
    >
      <RoleManagement />
    </PermissionGuard>
  }
/>
```

---

## 3. usePermissions Hook Usage

### Programmatic Permission Checks
```tsx
import { usePermissions } from '../hooks/usePermissions';
import { Permission, UserRole } from '../types/auth.types';

function MyComponent() {
  const { 
    hasPermission, 
    hasRole, 
    hasAnyPermission, 
    hasAllPermissions 
  } = usePermissions();

  // Check single permission
  const canCreateUser = hasPermission(Permission.USER_CREATE);
  
  // Check role
  const isAdmin = hasRole(UserRole.ADMIN);
  
  // Check if user has ANY of these permissions
  const canViewUsers = hasAnyPermission([
    Permission.USER_READ,
    Permission.USER_LIST
  ]);
  
  // Check if user has ALL of these permissions
  const canManageUsers = hasAllPermissions([
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE
  ]);

  return (
    <div>
      {canCreateUser && <button>Create User</button>}
      {isAdmin && <AdminBadge />}
      {canViewUsers && <UserList />}
      {canManageUsers && <AdvancedUserTools />}
    </div>
  );
}
```

### Conditional Rendering
```tsx
function Dashboard() {
  const { hasPermission, hasRole } = usePermissions();

  return (
    <div>
      {hasRole(UserRole.ADMIN) && <AdminDashboard />}
      {hasRole(UserRole.MANAGER) && <ManagerDashboard />}
      {hasRole(UserRole.USER) && <UserDashboard />}
      
      {hasPermission(Permission.AUDIT_READ) && (
        <AuditLogsWidget />
      )}
    </div>
  );
}
```

### Conditional Logic in Functions
```tsx
function UserTable() {
  const { hasPermission } = usePermissions();

  const handleRowClick = (user) => {
    if (hasPermission(Permission.USER_UPDATE)) {
      navigateToEdit(user);
    } else {
      showPermissionDeniedMessage();
    }
  };

  const showDeleteButton = hasPermission(Permission.USER_DELETE);

  return (
    <table>
      {users.map(user => (
        <tr key={user.id} onClick={() => handleRowClick(user)}>
          <td>{user.name}</td>
          {showDeleteButton && (
            <td>
              <button onClick={() => handleDelete(user)}>Delete</button>
            </td>
          )}
        </tr>
      ))}
    </table>
  );
}
```

---

## 4. Combining RoleGuard and PermissionGuard

### Nested Guards
```tsx
// First check role, then check permission
<RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
  <PermissionGuard requiredPermissions={[Permission.USER_DELETE]}>
    <button className="btn-danger">Delete All Users</button>
  </PermissionGuard>
</RoleGuard>
```

### Multiple Guards in Same Component
```tsx
function AdminPanel() {
  return (
    <div>
      <RoleGuard allowedRoles={[UserRole.ADMIN]}>
        <SystemSettings />
      </RoleGuard>
      
      <PermissionGuard requiredPermissions={[Permission.AUDIT_READ]}>
        <AuditLogs />
      </PermissionGuard>
      
      <PermissionGuard requiredPermissions={[Permission.ROLE_CREATE]}>
        <CreateRoleForm />
      </PermissionGuard>
    </div>
  );
}
```

---

## 5. Real-World Examples

### Complete Route Protection
```tsx
// App.tsx
import { RoleGuard } from './components/Auth/RoleGuard';
import { PermissionGuard } from './components/Auth/PermissionGuard';
import { UserRole, Permission } from './types/auth.types';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<AuthPage />} />
      
      {/* Protected by authentication only */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
      
      {/* Protected by role */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      
      {/* Protected by permission */}
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <PermissionGuard 
              requiredPermissions={[Permission.USER_LIST]}
            >
              <UserManagement />
            </PermissionGuard>
          </ProtectedRoute>
        }
      />
      
      {/* Protected by multiple permissions */}
      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            <PermissionGuard 
              requiredPermissions={[
                Permission.ROLE_READ, 
                Permission.ROLE_LIST
              ]}
              requireAll={false}
            >
              <RoleManagement />
            </PermissionGuard>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### Settings Page with Mixed Protection
```tsx
function Settings() {
  const { hasPermission, hasRole } = usePermissions();

  return (
    <div className="settings">
      <h1>Settings</h1>
      
      {/* Everyone can see this */}
      <section>
        <h2>Profile Settings</h2>
        <ProfileForm />
      </section>
      
      {/* Only users with permission */}
      <PermissionGuard requiredPermissions={[Permission.SETTINGS_UPDATE]}>
        <section>
          <h2>Application Settings</h2>
          <AppSettingsForm />
        </section>
      </PermissionGuard>
      
      {/* Only admins */}
      <RoleGuard allowedRoles={[UserRole.ADMIN]}>
        <section>
          <h2>System Configuration</h2>
          <SystemConfigForm />
        </section>
      </RoleGuard>
      
      {/* Conditional rendering */}
      {hasRole(UserRole.ADMIN) && (
        <section>
          <h2>Danger Zone</h2>
          <button className="btn-danger">Reset System</button>
        </section>
      )}
    </div>
  );
}
```

### User Management with Fine-Grained Control
```tsx
function UserManagement() {
  const { hasPermission } = usePermissions();

  return (
    <div>
      <div className="header">
        <h1>User Management</h1>
        
        <PermissionGuard requiredPermissions={[Permission.USER_CREATE]}>
          <button className="btn-primary">
            Create New User
          </button>
        </PermissionGuard>
      </div>
      
      <PermissionGuard 
        requiredPermissions={[Permission.USER_LIST]}
        fallback={<div>You don't have permission to view users</div>}
      >
        <UserTable 
          showEditButton={hasPermission(Permission.USER_UPDATE)}
          showDeleteButton={hasPermission(Permission.USER_DELETE)}
        />
      </PermissionGuard>
    </div>
  );
}
```

---

## Key Concepts

### RoleGuard
- ✅ Use when access depends on user's **role** (ADMIN, MANAGER, USER)
- ✅ Simpler, broader access control
- ✅ Good for major sections/features

### PermissionGuard
- ✅ Use when access depends on specific **permissions**
- ✅ Fine-grained control
- ✅ Good for specific actions (create, edit, delete)
- ✅ Supports AND/OR logic with `requireAll` prop

### usePermissions Hook
- ✅ Use for **programmatic checks** in component logic
- ✅ Conditional rendering without extra component nesting
- ✅ Dynamic behavior based on permissions

---

## Best Practices

1. **Use ProtectedRoute first** - Always wrap in ProtectedRoute to ensure authentication
2. **Choose the right tool** - Role for broad access, Permission for specific actions
3. **Provide fallbacks** - Show helpful messages instead of just hiding content
4. **Combine when needed** - Can nest guards for complex requirements
5. **Use the hook** - For conditional logic without extra DOM nesting
6. **Be consistent** - Use same pattern across your app
