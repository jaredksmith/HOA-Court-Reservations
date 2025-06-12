import { db } from '$lib/server/db';
import type { Booking, BookingParticipant, Profile } from '$lib/types';
import { checkIsPrimeTime } from '$lib/utils/time';
import { error } from '@sveltejs/kit';

export async function createGroupBooking(
  organizerId: string,
  startTime: string,
  endTime: string,
  courts: number[],
  totalPlayers: number,
  guestCount: number,
  minMembers: number,
  invitedUserIds: string[]
) {
  // Check if the time is prime time
  const isPrimeTime = checkIsPrimeTime(new Date(startTime));
  
  // Calculate expiration time (30 minutes from now)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);
  
  try {
    // Create the booking
    const booking = await db.createBooking({
      organizer_id: organizerId,
      start_time: startTime,
      end_time: endTime,
      courts,
      status: 'pending',
      total_players: totalPlayers,
      guest_count: guestCount,
      min_members: minMembers,
      expires_at: expiresAt.toISOString(),
      is_prime_time: isPrimeTime
    });
    
    // Add participants
    const participants: Omit<BookingParticipant, 'id'>[] = [
      // Add organizer as accepted
      {
        booking_id: booking.id,
        user_id: organizerId,
        status: 'accepted',
        hours_charged: null // Will be calculated when booking is confirmed
      },
      // Add invited participants
      ...invitedUserIds.map(userId => ({
        booking_id: booking.id,
        user_id: userId,
        status: 'invited' as const,
        hours_charged: null
      }))
    ];

    // Add all participants to the database
    await db.addBookingParticipants(participants);

    // TODO: Send push notifications to invited users
    // await sendPushNotification(invitedUserIds, {
    //   title: 'Court Booking Invitation',
    //   body: `You've been invited to a court booking`,
    //   data: { bookingId: booking.id }
    // });

    return booking;

  } catch (err) {
    console.error('Error creating group booking:', err);
    throw error(500, 'Failed to create booking');
  }
}