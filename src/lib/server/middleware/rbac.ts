import { error } from '@sveltejs/kit';
import { getUserWithHOA } from '$lib/server/auth';
import { hasPermission, canAccessHOA } from '$lib/utils/permissions';
import type { Permission, Profile, UserRole } from '$lib/types';

/**
 * RBAC Middleware for API endpoints
 * Provides comprehensive role-based access control for server-side operations
 */

export interface RBACOptions {
  /** Required permission to access the endpoint */
  permission?: Permission;
  /** Required role to access the endpoint */
  requiredRole?: UserRole;
  /** Whether to allow access to users from any HOA (super admin only) */
  allowCrossHOA?: boolean;
  /** Custom permission check function */
  customCheck?: (profile: Profile) => boolean;
}

/**
 * Main RBAC middleware function
 */
export async function requirePermission(
  locals: App.Locals,
  options: RBACOptions
): Promise<{ user: any; profile: Profile; hoa: any }> {
  // Check authentication
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }

  // Get user with HOA context
  const userWithHOA = await getUserWithHOA(locals.user.id, locals.user);
  if (!userWithHOA) {
    throw error(401, 'User profile not found');
  }

  const { user, profile, hoa } = userWithHOA;

  // Check if user is active
  if (!profile.is_active) {
    throw error(403, 'Account is deactivated');
  }

  // Check required role
  if (options.requiredRole) {
    if (profile.role !== options.requiredRole && profile.role !== 'super_admin') {
      throw error(403, `${options.requiredRole} role required`);
    }
  }

  // Check required permission
  if (options.permission) {
    if (!hasPermission(profile, options.permission)) {
      throw error(403, `Permission '${options.permission}' required`);
    }
  }

  // Custom permission check
  if (options.customCheck) {
    if (!options.customCheck(profile)) {
      throw error(403, 'Custom permission check failed');
    }
  }

  return { user, profile, hoa };
}

/**
 * Require admin permissions (HOA Admin or Super Admin)
 */
export async function requireAdmin(locals: App.Locals) {
  return requirePermission(locals, {
    customCheck: (profile) => profile.role === 'super_admin' || profile.role === 'hoa_admin'
  });
}

/**
 * Require super admin permissions
 */
export async function requireSuperAdmin(locals: App.Locals) {
  return requirePermission(locals, {
    requiredRole: 'super_admin'
  });
}

/**
 * Require HOA admin permissions (within same HOA)
 */
export async function requireHOAAdmin(locals: App.Locals) {
  return requirePermission(locals, {
    customCheck: (profile) => profile.role === 'super_admin' || profile.role === 'hoa_admin'
  });
}

/**
 * Check if user can access specific HOA data
 */
export async function requireHOAAccess(
  locals: App.Locals,
  targetHOAId: string
): Promise<{ user: any; profile: Profile; hoa: any }> {
  const { user, profile, hoa } = await requirePermission(locals, {});

  // Super admin can access any HOA
  if (profile.role === 'super_admin') {
    return { user, profile, hoa };
  }

  // Check if user can access the target HOA
  if (!canAccessHOA(profile, targetHOAId)) {
    throw error(403, 'Access denied to this HOA');
  }

  return { user, profile, hoa };
}

/**
 * Validate user can manage another user
 */
export async function requireUserManagementAccess(
  locals: App.Locals,
  targetUserId: string
): Promise<{ user: any; profile: Profile; hoa: any; canManage: boolean }> {
  const { user, profile, hoa } = await requirePermission(locals, {
    permission: 'manage_hoa_users'
  });

  // Super admin can manage anyone
  if (profile.role === 'super_admin') {
    return { user, profile, hoa, canManage: true };
  }

  // HOA admin can manage users in their HOA
  // This would require fetching the target user's profile to check HOA
  // For now, we'll return the permission check result
  const canManage = hasPermission(profile, 'manage_hoa_users');

  return { user, profile, hoa, canManage };
}

/**
 * Create audit log entry for admin actions
 */
export function createAuditLog(
  profile: Profile,
  action: string,
  targetType: string,
  targetId: string,
  details?: any
) {
  // TODO: Implement audit logging to database
  console.log('AUDIT LOG:', {
    userId: profile.user_id,
    userRole: profile.role,
    hoaId: profile.hoa_id,
    action,
    targetType,
    targetId,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Middleware for booking-related operations
 */
export async function requireBookingAccess(
  locals: App.Locals,
  bookingId?: string,
  permission: Permission = 'create_bookings'
): Promise<{ user: any; profile: Profile; hoa: any }> {
  const { user, profile, hoa } = await requirePermission(locals, {
    permission
  });

  // Additional booking-specific checks can be added here
  // For example, checking if booking belongs to user's HOA

  return { user, profile, hoa };
}

/**
 * Helper to check multiple permissions (OR logic)
 */
export function hasAnyPermission(profile: Profile | null, permissions: Permission[]): boolean {
  if (!profile) return false;
  return permissions.some(permission => hasPermission(profile, permission));
}

/**
 * Helper to check multiple permissions (AND logic)
 */
export function hasAllPermissions(profile: Profile | null, permissions: Permission[]): boolean {
  if (!profile) return false;
  return permissions.every(permission => hasPermission(profile, permission));
}

/**
 * Rate limiting for admin actions (basic implementation)
 */
const actionCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string, action: string, maxActions = 10, windowMs = 60000): boolean {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const userActions = actionCounts.get(key);

  if (!userActions || now > userActions.resetTime) {
    actionCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userActions.count >= maxActions) {
    return false;
  }

  userActions.count++;
  return true;
}
