import { redirect, fail, error } from '@sveltejs/kit';
import { getUserWithHOA } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { hasPermission } from '$lib/utils/permissions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  // Check authentication
  if (!locals.user) {
    throw redirect(302, '/auth/login');
  }

  // Get user with HOA context
  const userWithHOA = await getUserWithHOA(locals.user.id);
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

    return {
      auth: {
        user: locals.user,
        profile,
        hoa: userWithHOA.hoa,
        loading: false,
        initialized: true
      },
      hoa
    };

  } catch (err) {
    console.error('Error loading HOA for editing:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to load HOA details');
  }
};

export const actions: Actions = {
  default: async ({ request, locals, params }) => {
    // Check authentication
    if (!locals.user) {
      return fail(401, { error: 'Unauthorized' });
    }

    // Get user with HOA context
    const userWithHOA = await getUserWithHOA(locals.user.id);
    if (!userWithHOA) {
      return fail(401, { error: 'User not found' });
    }

    const { profile } = userWithHOA;

    // Check permissions
    if (!hasPermission(profile, 'manage_hoas')) {
      return fail(403, { error: 'Insufficient permissions' });
    }

    const formData = await request.formData();
    
    const name = formData.get('name')?.toString().trim();
    const description = formData.get('description')?.toString().trim();
    const address = formData.get('address')?.toString().trim();
    const contactEmail = formData.get('contact_email')?.toString().trim();
    const contactPhone = formData.get('contact_phone')?.toString().trim();
    const websiteUrl = formData.get('website_url')?.toString().trim();
    const totalCourts = parseInt(formData.get('total_courts')?.toString() || '4');
    const isActive = formData.get('is_active') === 'on';

    // Validation
    if (!name) {
      return fail(400, { error: 'Name is required' });
    }

    // Validate total courts
    if (totalCourts < 1 || totalCourts > 20) {
      return fail(400, { error: 'Total courts must be between 1 and 20' });
    }

    try {
      // Get current HOA to compare court count
      const currentHOA = await db.getHOAById(params.id);
      if (!currentHOA) {
        return fail(404, { error: 'HOA not found' });
      }

      // Generate court names if court count changed
      let courtNames = currentHOA.court_names;
      if (totalCourts !== currentHOA.total_courts) {
        courtNames = Array.from({ length: totalCourts }, (_, i) => `Court ${i + 1}`);
      }

      // Update HOA
      await db.updateHOA(params.id, {
        name,
        description: description || undefined,
        address: address || undefined,
        contact_email: contactEmail || undefined,
        contact_phone: contactPhone || undefined,
        website_url: websiteUrl || undefined,
        total_courts: totalCourts,
        court_names: courtNames,
        is_active: isActive
      });

      // Redirect to the HOA details page
      throw redirect(303, `/admin/hoas/${params.id}`);

    } catch (error) {
      console.error('Error updating HOA:', error);
      
      if (error instanceof Response) throw error;
      
      return fail(500, { error: 'Failed to update HOA. Please try again.' });
    }
  }
};
