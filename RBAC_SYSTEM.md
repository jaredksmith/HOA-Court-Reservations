# Role-Based Access Control (RBAC) System

## Overview

The HOA Court Reservations application implements a comprehensive three-tier role-based access control system that ensures proper data isolation and permission management across multiple HOAs.

## Role Hierarchy

### 1. Super Admin (`super_admin`)
- **System-wide access**: Can manage all HOAs and users across the entire system
- **Highest privilege level**: Can perform any action in the system
- **Cross-HOA access**: Can view and manage data from any HOA
- **User management**: Can create, modify, and deactivate any user
- **HOA management**: Can create, configure, and manage HOAs

### 2. HOA Admin (`hoa_admin`)
- **HOA-scoped access**: Can manage users and settings within their assigned HOA
- **Administrative privileges**: Can perform admin functions within their HOA
- **User management**: Can invite, activate, deactivate, and manage roles for users in their HOA
- **Booking management**: Can view, approve, and manage all bookings within their HOA
- **Settings management**: Can configure HOA-specific settings

### 3. Member (`member`)
- **Basic user access**: Can use core application features
- **Self-management**: Can manage their own profile and bookings
- **Booking creation**: Can create and manage their own court reservations
- **Limited visibility**: Can only see data relevant to their HOA and their own activities

## Permission System

### System-Level Permissions (Super Admin Only)
- `manage_hoas` - Create, update, delete HOAs
- `view_all_hoas` - View all HOAs in system
- `manage_system_users` - Manage users across all HOAs
- `view_system_reports` - View system-wide analytics
- `manage_system_settings` - Configure system-wide settings

### HOA-Level Permissions (HOA Admin + Super Admin)
- `manage_hoa_settings` - Update HOA configuration
- `manage_hoa_users` - Invite, activate, deactivate users
- `assign_user_roles` - Change user roles within HOA
- `view_hoa_reports` - View HOA analytics and reports
- `manage_hoa_courts` - Configure court settings
- `manage_hoa_hours` - Manage user hour allocations
- `reset_user_hours` - Reset user hour allocations
- `manage_all_bookings` - Edit/cancel any booking in HOA
- `view_all_bookings` - View all bookings in HOA
- `approve_bookings` - Approve pending bookings
- `view_hoa_members` - View member list
- `invite_members` - Send member invitations
- `deactivate_members` - Deactivate member accounts
- `view_member_details` - View detailed member information

### Basic Permissions (All Authenticated Users)
- `create_bookings` - Create new bookings
- `manage_own_bookings` - Edit/cancel own bookings
- `manage_own_profile` - Edit own profile
- `view_own_profile` - View own profile

## Database Security

### Row Level Security (RLS) Policies

The system uses Supabase RLS policies to enforce data isolation at the database level:

#### HOAs Table
- Super admins can manage all HOAs
- Users can view their own HOA only

#### Profiles Table
- Users can view profiles in their HOA
- Users can update their own profile
- HOA admins can manage profiles in their HOA
- Super admins can manage all profiles

#### Bookings Table
- Users can view bookings in their HOA
- Users can create bookings in their HOA
- Users can update their own bookings
- HOA admins can manage all bookings in their HOA

#### Helper Functions
- `get_user_hoa_id(user_uuid)` - Returns user's HOA ID
- `is_super_admin(user_uuid)` - Checks if user is super admin
- `is_hoa_admin(user_uuid)` - Checks if user is HOA admin or super admin

## Frontend Implementation

### Route Protection

#### Server-Side Protection
```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ locals }) => {
  const { user, profile, hoa } = await requirePermission(locals, {
    permission: 'manage_hoa_users'
  });
  
  return { auth: { user, profile, hoa } };
};
```

