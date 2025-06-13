-- Fix PostgreSQL Constraint Issues - Multi-tenant HOA Database
-- Run this script to fix the subquery constraint errors

-- =============================================
-- 1. REMOVE PROBLEMATIC CHECK CONSTRAINTS
-- =============================================

-- Drop the problematic check constraints that use subqueries
-- These will be replaced with triggers

-- Remove booking organizer HOA match constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS booking_organizer_hoa_match;

-- Remove push subscription user HOA match constraint  
ALTER TABLE push_subscriptions 
DROP CONSTRAINT IF EXISTS subscription_user_hoa_match;

-- =============================================
-- 2. CREATE VALIDATION TRIGGER FUNCTIONS
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

-- =============================================
-- 3. CREATE TRIGGERS
-- =============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_validate_booking_organizer_hoa ON bookings;
DROP TRIGGER IF EXISTS trigger_validate_push_subscription_user_hoa ON push_subscriptions;
DROP TRIGGER IF EXISTS trigger_validate_booking_participant_hoa ON booking_participants;

-- Create triggers to enforce data integrity
CREATE TRIGGER trigger_validate_booking_organizer_hoa
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_organizer_hoa();

CREATE TRIGGER trigger_validate_push_subscription_user_hoa
  BEFORE INSERT OR UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_push_subscription_user_hoa();

CREATE TRIGGER trigger_validate_booking_participant_hoa
  BEFORE INSERT OR UPDATE ON booking_participants
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_participant_hoa();

-- =============================================
-- 4. VALIDATE EXISTING DATA
-- =============================================

-- Check for any existing data that violates the constraints
-- This will help identify data integrity issues

-- Check bookings with organizers not in the same HOA
SELECT 
  b.id as booking_id,
  b.hoa_id as booking_hoa,
  p.hoa_id as organizer_hoa,
  p.full_name as organizer_name
FROM bookings b
LEFT JOIN profiles p ON b.organizer_id = p.user_id
WHERE b.hoa_id != p.hoa_id OR p.hoa_id IS NULL;

-- Check push subscriptions with users not in the same HOA
SELECT 
  ps.id as subscription_id,
  ps.hoa_id as subscription_hoa,
  p.hoa_id as user_hoa,
  p.full_name as user_name
FROM push_subscriptions ps
LEFT JOIN profiles p ON ps.user_id = p.user_id
WHERE ps.hoa_id != p.hoa_id OR p.hoa_id IS NULL;

-- Check booking participants not in the same HOA as their booking
SELECT 
  bp.id as participant_id,
  b.hoa_id as booking_hoa,
  p.hoa_id as participant_hoa,
  p.full_name as participant_name
FROM booking_participants bp
JOIN bookings b ON bp.booking_id = b.id
LEFT JOIN profiles p ON bp.user_id = p.user_id
WHERE b.hoa_id != p.hoa_id OR p.hoa_id IS NULL;

-- =============================================
-- 5. VERIFICATION
-- =============================================

-- Verify triggers were created successfully
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name LIKE '%validate%hoa%'
ORDER BY event_object_table, trigger_name;

-- Verify functions were created successfully
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%validate%hoa%'
ORDER BY routine_name;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Summary of changes:
-- ✅ Removed problematic CHECK constraints with subqueries
-- ✅ Created trigger functions for data validation
-- ✅ Created triggers to enforce data integrity
-- ✅ Validated existing data for constraint violations
-- ✅ Verified trigger and function creation

-- The database now uses triggers instead of CHECK constraints
-- to maintain data integrity while being PostgreSQL compliant.

-- Next steps:
-- 1. Review any constraint violations found in step 4
-- 2. Fix any data integrity issues if found
-- 3. Test the application to ensure triggers work correctly
-- 4. Monitor application logs for any trigger-related errors
