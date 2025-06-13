#!/usr/bin/env node

/**
 * Database Testing Script
 * Run this to test your Supabase database connection and setup
 *
 * Usage: node scripts/test-db.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env file
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
          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, '');
          if (key && cleanValue) {
            process.env[key] = cleanValue;
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Could not load .env file:', error.message);
    console.error('Please make sure you have a .env file with your Supabase credentials');
    process.exit(1);
  }
}

// Load environment variables
loadEnvFile();

// Initialize Supabase client
function initializeSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log('🔍 Debug - Environment variables:');
  console.log(`- SUPABASE_URL: ${supabaseUrl ? `${supabaseUrl.substring(0, 50)}...` : 'Missing'}`);
  console.log(`- SUPABASE_ANON_KEY: ${supabaseKey ? `${supabaseKey.substring(0, 30)}...` : 'Missing'}`);

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please check your .env file contains:');
    console.error('- SUPABASE_URL=https://your-project.supabase.co');
    console.error('- SUPABASE_ANON_KEY=your_anon_key_here');
    console.error('\nCurrent values:');
    console.error(`- SUPABASE_URL: ${supabaseUrl || 'NOT SET'}`);
    console.error(`- SUPABASE_ANON_KEY: ${supabaseKey ? 'SET' : 'NOT SET'}`);
    process.exit(1);
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error('❌ Invalid SUPABASE_URL format');
    console.error(`Expected: https://your-project.supabase.co`);
    console.error(`Got: ${supabaseUrl}`);
    process.exit(1);
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Test database connection and tables
async function testDatabaseSetup() {
  console.log('🔍 Testing Supabase database connection...');

  const supabase = initializeSupabase();
  const results = {
    connection: false,
    tables: {
      hoas: false,
      profiles: false,
      bookings: false,
      booking_participants: false,
      push_subscriptions: false
    },
    auth: false,
    errors: []
  };

  try {
    // Test basic connection with a simple query
    const { data, error } = await supabase.rpc('version');
    if (error) {
      // If version RPC fails, try a simple table query
      const { data: testData, error: testError } = await supabase.from('hoas').select('id').limit(1);
      if (testError) {
        results.errors.push(`Connection test failed: ${testError.message}`);
      } else {
        results.connection = true;
      }
    } else {
      results.connection = true;
    }

    // Test table existence and basic queries
    const tables = ['hoas', 'profiles', 'bookings', 'booking_participants', 'push_subscriptions'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          // Check if it's a table not found error vs other errors
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            results.errors.push(`Table ${table}: Table does not exist (not created yet)`);
          } else {
            results.errors.push(`Table ${table}: ${error.message}`);
          }
          results.tables[table] = false;
        } else {
          results.tables[table] = true;
        }
      } catch (err) {
        results.errors.push(`Table ${table}: ${err.message || 'Unknown error'}`);
        results.tables[table] = false;
      }
    }

    // Test auth configuration
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        results.errors.push(`Auth test: ${error.message}`);
      } else {
        results.auth = true;
      }
    } catch (err) {
      results.errors.push(`Auth test: ${err.message || 'Unknown error'}`);
    }

  } catch (err) {
    results.errors.push(`General error: ${err.message || 'Unknown error'}`);
  }

  return results;
}

// Print formatted test results
async function runDatabaseTests() {
  const results = await testDatabaseSetup();

  console.log('\n📊 Database Test Results:');
  console.log('========================');

  console.log(`🔗 Connection: ${results.connection ? '✅ Success' : '❌ Failed'}`);
  console.log(`🔐 Auth Setup: ${results.auth ? '✅ Success' : '❌ Failed'}`);

  console.log('\n📋 Tables:');
  Object.entries(results.tables).forEach(([table, status]) => {
    console.log(`  ${table}: ${status ? '✅ Found' : '❌ Missing'}`);
  });

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  }

  const allGood = results.connection &&
                  results.auth &&
                  Object.values(results.tables).every(status => status) &&
                  results.errors.length === 0;

  console.log(`\n🎯 Overall Status: ${allGood ? '✅ All tests passed!' : '❌ Some tests failed'}`);

  if (!allGood) {
    console.log('\n💡 Next Steps:');
    console.log('1. Check your .env file has correct Supabase credentials');
    console.log('2. Run the database/database-setup.sql script in your Supabase SQL editor');
    console.log('3. Verify your Supabase project is active and accessible');
  }

  return allGood;
}

// Test specific database operations
async function testDatabaseOperations() {
  console.log('\n🧪 Testing database operations...');

  const supabase = initializeSupabase();

  try {
    // Test creating a profile (this will fail without auth, but tests the query structure)
    const testProfile = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      hoa_id: '00000000-0000-0000-0000-000000000001', // Dummy HOA UUID
      full_name: 'Test User',
      phone_number: '+15551234567',
      household_id: 'test-household',
      role: 'member',
      prime_hours: 4,
      standard_hours: 8,
      last_reset: new Date().toISOString(),
      is_active: true
    };

    // This should fail due to RLS, but validates our schema
    const { error: profileError } = await supabase
      .from('profiles')
      .insert(testProfile);

    if (profileError) {
      // Expected to fail due to RLS - this is actually good!
      if (profileError.message.includes('row-level security')) {
        console.log('✅ RLS is properly configured for profiles table');
      } else {
        console.log(`⚠️  Profile insert error: ${profileError.message}`);
      }
    }

    // Test booking structure
    const testBooking = {
      hoa_id: '00000000-0000-0000-0000-000000000001', // Dummy HOA UUID
      organizer_id: '00000000-0000-0000-0000-000000000000',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      courts: [1, 2],
      status: 'pending',
      total_players: 4,
      guest_count: 0,
      min_members: 2,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      is_prime_time: false
    };

    const { error: bookingError } = await supabase
      .from('bookings')
      .insert(testBooking);

    if (bookingError) {
      if (bookingError.message.includes('row-level security')) {
        console.log('✅ RLS is properly configured for bookings table');
      } else if (bookingError.message.includes('must belong to the specified HOA')) {
        console.log('✅ HOA validation triggers are working correctly');
      } else {
        console.log(`⚠️  Booking insert error: ${bookingError.message}`);
      }
    }

    console.log('✅ Database operations test completed');

  } catch (err) {
    console.error('❌ Database operations test failed:', err);
  }
}

async function main() {
  console.log('🚀 HOA Court Reservations - Database Test Suite');
  console.log('================================================\n');

  try {
    // Run basic connection and table tests
    const basicTestsPassed = await runDatabaseTests();

    if (basicTestsPassed) {
      // Run more detailed operation tests
      await testDatabaseOperations();

      console.log('\n🎉 Database setup appears to be working correctly!');
      console.log('\nYou can now:');
      console.log('1. Start your development server: npm run dev');
      console.log('2. Test user registration and login');
      console.log('3. Create test bookings');

    } else {
      console.log('\n🔧 Please fix the issues above before proceeding.');
      console.log('\nCommon solutions:');
      console.log('1. Copy .env.example to .env and fill in your Supabase credentials');
      console.log('2. Run the database/database-setup.sql script in your Supabase SQL editor');
      console.log('3. Check that your Supabase project is active');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  }
}

main();
