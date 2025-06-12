import { fail, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/server/db';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' });
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return fail(400, { error: error.message });
      }
      
      // Set the session cookie
      cookies.set('session', data.session.access_token, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      
      // Redirect to the dashboard
      throw redirect(303, '/');
    } catch (err) {
      if (err instanceof Response) throw err;
      return fail(500, { error: 'An unexpected error occurred' });
    }
  }
};