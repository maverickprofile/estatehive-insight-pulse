// Setup script to configure Telegram webhook for instant processing
import fetch from 'node-fetch';

const BOT_TOKEN = '8303023013:AAEE6b_2IOjVs9wfxKrFBxdAc6_JPgvOV8E';
const WEBHOOK_URL = 'https://estatehive-insight-pulse.vercel.app/api/telegram/webhook';

async function setupWebhook() {
  console.log('🔧 Setting up Telegram Webhook for instant voice processing...\n');
  
  try {
    // First, delete any existing webhook
    console.log('1️⃣ Removing any existing webhook...');
    const deleteResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`
    );
    const deleteResult = await deleteResponse.json();
    console.log('   ✅ Webhook cleared:', deleteResult.ok ? 'Success' : 'Failed');
    
    // Set the new webhook
    console.log('\n2️⃣ Setting new webhook URL...');
    console.log('   URL:', WEBHOOK_URL);
    
    const setResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          allowed_updates: ['message'], // Only listen for messages
          drop_pending_updates: true, // Clear old updates
        }),
      }
    );
    
    const setResult = await setResponse.json();
    
    if (setResult.ok) {
      console.log('   ✅ Webhook set successfully!');
    } else {
      console.log('   ❌ Failed to set webhook:', setResult.description);
    }
    
    // Get webhook info
    console.log('\n3️⃣ Verifying webhook configuration...');
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );
    const info = await infoResponse.json();
    
    if (info.result) {
      console.log('   📍 Webhook URL:', info.result.url || 'Not set');
      console.log('   📊 Pending updates:', info.result.pending_update_count || 0);
      console.log('   ⏰ Last error:', info.result.last_error_message || 'None');
    }
    
    console.log('\n✅ Webhook Configuration Complete!');
    console.log('\n📱 How to test:');
    console.log('1. Send a voice message to @estatehive_voice_bot');
    console.log('2. You should receive an instant acknowledgment (<1s)');
    console.log('3. Full transcription and analysis will follow in 5-10s');
    console.log('\n⚡ Benefits of Webhook Mode:');
    console.log('• Instant response (< 1 second)');
    console.log('• No polling delays');
    console.log('• Always active (24/7)');
    console.log('• Lower latency');
    console.log('• More reliable');
    
  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
  }
}

// Run the setup
setupWebhook();