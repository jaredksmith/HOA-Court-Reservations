import { json, error } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/middleware/rbac';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

/**
 * GET /api/bookings/my
 * Get current user's bookings
 */
export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    const { user, profile } = await requirePermission(locals, {
      permission: 'manage_own_bookings'
    });

    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status'); // 'pending', 'confirmed', 'cancelled', 'all'

    // Get user's bookings (both as organizer and participant)
    const userBookings = await db.getBookingsByUserId(user.id);

    // Filter by status if specified
    let filteredBookings = userBookings;
    if (status && status !== 'all') {
      filteredBookings = userBookings.filter(booking => booking.status === status);
    }

    // Sort by date (most recent first)
    filteredBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply limit
    const limitedBookings = filteredBookings.slice(0, limit);

    return json(limitedBookings);

  } catch (err) {
    console.error('Error fetching user bookings:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to fetch bookings');
  }
};
