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

  // Address fields
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;

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

// Permission helpers - Comprehensive RBAC permissions
export type Permission =
  // System-wide permissions (Super Admin only)
  | 'manage_hoas'           // Create, update, delete HOAs
  | 'view_all_hoas'         // View all HOAs in system
  | 'manage_system_users'   // Manage users across all HOAs
  | 'view_system_reports'   // View system-wide analytics
  | 'manage_system_settings' // Configure system-wide settings

  // HOA-level permissions (HOA Admin and Super Admin)
  | 'manage_hoa_settings'   // Update HOA configuration
  | 'manage_hoa_users'      // Invite, activate, deactivate users
  | 'assign_user_roles'     // Change user roles within HOA
  | 'view_hoa_reports'      // View HOA analytics and reports
  | 'manage_hoa_courts'     // Configure court settings
  | 'manage_hoa_hours'      // Manage user hour allocations
  | 'reset_user_hours'      // Reset user hour allocations

  // Booking permissions
  | 'create_bookings'       // Create new bookings
  | 'manage_own_bookings'   // Edit/cancel own bookings
  | 'manage_all_bookings'   // Edit/cancel any booking in HOA
  | 'view_all_bookings'     // View all bookings in HOA
  | 'approve_bookings'      // Approve pending bookings

  // User management permissions
  | 'view_hoa_members'      // View member list
  | 'invite_members'        // Send member invitations
  | 'deactivate_members'    // Deactivate member accounts
  | 'view_member_details'   // View detailed member information

  // Profile permissions
  | 'manage_own_profile'    // Edit own profile
  | 'view_own_profile'      // View own profile;