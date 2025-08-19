// WATI API Integration for Real WhatsApp Messaging
// Your WATI Business Number: +15557735226
// Target Client: 917259778145

import { WhatsAppService } from './whatsappService'

interface WatiConfig {
  baseUrl: string
  accessToken: string
  businessNumber: string // +15557735226
}

interface WatiMessage {
  whatsappNumber: string
  text: string
  type?: string
  from?: string
  messageId?: string
  timestamp?: string
}

interface WatiWebhookPayload {
  eventType: string
  data: {
    id: string
    whatsappNumber: string
    text?: string
    type: string
    created: string
    sender?: {
      name?: string
      number?: string
    }
    // Add other WATI webhook fields as needed
  }
}

export class WatiIntegration {
  private config: WatiConfig

  constructor(config: WatiConfig) {
    this.config = config
  }

  // Send message from WATI business number (+15557735226) to client
  async sendMessage(recipientNumber: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/sendSessionMessage`, {
        method: 'POST',
        headers: {
          'Authorization': this.config.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          whatsappNumber: recipientNumber,
          message: {
            text: message
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('WATI send message error:', response.status, errorData)
        throw new Error(`WATI API error: ${response.status}`)
      }

      const result = await response.json()
      console.log('Message sent via WATI:', result)
      
      // Also save to database as agent message
      const conversation = await WhatsAppService.createOrGetConversation(
        recipientNumber,
        `WhatsApp +${recipientNumber}`
      )
      
      await WhatsAppService.sendMessage(conversation.id, message)
      
      return true
    } catch (error) {
      console.error('Failed to send message via WATI:', error)
      throw error
    }
  }

  // Handle incoming webhook from WATI when client sends message
  async handleWebhook(payload: WatiWebhookPayload): Promise<void> {
    try {
      console.log('Received WATI webhook:', payload)

      if (payload.eventType === 'message' && payload.data.text) {
        const phoneNumber = payload.data.whatsappNumber
        const messageText = payload.data.text
        const senderName = payload.data.sender?.name || `WhatsApp +${phoneNumber}`

        // Save incoming message to database
        await WhatsAppService.receiveMessage(phoneNumber, messageText, senderName)

        console.log(`Message received from ${phoneNumber}: ${messageText}`)
        
        // Optional: Auto-reply logic here
        // await this.sendAutoReply(phoneNumber, messageText)
      }
    } catch (error) {
      console.error('Error handling WATI webhook:', error)
      throw error
    }
  }

  // Fetch messages from WATI API (for sync)
  async fetchMessages(pageSize: number = 100): Promise<WatiMessage[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/getMessages?pageSize=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.config.accessToken,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        console.error('WATI fetch messages error:', response.status, errorData)
        throw new Error(`WATI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.messages || data.data || data || []
    } catch (error) {
      console.error('Failed to fetch messages from WATI:', error)
      throw error
    }
  }

  // Sync messages from WATI to database
  async syncMessages(): Promise<number> {
    try {
      console.log('Syncing messages from WATI...')
      
      const watiMessages = await this.fetchMessages()
      let syncedCount = 0

      for (const msg of watiMessages) {
        try {
          // Determine if it's incoming or outgoing based on WATI data structure
          const isFromClient = msg.from !== this.config.businessNumber
          
          if (isFromClient) {
            // Message from client to business
            await WhatsAppService.receiveMessage(
              msg.whatsappNumber,
              msg.text,
              `WhatsApp +${msg.whatsappNumber}`
            )
          } else {
            // Message from business to client (already handled when sent)
            console.log('Skipping outgoing message:', msg.messageId)
          }
          
          syncedCount++
        } catch (error) {
          console.error('Error syncing individual message:', error)
        }
      }

      console.log(`Synced ${syncedCount} messages from WATI`)
      return syncedCount
    } catch (error) {
      console.error('Failed to sync messages:', error)
      throw error
    }
  }

  // Auto-reply logic (optional)
  private async sendAutoReply(phoneNumber: string, incomingMessage: string): Promise<void> {
    const lowerMessage = incomingMessage.toLowerCase()
    
    let autoReply: string | null = null
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      autoReply = 'Hello! Thank you for contacting Estate Hive. How can I help you with your property needs today?'
    } else if (lowerMessage.includes('property') || lowerMessage.includes('apartment') || lowerMessage.includes('bhk')) {
      autoReply = 'Great! We have various property options available. Let me connect you with our property consultant who can share detailed information.'
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
      autoReply = 'I understand you are interested in pricing. Our team will share detailed pricing based on your requirements. What type of property are you looking for?'
    }

    if (autoReply) {
      // Wait a moment before sending auto-reply to seem more natural
      setTimeout(async () => {
        try {
          await this.sendMessage(phoneNumber, autoReply!)
        } catch (error) {
          console.error('Failed to send auto-reply:', error)
        }
      }, 2000)
    }
  }
}

// Default WATI configuration (you'll need to update with your actual values)
export const createWatiIntegration = () => {
  const config: WatiConfig = {
    baseUrl: process.env.WATI_BASE_URL || 'https://live-server-XXX.wati.io', // Your WATI server URL
    accessToken: process.env.WATI_ACCESS_TOKEN || 'Bearer your_access_token_here', // Your WATI access token
    businessNumber: '+15557735226' // Your verified WATI business number
  }

  return new WatiIntegration(config)
}

// Utility functions for phone number handling
export const formatPhoneNumber = (number: string): string => {
  // Remove all non-digits
  const digits = number.replace(/\D/g, '')
  
  // Handle Indian numbers (remove leading 91 if present)
  if (digits.startsWith('91') && digits.length === 12) {
    return digits.substring(2)
  }
  
  return digits
}

export const addCountryCode = (number: string, countryCode: string = '91'): string => {
  const cleanNumber = formatPhoneNumber(number)
  return `${countryCode}${cleanNumber}`
}