import type { Profile, UserRole, Permission } from '$lib/types';

/**
 * Permission management utilities for multi-tenant HOA system
 */

/**
 * Check if a user has a specific permission
 */
export function hasPermission(profile: Profile | null, permission: Permission): boolean {
  if (!profile || !profile.is_active) return false;

  const role = profile.role;

  switch (permission) {
    // System-wide permissions (Super Admin only)
    case 'manage_hoas':
    case 'view_all_hoas':
    case 'manage_system_users':
    case 'view_system_reports':
    case 'manage_system_settings':
      return role === 'super_admin';

    // HOA-level permissions (HOA Admin and Super Admin)
    case 'manage_hoa_settings':
    case 'manage_hoa_users':
    case 'assign_user_roles':
    case 'view_hoa_reports':
    case 'manage_hoa_courts':
    case 'manage_hoa_hours':
    case 'reset_user_hours':
    case 'manage_all_bookings':
    case 'view_all_bookings':
    case 'approve_bookings':
    case 'view_hoa_members':
    case 'invite_members':
    case 'deactivate_members':
    case 'view_member_details':
      return role === 'super_admin' || role === 'hoa_admin';

    // Basic user permissions (All authenticated users)
    case 'create_bookings':
    case 'manage_own_bookings':
    case 'manage_own_profile':
    case 'view_own_profile':
      return role === 'super_admin' || role === 'hoa_admin' || role === 'member';

    default:
      return false;
  }
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(profile: Profile | null): boolean {
  return profile?.role === 'super_admin';
}

/**
 * Check if user is HOA admin (includes super admin)
 */
export function isHOAAdmin(profile: Profile | null): boolean {
  return profile?.role === 'super_admin' || profile?.role === 'hoa_admin';
}

/**
 * Check if user is a regular member
 */
export function isMember(profile: Profile | null): boolean {
  return profile?.role === 'member';
}

/**
 * Check if user can manage another user
 */
export function canManageUser(currentProfile: Profile | null, targetProfile: Profile): boolean {
  if (!currentProfile) return false;

  // Super admin can manage anyone
  if (currentProfile.role === 'super_admin') return true;

  // HOA admin can manage users in their HOA (except super admins)
  if (currentProfile.role === 'hoa_admin') {
    return currentProfile.hoa_id === targetProfile.hoa_id && 
           targetProfile.role !== 'super_admin';
  }

  // Members can only manage themselves
  return currentProfile.user_id === targetProfile.user_id;
}

/**
 * Check if user can access HOA data
 */
export function canAccessHOA(profile: Profile | null, hoaId: string): boolean {
  if (!profile) return false;

  // Super admin can access any HOA
  if (profile.role === 'super_admin') return true;

  // Others can only access their own HOA
  return profile.hoa_id === hoaId;
}

/**
 * Get user's accessible HOA IDs
 */
export function getAccessibleHOAIds(profile: Profile | null): string[] {
  if (!profile) return [];

  // Super admin can access all HOAs (return empty array to indicate "all")
  if (profile.role === 'super_admin') return [];

  // Others can only access their own HOA
  return [profile.hoa_id];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Administrator';
    case 'hoa_admin':
      return 'HOA Administrator';
    case 'member':
      return 'Member';
    default:
      return 'Unknown';
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Can manage all HOAs and system settings';
    case 'hoa_admin':
      return 'Can manage users, bookings, and settings for their HOA';
    case 'member':
      return 'Can create and manage their own bookings';
    default:
      return '';
  }
}

/**
 * Get available roles for assignment
 */
export function getAssignableRoles(currentProfile: Profile | null): UserRole[] {
  if (!currentProfile) return [];

  switch (currentProfile.role) {
    case 'super_admin':
      return ['super_admin', 'hoa_admin', 'member'];
    case 'hoa_admin':
      return ['hoa_admin', 'member'];
    case 'member':
      return []; // Members can't assign roles
    default:
      return [];
  }
}

/**
 * Check if user can assign a specific role
 */
export function canAssignRole(currentProfile: Profile | null, targetRole: UserRole): boolean {
  const assignableRoles = getAssignableRoles(currentProfile);
  return assignableRoles.includes(targetRole);
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: UserRole): number {
  switch (role) {
    case 'super_admin': return 3;
    case 'hoa_admin': return 2;
    case 'member': return 1;
    default: return 0;
  }
}

/**
 * Check if current user can manage target user based on role hierarchy
 */
export function canManageUserRole(currentProfile: Profile | null, targetRole: UserRole): boolean {
  if (!currentProfile) return false;

  const currentLevel = getRoleLevel(currentProfile.role);
  const targetLevel = getRoleLevel(targetRole);

  // Can only manage users with lower or equal role level
  return currentLevel >= targetLevel;
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  const permissions: Permission[] = [];

  // All roles get basic permissions
  permissions.push(
    'create_bookings',
    'manage_own_bookings',
    'manage_own_profile',
    'view_own_profile'
  );

  // HOA Admin and Super Admin permissions
  if (role === 'hoa_admin' || role === 'super_admin') {
    permissions.push(
      'manage_hoa_settings',
      'manage_hoa_users',
      'assign_user_roles',
      'view_hoa_reports',
      'manage_hoa_courts',
      'manage_hoa_hours',
      'reset_user_hours',
      'manage_all_bookings',
      'view_all_bookings',
      'approve_bookings',
      'view_hoa_members',
      'invite_members',
      'deactivate_members',
      'view_member_details'
    );
  }

  // Super Admin only permissions
  if (role === 'super_admin') {
    permissions.push(
      'manage_hoas',
      'view_all_hoas',
      'manage_system_users',
      'view_system_reports',
      'manage_system_settings'
    );
  }

  return permissions;
}

/**
 * Check if user has any admin permissions
 */
export function isAdmin(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.role === 'super_admin' || profile.role === 'hoa_admin';
}

/**
 * Check if user can access admin panel
 */
export function canAccessAdminPanel(profile: Profile | null): boolean {
  return isAdmin(profile);
}

/**
 * Validate HOA slug format
 */
export function isValidHOASlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50;
}

/**
 * Generate HOA slug from name
 */
export function generateHOASlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate invitation code
 */
export function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format HOA display name with member count
 */
export function formatHOADisplayName(hoa: { name: string }, memberCount?: number): string {
  if (memberCount !== undefined) {
    return `${hoa.name} (${memberCount} member${memberCount !== 1 ? 's' : ''})`;
  }
  return hoa.name;
}
