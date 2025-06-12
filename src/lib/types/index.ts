export type User = {
  id: string;
  email: string;
  household_id: string;
  created_at: string;
};

export type UserRole = 'super_admin' | 'hoa_admin' | 'member';

export type HOA = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;

  // Court configuration
  total_courts: number;
  court_names: string[];

  // Hour allocation settings
  default_prime_hours: number;
  default_standard_hours: number;

  // Booking settings
  max_advance_booking_days: number;
  booking_window_hours: number;
  prime_time_start: string;
  prime_time_end: string;

  // HOA status and settings
  is_active: boolean;
  invitation_code: string;
  allow_guest_bookings: boolean;
  max_guests_per_booking: number;

  // Metadata
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  hoa_id: string;
  full_name: string;
  phone_number: string;
  household_id: string;
  role: UserRole;
  prime_hours: number;
  standard_hours: number;
  last_reset: string;
  is_active: boolean;
  joined_at: string;
  created_at: string;

  // Populated relations
  hoa?: HOA;
};

export type Booking = {
  id: string;
  hoa_id: string;
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

  // Populated relations
  hoa?: HOA;
  organizer?: Profile;
  participants?: BookingParticipant[];
};

export type BookingParticipant = {
  id: string;
  booking_id: string;
  user_id: string;
  status: 'invited' | 'accepted' | 'declined';
  hours_charged: number | null;
  created_at: string;

  // Populated relations
  user?: Profile;
  booking?: Booking;
};

export type PushSubscription = {
  id: string;
  user_id: string;
  hoa_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

export type Court = {
  id: number;
  name: string;
};

// HOA Management Types
export type HOACreationData = {
  name: string;
  slug: string;
  description?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  total_courts?: number;
  court_names?: string[];
  admin_full_name: string;
  admin_phone_number: string;
  admin_household_id?: string;
};

export type HOASettings = {
  default_prime_hours: number;
  default_standard_hours: number;
  max_advance_booking_days: number;
  booking_window_hours: number;
  prime_time_start: string;
  prime_time_end: string;
  allow_guest_bookings: boolean;
  max_guests_per_booking: number;
  court_names: string[];
};

export type HOAStats = {
  total_members: number;
  active_members: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  total_hours_used: number;
  prime_hours_used: number;
  standard_hours_used: number;
};

export type UserInvitation = {
  id: string;
  hoa_id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
};

// Auth Context Types
export type AuthContext = {
  user: User | null;
  profile: Profile | null;
  hoa: HOA | null;
  loading: boolean;
  initialized: boolean;
};

// Permission helpers
export type Permission =
  | 'manage_hoas'           // Super admin only
  | 'manage_hoa_settings'   // HOA admin and super admin
  | 'manage_hoa_users'      // HOA admin and super admin
  | 'view_hoa_reports'      // HOA admin and super admin
  | 'create_bookings'       // All authenticated users
  | 'manage_own_bookings'   // All authenticated users
  | 'manage_all_bookings';  // HOA admin and super admin