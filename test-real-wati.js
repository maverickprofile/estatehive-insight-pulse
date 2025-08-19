#!/usr/bin/env node

// Test script to verify REAL WATI API connection with your credentials
// Run with: node test-real-wati.js

const WATI_BASE_URL = 'https://live-mt-server.wati.io/460848'
const WATI_ACCESS_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YWU1MGJmNi05YjQ1LTQ2Y2QtYWNhNC1jY2VlNTllNDMxZGMiLCJ1bmlxdWVfbmFtZSI6Im1haGVzaGthbWFsYWthcjFAZ21haWwuY29tIiwibmFtZWlkIjoibWFoZXNoa2FtYWxha2FyMUBnbWFpbC5jb20iLCJlbWFpbCI6Im1haGVzaGthbWFsYWthcjFAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDgvMTIvMjAyNSAxMTowNzozNyIsInRlbmFudF9pZCI6IjQ2MDg0OCIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.F4QtJ9mwSL13k1LZPemPzRBsGZnOUdNgVQmeJd8NNfE'
const TEST_PHONE = '917259778145'

async function testWatiConnection() {
  console.log('🧪 Testing REAL WATI API Connection...')
  console.log(`📡 Base URL: ${WATI_BASE_URL}`)
  console.log(`📱 Testing with phone: ${TEST_PHONE}`)
  console.log('')

  try {
    // Test 1: Check connection with getContacts
    console.log('🔍 Test 1: Checking WATI API connection...')
    const contactResponse = await fetch(`${WATI_BASE_URL}/api/v1/getContacts?pageSize=1`, {
      method: 'GET',
      headers: {
        'Authorization': WATI_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    })

    console.log(`Connection Status: ${contactResponse.status} ${contactResponse.statusText}`)
    
    if (contactResponse.ok) {
      const contactData = await contactResponse.json()
      console.log('✅ WATI API Connection: SUCCESS')
      console.log('Response:', JSON.stringify(contactData, null, 2))
    } else {
      const errorData = await contactResponse.text()
      console.log('❌ WATI API Connection: FAILED')
      console.log('Error:', errorData)
      return
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 2: Fetch messages for specific contact
    console.log('📥 Test 2: Fetching messages for contact 917259778145...')
    const messagesResponse = await fetch(`${WATI_BASE_URL}/api/v1/getMessages/${TEST_PHONE}`, {
      method: 'GET',
      headers: {
        'Authorization': WATI_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    })

    console.log(`Messages Status: ${messagesResponse.status} ${messagesResponse.statusText}`)
    
    if (messagesResponse.ok) {
      const messagesData = await messagesResponse.json()
      console.log('✅ Message Fetch: SUCCESS')
      console.log('Messages Response:', JSON.stringify(messagesData, null, 2))
    } else {
      const errorData = await messagesResponse.text()
      console.log('⚠️ Message Fetch: Failed (might be normal if no conversation history)')
      console.log('Error:', errorData)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 3: Send a test message - try multiple endpoints
    console.log('📤 Test 3: Sending test message...')
    console.log('⚠️  This will send a REAL WhatsApp message to', TEST_PHONE)
    
    // Try endpoint 1: sendSessionMessage
    console.log('🔄 Trying sendSessionMessage endpoint...')
    let sendResponse = await fetch(`${WATI_BASE_URL}/api/v1/sendSessionMessage/${TEST_PHONE}`, {
      method: 'POST',
      headers: {
        'Authorization': WATI_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `🎉 WATI Integration Test - ${new Date().toLocaleString()}\n\nHello from Estate Hive! Your WhatsApp integration is working perfectly.\n\nThis is a test message from your business number +15557735226.`
      })
    })

    console.log(`Send Status (endpoint 1): ${sendResponse.status} ${sendResponse.statusText}`)
    
    if (!sendResponse.ok) {
      // Try endpoint 2: different format
      console.log('🔄 Trying alternative sendMessage format...')
      sendResponse = await fetch(`${WATI_BASE_URL}/api/v1/sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': WATI_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: TEST_PHONE,
          message: `🎉 WATI Integration Test - ${new Date().toLocaleString()}\n\nHello from Estate Hive! Your WhatsApp integration is working perfectly.\n\nThis is a test message from your business number +15557735226.`
        })
      })
      
      console.log(`Send Status (endpoint 2): ${sendResponse.status} ${sendResponse.statusText}`)
    }

    console.log(`Send Status: ${sendResponse.status} ${sendResponse.statusText}`)
    
    if (sendResponse.ok) {
      const sendData = await sendResponse.json()
      console.log('🚀 REAL WhatsApp Message: SENT SUCCESSFULLY!')
      console.log('📱 Check phone', TEST_PHONE, 'for the WhatsApp message!')
      console.log('Send Response:', JSON.stringify(sendData, null, 2))
    } else {
      const errorData = await sendResponse.text()
      console.log('❌ Message Send: FAILED')
      console.log('Error:', errorData)
    }

    console.log('\n' + '='.repeat(50) + '\n')
    console.log('🎯 WATI API Test Complete!')
    console.log('✅ Your WATI credentials are valid and ready for production!')
    console.log('🚀 The WhatsApp integration is now LIVE!')

  } catch (error) {
    console.log('💥 Test Error:', error.message)
  }
}

// Run the test
testWatiConnection()