import { describe, it, expect, beforeEach } from 'vitest';
import { 
  hasPermission, 
  canManageUser, 
  canAccessHOA, 
  getAssignableRoles,
  canAssignRole,
  getRoleLevel,
  getRolePermissions,
  isAdmin,
  isSuperAdmin,
  canAccessAdminPanel
} from '$lib/utils/permissions';
import type { Profile, UserRole } from '$lib/types';

// Mock profile factory
function createMockProfile(
  role: UserRole, 
  hoaId = 'hoa-1', 
  userId = 'user-1',
  isActive = true
): Profile {
  return {
    id: 'profile-1',
    user_id: userId,
    hoa_id: hoaId,
    full_name: 'Test User',
    phone_number: '+1234567890',
    household_id: 'household-1',
    role,
    prime_hours: 4,
    standard_hours: 8,
    last_reset: new Date().toISOString(),
    is_active: isActive,
    joined_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
}

describe('RBAC Permission System', () => {
  describe('hasPermission', () => {
    it('should deny access for null profile', () => {
      expect(hasPermission(null, 'create_bookings')).toBe(false);
    });

    it('should deny access for inactive users', () => {
      const profile = createMockProfile('member', 'hoa-1', 'user-1', false);
      expect(hasPermission(profile, 'create_bookings')).toBe(false);
    });

    it('should grant basic permissions to all active users', () => {
      const member = createMockProfile('member');
      const hoaAdmin = createMockProfile('hoa_admin');
      const superAdmin = createMockProfile('super_admin');

      const basicPermissions = [
        'create_bookings',
        'manage_own_bookings',
        'manage_own_profile',
        'view_own_profile'
      ];

      basicPermissions.forEach(permission => {
        expect(hasPermission(member, permission as any)).toBe(true);
        expect(hasPermission(hoaAdmin, permission as any)).toBe(true);
        expect(hasPermission(superAdmin, permission as any)).toBe(true);
      });
    });

    it('should grant HOA admin permissions to HOA admins and super admins', () => {
      const member = createMockProfile('member');
      const hoaAdmin = createMockProfile('hoa_admin');
      const superAdmin = createMockProfile('super_admin');

      const hoaAdminPermissions = [
        'manage_hoa_settings',
        'manage_hoa_users',
        'view_hoa_reports',
        'manage_all_bookings'
      ];

      hoaAdminPermissions.forEach(permission => {
        expect(hasPermission(member, permission as any)).toBe(false);
        expect(hasPermission(hoaAdmin, permission as any)).toBe(true);
        expect(hasPermission(superAdmin, permission as any)).toBe(true);
      });
    });

    it('should grant system permissions only to super admins', () => {
      const member = createMockProfile('member');
      const hoaAdmin = createMockProfile('hoa_admin');
      const superAdmin = createMockProfile('super_admin');

      const systemPermissions = [
        'manage_hoas',
        'view_all_hoas',
        'manage_system_users',
        'view_system_reports'
      ];

      systemPermissions.forEach(permission => {
        expect(hasPermission(member, permission as any)).toBe(false);
        expect(hasPermission(hoaAdmin, permission as any)).toBe(false);
        expect(hasPermission(superAdmin, permission as any)).toBe(true);
      });
    });
  });

  describe('canManageUser', () => {
    it('should allow super admin to manage anyone', () => {
      const superAdmin = createMockProfile('super_admin', 'hoa-1');
      const targetMember = createMockProfile('member', 'hoa-2');
      const targetHOAAdmin = createMockProfile('hoa_admin', 'hoa-2');
      const targetSuperAdmin = createMockProfile('super_admin', 'hoa-2');

      expect(canManageUser(superAdmin, targetMember)).toBe(true);
      expect(canManageUser(superAdmin, targetHOAAdmin)).toBe(true);
      expect(canManageUser(superAdmin, targetSuperAdmin)).toBe(true);
    });

    it('should allow HOA admin to manage users in same HOA (except super admins)', () => {
      const hoaAdmin = createMockProfile('hoa_admin', 'hoa-1');
      const sameMember = createMockProfile('member', 'hoa-1');
      const sameHOAAdmin = createMockProfile('hoa_admin', 'hoa-1');
      const sameSuperAdmin = createMockProfile('super_admin', 'hoa-1');
      const differentMember = createMockProfile('member', 'hoa-2');

      expect(canManageUser(hoaAdmin, sameMember)).toBe(true);
      expect(canManageUser(hoaAdmin, sameHOAAdmin)).toBe(true);
      expect(canManageUser(hoaAdmin, sameSuperAdmin)).toBe(false);
      expect(canManageUser(hoaAdmin, differentMember)).toBe(false);
    });

    it('should allow members to manage only themselves', () => {
      const member = createMockProfile('member', 'hoa-1', 'user-1');
      const sameMember = createMockProfile('member', 'hoa-1', 'user-1');
      const differentMember = createMockProfile('member', 'hoa-1', 'user-2');

      expect(canManageUser(member, sameMember)).toBe(true);
      expect(canManageUser(member, differentMember)).toBe(false);
    });
  });

  describe('canAccessHOA', () => {
    it('should allow super admin to access any HOA', () => {
      const superAdmin = createMockProfile('super_admin', 'hoa-1');
      
      expect(canAccessHOA(superAdmin, 'hoa-1')).toBe(true);
      expect(canAccessHOA(superAdmin, 'hoa-2')).toBe(true);
      expect(canAccessHOA(superAdmin, 'any-hoa')).toBe(true);
    });

    it('should allow users to access only their own HOA', () => {
      const hoaAdmin = createMockProfile('hoa_admin', 'hoa-1');
      const member = createMockProfile('member', 'hoa-1');

      expect(canAccessHOA(hoaAdmin, 'hoa-1')).toBe(true);
      expect(canAccessHOA(hoaAdmin, 'hoa-2')).toBe(false);
      expect(canAccessHOA(member, 'hoa-1')).toBe(true);
      expect(canAccessHOA(member, 'hoa-2')).toBe(false);
    });
  });

  describe('Role Management', () => {
    it('should return correct assignable roles', () => {
      const member = createMockProfile('member');
      const hoaAdmin = createMockProfile('hoa_admin');
      const superAdmin = createMockProfile('super_admin');

      expect(getAssignableRoles(member)).toEqual([]);
      expect(getAssignableRoles(hoaAdmin)).toEqual(['hoa_admin', 'member']);
      expect(getAssignableRoles(superAdmin)).toEqual(['super_admin', 'hoa_admin', 'member']);
    });

    it('should validate role assignment permissions', () => {
      const member = createMockProfile('member');
      const hoaAdmin = createMockProfile('hoa_admin');
      const superAdmin = createMockProfile('super_admin');

      // Members can't assign any roles
      expect(canAssignRole(member, 'member')).toBe(false);
      expect(canAssignRole(member, 'hoa_admin')).toBe(false);
      expect(canAssignRole(member, 'super_admin')).toBe(false);

      // HOA admins can assign member and hoa_admin roles
      expect(canAssignRole(hoaAdmin, 'member')).toBe(true);
      expect(canAssignRole(hoaAdmin, 'hoa_admin')).toBe(true);
      expect(canAssignRole(hoaAdmin, 'super_admin')).toBe(false);

      // Super admins can assign any role
      expect(canAssignRole(superAdmin, 'member')).toBe(true);
      expect(canAssignRole(superAdmin, 'hoa_admin')).toBe(true);
      expect(canAssignRole(superAdmin, 'super_admin')).toBe(true);
    });

    it('should return correct role levels', () => {
      expect(getRoleLevel('member')).toBe(1);
      expect(getRoleLevel('hoa_admin')).toBe(2);
      expect(getRoleLevel('super_admin')).toBe(3);
    });
  });

  describe('Role Permissions', () => {
    it('should return correct permissions for each role', () => {
      const memberPermissions = getRolePermissions('member');
      const hoaAdminPermissions = getRolePermissions('hoa_admin');
      const superAdminPermissions = getRolePermissions('super_admin');

      // Members should have basic permissions
      expect(memberPermissions).toContain('create_bookings');
      expect(memberPermissions).toContain('manage_own_bookings');
      expect(memberPermissions).not.toContain('manage_hoa_users');
      expect(memberPermissions).not.toContain('manage_hoas');

      // HOA admins should have member + HOA admin permissions
      expect(hoaAdminPermissions).toContain('create_bookings');
      expect(hoaAdminPermissions).toContain('manage_hoa_users');
      expect(hoaAdminPermissions).toContain('manage_all_bookings');
      expect(hoaAdminPermissions).not.toContain('manage_hoas');

      // Super admins should have all permissions
      expect(superAdminPermissions).toContain('create_bookings');
      expect(superAdminPermissions).toContain('manage_hoa_users');
      expect(superAdminPermissions).toContain('manage_hoas');
      expect(superAdminPermissions).toContain('manage_system_users');
    });
  });

  describe('Admin Checks', () => {
    it('should correctly identify admin users', () => {
      const member = createMockProfile('member');
      const hoaAdmin = createMockProfile('hoa_admin');
      const superAdmin = createMockProfile('super_admin');

      expect(isAdmin(member)).toBe(false);
      expect(isAdmin(hoaAdmin)).toBe(true);
      expect(isAdmin(superAdmin)).toBe(true);
    });

    it('should correctly identify super admin users', () => {
      const member = createMockProfile('member');
      const hoaAdmin = createMockProfile('hoa_admin');
      const superAdmin = createMockProfile('super_admin');

      expect(isSuperAdmin(member)).toBe(false);
      expect(isSuperAdmin(hoaAdmin)).toBe(false);
      expect(isSuperAdmin(superAdmin)).toBe(true);
    });

    it('should correctly check admin panel access', () => {
      const member = createMockProfile('member');
      const hoaAdmin = createMockProfile('hoa_admin');
      const superAdmin = createMockProfile('super_admin');

      expect(canAccessAdminPanel(member)).toBe(false);
      expect(canAccessAdminPanel(hoaAdmin)).toBe(true);
      expect(canAccessAdminPanel(superAdmin)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null profiles gracefully', () => {
      expect(hasPermission(null, 'create_bookings')).toBe(false);
      expect(canManageUser(null, createMockProfile('member'))).toBe(false);
      expect(canAccessHOA(null, 'hoa-1')).toBe(false);
      expect(getAssignableRoles(null)).toEqual([]);
      expect(canAssignRole(null, 'member')).toBe(false);
      expect(isAdmin(null)).toBe(false);
      expect(isSuperAdmin(null)).toBe(false);
      expect(canAccessAdminPanel(null)).toBe(false);
    });

    it('should handle inactive users correctly', () => {
      const inactiveProfile = createMockProfile('hoa_admin', 'hoa-1', 'user-1', false);
      
      expect(hasPermission(inactiveProfile, 'create_bookings')).toBe(false);
      expect(hasPermission(inactiveProfile, 'manage_hoa_users')).toBe(false);
    });
  });
});
