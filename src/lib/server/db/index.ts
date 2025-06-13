import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { User, Profile, Booking, BookingParticipant, PushSubscription, HOA, HOACreationData, UserRole } from '$lib/types';

// Validate required environment variables
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required Supabase environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please check your .env file and ensure all Supabase credentials are set');
  console.error('Get these from: Supabase Dashboard → Settings → API → Project API keys');
}

// Initialize Supabase client for user operations (respects RLS)
const supabase = createClient(
  env.SUPABASE_URL || 'http://localhost:54321',
  env.SUPABASE_ANON_KEY || 'mock-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

// Initialize Supabase admin client for server operations (bypasses RLS)
const supabaseAdmin = createClient(
  env.SUPABASE_URL || 'http://localhost:54321',
  env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('Database connection check failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Database connection check error:', err);
    return false;
  }
}

// Export clients for use in other modules
export { supabase, supabaseAdmin };

// =============================================
// HOA MANAGEMENT FUNCTIONS
// =============================================

// Create a new HOA (super admin only)
export async function createHOA(hoaData: HOACreationData, adminUserId: string): Promise<HOA> {
  const { data, error } = await supabaseAdmin.rpc('create_hoa', {
    hoa_name: hoaData.name,
    hoa_slug: hoaData.slug,
    admin_user_id: adminUserId,
    admin_full_name: hoaData.admin_full_name,
    admin_phone_number: hoaData.admin_phone_number,
    admin_household_id: hoaData.admin_household_id || 'admin'
  });

  if (error) throw error;

  // Get the created HOA
  const hoa = await getHOAById(data);
  if (!hoa) throw new Error('Failed to retrieve created HOA');

  // Update HOA with additional settings if provided
  if (hoaData.description || hoaData.address || hoaData.contact_email) {
    await updateHOA(data, {
      description: hoaData.description,
      address: hoaData.address,
      contact_email: hoaData.contact_email,
      contact_phone: hoaData.contact_phone,
      website_url: hoaData.website_url,
      total_courts: hoaData.total_courts,
      court_names: hoaData.court_names
    });
  }

  return hoa;
}

