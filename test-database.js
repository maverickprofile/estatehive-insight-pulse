import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testing Database Connection...\n');
  console.log('URL:', supabaseUrl);
  console.log('-----------------------------------\n');

  try {
    // Test 1: Check if we can connect
    console.log('1️⃣ Testing connection...');
    const { data: test, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      return;
    }
    console.log('✅ Connection successful!\n');

    // Test 2: Check tables exist
    console.log('2️⃣ Checking tables...');
    const tables = [
      'profiles',
      'agents', 
      'properties',
      'leads',
      'clients',
      'conversations',
      'messages',
      'appointments',
      'invoices',
      'notifications'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}' - Error: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }

    // Test 3: Check storage buckets
    console.log('\n3️⃣ Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('❌ Could not list buckets:', bucketsError.message);
    } else {
      console.log('Storage buckets found:', buckets.map(b => b.name).join(', '));
    }

    // Test 4: Check if we can insert a test property
    console.log('\n4️⃣ Testing property creation...');
    const { data: property, error: propError } = await supabase
      .from('properties')
      .insert({
        title: 'Test Property',
        description: 'This is a test property',
        property_type: 'residential',
        status: 'draft',
        city: 'Test City',
        price: 1000000,
        area_sqft: 1000
      })
      .select()
      .single();

    if (propError) {
      console.error('❌ Property creation failed:', propError.message);
      console.error('Details:', propError);
    } else {
      console.log('✅ Property created successfully!');
      console.log('Property ID:', property.id);
      
      // Clean up - delete test property
      await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);
      console.log('🧹 Test property cleaned up');
    }

    console.log('\n✨ All tests completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testDatabase();