import * as db from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  console.log('🔍 Layout server load - checking auth state');
  
  // If no user in locals, return unauthenticated state
  if (!locals.user) {
    console.log('⚠️  No user in locals, returning unauthenticated state');
    return {
      auth: {
        user: null,
        profile: null,
        hoa: null,
        loading: false,
        initialized: true
      }
    };
  }

  try {
    console.log('✅ User found in locals:', locals.user.id);

    // Get profile and HOA separately to avoid the getUserWithHOA complexity
    const profile = await db.getProfileByUserId(locals.user.id);

    if (!profile) {
      console.log('⚠️  No profile found for user, returning partial auth state');
      return {
        auth: {
          user: locals.user,
          profile: null,
          hoa: null,
          loading: false,
          initialized: true
        }
      };
    }

    console.log('✅ Profile found:', profile.full_name, 'Role:', profile.role);

    const hoa = await db.getHOAById(profile.hoa_id);

    if (!hoa) {
      console.log('⚠️  No HOA found for profile, returning partial auth state');
      return {
        auth: {
          user: locals.user,
          profile,
          hoa: null,
          loading: false,
          initialized: true
        }
      };
    }

    console.log('✅ Full auth context loaded:', {
      userId: locals.user.id,
      profileRole: profile.role,
      hoaName: hoa.name
    });

    return {
      auth: {
        user: locals.user,
        profile,
        hoa,
        loading: false,
        initialized: true
      }
    };

  } catch (error) {
    console.error('❌ Error loading auth context:', error);

    // Return partial state on error
    return {
      auth: {
        user: locals.user,
        profile: null,
        hoa: null,
        loading: false,
        initialized: true
      }
    };
  }
};
