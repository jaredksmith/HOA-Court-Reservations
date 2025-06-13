-- Migration: Add phone_number column to profiles table
-- Run this if you already have an existing profiles table

-- =============================================
-- 1. ADD PHONE NUMBER COLUMN
-- =============================================

-- Add phone_number column (initially allow NULL for existing records)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- =============================================
-- 2. ADD PHONE NUMBER VALIDATION CONSTRAINT
-- =============================================

-- Add constraint for phone number format validation
-- This constraint allows US phone number formats
ALTER TABLE profiles 
ADD CONSTRAINT IF NOT EXISTS valid_phone_format 
CHECK (
  phone_number IS NULL OR 
  phone_number ~ '^(\+1\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$'
);

-- =============================================
-- 3. CREATE INDEX FOR PERFORMANCE
-- =============================================

-- Add index on phone_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);

-- =============================================
-- 4. UPDATE EXISTING RECORDS (OPTIONAL)
-- =============================================

-- If you want to add placeholder phone numbers for existing users
-- Uncomment the following lines and modify as needed:

/*
-- Add placeholder phone numbers for existing records
UPDATE profiles 
SET phone_number = '+1555000' || LPAD(id::text, 4, '0')
WHERE phone_number IS NULL;
*/

-- =============================================
-- 5. MAKE PHONE NUMBER REQUIRED (AFTER DATA UPDATE)
-- =============================================

-- After you've updated existing records with phone numbers,
-- you can make the column required by running:

/*
-- Make phone_number NOT NULL (only after updating existing records)
ALTER TABLE profiles 
ALTER COLUMN phone_number SET NOT NULL;
*/

-- =============================================
-- 6. UPDATE TRIGGER FUNCTION
-- =============================================

-- Update the trigger function to handle phone numbers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone_number, household_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'household_id', 'default')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. VERIFY MIGRATION
-- =============================================

-- Check the updated table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
  AND table_schema = 'public';

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
  AND schemaname = 'public';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Summary of changes:
-- ✅ Added phone_number column to profiles table
-- ✅ Added phone number format validation constraint
-- ✅ Added index for phone number lookups
-- ✅ Updated trigger function for new user creation
-- ⚠️  Existing records will have NULL phone_number (update manually)
-- ⚠️  Column is nullable until you update existing records

-- Next steps:
-- 1. Update existing user records with phone numbers
-- 2. Make phone_number column NOT NULL (uncomment section 5)
-- 3. Test user registration with phone number
-- 4. Update your application code to handle phone numbers
