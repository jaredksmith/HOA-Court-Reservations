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
			hoa_id: 'mock-hoa-id',
			full_name: 'Admin User',
			phone_number: '+15551234567',
			household_id: 'household-1',
			role: 'hoa_admin',
			prime_hours: 10,
			standard_hours: 15,
			last_reset: new Date().toISOString(),
			is_active: true,
			joined_at: new Date().toISOString(),
			created_at: new Date().toISOString()
		},
		hoa: {
			id: 'mock-hoa-id',
			name: 'Sunset Ridge HOA',
			slug: 'sunset-ridge',
			description: 'A beautiful community with pickleball courts',
			total_courts: 4,
			court_names: ['Court 1', 'Court 2', 'Court 3', 'Court 4'],
			default_prime_hours: 4,
			default_standard_hours: 8,
			max_advance_booking_days: 14,
			booking_window_hours: 2,
			prime_time_start: '17:00',
			prime_time_end: '21:00',
			is_active: true,
			invitation_code: 'SUNSET01',
			allow_guest_bookings: true,
			max_guests_per_booking: 2,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}
	});
};
