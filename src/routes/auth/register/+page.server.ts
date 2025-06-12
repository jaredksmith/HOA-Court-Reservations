import { fail, redirect } from '@sveltejs/kit';
import { createUser } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const householdId = formData.get('householdId') as string;
    
    if (!email || !password || !fullName || !householdId) {
      return fail(400, { error: 'All fields are required' });
    }
    
    try {
      await createUser(email, password, fullName, householdId);
      
      // Redirect to login page
      throw redirect(303, '/auth/login?registered=true');
    } catch (err) {
      if (err instanceof Response) throw err;
      console.error('Registration error:', err);
      return fail(500, { error: 'Failed to create account' });
    }
  }
};