#### Client-Side Protection
```svelte
<!-- Using PermissionGuard component -->
<PermissionGuard {profile} permission="manage_hoa_users">
  <button>Manage Users</button>
</PermissionGuard>

<!-- Multiple permissions (OR logic) -->
<PermissionGuard {profile} anyPermissions={['manage_hoa_users', 'view_hoa_members']}>
  <div>User management section</div>
</PermissionGuard>

<!-- Role-based check -->
<PermissionGuard {profile} role="super_admin">
  <div>Super admin only content</div>
</PermissionGuard>
```

### Navigation Menu
The admin navigation menu dynamically shows/hides items based on user permissions:

```svelte
{#if hasPermission(profile, 'view_hoa_members')}
  <a href="/admin/users">Users</a>
{/if}
```

## API Security

### Middleware Protection

All admin API endpoints use RBAC middleware for protection:

```typescript
// API endpoint protection
export const GET: RequestHandler = async ({ locals }) => {
  const { profile } = await requirePermission(locals, {
    permission: 'view_hoa_members'
  });
  
  // API logic here
};
```

### Rate Limiting

Admin actions are rate-limited to prevent abuse:
- User creation: 5 users per 5 minutes
- User updates: 10 updates per 5 minutes
- Bulk operations: 3 operations per 5 minutes
- User deactivation: 5 deactivations per 5 minutes

### Audit Logging

All admin actions are logged for security and compliance:

```typescript
createAuditLog(
  profile,
  'CREATE_USER',
  'user',
  newUserId,
  { email, role, hoa_id }
);
```

## Usage Examples

### Checking Permissions in Code

```typescript
import { hasPermission, canManageUser } from '$lib/utils/permissions';

// Check single permission
if (hasPermission(profile, 'manage_hoa_users')) {
  // Show user management UI
}

// Check if user can manage another user
if (canManageUser(currentProfile, targetProfile)) {
  // Allow user management actions
}

// Check multiple permissions (OR logic)
if (hasAnyPermission(profile, ['manage_hoa_users', 'view_hoa_members'])) {
  // Show user-related features
}
```

### Role Assignment

```typescript
import { canAssignRole, getAssignableRoles } from '$lib/utils/permissions';

// Get roles current user can assign
const assignableRoles = getAssignableRoles(profile);

// Check if user can assign specific role
if (canAssignRole(profile, 'hoa_admin')) {
  // Allow role assignment
}
```

## Security Considerations

### Data Isolation
- **HOA Scoping**: All data access is scoped to the user's HOA (except super admins)
- **RLS Enforcement**: Database-level security prevents unauthorized data access
- **API Validation**: Server-side validation ensures proper permission checks

### Role Hierarchy
- **Inheritance**: Higher roles inherit permissions from lower roles
- **Escalation Prevention**: Users cannot assign roles higher than their own
- **Self-Protection**: Users cannot deactivate themselves

### Session Management
- **Token Validation**: All requests validate session tokens
- **Automatic Logout**: Invalid sessions redirect to login
- **Secure Cookies**: Session cookies use secure, httpOnly flags

## Testing

The RBAC system includes comprehensive tests covering:
- Permission validation for all roles
- User management capabilities
- HOA access controls
- Role assignment validation
- Edge cases and error handling

Run tests with:
```bash
npm run test src/lib/tests/rbac.test.ts
```

## Deployment Considerations

### Environment Variables
Ensure proper Supabase configuration:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin operations)

### Database Setup
1. Run the main database setup script: `database-setup.sql`
2. Verify RLS policies are enabled
3. Test helper functions work correctly
4. Validate sample data access

### Monitoring
- Monitor audit logs for suspicious activity
- Track failed permission checks
- Review rate limiting effectiveness
- Validate data isolation between HOAs

## Future Enhancements

### Planned Features
- **Granular Permissions**: More specific permission controls
- **Temporary Roles**: Time-limited role assignments
- **Permission Groups**: Grouping permissions for easier management
- **Advanced Audit**: Enhanced logging and reporting
- **API Keys**: Service-to-service authentication

### Scalability
- **Caching**: Permission caching for improved performance
- **Batch Operations**: Optimized bulk user operations
- **Background Jobs**: Async processing for large operations
