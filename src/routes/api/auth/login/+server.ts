import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { email, password } = await request.json();
		
		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}
		
		// TODO: Implement actual authentication with Supabase
		// For now, this is a placeholder
		
		// Mock authentication - replace with actual Supabase auth
		if (email === 'admin@example.com' && password === 'password') {
			const sessionId = 'mock-session-' + Date.now();
			
			// Set session cookie
			cookies.set('session', sessionId, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 7 // 7 days
			});
			
			return json({
				user: {
					id: '1',
					email: 'admin@example.com'
				},
				profile: {
					id: '1',
					user_id: '1',
					full_name: 'Admin User',
					household_id: 'household-1',
					prime_hours: 10,
					standard_hours: 15,
					is_admin: true
				}
			});
		}
		
		return json({ error: 'Invalid credentials' }, { status: 401 });
		
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
