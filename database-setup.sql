-- HOA Court Reservations Database Setup
-- Run this script in your Supabase SQL editor

-- =============================================
-- 1. CREATE TABLES
-- =============================================

-- HOAs table (multi-tenant support)
CREATE TABLE IF NOT EXISTS hoas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,

  -- Court configuration
  total_courts INTEGER DEFAULT 4,
  court_names TEXT[] DEFAULT ARRAY['Court 1', 'Court 2', 'Court 3', 'Court 4'],

  -- Hour allocation settings
  default_prime_hours INTEGER DEFAULT 4,
  default_standard_hours INTEGER DEFAULT 8,

  -- Booking settings
  max_advance_booking_days INTEGER DEFAULT 14,
  booking_window_hours INTEGER DEFAULT 2,
  prime_time_start TIME DEFAULT '17:00',
  prime_time_end TIME DEFAULT '21:00',

  -- HOA status and settings
  is_active BOOLEAN DEFAULT TRUE,
  invitation_code TEXT UNIQUE,
  allow_guest_bookings BOOLEAN DEFAULT TRUE,
  max_guests_per_booking INTEGER DEFAULT 2,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_court_count CHECK (total_courts > 0 AND total_courts <= 20),
  CONSTRAINT valid_hours CHECK (default_prime_hours >= 0 AND default_standard_hours >= 0)
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  hoa_id UUID REFERENCES hoas(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  household_id TEXT NOT NULL,

  -- Address fields
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- User role within HOA
  role TEXT CHECK (role IN ('super_admin', 'hoa_admin', 'member')) DEFAULT 'member',

  -- Hour allocations (can be customized per user)
  prime_hours INTEGER DEFAULT 4,
  standard_hours INTEGER DEFAULT 8,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User status
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_phone_format CHECK (
    phone_number ~ '^(\+1\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$'
  ),
  CONSTRAINT valid_hours CHECK (prime_hours >= 0 AND standard_hours >= 0),

  -- Phone number unique per HOA (not globally)
  UNIQUE(hoa_id, phone_number)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hoa_id UUID REFERENCES hoas(id) ON DELETE CASCADE,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  courts INTEGER[] NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  total_players INTEGER NOT NULL,
  guest_count INTEGER DEFAULT 0,
  min_members INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_prime_time BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking participants table
CREATE TABLE IF NOT EXISTS booking_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('invited', 'accepted', 'declined')) DEFAULT 'invited',
  hours_charged INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, user_id)
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hoa_id UUID REFERENCES hoas(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- =============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- HOAs indexes
CREATE INDEX IF NOT EXISTS idx_hoas_slug ON hoas(slug);
CREATE INDEX IF NOT EXISTS idx_hoas_invitation_code ON hoas(invitation_code);
CREATE INDEX IF NOT EXISTS idx_hoas_is_active ON hoas(is_active);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_hoa_id ON profiles(hoa_id);
CREATE INDEX IF NOT EXISTS idx_profiles_household_id ON profiles(household_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_hoa_phone ON profiles(hoa_id, phone_number);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_hoa_id ON bookings(hoa_id);
CREATE INDEX IF NOT EXISTS idx_bookings_organizer_id ON bookings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_courts ON bookings USING GIN(courts);
CREATE INDEX IF NOT EXISTS idx_bookings_hoa_start_time ON bookings(hoa_id, start_time);

-- Booking participants indexes
CREATE INDEX IF NOT EXISTS idx_booking_participants_booking_id ON booking_participants(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_participants_user_id ON booking_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_participants_status ON booking_participants(status);

-- Push subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_hoa_id ON push_subscriptions(hoa_id);

-- =============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE hoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. CREATE RLS POLICIES
-- =============================================

-- Helper function to get user's HOA ID
CREATE OR REPLACE FUNCTION get_user_hoa_id(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT hoa_id FROM profiles WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = 'super_admin' FROM profiles WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is HOA admin
CREATE OR REPLACE FUNCTION is_hoa_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role IN ('super_admin', 'hoa_admin') FROM profiles WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- HOAs Policies
CREATE POLICY "Super admins can manage all HOAs" ON hoas
  FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own HOA" ON hoas
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    id = get_user_hoa_id(auth.uid())
  );

-- Profiles Policies
CREATE POLICY "Users can view profiles in their HOA" ON profiles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (hoa_id = get_user_hoa_id(auth.uid()) OR is_super_admin(auth.uid()))
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HOA admins can manage profiles in their HOA" ON profiles
  FOR ALL USING (
    is_hoa_admin(auth.uid()) AND
    (hoa_id = get_user_hoa_id(auth.uid()) OR is_super_admin(auth.uid()))
  );

-- Bookings Policies (Fixed to avoid circular dependencies)
CREATE POLICY "Users can view bookings in their HOA" ON bookings
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    hoa_id = get_user_hoa_id(auth.uid()) AND
    (auth.uid() = organizer_id OR is_hoa_admin(auth.uid()))
  );

CREATE POLICY "Users can create bookings in their HOA" ON bookings
  FOR INSERT WITH CHECK (
    auth.uid() = organizer_id AND
    hoa_id = get_user_hoa_id(auth.uid())
  );

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (
    auth.uid() = organizer_id AND
    hoa_id = get_user_hoa_id(auth.uid())
  );

CREATE POLICY "HOA admins can manage bookings in their HOA" ON bookings
  FOR ALL USING (
    is_hoa_admin(auth.uid()) AND
    (hoa_id = get_user_hoa_id(auth.uid()) OR is_super_admin(auth.uid()))
  );

-- Booking Participants Policies (Fixed to avoid circular dependencies)
CREATE POLICY "Users can view participants in their HOA" ON booking_participants
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (auth.uid() = user_id OR is_hoa_admin(auth.uid()))
  );

CREATE POLICY "HOA members can add participants from their HOA" ON booking_participants
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = booking_participants.user_id
      AND p.hoa_id = get_user_hoa_id(auth.uid())
      AND p.is_active = TRUE
    )
  );

