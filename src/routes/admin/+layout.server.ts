import { redirect } from '@sveltejs/kit';
import { getUserWithHOA } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  // Check if user is authenticated
  if (!locals.user) {
    throw redirect(303, '/auth/login');
  }

  // Get user with HOA context
  const userWithHOA = await getUserWithHOA(locals.user.id);
  
  if (!userWithHOA) {
    throw redirect(303, '/auth/login');
  }

  const { user, profile, hoa } = userWithHOA;

  // Check if user has admin permissions
  const isAdmin = profile.role === 'super_admin' || profile.role === 'hoa_admin';
  
  if (!isAdmin) {
    throw redirect(303, '/dashboard');
  }

  return {
    auth: {
      user,
      profile,
      hoa,
      loading: false,
      initialized: true
    }
  };
};
