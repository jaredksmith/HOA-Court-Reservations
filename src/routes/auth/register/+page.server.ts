import { fail, redirect } from '@sveltejs/kit';
import { createUserWithInvitationCode } from '$lib/server/auth';
import { isValidPhoneNumber } from '$lib/utils/phone';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const householdId = formData.get('householdId') as string;
    const invitationCode = formData.get('invitationCode') as string;

    // Validate required fields
    if (!email || !password || !fullName || !phoneNumber || !householdId || !invitationCode) {
      return fail(400, { error: 'All fields are required' });
    }

    // Validate phone number format
    if (!isValidPhoneNumber(phoneNumber)) {
      return fail(400, { error: 'Please enter a valid phone number' });
    }

    // Validate invitation code format
    if (invitationCode.length !== 8) {
      return fail(400, { error: 'Invalid invitation code format' });
    }

    try {
      const result = await createUserWithInvitationCode(
        email,
        password,
        fullName,
        phoneNumber,
        householdId,
        invitationCode
      );

      // Redirect to login page with HOA context
      const redirectUrl = `/auth/login?registered=true&hoa=${result.hoa.slug}`;
      throw redirect(303, redirectUrl);
    } catch (err) {
      if (err instanceof Response) throw err;
      console.error('Registration error:', err);

      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes('Invalid invitation code')) {
          return fail(400, { error: 'Invalid invitation code. Please check with your HOA administrator.' });
        }
        if (err.message.includes('phone number is already registered')) {
          return fail(400, { error: 'This phone number is already registered in this HOA.' });
        }
      }

      return fail(500, { error: 'Failed to create account. Please try again.' });
    }
  }
};