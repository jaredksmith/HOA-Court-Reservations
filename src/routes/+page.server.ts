import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if user is authenticated
  if (!locals.user) {
    // Preserve the current URL as the intended destination
    const redirectTo = url.pathname + url.search;
    const loginUrl = redirectTo === '/' 
      ? '/auth/login' 
      : `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`;
    
    throw redirect(303, loginUrl);
  }

  // User is authenticated, allow access to the page
  return {};
};
