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
      console.log('🔐 Login attempt for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Supabase auth error:', error);
        return fail(400, { error: error.message });
      }

      console.log('✅ Supabase auth successful for user:', data.user.id);

      // Set the session cookie
      cookies.set('session', data.session.access_token, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });

      console.log('✅ Session cookie set, redirecting to dashboard');

      // Redirect to the dashboard
      throw redirect(303, '/');
    } catch (err) {
      // Check if it's a redirect response (which is expected)
      if (err instanceof Response && err.status >= 300 && err.status < 400) {
        console.log('✅ Redirect response, passing through');
        throw err;
      }
      // Check if it's a redirect object (SvelteKit redirect)
      if (err && typeof err === 'object' && 'status' in err && err.status === 303) {
        console.log('✅ SvelteKit redirect, passing through');
        throw err;
      }
      console.error('❌ Unexpected login error:', err);
      console.error('Error stack:', err?.stack);
      return fail(500, { error: 'An unexpected error occurred' });
    }
  }
};