-- Address Fields Migration
-- Run this script in your Supabase SQL editor to add address fields to existing profiles table

-- =============================================
-- 1. ADD ADDRESS FIELDS TO PROFILES TABLE
-- =============================================

-- Add address fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- =============================================
-- 2. VERIFY THE MIGRATION
-- =============================================

-- Verify the new columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('street_address', 'city', 'state', 'zip_code')
ORDER BY ordinal_position;

-- Show complete profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
