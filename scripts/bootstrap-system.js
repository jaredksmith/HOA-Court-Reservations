#!/usr/bin/env node

/**
 * System Bootstrap Script
 * This script sets up the initial system state for testing:
 * 1. Creates a super admin user
 * 2. Creates a test HOA with invitation code
 * 3. Tests the complete authentication flow
 * 4. Verifies RLS policies work correctly
 *
 * Usage: node scripts/bootstrap-system.js
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

// Initialize Supabase clients
function initializeSupabase() {
  loadEnvFile();
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ Missing required Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  return { supabase, supabaseAdmin };
}

// Bootstrap configuration
const BOOTSTRAP_CONFIG = {
  superAdmin: {
    email: 'superadmin@hoatest.com',
    password: 'SuperAdmin123!',
    fullName: 'Super Administrator',
    phoneNumber: '+15551234567',
    householdId: 'admin-001'
  },
  testHOA: {
    name: 'Test Valley HOA',
    slug: 'test-valley',
    description: 'Test HOA for development and testing',
    address: '123 Test Valley Dr, Test City, TC 12345',
    contactEmail: 'admin@testvalley.com',
    contactPhone: '+15551234568',
    totalCourts: 4,
    courtNames: ['Court 1', 'Court 2', 'Court 3', 'Court 4']
  }
};

async function createSuperAdminUser(supabaseAdmin) {
  console.log('🔧 Creating super admin user...');
  
  const { superAdmin } = BOOTSTRAP_CONFIG;
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: superAdmin.email,
      password: superAdmin.password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  Super admin user already exists, skipping creation');
        
        // Get existing user
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === superAdmin.email);
        
        if (existingUser) {
          return existingUser;
        }
      }
      throw authError;
    }

    console.log('✅ Super admin auth user created');
    return authData.user;
    
  } catch (error) {
    console.error('❌ Failed to create super admin user:', error.message);
    throw error;
  }
}

async function createTestHOA(supabaseAdmin, adminUserId) {
  console.log('🏘️  Creating test HOA...');
  
  const { testHOA } = BOOTSTRAP_CONFIG;
  
  try {
    // Check if HOA already exists
    const { data: existingHOA } = await supabaseAdmin
      .from('hoas')
      .select('*')
      .eq('slug', testHOA.slug)
      .single();

    if (existingHOA) {
      console.log('ℹ️  Test HOA already exists, skipping creation');
      return existingHOA;
    }

    // Create HOA using the database function
    const { data: hoaId, error: hoaError } = await supabaseAdmin.rpc('create_hoa', {
      hoa_name: testHOA.name,
      hoa_slug: testHOA.slug,
      admin_user_id: adminUserId,
      admin_full_name: BOOTSTRAP_CONFIG.superAdmin.fullName,
      admin_phone_number: BOOTSTRAP_CONFIG.superAdmin.phoneNumber,
      admin_household_id: BOOTSTRAP_CONFIG.superAdmin.householdId
    });

    if (hoaError) throw hoaError;

    // Update HOA with additional details
    const { error: updateError } = await supabaseAdmin
      .from('hoas')
      .update({
        description: testHOA.description,
        address: testHOA.address,
        contact_email: testHOA.contactEmail,
        contact_phone: testHOA.contactPhone,
        total_courts: testHOA.totalCourts,
        court_names: testHOA.courtNames
      })
      .eq('id', hoaId);

    if (updateError) throw updateError;

    // Get the created HOA
    const { data: createdHOA, error: fetchError } = await supabaseAdmin
      .from('hoas')
      .select('*')
      .eq('id', hoaId)
      .single();

    if (fetchError) throw fetchError;

    console.log('✅ Test HOA created');
    console.log(`   Name: ${createdHOA.name}`);
    console.log(`   Slug: ${createdHOA.slug}`);
    console.log(`   Invitation Code: ${createdHOA.invitation_code}`);
    
    return createdHOA;
    
  } catch (error) {
    console.error('❌ Failed to create test HOA:', error.message);
    throw error;
  }
}

async function updateSuperAdminProfile(supabaseAdmin, userId) {
  console.log('👤 Updating super admin profile...');
  
  try {
    // Update profile to super_admin role
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('user_id', userId);

    if (error) throw error;
    
    console.log('✅ Super admin profile updated');
    
  } catch (error) {
    console.error('❌ Failed to update super admin profile:', error.message);
    throw error;
  }
}

async function testAuthenticationFlow(supabase) {
  console.log('🧪 Testing authentication flow...');
  
  const { superAdmin } = BOOTSTRAP_CONFIG;
  
  try {
    // Test login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: superAdmin.email,
      password: superAdmin.password
    });

    if (loginError) throw loginError;
    
    console.log('✅ Authentication login successful');
    
    // Test getting user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        hoa:hoas(*)
      `)
      .eq('user_id', loginData.user.id)
      .single();

    if (profileError) throw profileError;
    
    console.log('✅ Profile retrieval successful');
    console.log(`   Role: ${profile.role}`);
    console.log(`   HOA: ${profile.hoa?.name}`);
    
    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Authentication logout successful');
    
    return { user: loginData.user, profile };
    
  } catch (error) {
    console.error('❌ Authentication flow test failed:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 HOA Court Reservations - System Bootstrap');
  console.log('===========================================\n');

  try {
    const { supabase, supabaseAdmin } = initializeSupabase();
    
    // Step 1: Create super admin user
    const adminUser = await createSuperAdminUser(supabaseAdmin);
    
    // Step 2: Create test HOA
    const testHOA = await createTestHOA(supabaseAdmin, adminUser.id);
    
    // Step 3: Update super admin profile
    await updateSuperAdminProfile(supabaseAdmin, adminUser.id);
    
    // Step 4: Test authentication flow
    const authTest = await testAuthenticationFlow(supabase);
    
    console.log('\n🎉 System bootstrap completed successfully!');
    console.log('\n📋 Bootstrap Summary:');
    console.log('====================');
    console.log(`Super Admin Email: ${BOOTSTRAP_CONFIG.superAdmin.email}`);
    console.log(`Super Admin Password: ${BOOTSTRAP_CONFIG.superAdmin.password}`);
    console.log(`Test HOA Name: ${testHOA.name}`);
    console.log(`Test HOA Invitation Code: ${testHOA.invitation_code}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Start your dev server: npm run dev');
    console.log('2. Login with the super admin credentials above');
    console.log('3. Test creating additional HOAs and users');
    console.log('4. Test the booking system');
    
  } catch (error) {
    console.error('\n💥 Bootstrap failed:', error);
    process.exit(1);
  }
}

main();
