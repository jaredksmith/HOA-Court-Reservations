# Supabase Database Integration Setup Guide

## 🚀 Quick Start Checklist

- [ ] Create Supabase project
- [ ] Set up environment variables
- [ ] Create database schema
- [ ] Configure Row Level Security (RLS)
- [ ] Test local development
- [ ] Configure Vercel deployment
- [ ] Test production deployment

## 1. Environment Variables Setup

### Required Environment Variables

You need these environment variables for both local development and production:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Web Push Configuration
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@example.com

# Application Configuration
PUBLIC_APP_URL=http://localhost:5173  # For local dev
NODE_ENV=development
```

### Step 1.1: Create Local Environment File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project or select existing
   - Go to Settings → API
   - Copy the Project URL and anon/service_role keys

3. Generate VAPID keys for push notifications:
   ```bash
   npx web-push generate-vapid-keys
   ```

4. Fill in your `.env` file with real values

### Step 1.2: Configure Vercel Environment Variables

In your Vercel dashboard:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add all the same variables from your `.env` file
4. For production, change `PUBLIC_APP_URL` to your domain

## 2. Database Schema Setup

### Required Tables

Your application needs these tables in Supabase:

#### 2.1 Profiles Table
```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  household_id TEXT NOT NULL,
  prime_hours INTEGER DEFAULT 4,
  standard_hours INTEGER DEFAULT 8,
  is_admin BOOLEAN DEFAULT FALSE,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Phone number validation constraint
  CONSTRAINT valid_phone_format CHECK (
    phone_number ~ '^(\+1\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$'
  )
);
```

#### 2.2 Bookings Table
```sql
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
```

#### 2.3 Booking Participants Table
```sql
CREATE TABLE booking_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('invited', 'accepted', 'declined')) DEFAULT 'invited',
  hours_charged INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.4 Push Subscriptions Table
```sql
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

### 2.5 Create Indexes for Performance
```sql
-- Profiles indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_household_id ON profiles(household_id);

-- Bookings indexes
CREATE INDEX idx_bookings_organizer_id ON bookings(organizer_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Booking participants indexes
CREATE INDEX idx_booking_participants_booking_id ON booking_participants(booking_id);
CREATE INDEX idx_booking_participants_user_id ON booking_participants(user_id);

-- Push subscriptions indexes
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```

## 3. Row Level Security (RLS) Configuration

Enable RLS and create policies for each table:

### 3.1 Enable RLS
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
```

### 3.2 Create RLS Policies

#### Profiles Policies
```sql
-- Users can view all profiles (for booking invitations)
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### Bookings Policies
```sql
-- Users can view bookings they're involved in
CREATE POLICY "Users can view relevant bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = organizer_id OR
    EXISTS (
      SELECT 1 FROM booking_participants 
      WHERE booking_id = bookings.id AND user_id = auth.uid()
    )
  );

-- Users can create bookings
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = organizer_id);
```

#### Booking Participants Policies
```sql
-- Users can view participants for bookings they're involved in
CREATE POLICY "Users can view relevant participants" ON booking_participants
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id AND organizer_id = auth.uid()
    )
  );

-- Organizers can add participants
CREATE POLICY "Organizers can add participants" ON booking_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id AND organizer_id = auth.uid()
    )
  );

-- Users can update their own participation status
CREATE POLICY "Users can update own participation" ON booking_participants
  FOR UPDATE USING (auth.uid() = user_id);
```

#### Push Subscriptions Policies
```sql
-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

## 4. Testing Strategy

### 4.1 Local Development Testing

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test database connection:**
   - Check browser console for any Supabase connection errors
   - Try creating a test user account
   - Verify data appears in Supabase dashboard

3. **Test core functionality:**
   - User registration/login
   - Profile creation
   - Booking creation
   - Participant management

### 4.2 Production Deployment Testing

1. **Deploy to Vercel:**
   ```bash
   npm run build
   # Deploy via Vercel CLI or GitHub integration
   ```

2. **Verify environment variables:**
   - Check Vercel dashboard for all required env vars
   - Test that production app connects to Supabase

3. **Test production functionality:**
   - Complete user flow from registration to booking
   - Verify push notifications work
   - Check database operations in Supabase dashboard

## 5. Security Best Practices

### 5.1 Environment Variable Security
- Never commit `.env` files to Git
- Use different Supabase projects for development/production
- Rotate API keys regularly
- Use service role key only for server-side operations

### 5.2 Database Security
- Always use RLS policies
- Validate all user inputs
- Use prepared statements (Supabase handles this)
- Monitor database access logs

## 6. Troubleshooting

### Common Issues:

1. **"Invalid API key" errors:**
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
   - Check if keys are properly set in environment

2. **RLS policy errors:**
   - Ensure user is authenticated before database operations
   - Check policy conditions match your use case

3. **CORS errors:**
   - Verify PUBLIC_APP_URL matches your domain
   - Check Supabase project settings for allowed origins

4. **Build errors on Vercel:**
   - Ensure all environment variables are set
   - Check build logs for missing dependencies

## Next Steps

After completing this setup:
1. Test all functionality locally
2. Deploy to Vercel staging environment
3. Run end-to-end tests
4. Deploy to production
5. Monitor application performance and errors
