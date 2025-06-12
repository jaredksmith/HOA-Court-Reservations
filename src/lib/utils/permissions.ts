import type { Profile, UserRole, Permission } from '$lib/types';

/**
 * Permission management utilities for multi-tenant HOA system
 */

/**
 * Check if a user has a specific permission
 */
export function hasPermission(profile: Profile | null, permission: Permission): boolean {
  if (!profile) return false;

  const role = profile.role;

  switch (permission) {
    case 'manage_hoas':
      return role === 'super_admin';

    case 'manage_hoa_settings':
    case 'manage_hoa_users':
    case 'view_hoa_reports':
    case 'manage_all_bookings':
      return role === 'super_admin' || role === 'hoa_admin';

    case 'create_bookings':
    case 'manage_own_bookings':
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
