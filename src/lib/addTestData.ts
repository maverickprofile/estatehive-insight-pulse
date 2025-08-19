// Utility to add test WhatsApp conversation data
import { WhatsAppService } from './whatsappService'

export async function addTestWhatsAppData() {
  try {
    console.log('Adding test WhatsApp conversation data...')
    
    // Test conversation 1: Phone number 917259778145
    const phoneNumber1 = '917259778145'
    const clientName1 = 'Test WhatsApp User'
    
    // Add initial client message
    await WhatsAppService.receiveMessage(
      phoneNumber1,
      'Hi, I saw your property listing for the 3BHK apartment. Is it still available?',
      clientName1
    )
    
    // Get the conversation
    const conversation1 = await WhatsAppService.createOrGetConversation(phoneNumber1, clientName1)
    
    // Add agent response
    await WhatsAppService.sendMessage(
      conversation1.id,
      'Hello! Yes, the 3BHK apartment is still available. Would you like to schedule a viewing?'
    )
    
    // Add more client messages
    await WhatsAppService.receiveMessage(
      phoneNumber1,
      'Yes, I would love to see it. What time works best for you?',
      clientName1
    )
    
    await WhatsAppService.sendMessage(
      conversation1.id,
      'Great! How about tomorrow at 2 PM? The property is located in downtown with great amenities.'
    )
    
    await WhatsAppService.receiveMessage(
      phoneNumber1,
      'Perfect! Tomorrow at 2 PM works for me. Could you share the exact address?',
      clientName1
    )
    
    await WhatsAppService.sendMessage(
      conversation1.id,
      'Absolutely! The address is 123 Main Street, Downtown. I\'ll send you the location pin as well.'
    )
    
    await WhatsAppService.receiveMessage(
      phoneNumber1,
      'Thank you for the property information!',
      clientName1
    )
    
    // Test conversation 2: Another phone number
    const phoneNumber2 = '918765432100'
    const clientName2 = 'Property Inquiry'
    
    await WhatsAppService.receiveMessage(
      phoneNumber2,
      'Hello, I am looking for a 2BHK apartment. What options do you have?',
      clientName2
    )
    
    const conversation2 = await WhatsAppService.createOrGetConversation(phoneNumber2, clientName2)
    
    await WhatsAppService.sendMessage(
      conversation2.id,
      'Hi! We have several 2BHK options available. The price range is ₹15,000 - ₹25,000 per month depending on location and amenities.'
    )
    
    await WhatsAppService.receiveMessage(
      phoneNumber2,
      'What is the price range for 2BHK?',
      clientName2
    )
    
    console.log('✅ Test data added successfully!')
    console.log(`📱 Conversation 1: ${phoneNumber1} (${clientName1})`)
    console.log(`📱 Conversation 2: ${phoneNumber2} (${clientName2})`)
    
    return { success: true, conversations: [conversation1, conversation2] }
    
  } catch (error) {
    console.error('❌ Error adding test data:', error)
    return { success: false, error }
  }
}

// Function to clear test data (for cleanup)
export async function clearTestWhatsAppData() {
  console.log('🧹 This function would clear test data (not implemented for safety)')
  console.log('To clear data manually, delete records from conversations and messages tables in Supabase dashboard')
}