CREATE POLICY "Users can update own participation" ON booking_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Push Subscriptions Policies
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
  FOR ALL USING (
    auth.uid() = user_id AND
    hoa_id = get_user_hoa_id(auth.uid())
  );

-- =============================================
-- 5. CREATE USEFUL FUNCTIONS
-- =============================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if HOA ID is provided in metadata
  IF NEW.raw_user_meta_data->>'hoa_id' IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, hoa_id, full_name, phone_number, household_id, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'hoa_id')::UUID,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
      COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
      COALESCE(NEW.raw_user_meta_data->>'household_id', 'default'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to reset user hours for a specific HOA (for admin use)
CREATE OR REPLACE FUNCTION public.reset_hoa_user_hours(
  target_hoa_id UUID,
  prime_hours_new INTEGER DEFAULT 4,
  standard_hours_new INTEGER DEFAULT 8
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    prime_hours = prime_hours_new,
    standard_hours = standard_hours_new,
    last_reset = NOW()
  WHERE hoa_id = target_hoa_id AND role = 'member'; -- Don't reset admin hours
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new HOA (for super admins)
CREATE OR REPLACE FUNCTION public.create_hoa(
  hoa_name TEXT,
  hoa_slug TEXT,
  admin_user_id UUID,
  admin_full_name TEXT,
  admin_phone_number TEXT,
  admin_household_id TEXT DEFAULT 'admin'
)
RETURNS UUID AS $$
DECLARE
  new_hoa_id UUID;
  invitation_code TEXT;
BEGIN
  -- Generate unique invitation code
  invitation_code := upper(substring(md5(random()::text) from 1 for 8));

  -- Create HOA
  INSERT INTO hoas (name, slug, invitation_code)
  VALUES (hoa_name, hoa_slug, invitation_code)
  RETURNING id INTO new_hoa_id;

  -- Create HOA admin profile
  INSERT INTO profiles (user_id, hoa_id, full_name, phone_number, household_id, role)
  VALUES (admin_user_id, new_hoa_id, admin_full_name, admin_phone_number, admin_household_id, 'hoa_admin');

  RETURN new_hoa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's available hours
CREATE OR REPLACE FUNCTION public.get_user_available_hours(user_uuid UUID)
RETURNS TABLE(prime_hours INTEGER, standard_hours INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT p.prime_hours, p.standard_hours
  FROM profiles p
  WHERE p.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. DATA INTEGRITY TRIGGER FUNCTIONS
-- =============================================

-- Function to validate booking organizer belongs to the same HOA
CREATE OR REPLACE FUNCTION validate_booking_organizer_hoa()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if organizer belongs to the specified HOA
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = NEW.organizer_id
    AND p.hoa_id = NEW.hoa_id
    AND p.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Booking organizer must belong to the specified HOA';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate push subscription user belongs to the HOA
CREATE OR REPLACE FUNCTION validate_push_subscription_user_hoa()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user belongs to the specified HOA
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = NEW.user_id
    AND p.hoa_id = NEW.hoa_id
    AND p.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Push subscription user must belong to the specified HOA';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate booking participant belongs to the same HOA as booking
CREATE OR REPLACE FUNCTION validate_booking_participant_hoa()
RETURNS TRIGGER AS $$
DECLARE
  booking_hoa_id UUID;
BEGIN
  -- Get the HOA ID from the booking
  SELECT hoa_id INTO booking_hoa_id
  FROM bookings
  WHERE id = NEW.booking_id;

  -- Check if participant belongs to the same HOA as the booking
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = NEW.user_id
    AND p.hoa_id = booking_hoa_id
    AND p.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Booking participant must belong to the same HOA as the booking';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to enforce data integrity
CREATE OR REPLACE TRIGGER trigger_validate_booking_organizer_hoa
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_organizer_hoa();

CREATE OR REPLACE TRIGGER trigger_validate_push_subscription_user_hoa
  BEFORE INSERT OR UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_push_subscription_user_hoa();

CREATE OR REPLACE TRIGGER trigger_validate_booking_participant_hoa
  BEFORE INSERT OR UPDATE ON booking_participants
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_participant_hoa();

-- =============================================
-- 7. INSERT SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =============================================

-- Create a sample HOA for testing
-- Uncomment the following lines if you want sample data for testing

/*
-- Sample HOA
INSERT INTO hoas (name, slug, invitation_code, description) VALUES
  ('Sunset Ridge HOA', 'sunset-ridge', 'SUNSET01', 'A beautiful community with 4 pickleball courts'),
  ('Oak Valley Community', 'oak-valley', 'OAKVAL02', 'Family-friendly community with recreational facilities');

-- Note: You'll need to replace the UUIDs with actual user IDs from auth.users
-- Sample profiles (after creating users in auth.users)
INSERT INTO profiles (user_id, hoa_id, full_name, phone_number, household_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001',
   (SELECT id FROM hoas WHERE slug = 'sunset-ridge'),
   'Super Admin', '+15551234567', 'admin', 'super_admin'),
  ('00000000-0000-0000-0000-000000000002',
   (SELECT id FROM hoas WHERE slug = 'sunset-ridge'),
   'HOA Admin', '+15551234568', 'admin', 'hoa_admin'),
  ('00000000-0000-0000-0000-000000000003',
   (SELECT id FROM hoas WHERE slug = 'sunset-ridge'),
   'John Smith', '+15551234569', 'household-1', 'member'),
  ('00000000-0000-0000-0000-000000000004',
   (SELECT id FROM hoas WHERE slug = 'oak-valley'),
   'Jane Doe', '+15551234570', 'household-2', 'member');

-- Sample booking
INSERT INTO bookings (hoa_id, organizer_id, start_time, end_time, courts, total_players, min_members) VALUES
  ((SELECT id FROM hoas WHERE slug = 'sunset-ridge'),
   '00000000-0000-0000-0000-000000000003',
   NOW() + INTERVAL '1 day',
   NOW() + INTERVAL '1 day 2 hours',
   ARRAY[1, 2],
   4,
   2);
*/

-- =============================================
-- 8. SETUP COMPLETE
-- =============================================

-- Verify tables were created
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('hoas', 'profiles', 'bookings', 'booking_participants', 'push_subscriptions')
ORDER BY tablename;

-- Verify HOA table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hoas' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify profiles table has hoa_id
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
