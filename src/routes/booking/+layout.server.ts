import { redirect } from '@sveltejs/kit';
import { getUserWithHOA } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Check if user is authenticated
  if (!locals.user) {
    // Preserve the current URL as the intended destination
    const redirectTo = url.pathname + url.search;
    const loginUrl = `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`;
    throw redirect(303, loginUrl);
  }

  // Get user with HOA context
  const userWithHOA = await getUserWithHOA(locals.user.id);
  
  if (!userWithHOA) {
    throw redirect(303, '/auth/login');
  }

  const { user, profile, hoa } = userWithHOA;

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