// Get HOA by ID
export async function getHOAById(id: string): Promise<HOA | null> {
  const { data, error } = await supabase
    .from('hoas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as HOA;
}

// Get HOA by slug
export async function getHOABySlug(slug: string): Promise<HOA | null> {
  const { data, error } = await supabase
    .from('hoas')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as HOA;
}

// Get HOA by invitation code
export async function getHOAByInvitationCode(code: string): Promise<HOA | null> {
  const { data, error } = await supabase
    .from('hoas')
    .select('*')
    .eq('invitation_code', code)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as HOA;
}

// Get all HOAs (super admin only)
export async function getAllHOAs(): Promise<HOA[]> {
  const { data, error } = await supabaseAdmin
    .from('hoas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as HOA[];
}

// Update HOA
export async function updateHOA(id: string, updates: Partial<HOA>): Promise<void> {
  const { error } = await supabaseAdmin
    .from('hoas')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

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

export async function getUserBySessionId(accessToken: string) {
  try {
    // Use the admin client to verify the JWT token
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error) {
      console.log('⚠️  Token validation failed:', error.message);
      return null;
    }

    if (!data.user) {
      console.log('⚠️  No user found for token');
      return null;
    }

    // Convert Supabase user to our User type
    return {
      id: data.user.id,
      email: data.user.email || '',
      household_id: '', // Will be populated from profile
      created_at: data.user.created_at
    } as User;
  } catch (err) {
    console.error('❌ Error validating token:', err);
    return null;
  }
}

// Profile functions
export async function createProfile(profile: Omit<Profile, 'id' | 'created_at' | 'joined_at'>): Promise<Profile> {
  // Validate required fields
  if (!profile.phone_number || profile.phone_number.trim() === '') {
    throw new Error('Phone number is required');
  }
  if (!profile.hoa_id) {
    throw new Error('HOA ID is required');
  }

  const profileData = {
    ...profile,
    created_at: new Date().toISOString(),
    joined_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    // Handle unique constraint violations
    if (error.code === '23505' && error.message.includes('phone_number')) {
      throw new Error('This phone number is already registered in this HOA');
    }
    throw error;
  }
  return data as Profile;
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      hoa:hoas(*)
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Profile;
}

// Get profiles by HOA ID
export async function getProfilesByHOAId(hoaId: string, activeOnly: boolean = true): Promise<Profile[]> {
  let query = supabase
    .from('profiles')
    .select(`
      *,
      hoa:hoas(*)
    `)
    .eq('hoa_id', hoaId);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data as Profile[];
}

// Update profile role (admin only)
export async function updateProfileRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('user_id', userId);

  if (error) throw error;
}

// Deactivate profile (admin only)
export async function deactivateProfile(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (error) throw error;
}

export async function resetHOAUserHours(hoaId: string, resetData: { prime_hours: number, standard_hours: number, last_reset: string }): Promise<void> {
  // Use admin client to bypass RLS for bulk operations
  const { error } = await supabaseAdmin.rpc('reset_hoa_user_hours', {
    target_hoa_id: hoaId,
    prime_hours_new: resetData.prime_hours,
    standard_hours_new: resetData.standard_hours
  });

  if (error) throw error;
}

// Booking functions
export async function createBooking(booking: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> {
  // Ensure hoa_id is provided
  if (!booking.hoa_id) {
    throw new Error('HOA ID is required for booking');
  }

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

export async function getBookingById(id: string): Promise<Booking | null> {
  // Get booking data first
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (bookingError) {
    if (bookingError.code === 'PGRST116') return null;
    throw bookingError;
  }

  // Get related data separately to avoid PostgREST join issues
  const [hoaResult, organizerResult, participantsResult] = await Promise.all([
    supabase.from('hoas').select('*').eq('id', booking.hoa_id).single(),
    supabase.from('profiles').select('*').eq('user_id', booking.organizer_id).single(),
    supabase.from('booking_participants').select(`
      *,
      user:profiles!user_id(*)
    `).eq('booking_id', booking.id)
  ]);

  // Combine the data
  const result = {
    ...booking,
    hoa: hoaResult.data,
    organizer: organizerResult.data,
    participants: participantsResult.data || []
  };

  return result as Booking;
}

// Get bookings by HOA ID
export async function getBookingsByHOAId(hoaId: string, limit?: number): Promise<Booking[]> {
  // Get bookings first
  let query = supabase
    .from('bookings')
    .select('*')
    .eq('hoa_id', hoaId)
    .order('start_time', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: bookings, error } = await query;
  if (error) throw error;

  if (!bookings || bookings.length === 0) {
    return [];
  }

  // Get related data for all bookings
  const organizerIds = [...new Set(bookings.map(b => b.organizer_id))];

  const [hoaResult, organizersResult] = await Promise.all([
    supabase.from('hoas').select('*').eq('id', hoaId).single(),
    supabase.from('profiles').select('*').in('user_id', organizerIds)
  ]);

  // Create a map of organizers for quick lookup
  const organizersMap = new Map();
  if (organizersResult.data) {
    organizersResult.data.forEach(org => {
      organizersMap.set(org.user_id, org);
    });
  }

  // Combine the data
  const result = bookings.map(booking => ({
    ...booking,
    hoa: hoaResult.data,
    organizer: organizersMap.get(booking.organizer_id),
    participants: [] // We'll load participants separately when needed
  }));

  return result as Booking[];
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

// Admin functions (use service role key to bypass RLS)
export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      hoa:hoas(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Profile[];
}

export async function getAllBookings(): Promise<Booking[]> {
  // Get all bookings first
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  if (!bookings || bookings.length === 0) {
    return [];
  }

  // Get related data
  const hoaIds = [...new Set(bookings.map(b => b.hoa_id))];
  const organizerIds = [...new Set(bookings.map(b => b.organizer_id))];

  const [hoasResult, organizersResult] = await Promise.all([
    supabaseAdmin.from('hoas').select('*').in('id', hoaIds),
    supabaseAdmin.from('profiles').select('*').in('user_id', organizerIds)
  ]);

  // Create maps for quick lookup
  const hoasMap = new Map();
  const organizersMap = new Map();

  if (hoasResult.data) {
    hoasResult.data.forEach(hoa => hoasMap.set(hoa.id, hoa));
  }

  if (organizersResult.data) {
    organizersResult.data.forEach(org => organizersMap.set(org.user_id, org));
  }

  // Combine the data
  const result = bookings.map(booking => ({
    ...booking,
    hoa: hoasMap.get(booking.hoa_id),
    organizer: organizersMap.get(booking.organizer_id),
    participants: [] // Load separately when needed
  }));

  return result as Booking[];
}

export async function deleteExpiredBookings(): Promise<void> {
  const { error } = await supabaseAdmin
    .from('bookings')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'pending');

  if (error) throw error;
}

// Get HOA statistics
export async function getHOAStats(hoaId: string) {
  const [profilesResult, bookingsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, is_active')
      .eq('hoa_id', hoaId),
    supabase
      .from('bookings')
      .select('id, status')
      .eq('hoa_id', hoaId)
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (bookingsResult.error) throw bookingsResult.error;

  const profiles = profilesResult.data;
  const bookings = bookingsResult.data;

  return {
    total_members: profiles.length,
    active_members: profiles.filter(p => p.is_active).length,
    total_bookings: bookings.length,
    pending_bookings: bookings.filter(b => b.status === 'pending').length,
    confirmed_bookings: bookings.filter(b => b.status === 'confirmed').length,
    cancelled_bookings: bookings.filter(b => b.status === 'cancelled').length
  };
}

// Export all functions as a db object for backward compatibility
export const db = {
  // User operations (uses anon key, respects RLS)
  createUser,
  getUserBySessionId,
  createProfile,
  getProfileByUserId,
  createBooking,
  getBookingById,
  updateBookingStatus,
  addBookingParticipants,
  updateParticipantStatus,
  savePushSubscription,

  // HOA operations
  createHOA,
  getHOAById,
  getHOABySlug,
  getHOAByInvitationCode,
  getAllHOAs,
  updateHOA,
  getProfilesByHOAId,
  getBookingsByHOAId,
  updateProfileRole,
  deactivateProfile,
  getHOAStats,

  // Admin operations (uses service role key, bypasses RLS)
  resetHOAUserHours,
  getAllProfiles,
  getAllBookings,
  deleteExpiredBookings
};