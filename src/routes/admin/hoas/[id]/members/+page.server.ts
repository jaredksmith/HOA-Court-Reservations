import { redirect, error } from '@sveltejs/kit';
import { getUserWithHOA } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { hasPermission } from '$lib/utils/permissions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  // Check authentication
  if (!locals.user) {
    throw redirect(302, '/auth/login');
  }

  // Get user with HOA context
  const userWithHOA = await getUserWithHOA(locals.user.id, locals.user);
  if (!userWithHOA) {
    throw redirect(302, '/auth/login');
  }

  const { profile } = userWithHOA;

  // Check if user can manage HOAs (super admin only)
  if (!hasPermission(profile, 'manage_hoas')) {
    throw redirect(302, '/admin');
  }

  try {
    // Get the HOA details
    const hoa = await db.getHOAById(params.id);
    if (!hoa) {
      throw error(404, 'HOA not found');
    }

    // Get HOA members (including inactive ones for admin view)
    const members = await db.getProfilesByHOAId(hoa.id, false);

    return {
      auth: {
        user: locals.user,
        profile,
        hoa: userWithHOA.hoa,
        loading: false,
        initialized: true
      },
      hoa,
      members
    };

  } catch (err) {
    console.error('Error loading HOA members:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to load HOA members');
  }
};
