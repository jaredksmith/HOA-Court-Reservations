import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { User, Profile, Booking, BookingParticipant, PushSubscription } from '$lib/types';

// Initialize Supabase client
const supabase = createClient(
  env.SUPABASE_URL || 'http://localhost:54321',
  env.SUPABASE_ANON_KEY || 'mock-key'
);

// Export the client for use in other modules
export { supabase };

// User functions
export async function createUser(email: string, password: string) {
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password
  });

  if (authError) throw authError;
  if (!data.user) throw new Error('Failed to create user');

  // Convert Supabase user to our User type
  return {
    id: data.user.id,
    email: data.user.email || '',
    household_id: '', // Will be set when profile is created
    created_at: data.user.created_at
  } as User;
}

export async function getUserBySessionId(sessionId: string) {
  const { data, error } = await supabase.auth.getUser(sessionId);

  if (error) throw error;
  if (!data.user) return null;

  // Convert Supabase user to our User type
  return {
    id: data.user.id,
    email: data.user.email || '',
    household_id: '', // Will be populated from profile
    created_at: data.user.created_at
  } as User;
}

// Profile functions
export async function createProfile(profile: Omit<Profile, 'id'>) {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();
  
  if (error) throw error;
  return data as Profile;
}

export async function getProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) return null;
  return data as Profile;
}

export async function resetAllUserHours(resetData: { prime_hours: number, standard_hours: number, last_reset: string }) {
  const { error } = await supabase
    .from('profiles')
    .update(resetData);
  
  if (error) throw error;
}

// Booking functions
export async function createBooking(booking: Omit<Booking, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ...booking,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Booking;
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Booking;
}

export async function updateBookingStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled') {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
}

// Booking participants
export async function addBookingParticipants(participants: Omit<BookingParticipant, 'id'>[]) {
  const { data, error } = await supabase
    .from('booking_participants')
    .insert(participants)
    .select();
  
  if (error) throw error;
  return data as BookingParticipant[];
}

export async function updateParticipantStatus(id: string, status: 'invited' | 'accepted' | 'declined', hoursCharged?: number) {
  const updateData: Partial<BookingParticipant> = { status };
  if (hoursCharged !== undefined) {
    updateData.hours_charged = hoursCharged;
  }
  
  const { error } = await supabase
    .from('booking_participants')
    .update(updateData)
    .eq('id', id);
  
  if (error) throw error;
}

// Push subscription
export async function savePushSubscription(subscription: Omit<PushSubscription, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert({
      ...subscription,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data as PushSubscription;
}

// Export all functions as a db object for backward compatibility
export const db = {
  createUser,
  getUserBySessionId,
  createProfile,
  getProfileByUserId,
  resetAllUserHours,
  createBooking,
  getBookingById,
  updateBookingStatus,
  addBookingParticipants,
  updateParticipantStatus,
  savePushSubscription
};