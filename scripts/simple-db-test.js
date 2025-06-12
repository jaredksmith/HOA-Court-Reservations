#!/usr/bin/env node

/**
 * Simple Database Test
 * Quick test to verify Supabase connection
 */

import { createClient } from '@supabase/supabase-js';

// Hardcode the values from .env for testing
const supabaseUrl = 'https://fgrushldztgkgmqhopmb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncnVzaGxkenRna2dtcWhvcG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDQxMTEsImV4cCI6MjA2NTMyMDExMX0.Q7EjbyV3u_e8PWjPGozjuLaJIIHuIXqCP632oIGyUpM';

console.log('🔍 Testing Supabase connection...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey.substring(0, 30)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...');

    // Test 1: Try a simple RPC call
    console.log('Testing RPC call...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('version');
    if (rpcError) {
      console.log(`RPC Error: ${rpcError.message}`);
    } else {
      console.log(`RPC Success: ${rpcData}`);
    }

    // Test 2: Try table query
    console.log('\nTesting table query...');
    const { data, error } = await supabase.from('hoas').select('id').limit(1);

    if (error) {
      console.log(`❌ Table Error: ${error.message}`);
      console.log(`Error code: ${error.code}`);
      console.log(`Error details:`, error.details);
      console.log(`Error hint:`, error.hint);
    } else {
      console.log('✅ Table query successful!');
      console.log(`Data:`, data);
    }

    // Test 3: Try auth
    console.log('\nTesting auth...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log(`Auth Error: ${authError.message}`);
    } else {
      console.log(`Auth Success: Session exists = ${!!authData.session}`);
    }

  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
    console.log(`Exception details:`, err);
  }
}

testConnection();
