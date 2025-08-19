#!/usr/bin/env node

// Test script to verify WATI API credentials
// Run with: node test-wati-api.js

const WATI_BASE_URL = process.env.WATI_BASE_URL || 'https://live-server-XXX.wati.io'; // Replace with your URL
const WATI_API_KEY = process.env.WATI_API_KEY || 'Bearer your_api_key_here'; // Replace with your key

async function testWatiAPI() {
  console.log('🧪 Testing WATI API Connection...\n');
  
  console.log('Configuration:');
  console.log(`WATI_BASE_URL: ${WATI_BASE_URL}`);
  console.log(`WATI_API_KEY: ${WATI_API_KEY.substring(0, 20)}...`);
  console.log('');

  if (WATI_BASE_URL.includes('XXX') || WATI_API_KEY.includes('your_api_key_here')) {
    console.log('❌ Please update the WATI_BASE_URL and WATI_API_KEY values in this file or set them as environment variables.');
    process.exit(1);
  }

  try {
    console.log('📡 Fetching messages from WATI API...');
    
    const response = await fetch(`${WATI_BASE_URL}/api/v1/getMessages?pageSize=5`, {
      method: 'GET',
      headers: {
        'Authorization': WATI_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.log('❌ API Error Response:');
      console.log(errorBody);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response received successfully!');
    console.log('\n📄 Response structure:');
    console.log(JSON.stringify(data, null, 2));

    // Analyze response structure
    console.log('\n🔍 Analysis:');
    if (Array.isArray(data)) {
      console.log(`- Response is an array with ${data.length} items`);
    } else if (data.messages) {
      console.log('- Response has "messages" property');
      if (Array.isArray(data.messages.items)) {
        console.log(`- Messages array has ${data.messages.items.length} items`);
      } else if (Array.isArray(data.messages)) {
        console.log(`- Messages array has ${data.messages.length} items`);
      }
    } else if (data.data && Array.isArray(data.data)) {
      console.log(`- Response has "data" array with ${data.data.length} items`);
    } else {
      console.log('- Unknown response structure');
      console.log('- Available properties:', Object.keys(data));
    }

    console.log('\n✅ WATI API connection successful! You can now deploy to Supabase.');
    
  } catch (error) {
    console.log('❌ Error testing WATI API:');
    console.error(error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your WATI_BASE_URL is correct');
    console.log('2. Verify your WATI_API_KEY is valid');
    console.log('3. Ensure your WATI account has API access enabled');
  }
}

// Run the test
testWatiAPI();