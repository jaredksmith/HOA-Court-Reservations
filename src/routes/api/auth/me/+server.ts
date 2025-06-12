import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}
	
	// TODO: Get user profile from database
	// For now, return mock data
	return json({
		user: locals.user,
		profile: {
			id: '1',
			user_id: locals.user.id,
			full_name: 'Admin User',
			household_id: 'household-1',
			prime_hours: 10,
			standard_hours: 15,
			is_admin: true
		}
	});
};
