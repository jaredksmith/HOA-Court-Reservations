import { json, error } from '@sveltejs/kit';
import { requirePermission, createAuditLog, checkRateLimit } from '$lib/server/middleware/rbac';
import { db } from '$lib/server/db';
import { hasPermission, canManageUser, canAssignRole } from '$lib/utils/permissions';
import type { RequestHandler } from './$types';
import type { UserRole } from '$lib/types';

/**
 * GET /api/admin/users
 * Get list of users based on admin permissions
 */
export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    const { profile, hoa } = await requirePermission(locals, {
      permission: 'view_hoa_members'
    });

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const roleFilter = url.searchParams.get('role') as UserRole | null;
    const statusFilter = url.searchParams.get('status'); // 'active', 'inactive', 'all'

    let users;

    if (profile.role === 'super_admin') {
      // Super admin can see all users across all HOAs
      users = await db.getAllProfiles();
    } else {
      // HOA admin can only see users in their HOA
      users = await db.getProfilesByHOAId(hoa.id);
    }

    // Apply filters
    let filteredUsers = users;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.full_name.toLowerCase().includes(searchLower) ||
        user.phone_number.includes(search) ||
        user.household_id.toLowerCase().includes(searchLower)
      );
    }

    if (roleFilter) {
      filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filteredUsers = filteredUsers.filter(user => user.is_active === isActive);
    }

    // Pagination
    const total = filteredUsers.length;
    const offset = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('Error fetching users:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to fetch users');
  }
};

/**
 * POST /api/admin/users
 * Create new user (invitation-based)
 */
export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    const { profile, hoa } = await requirePermission(locals, {
      permission: 'invite_members'
    });

    // Rate limiting for user creation
    if (!checkRateLimit(profile.user_id, 'create_user', 5, 300000)) { // 5 users per 5 minutes
      throw error(429, 'Rate limit exceeded. Please wait before creating more users.');
    }

    const data = await request.json();
    const { email, full_name, phone_number, household_id, role = 'member' } = data;

    // Validate required fields
    if (!email || !full_name || !phone_number || !household_id) {
      throw error(400, 'Missing required fields');
    }

    // Check if current user can assign the requested role
    if (!canAssignRole(profile, role)) {
      throw error(403, `Cannot assign role: ${role}`);
    }

    // Determine target HOA
    let targetHOAId = hoa.id;
    if (profile.role === 'super_admin' && data.hoa_id) {
      targetHOAId = data.hoa_id;
    }

    // Create user invitation (this would typically send an email)
    // For now, we'll create the user directly
    const newUser = await db.createUser(email, 'temp_password_' + Date.now());
    
    const newProfile = await db.createProfile({
      user_id: newUser.id,
      hoa_id: targetHOAId,
      full_name,
      phone_number,
      household_id,
      role,
      prime_hours: hoa.default_prime_hours,
      standard_hours: hoa.default_standard_hours,
      last_reset: new Date().toISOString(),
      is_active: true
    });

    // Create audit log
    createAuditLog(
      profile,
      'CREATE_USER',
      'user',
      newProfile.id,
      { email, role, hoa_id: targetHOAId }
    );

    return json({
      success: true,
      user: newProfile,
      message: 'User created successfully'
    });

  } catch (err) {
    console.error('Error creating user:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to create user');
  }
};

/**
 * PATCH /api/admin/users
 * Bulk update users
 */
export const PATCH: RequestHandler = async ({ locals, request }) => {
  try {
    const { profile } = await requirePermission(locals, {
      permission: 'manage_hoa_users'
    });

    const data = await request.json();
    const { action, user_ids, ...updateData } = data;

    if (!action || !user_ids || !Array.isArray(user_ids)) {
      throw error(400, 'Invalid bulk update request');
    }

    // Rate limiting for bulk operations
    if (!checkRateLimit(profile.user_id, 'bulk_update', 3, 300000)) { // 3 bulk ops per 5 minutes
      throw error(429, 'Rate limit exceeded for bulk operations');
    }

    const results = [];

    for (const userId of user_ids) {
      try {
        // Get target user profile
        const targetProfile = await db.getProfileByUserId(userId);
        if (!targetProfile) {
          results.push({ userId, success: false, error: 'User not found' });
          continue;
        }

        // Check if current user can manage target user
        if (!canManageUser(profile, targetProfile)) {
          results.push({ userId, success: false, error: 'Insufficient permissions' });
          continue;
        }

        switch (action) {
          case 'activate':
            await db.updateProfile(targetProfile.id, { is_active: true });
            createAuditLog(profile, 'ACTIVATE_USER', 'user', targetProfile.id);
            results.push({ userId, success: true });
            break;

          case 'deactivate':
            await db.updateProfile(targetProfile.id, { is_active: false });
            createAuditLog(profile, 'DEACTIVATE_USER', 'user', targetProfile.id);
            results.push({ userId, success: true });
            break;

          case 'update_role':
            if (!updateData.role || !canAssignRole(profile, updateData.role)) {
              results.push({ userId, success: false, error: 'Cannot assign role' });
              continue;
            }
            await db.updateProfileRole(targetProfile.id, updateData.role);
            createAuditLog(profile, 'UPDATE_USER_ROLE', 'user', targetProfile.id, { 
              oldRole: targetProfile.role, 
              newRole: updateData.role 
            });
            results.push({ userId, success: true });
            break;

          case 'reset_hours':
            const hoaData = await db.getHOAById(targetProfile.hoa_id);
            await db.updateProfile(targetProfile.id, {
              prime_hours: hoaData.default_prime_hours,
              standard_hours: hoaData.default_standard_hours,
              last_reset: new Date().toISOString()
            });
            createAuditLog(profile, 'RESET_USER_HOURS', 'user', targetProfile.id);
            results.push({ userId, success: true });
            break;

          default:
            results.push({ userId, success: false, error: 'Unknown action' });
        }
      } catch (err) {
        console.error(`Error processing user ${userId}:`, err);
        results.push({ userId, success: false, error: 'Processing error' });
      }
    }

    return json({
      success: true,
      results,
      message: `Bulk ${action} completed`
    });

  } catch (err) {
    console.error('Error in bulk user update:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to update users');
  }
};
