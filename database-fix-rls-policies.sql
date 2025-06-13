-- =============================================
-- FIX RLS INFINITE RECURSION POLICIES
-- =============================================
-- This script fixes the infinite recursion issue in RLS policies
-- for bookings and booking_participants tables.
--
-- Run this in your Supabase SQL Editor to fix the issue.
-- =============================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view bookings in their HOA" ON bookings;
DROP POLICY IF EXISTS "Users can view participants in their HOA bookings" ON booking_participants;
DROP POLICY IF EXISTS "Organizers can add participants from their HOA" ON booking_participants;

-- Recreate bookings policies without circular dependencies
CREATE POLICY "Users can view bookings in their HOA" ON bookings
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    hoa_id = get_user_hoa_id(auth.uid()) AND
    (auth.uid() = organizer_id OR is_hoa_admin(auth.uid()))
  );

-- Recreate booking_participants policies without circular dependencies
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

-- Verify the fix worked
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_participants')
ORDER BY tablename, policyname;
