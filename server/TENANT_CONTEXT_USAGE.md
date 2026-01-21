# Tenant Context Service Usage Guide

## Overview
The `TenantContextService` provides automatic multi-tenancy support by storing and managing organization context per HTTP request. It ensures data isolation between different organizations.

## How It Works

### 1. Automatic Context Setting
The `TenantContextInterceptor` automatically extracts the `organizationId` from the authenticated user's JWT token and sets it in the tenant context for each request.

```typescript
// Interceptor automatically runs on every request
if (user && user.organizationId) {
  this.tenantContext.setOrganizationId(user.organizationId.toString());
}
```

### 2. Using in Services
Services can inject `TenantContextService` to filter queries by organization:

```typescript
import { TenantContextService } from '../organizations/tenant-context.service';

@Injectable()
export class YourService {
  constructor(
    private readonly tenantContext: TenantContextService,
    @InjectModel(YourModel.name) private yourModel: Model<YourDocument>,
  ) {}

  async findAll() {
    const filter: any = {};
    
    // Automatically filter by organization
    const organizationId = this.tenantContext.getOrganizationId();
    if (organizationId) {
      filter.organizationId = organizationId;
    }
    
    return this.yourModel.find(filter).exec();
  }
}
```

## Already Integrated

### UsersService
The `getAllUsers` method now automatically filters users by organization:

```typescript
// Users are automatically scoped to their organization
GET /users -> Returns only users from the authenticated user's organization
```

### RolesService
The `getRoles` method filters roles by organization:

```typescript
// Roles are automatically scoped to their organization
GET /roles -> Returns only roles from the authenticated user's organization
```

## Adding to New Services

To add tenant context to a new service:

1. **Import OrganizationsModule** in your module:
```typescript
@Module({
  imports: [
    // ... other imports
    OrganizationsModule, // Provides TenantContextService
  ],
  // ...
})
```

2. **Inject TenantContextService** in your service:
```typescript
constructor(
  private readonly tenantContext: TenantContextService,
  // ... other dependencies
) {}
```

3. **Use in queries**:
```typescript
async findAll() {
  const filter: any = {};
  
  const organizationId = this.tenantContext.getOrganizationId();
  if (organizationId) {
    filter.organizationId = organizationId;
  }
  
  return this.model.find(filter).exec();
}
```

## API Methods

### `setOrganizationId(organizationId: string | null)`
Set the organization ID for the current request (automatically done by interceptor).

### `getOrganizationId(): string | null`
Get the current organization ID.

### `hasOrganization(): boolean`
Check if an organization context is set.

### `clear(): void`
Clear the organization context (rarely needed).

## Benefits

✅ **Automatic**: No need to pass organization ID through every function  
✅ **Secure**: Request-scoped, prevents data leakage between requests  
✅ **Clean**: Services don't need organization parameters  
✅ **Consistent**: All services filter data the same way  

## Example Flow

```
1. User logs in → JWT includes organizationId
2. Request arrives with JWT token
3. TenantContextInterceptor extracts organizationId from user
4. organizationId stored in request-scoped TenantContextService
5. Any service can access organizationId via tenantContext.getOrganizationId()
6. Services filter database queries by organizationId
7. Request completes, context is destroyed
```

## Important Notes

- The service is **request-scoped**: Each HTTP request gets its own instance
- Organization ID comes from the authenticated user's JWT token
- If no organization ID is set, queries return all data (useful for super admins)
- Always check if organizationId exists before filtering
