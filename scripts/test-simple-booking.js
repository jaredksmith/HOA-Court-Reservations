#!/usr/bin/env node

/**
 * Simple Booking Test
 * Tests basic booking operations without complex joins
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');

    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          const value = trimmedLine.substring(equalIndex + 1).trim();
          const cleanValue = value.replace(/^["']|["']$/g, '');
          if (key && cleanValue) {
            process.env[key] = cleanValue;
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Could not load .env file:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🧪 Simple Booking Test');
  console.log('======================\n');

  loadEnvFile();
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    // Login as super admin
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@hoatest.com',
      password: 'SuperAdmin123!'
    });

    if (loginError) throw loginError;
    console.log('✅ Logged in successfully');

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single();

    if (profileError) throw profileError;
    console.log('✅ Profile retrieved');

    // Create simple booking without joins
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    startTime.setHours(10, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(12, 0, 0, 0);
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    
    const bookingData = {
      hoa_id: profile.hoa_id,
      organizer_id: profile.user_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      courts: [1],
      status: 'pending',
      total_players: 2,
      guest_count: 0,
      min_members: 1,
      expires_at: expiresAt.toISOString(),
      is_prime_time: false
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) throw bookingError;
    console.log('✅ Booking created:', booking.id);

    // Test simple booking retrieval
    const { data: retrievedBooking, error: retrieveError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking.id)
      .single();

    if (retrieveError) throw retrieveError;
    console.log('✅ Booking retrieved');

    // Test with manual join using separate queries
    const { data: organizer, error: organizerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', retrievedBooking.organizer_id)
      .single();

    if (organizerError) throw organizerError;
    console.log('✅ Organizer profile retrieved:', organizer.full_name);

    // Test the problematic join syntax
    console.log('\n🔍 Testing PostgREST join syntax...');
    
    try {
      const { data: joinedBooking, error: joinError } = await supabase
        .from('bookings')
        .select(`
          *,
          organizer:profiles!organizer_id(*)
        `)
        .eq('id', booking.id)
        .single();

      if (joinError) {
        console.log('❌ PostgREST join failed:', joinError.message);
        console.log('   This is the issue we need to fix');
      } else {
        console.log('✅ PostgREST join worked!');
      }
    } catch (err) {
      console.log('❌ PostgREST join error:', err.message);
    }

    // Cleanup
    await supabase
      .from('bookings')
      .delete()
      .eq('id', booking.id);
    
    console.log('✅ Test booking cleaned up');

    await supabase.auth.signOut();
    console.log('✅ Signed out');

    console.log('\n🎯 Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
