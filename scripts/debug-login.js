#!/usr/bin/env node

/**
 * Debug Login Script
 * Tests the exact login flow to identify the issue
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

async function debugLogin() {
  console.log('🔍 Debug Login Test');
  console.log('===================\n');

  loadEnvFile();
  
  console.log('Environment check:');
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Set' : 'Missing'}`);
  console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing'}`);
  console.log('');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const credentials = {
    email: 'superadmin@hoatest.com',
    password: 'SuperAdmin123!'
  };

  try {
    console.log('🔐 Attempting login...');
    console.log(`Email: ${credentials.email}`);
    console.log(`Password: ${'*'.repeat(credentials.password.length)}`);
    console.log('');

    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    
    if (error) {
      console.error('❌ Supabase auth error:', error);
      console.error('Error details:');
      console.error(`  Code: ${error.status || 'N/A'}`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Name: ${error.name || 'N/A'}`);
      return;
    }

    console.log('✅ Login successful!');
    console.log('User data:');
    console.log(`  ID: ${data.user.id}`);
    console.log(`  Email: ${data.user.email}`);
    console.log(`  Created: ${data.user.created_at}`);
    console.log('');

    console.log('Session data:');
    console.log(`  Access Token: ${data.session.access_token.substring(0, 20)}...`);
    console.log(`  Expires: ${data.session.expires_at}`);
    console.log('');

    // Test getting user profile
    console.log('🔍 Testing profile retrieval...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        hoa:hoas(*)
      `)
      .eq('user_id', data.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile retrieval error:', profileError);
      console.error('Error details:');
      console.error(`  Code: ${profileError.code}`);
      console.error(`  Message: ${profileError.message}`);
      console.error(`  Details: ${profileError.details}`);
      console.error(`  Hint: ${profileError.hint}`);
    } else {
      console.log('✅ Profile retrieved successfully!');
      console.log('Profile data:');
      console.log(`  Name: ${profile.full_name}`);
      console.log(`  Role: ${profile.role}`);
      console.log(`  HOA: ${profile.hoa?.name}`);
      console.log(`  Phone: ${profile.phone_number}`);
    }

    // Test session validation
    console.log('\n🔍 Testing session validation...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session validation error:', sessionError);
    } else {
      console.log('✅ Session validation successful!');
      console.log(`  User ID: ${sessionData.session?.user?.id}`);
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Signed out successfully');

  } catch (error) {
    console.error('❌ Unexpected error during login test:', error);
    console.error('Stack trace:', error.stack);
  }
}

debugLogin();
