import { redirect } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/middleware/rbac';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user has permission to manage users
  const { user, profile, hoa } = await requirePermission(locals, {
    permission: 'view_hoa_members'
  });

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
