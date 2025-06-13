import { json, error } from '@sveltejs/kit';
import { getUserWithHOA } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { hasPermission } from '$lib/utils/permissions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }

    // Get user with HOA context
    const userWithHOA = await getUserWithHOA(locals.user.id, locals.user);
    if (!userWithHOA) {
      throw error(401, 'User not found');
    }

    const { profile, hoa } = userWithHOA;

    // Check admin permissions
    if (!hasPermission(profile, 'view_hoa_reports')) {
      throw error(403, 'Insufficient permissions');
    }

    let stats;

    if (profile.role === 'super_admin') {
      // Super admin gets system-wide stats
      const [allProfiles, allBookings] = await Promise.all([
        db.getAllProfiles(),
        db.getAllBookings()
      ]);

      stats = {
        total_members: allProfiles.length,
        active_members: allProfiles.filter(p => p.is_active).length,
        total_bookings: allBookings.length,
        pending_bookings: allBookings.filter(b => b.status === 'pending').length,
        confirmed_bookings: allBookings.filter(b => b.status === 'confirmed').length,
        cancelled_bookings: allBookings.filter(b => b.status === 'cancelled').length,
        total_hoas: await db.getAllHOAs().then(hoas => hoas.length)
      };
    } else {
      // HOA admin gets HOA-specific stats
      stats = await db.getHOAStats(hoa.id);
    }

    return json(stats);
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch statistics');
  }
};
