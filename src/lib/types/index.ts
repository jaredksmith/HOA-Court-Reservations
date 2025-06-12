export type User = {
  id: string;
  email: string;
  household_id: string;
  created_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  household_id: string;
  prime_hours: number;
  standard_hours: number;
  is_admin: boolean;
  last_reset: string;
};

export type Booking = {
  id: string;
  organizer_id: string;
  start_time: string;
  end_time: string;
  courts: number[];
  status: 'pending' | 'confirmed' | 'cancelled';
  total_players: number;
  guest_count: number;
  min_members: number;
  created_at: string;
  expires_at: string | null;
  is_prime_time: boolean;
};

export type BookingParticipant = {
  id: string;
  booking_id: string;
  user_id: string;
  status: 'invited' | 'accepted' | 'declined';
  hours_charged: number | null;
};

export type PushSubscription = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

export type Court = {
  id: number;
  name: string;
};