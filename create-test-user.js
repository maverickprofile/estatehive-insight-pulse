// Create a test user for Estate Hive CRM
// Run this with: node create-test-user.js

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Your Supabase credentials
const SUPABASE_URL = 'https://mtjxfyzcuuvtplemliwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10anhmeXpjdXV2dHBsZW1saXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzU3NTYsImV4cCI6MjA2ODg1MTc1Nn0.KxsHhDcmJIDcPncNXgL05QvDvOm20l0t0vTQdSF0qPg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createUser() {
  console.log('🏠 Estate Hive CRM - Create User Account\n');
  
  try {
    // Get user input
    const email = await question('Enter email address: ') || 'admin@estatehive.com';
    const password = await question('Enter password (min 6 characters): ') || 'admin123456';
    const fullName = await question('Enter full name (optional): ') || 'Estate Admin';
    
    console.log('\n📝 Creating user account...');
    
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin'
        }
      }
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      
      if (error.message.includes('already registered')) {
        console.log('\n💡 User already exists. Try signing in instead:');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (signInError) {
          console.error('❌ Sign in failed:', signInError.message);
        } else {
          console.log('✅ Successfully signed in!');
          console.log('   User ID:', signInData.user?.id);
          console.log('   Email:', signInData.user?.email);
        }
      }
    } else {
      console.log('✅ User created successfully!');
      console.log('   User ID:', data.user?.id);
      console.log('   Email:', data.user?.email);
      console.log('\n📧 Check your email for verification link (if email confirmations are enabled)');
      
      // Create profile entry
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName,
            role: 'admin',
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.log('⚠️  Could not create profile:', profileError.message);
        } else {
          console.log('✅ Profile created successfully!');
        }
      }
    }
    
    console.log('\n🎉 Setup Complete!');
    console.log('You can now sign in to Estate Hive CRM with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Access the app at: http://localhost:8080');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    rl.close();
  }
}

// Quick create option for testing
async function quickCreate() {
  console.log('🚀 Quick Create Test User\n');
  
  const testEmail = 'test@estatehive.com';
  const testPassword = 'test123456';
  
  console.log(`Creating user: ${testEmail}`);
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Test User',
        role: 'admin'
      }
    }
  });
  
  if (error) {
    if (error.message.includes('already registered')) {
      console.log('✅ Test user already exists!');
    } else {
      console.error('❌ Error:', error.message);
    }
  } else {
    console.log('✅ Test user created!');
  }
  
  console.log('\n📝 Test Credentials:');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  
  rl.close();
}

// Ask user which option they want
console.log('Choose an option:');
console.log('1. Create custom user');
console.log('2. Quick create test user (test@estatehive.com)');
console.log('');

rl.question('Enter choice (1 or 2): ', (answer) => {
  if (answer === '2') {
    quickCreate();
  } else {
    createUser();
  }
});