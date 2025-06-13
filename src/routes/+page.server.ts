import { redirect } from '@sveltejs/kit';
import { getUserWithHOA } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  console.log('🏠 Homepage server load - checking auth state');

  // Check if user is authenticated
  if (!locals.user) {
    console.log('⚠️  No user in locals, redirecting to login');
    // Preserve the current URL as the intended destination
    const redirectTo = url.pathname + url.search;
    const loginUrl = redirectTo === '/'
      ? '/auth/login'
      : `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`;

    throw redirect(303, loginUrl);
  }

  console.log('✅ User authenticated, checking profile...');

  // Get user with HOA context to ensure they have a complete profile
  try {
    const userWithHOA = await getUserWithHOA(locals.user.id, locals.user);

    if (!userWithHOA || !userWithHOA.profile) {
      console.log('⚠️  User has no profile, redirecting to registration');
      throw redirect(303, '/auth/register');
    }

    console.log('✅ User has complete profile, allowing access to homepage');

    // User is authenticated and has a profile, allow access to the page
    return {
      auth: {
        user: userWithHOA.user,
        profile: userWithHOA.profile,
        hoa: userWithHOA.hoa,
        loading: false,
        initialized: true
      }
    };
  } catch (err) {
    console.error('❌ Error checking user profile:', err);

    // If it's already a redirect, re-throw it
    if (err instanceof Response) {
      throw err;
    }

    // Otherwise redirect to login
    throw redirect(303, '/auth/login');
  }
};
