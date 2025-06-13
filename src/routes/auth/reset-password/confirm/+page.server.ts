import { fail, redirect } from '@sveltejs/kit';
import { validatePasswordResetToken, updateUserPassword } from '$lib/server/auth/password-reset';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  // Extract the token from URL query parameters
  const token = url.searchParams.get('token');
  const error = url.searchParams.get('error');

  // Check for errors first
  if (error) {
    console.error('Password reset error:', error);
    throw redirect(302, `/auth/reset-password?error=${encodeURIComponent(error)}`);
  }

  // Check if token is provided
  if (!token) {
    throw redirect(302, '/auth/reset-password?error=invalid_link');
  }

  // Validate the token
  const tokenValidation = await validatePasswordResetToken(token);

  if (!tokenValidation.success) {
    console.error('Invalid password reset token:', tokenValidation.error);
    throw redirect(302, `/auth/reset-password?error=${encodeURIComponent(tokenValidation.error || 'invalid_token')}`);
  }

  return {
    token,
    email: tokenValidation.email,
    userId: tokenValidation.userId
  };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const token = formData.get('token') as string;

    // Validate required fields
    if (!password || !confirmPassword) {
      return fail(400, { error: 'All fields are required' });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match' });
    }

    // Validate password strength
    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters long' });
    }

    if (!token) {
      return fail(400, { error: 'Invalid reset token' });
    }

    try {
      console.log('🔐 Confirming password reset');

      // Validate the token again (it gets marked as used)
      const tokenValidation = await validatePasswordResetToken(token);

      if (!tokenValidation.success || !tokenValidation.userId) {
        console.error('❌ Invalid token during password reset:', tokenValidation.error);
        return fail(400, { error: 'Invalid or expired reset link' });
      }

      // Update the user's password
      const updateResult = await updateUserPassword(tokenValidation.userId, password);

      if (!updateResult.success) {
        console.error('❌ Password update error:', updateResult.error);
        return fail(500, { error: 'Failed to update password' });
      }

      console.log('✅ Password reset successful for user:', tokenValidation.userId);

      // Redirect to login with success message
      throw redirect(303, '/auth/login?reset=success');

    } catch (err) {
      // Check if it's a redirect response (which is expected)
      if (err instanceof Response && err.status >= 300 && err.status < 400) {
        throw err;
      }
      console.error('❌ Unexpected password reset error:', err);
      return fail(500, { error: 'An unexpected error occurred' });
    }
  }
};
