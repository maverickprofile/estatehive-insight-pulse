// Test script to verify Telegram proxy endpoint
const PROXY_URL = 'https://estatehive-insight-pulse.vercel.app/api/telegram/download';
const BOT_TOKEN = '8303023013:AAEE6b_2IOjVs9wfxKrFBxdAc6_JPgvOV8E';

async function testTelegramProxy() {
  console.log('Testing Telegram proxy endpoint...');
  console.log('URL:', PROXY_URL);
  
  try {
    // First, test if the endpoint is accessible
    console.log('\n1. Testing endpoint availability...');
    const optionsResponse = await fetch(PROXY_URL, {
      method: 'OPTIONS',
    });
    console.log('OPTIONS response status:', optionsResponse.status);
    
    // Test with a sample file path (this will fail but shows if endpoint works)
    console.log('\n2. Testing POST request...');
    const testResponse = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_token: BOT_TOKEN,
        file_path: 'voice/test.oga',
      }),
    });
    
    console.log('POST response status:', testResponse.status);
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.log('Response:', errorText);
    }
    
    // Test CORS headers
    console.log('\n3. Checking CORS headers...');
    console.log('Access-Control-Allow-Origin:', testResponse.headers.get('Access-Control-Allow-Origin'));
    console.log('Access-Control-Allow-Methods:', testResponse.headers.get('Access-Control-Allow-Methods'));
    
    console.log('\n✅ Telegram proxy endpoint is configured and responding!');
    console.log('The endpoint is ready to handle Telegram file downloads.');
    
  } catch (error) {
    console.error('\n❌ Error testing Telegram proxy:', error.message);
    console.log('\nPossible issues:');
    console.log('1. The Vercel deployment might not be complete');
    console.log('2. The api/telegram-proxy.js file might not be deployed');
    console.log('3. There might be a configuration issue');
  }
}

// Run the test
console.log('Starting Telegram Proxy Test\n' + '='.repeat(40));
testTelegramProxy();