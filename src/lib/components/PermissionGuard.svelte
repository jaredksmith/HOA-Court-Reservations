<script lang="ts">
  import { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isSuperAdmin } from '$lib/utils/permissions';
  import type { Permission, Profile, UserRole } from '$lib/types';

  /**
   * PermissionGuard Component
   * 
   * Conditionally renders content based on user permissions and roles.
   * Provides a declarative way to handle role-based UI visibility.
   * 
   * Usage examples:
   * 
   * <!-- Single permission check -->
   * <PermissionGuard {profile} permission="manage_hoa_users">
   *   <button>Manage Users</button>
   * </PermissionGuard>
   * 
   * <!-- Multiple permissions (OR logic) -->
   * <PermissionGuard {profile} anyPermissions={['manage_hoa_users', 'view_hoa_members']}>
   *   <div>User management section</div>
   * </PermissionGuard>
   * 
   * <!-- Multiple permissions (AND logic) -->
   * <PermissionGuard {profile} allPermissions={['manage_hoa_users', 'manage_hoa_settings']}>
   *   <div>Full admin section</div>
   * </PermissionGuard>
   * 
   * <!-- Role-based check -->
   * <PermissionGuard {profile} role="super_admin">
   *   <div>Super admin only content</div>
   * </PermissionGuard>
   * 
   * <!-- Admin check (HOA admin or super admin) -->
   * <PermissionGuard {profile} requireAdmin>
   *   <div>Admin content</div>
   * </PermissionGuard>
   * 
   * <!-- Custom check function -->
   * <PermissionGuard {profile} customCheck={(p) => p.hoa_id === specificHOAId}>
   *   <div>HOA-specific content</div>
   * </PermissionGuard>
   * 
   * <!-- Fallback content when permission is denied -->
   * <PermissionGuard {profile} permission="manage_hoa_users">
   *   <button>Manage Users</button>
   *   <div slot="fallback">
   *     <p>You don't have permission to manage users.</p>
   *   </div>
   * </PermissionGuard>
   */

  // Props
  export let profile: Profile | null = null;
  
  // Permission checks (use only one of these)
  export let permission: Permission | undefined = undefined;
  export let anyPermissions: Permission[] | undefined = undefined;
  export let allPermissions: Permission[] | undefined = undefined;
  
  // Role checks
  export let role: UserRole | undefined = undefined;
  export let requireAdmin = false;
  export let requireSuperAdmin = false;
  
  // Custom check function
  export let customCheck: ((profile: Profile) => boolean) | undefined = undefined;
  
  // Behavior options
  export let requireActive = true; // Require user to be active
  export let showFallback = true; // Whether to show fallback slot when access denied
  
  // Computed access check
  $: hasAccess = checkAccess(profile);
  
  function checkAccess(userProfile: Profile | null): boolean {
    // No profile means no access
    if (!userProfile) return false;
    
    // Check if user must be active
    if (requireActive && !userProfile.is_active) return false;
    
    // Role-based checks
    if (requireSuperAdmin) {
      return isSuperAdmin(userProfile);
    }
    
    if (requireAdmin) {
      return isAdmin(userProfile);
    }
    
    if (role) {
      return userProfile.role === role || userProfile.role === 'super_admin';
    }
    
    // Permission-based checks
    if (permission) {
      return hasPermission(userProfile, permission);
    }
    
    if (anyPermissions && anyPermissions.length > 0) {
      return hasAnyPermission(userProfile, anyPermissions);
    }
    
    if (allPermissions && allPermissions.length > 0) {
      return hasAllPermissions(userProfile, allPermissions);
    }
    
    // Custom check function
    if (customCheck) {
      return customCheck(userProfile);
    }
    
    // If no checks specified, default to allowing access for active users
    return userProfile.is_active;
  }
  
  // Debug mode (can be enabled via prop)
  export let debug = false;
  
  $: if (debug) {
    console.log('PermissionGuard Debug:', {
      profile: profile ? {
        id: profile.id,
        role: profile.role,
        is_active: profile.is_active,
        hoa_id: profile.hoa_id
      } : null,
      checks: {
        permission,
        anyPermissions,
        allPermissions,
        role,
        requireAdmin,
        requireSuperAdmin,
        customCheck: !!customCheck
      },
      hasAccess,
      requireActive
    });
  }
</script>

{#if hasAccess}
  <slot />
{:else if showFallback && $$slots.fallback}
  <slot name="fallback" />
{:else if showFallback && $$slots.denied}
  <slot name="denied" />
{/if}

<!-- 
Alternative usage with explicit access denied handling:

<PermissionGuard {profile} permission="manage_hoa_users" showFallback={false}>
  <button>Manage Users</button>
</PermissionGuard>

{#if !hasPermission(profile, 'manage_hoa_users')}
  <div class="access-denied">
    <p>You need admin permissions to access this feature.</p>
    <a href="/contact">Contact your HOA administrator</a>
  </div>
{/if}
-->

<style>
  /* No styles needed - this is a logic-only component */
</style>
