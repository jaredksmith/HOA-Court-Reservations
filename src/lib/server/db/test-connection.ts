import { supabase, checkDatabaseConnection } from './index.js';

/**
 * Test database connection and basic operations
 * Use this to verify your Supabase setup is working correctly
 */
export async function testDatabaseSetup() {
  console.log('🔍 Testing Supabase database connection...');
  
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
    errors: [] as string[]
  };

  try {
    // Test basic connection
    results.connection = await checkDatabaseConnection();
    if (!results.connection) {
      results.errors.push('Failed to connect to database');
    }

    // Test table existence and basic queries
    const tables = ['hoas', 'profiles', 'bookings', 'booking_participants', 'push_subscriptions'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          results.errors.push(`Table ${table}: ${error.message}`);
          results.tables[table as keyof typeof results.tables] = false;
        } else {
          results.tables[table as keyof typeof results.tables] = true;
        }
      } catch (err) {
        results.errors.push(`Table ${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        results.tables[table as keyof typeof results.tables] = false;
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
      results.errors.push(`Auth test: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

  } catch (err) {
    results.errors.push(`General error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  return results;
}

/**
 * Print formatted test results to console
 */
export async function runDatabaseTests() {
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
    console.log('2. Run the database-setup.sql script in your Supabase SQL editor');
    console.log('3. Verify your Supabase project is active and accessible');
  }
  
  return allGood;
}

/**
 * Test specific database operations
 */
export async function testDatabaseOperations() {
  console.log('\n🧪 Testing database operations...');
  
  try {
    // Test creating a profile (this will fail without auth, but tests the query structure)
    const testProfile = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      hoa_id: '00000000-0000-0000-0000-000000000001', // Dummy HOA UUID
      full_name: 'Test User',
      phone_number: '+15551234567',
      household_id: 'test-household',
      role: 'member' as const,
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
      status: 'pending' as const,
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
