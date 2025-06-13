import { redirect, fail } from '@sveltejs/kit';
import { getUserWithHOA } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { hasPermission } from '$lib/utils/permissions';
import type { Actions, PageServerLoad } from './$types';
import type { HOACreationData } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
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

  return {
    auth: {
      user: locals.user,
      profile,
      hoa: userWithHOA.hoa,
      loading: false,
      initialized: true
    }
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
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
    const slug = formData.get('slug')?.toString().trim();
    const description = formData.get('description')?.toString().trim();
    const address = formData.get('address')?.toString().trim();
    const contactEmail = formData.get('contact_email')?.toString().trim();
    const contactPhone = formData.get('contact_phone')?.toString().trim();
    const websiteUrl = formData.get('website_url')?.toString().trim();
    const totalCourts = parseInt(formData.get('total_courts')?.toString() || '4');
    const adminFullName = formData.get('admin_full_name')?.toString().trim();
    const adminPhoneNumber = formData.get('admin_phone_number')?.toString().trim();
    const adminHouseholdId = formData.get('admin_household_id')?.toString().trim();

    // Validation
    if (!name || !slug || !adminFullName || !adminPhoneNumber) {
      return fail(400, { error: 'Name, slug, admin name, and admin phone are required' });
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return fail(400, { error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
    }

    // Validate total courts
    if (totalCourts < 1 || totalCourts > 20) {
      return fail(400, { error: 'Total courts must be between 1 and 20' });
    }

    // Generate court names
    const courtNames = Array.from({ length: totalCourts }, (_, i) => `Court ${i + 1}`);

    try {
      const hoaData: HOACreationData = {
        name,
        slug,
        description: description || undefined,
        address: address || undefined,
        contact_email: contactEmail || undefined,
        contact_phone: contactPhone || undefined,
        website_url: websiteUrl || undefined,
        total_courts: totalCourts,
        court_names: courtNames,
        admin_full_name: adminFullName,
        admin_phone_number: adminPhoneNumber,
        admin_household_id: adminHouseholdId || 'admin'
      };

      const hoa = await db.createHOA(hoaData, locals.user.id);

      // Redirect to the HOA details page
      throw redirect(303, `/admin/hoas/${hoa.id}`);

    } catch (error) {
      console.error('Error creating HOA:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value violates unique constraint')) {
          if (error.message.includes('slug')) {
            return fail(400, { error: 'This slug is already taken. Please choose a different one.' });
          }
        }
      }
      
      return fail(500, { error: 'Failed to create HOA. Please try again.' });
    }
  }
};
