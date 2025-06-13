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
    const userWithHOA = await getUserWithHOA(locals.user.id);
    if (!userWithHOA) {
      throw error(401, 'User not found');
    }

    const { profile } = userWithHOA;

    // Check if user can manage HOAs (super admin only)
    if (!hasPermission(profile, 'manage_hoas')) {
      throw error(403, 'Insufficient permissions');
    }

    // Get all HOAs (super admin only)
    const hoas = await db.getAllHOAs();

    return json(hoas);

  } catch (err) {
    console.error('Error fetching HOAs:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Internal server error');
  }
};
