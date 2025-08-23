// Test Supabase Authentication
// Run this with: node test-supabase-auth.js

import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const SUPABASE_URL = 'https://mtjxfyzcuuvtplemliwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10anhmeXpjdXV2dHBsZW1saXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzU3NTYsImV4cCI6MjA2ODg1MTc1Nn0.KxsHhDcmJIDcPncNXgL05QvDvOm20l0t0vTQdSF0qPg';

console.log('🔧 Testing Supabase Connection...\n');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_ANON_KEY.substring(0, 50) + '...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1️⃣ Testing basic connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('conversations')
      .select('count')
      .limit(1);
    
    if (tablesError) {
      console.log('❌ Connection test failed:', tablesError.message);
      console.log('   Error code:', tablesError.code);
      console.log('   Details:', tablesError.details);
    } else {
      console.log('✅ Successfully connected to Supabase!');
    }

    // Test 2: Try to sign in with test credentials
    console.log('\n2️⃣ Testing authentication...');
    console.log('   Note: This will fail if no user exists, which is expected.');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        console.log('⚠️  No test user exists (expected)');
        console.log('   You need to create a user in Supabase Dashboard');
      } else {
        console.log('❌ Authentication error:', authError.message);
        console.log('   Status:', authError.status);
      }
    } else {
      console.log('✅ Authentication working!');
      console.log('   User ID:', authData.user?.id);
    }

    // Test 3: Check auth configuration
    console.log('\n3️⃣ Checking auth configuration...');
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('   Session check:', sessionData ? 'Session available' : 'No active session');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error('Full error:', error);
  }

  console.log('\n📋 Troubleshooting Steps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/mtjxfyzcuuvtplemliwe/auth/users');
  console.log('2. Create a new user if none exists');
  console.log('3. Ensure email authentication is enabled in Auth Settings');
  console.log('4. Check if RLS policies are properly configured');
  console.log('5. Try clearing browser cache and cookies');
}

testConnection();