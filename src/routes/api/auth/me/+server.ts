import { json } from '@sveltejs/kit';
import { getUserWithHOA } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		// Get user with HOA context
		const userWithHOA = await getUserWithHOA(locals.user.id, locals.user);

		if (!userWithHOA) {
			return json({ error: 'User profile not found' }, { status: 404 });
		}

		const { user, profile, hoa } = userWithHOA;

		return json({
			user,
			profile,
			hoa
		});

	} catch (error) {
		console.error('Error getting user data:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
