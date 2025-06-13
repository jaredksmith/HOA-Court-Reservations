import { fail, redirect } from '@sveltejs/kit';
import * as db from '$lib/server/db';
import { normalizePhoneNumber, isValidPhoneNumber } from '$lib/utils/phone';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  // Redirect to login if not authenticated
  if (!locals.user) {
    // Preserve the current URL as the intended destination
    const redirectTo = url.pathname + url.search;
    const loginUrl = `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`;
    throw redirect(302, loginUrl);
  }

  try {
    // Get user profile with HOA data
    const profile = await db.getProfileByUserId(locals.user.id);
    
    if (!profile) {
      throw redirect(302, '/auth/login');
    }

    const hoa = await db.getHOAById(profile.hoa_id);

    return {
      profile,
      hoa,
      user: locals.user
    };
  } catch (error) {
    console.error('Error loading profile:', error);
    throw redirect(302, '/');
  }
};

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    try {
      const formData = await request.formData();
      const fullName = formData.get('fullName')?.toString();
      const phoneNumber = formData.get('phoneNumber')?.toString();
      const householdId = formData.get('householdId')?.toString();

      // Validate required fields
      if (!fullName || fullName.trim() === '') {
        return fail(400, { error: 'Full name is required' });
      }

      if (!phoneNumber || phoneNumber.trim() === '') {
        return fail(400, { error: 'Phone number is required' });
      }

      if (!householdId || householdId.trim() === '') {
        return fail(400, { error: 'Household ID is required' });
      }

      // Validate and normalize phone number
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      if (!isValidPhoneNumber(normalizedPhone)) {
        return fail(400, { error: 'Please enter a valid phone number' });
      }

      // Get current profile to check permissions
      const currentProfile = await db.getProfileByUserId(locals.user.id);
      if (!currentProfile) {
        return fail(404, { error: 'Profile not found' });
      }

      // Update profile using admin client (since we're updating the user's own profile)
      // Import the admin client from the db module
      const { supabaseAdmin } = await import('$lib/server/db');

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone_number: normalizedPhone,
          household_id: householdId.trim()
        })
        .eq('user_id', locals.user.id);

      if (error) {
        console.error('Profile update error:', error);
        
        // Handle specific errors
        if (error.code === '23505' && error.message.includes('phone_number')) {
          return fail(400, { error: 'This phone number is already registered in your HOA' });
        }
        
        return fail(500, { error: 'Failed to update profile' });
      }

      return { success: true, message: 'Profile updated successfully' };

    } catch (error) {
      console.error('Profile update error:', error);
      return fail(500, { error: 'An unexpected error occurred' });
    }
  },

  changePassword: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    try {
      const formData = await request.formData();
      const currentPassword = formData.get('currentPassword')?.toString();
      const newPassword = formData.get('newPassword')?.toString();
      const confirmPassword = formData.get('confirmPassword')?.toString();

      // Validate required fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        return fail(400, { error: 'All password fields are required' });
      }

      // Validate password match
      if (newPassword !== confirmPassword) {
        return fail(400, { error: 'New passwords do not match' });
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return fail(400, { error: 'New password must be at least 8 characters long' });
      }

      console.log('🔐 Changing password for user:', locals.user.id);

      // Import Supabase client
      const { supabase } = await import('$lib/server/db');

      // First, verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: locals.user.email,
        password: currentPassword
      });

      if (verifyError) {
        console.error('Current password verification failed:', verifyError);
        return fail(400, { error: 'Current password is incorrect' });
      }

      // Update password using admin client
      const { supabaseAdmin } = await import('$lib/server/db');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        locals.user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Password update error:', updateError);
        return fail(500, { error: 'Failed to update password' });
      }

      return { success: true, message: 'Password changed successfully' };

    } catch (error) {
      console.error('Unexpected password change error:', error);
      return fail(500, { error: 'An unexpected error occurred' });
    }
  }
};
