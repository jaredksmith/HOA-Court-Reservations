-- =============================================
-- FIX FOREIGN KEY RELATIONSHIPS FOR POSTGREST
-- =============================================
-- This script fixes foreign key relationships to work properly with PostgREST
-- The issue is that organizer_id references auth.users instead of profiles
-- which makes PostgREST unable to find the relationship
-- =============================================

-- First, let's check if we have any existing bookings
-- If we do, we'll need to handle them carefully

-- Drop existing foreign key constraint on organizer_id
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_organizer_id_fkey;

-- Add new foreign key constraint that references profiles.user_id instead
-- This allows PostgREST to understand the relationship
ALTER TABLE bookings 
ADD CONSTRAINT bookings_organizer_id_fkey 
FOREIGN KEY (organizer_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Also fix booking_participants if it has similar issues
ALTER TABLE booking_participants DROP CONSTRAINT IF EXISTS booking_participants_user_id_fkey;

-- Add proper foreign key for booking_participants
ALTER TABLE booking_participants 
ADD CONSTRAINT booking_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Verify the relationships are now correct
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('bookings', 'booking_participants')
ORDER BY tc.table_name, kcu.column_name;
