import { json, error } from '@sveltejs/kit';
import { requirePermission, createAuditLog, checkRateLimit } from '$lib/server/middleware/rbac';
import { db } from '$lib/server/db';
import { canManageUser, canAssignRole } from '$lib/utils/permissions';
import type { RequestHandler } from './$types';

/**
 * GET /api/admin/users/[id]
 * Get specific user details
 */
export const GET: RequestHandler = async ({ locals, params }) => {
  try {
    const { profile } = await requirePermission(locals, {
      permission: 'view_member_details'
    });

    const targetProfile = await db.getProfileByUserId(params.id);
    if (!targetProfile) {
      throw error(404, 'User not found');
    }

    // Check if current user can view target user
    if (!canManageUser(profile, targetProfile)) {
      throw error(403, 'Insufficient permissions to view this user');
    }

    // Get additional user data
    const userBookings = await db.getBookingsByUserId(params.id);
    const userStats = {
      total_bookings: userBookings.length,
      confirmed_bookings: userBookings.filter(b => b.status === 'confirmed').length,
      cancelled_bookings: userBookings.filter(b => b.status === 'cancelled').length,
      hours_used_this_period: 0 // TODO: Calculate from bookings
    };

    return json({
      user: targetProfile,
      stats: userStats,
      recent_bookings: userBookings.slice(0, 5) // Last 5 bookings
    });

  } catch (err) {
    console.error('Error fetching user details:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to fetch user details');
  }
};

/**
 * PATCH /api/admin/users/[id]
 * Update specific user
 */
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  try {
    const { profile } = await requirePermission(locals, {
      permission: 'manage_hoa_users'
    });

    // Rate limiting for user updates
    if (!checkRateLimit(profile.user_id, 'update_user', 10, 300000)) { // 10 updates per 5 minutes
      throw error(429, 'Rate limit exceeded for user updates');
    }

    const targetProfile = await db.getProfileByUserId(params.id);
    if (!targetProfile) {
      throw error(404, 'User not found');
    }

    // Check if current user can manage target user
    if (!canManageUser(profile, targetProfile)) {
      throw error(403, 'Insufficient permissions to update this user');
    }

    const updateData = await request.json();
    const allowedFields = [
      'full_name',
      'phone_number',
      'household_id',
      'role',
      'prime_hours',
      'standard_hours',
      'is_active'
    ];

    // Filter and validate update data
    const filteredData: any = {};
    const auditDetails: any = {};

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        // Special validation for role changes
        if (key === 'role') {
          if (!canAssignRole(profile, value as any)) {
            throw error(403, `Cannot assign role: ${value}`);
          }
          auditDetails.oldRole = targetProfile.role;
          auditDetails.newRole = value;
        }

        filteredData[key] = value;
      }
    }

    if (Object.keys(filteredData).length === 0) {
      throw error(400, 'No valid fields to update');
    }

    // Update the user profile
    const updatedProfile = await db.updateProfile(targetProfile.id, filteredData);

    // Create audit log
    createAuditLog(
      profile,
      'UPDATE_USER',
      'user',
      targetProfile.id,
      { 
        updatedFields: Object.keys(filteredData),
        ...auditDetails
      }
    );

    return json({
      success: true,
      user: updatedProfile,
      message: 'User updated successfully'
    });

  } catch (err) {
    console.error('Error updating user:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to update user');
  }
};

/**
 * DELETE /api/admin/users/[id]
 * Deactivate user (soft delete)
 */
export const DELETE: RequestHandler = async ({ locals, params }) => {
  try {
    const { profile } = await requirePermission(locals, {
      permission: 'deactivate_members'
    });

    // Rate limiting for user deactivation
    if (!checkRateLimit(profile.user_id, 'deactivate_user', 5, 300000)) { // 5 deactivations per 5 minutes
      throw error(429, 'Rate limit exceeded for user deactivation');
    }

    const targetProfile = await db.getProfileByUserId(params.id);
    if (!targetProfile) {
      throw error(404, 'User not found');
    }

    // Check if current user can manage target user
    if (!canManageUser(profile, targetProfile)) {
      throw error(403, 'Insufficient permissions to deactivate this user');
    }

    // Prevent deactivating super admins (unless done by another super admin)
    if (targetProfile.role === 'super_admin' && profile.role !== 'super_admin') {
      throw error(403, 'Cannot deactivate super admin');
    }

    // Prevent self-deactivation
    if (targetProfile.user_id === profile.user_id) {
      throw error(400, 'Cannot deactivate your own account');
    }

    // Deactivate the user
    await db.deactivateProfile(targetProfile.id);

    // Cancel any pending bookings
    const userBookings = await db.getBookingsByUserId(params.id);
    const pendingBookings = userBookings.filter(b => b.status === 'pending');
    
    for (const booking of pendingBookings) {
      await db.updateBookingStatus(booking.id, 'cancelled');
    }

    // Create audit log
    createAuditLog(
      profile,
      'DEACTIVATE_USER',
      'user',
      targetProfile.id,
      { 
        cancelledBookings: pendingBookings.length,
        reason: 'Admin deactivation'
      }
    );

    return json({
      success: true,
      message: 'User deactivated successfully',
      cancelled_bookings: pendingBookings.length
    });

  } catch (err) {
    console.error('Error deactivating user:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to deactivate user');
  }
};

/**
 * PUT /api/admin/users/[id]/reactivate
 * Reactivate a deactivated user
 */
export const PUT: RequestHandler = async ({ locals, params, url }) => {
  // Only handle reactivation requests
  if (!url.pathname.endsWith('/reactivate')) {
    throw error(404, 'Not found');
  }

  try {
    const { profile } = await requirePermission(locals, {
      permission: 'manage_hoa_users'
    });

    const targetProfile = await db.getProfileByUserId(params.id);
    if (!targetProfile) {
      throw error(404, 'User not found');
    }

    // Check if current user can manage target user
    if (!canManageUser(profile, targetProfile)) {
      throw error(403, 'Insufficient permissions to reactivate this user');
    }

    if (targetProfile.is_active) {
      throw error(400, 'User is already active');
    }

    // Reactivate the user
    await db.updateProfile(targetProfile.id, { is_active: true });

    // Create audit log
    createAuditLog(
      profile,
      'REACTIVATE_USER',
      'user',
      targetProfile.id
    );

    return json({
      success: true,
      message: 'User reactivated successfully'
    });

  } catch (err) {
    console.error('Error reactivating user:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to reactivate user');
  }
};
