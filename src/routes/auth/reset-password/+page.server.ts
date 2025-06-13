import { fail } from '@sveltejs/kit';
import { createPasswordResetToken } from '$lib/server/auth/password-reset';
import { validateEmailConfig } from '$lib/server/email';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, url }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;

    if (!email) {
      return fail(400, { error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(400, { error: 'Please enter a valid email address' });
    }

    try {
      console.log('🔐 Password reset request for:', email);

      // Check if email service is configured
      if (!validateEmailConfig()) {
        console.error('❌ Email service not configured');
        return fail(500, { error: 'Email service is not available. Please contact your administrator.' });
      }

      // Get the base URL for the reset link
      const baseUrl = url.origin;

      // Create password reset token and send email
      const result = await createPasswordResetToken(email, baseUrl);

      if (!result.success && result.error) {
        console.error('❌ Password reset error:', result.error);
        return fail(500, { error: 'Failed to send password reset email. Please try again.' });
      }

      console.log('✅ Password reset process completed for:', email);
      return { success: true, message: 'If an account with that email exists, you will receive a password reset link.' };

    } catch (err) {
      console.error('❌ Unexpected password reset error:', err);
      return fail(500, { error: 'An unexpected error occurred. Please try again.' });
    }
  }
};
