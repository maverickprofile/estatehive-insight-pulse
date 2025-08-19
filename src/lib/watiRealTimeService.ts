// Production-Level Real-Time WATI WhatsApp Integration
// This service handles ACTUAL WhatsApp messages via WATI API

import { WhatsAppService } from './whatsappService'

interface WatiConfig {
  baseUrl: string
  accessToken: string
  instanceId: string
}

interface WatiApiResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

interface WatiMessage {
  id: string
  whatsappNumber: string
  text: string
  type: string
  created: string
  messageId?: string
  sender?: {
    name?: string
    number?: string
  }
  eventType?: string
  data?: any
}

export class WatiRealTimeService {
  private config: WatiConfig
  private syncInterval: NodeJS.Timeout | null = null
  private isConnected = false

  constructor(config: WatiConfig) {
    this.config = config
  }

  // Test WATI API connection
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🔄 Testing WATI API connection...')
      
      const response = await fetch(`${this.config.baseUrl}/api/v1/getContacts?pageSize=1`, {
        method: 'GET',
        headers: {
          'Authorization': this.config.accessToken,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        this.isConnected = true
        return {
          success: true,
          message: '✅ WATI API connection successful',
          data: data
        }
      } else {
        return {
          success: false,
          message: `❌ WATI API error: ${data.message || response.statusText}`,
          data: data
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Connection failed: ${(error as Error).message}`
      }
    }
  }

  // Send REAL WhatsApp message via WATI API
  async sendWhatsAppMessage(recipientNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📤 Sending WhatsApp message to ${recipientNumber}: ${message}`)

      const response = await fetch(`${this.config.baseUrl}/api/v1/sendSessionMessage`, {
        method: 'POST',
        headers: {
          'Authorization': this.config.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          whatsappNumber: recipientNumber.replace(/\D/g, ''), // Remove non-digits
          message: {
            text: message
          }
        })
      })

      const result = await response.json()
      console.log('WATI Send Response:', result)

      if (response.ok && result.result === 'success') {
        // Also save to database
        const conversation = await WhatsAppService.createOrGetConversation(recipientNumber)
        await WhatsAppService.sendMessage(conversation.id, message)

        return {
          success: true,
          messageId: result.data?.id || result.messageId
        }
      } else {
        return {
          success: false,
          error: result.message || result.error || 'Failed to send message'
        }
      }
    } catch (error) {
      console.error('Send message error:', error)
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  // Fetch latest messages from WATI
  async fetchLatestMessages(): Promise<WatiMessage[]> {
    try {
      console.log('🔄 Fetching latest messages from WATI...')

      const response = await fetch(`${this.config.baseUrl}/api/v1/getMessages?pageSize=50&sortOrder=desc`, {
        method: 'GET',
        headers: {
          'Authorization': this.config.accessToken,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`WATI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('WATI Messages Response:', data)

      // Handle different response formats
      let messages: any[] = []
      if (data.messages && Array.isArray(data.messages)) {
        messages = data.messages
      } else if (data.data && Array.isArray(data.data)) {
        messages = data.data
      } else if (Array.isArray(data)) {
        messages = data
      }

      return messages.map(msg => ({
        id: msg.id || msg.messageId,
        whatsappNumber: msg.whatsappNumber || msg.phoneNumber,
        text: msg.text || msg.message || msg.body,
        type: msg.type || 'text',
        created: msg.created || msg.timestamp || new Date().toISOString(),
        messageId: msg.messageId,
        sender: msg.sender,
        eventType: msg.eventType,
        data: msg
      }))
    } catch (error) {
      console.error('Fetch messages error:', error)
      throw error
    }
  }

  // Sync messages from WATI to database
  async syncMessages(): Promise<{ synced: number; errors: number }> {
    try {
      const messages = await this.fetchLatestMessages()
      let synced = 0
      let errors = 0

      for (const msg of messages) {
        try {
          // Determine if message is from client or business
          const isIncoming = msg.eventType === 'message' || !msg.eventType

          if (isIncoming && msg.text) {
            // Save incoming message to database
            await WhatsAppService.receiveMessage(
              msg.whatsappNumber,
              msg.text,
              msg.sender?.name || `WhatsApp ${msg.whatsappNumber}`
            )
            synced++
          }
        } catch (error) {
          console.error('Error syncing message:', error)
          errors++
        }
      }

      console.log(`✅ Synced ${synced} messages, ${errors} errors`)
      return { synced, errors }
    } catch (error) {
      console.error('Sync error:', error)
      throw error
    }
  }

  // Start real-time sync (polls every 30 seconds)
  startRealTimeSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    console.log(`🔄 Starting real-time sync (every ${intervalMs/1000}s)`)

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncMessages()
      } catch (error) {
        console.error('Real-time sync error:', error)
      }
    }, intervalMs)
  }

  // Stop real-time sync
  stopRealTimeSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('⏹️ Real-time sync stopped')
    }
  }

  // Handle WATI webhook (for instant message receiving)
  async handleWebhook(payload: any): Promise<void> {
    try {
      console.log('📨 WATI Webhook received:', payload)

      if (payload.eventType === 'message' && payload.data) {
        const msgData = payload.data
        
        if (msgData.text || msgData.message) {
          const phoneNumber = msgData.whatsappNumber || msgData.phoneNumber
          const messageText = msgData.text || msgData.message
          const senderName = msgData.sender?.name || `WhatsApp ${phoneNumber}`

          // Save to database immediately
          await WhatsAppService.receiveMessage(phoneNumber, messageText, senderName)
          
          console.log(`✅ Webhook message saved: ${phoneNumber} - ${messageText}`)
        }
      }
    } catch (error) {
      console.error('Webhook handling error:', error)
      throw error
    }
  }

  // Get connection status
  getStatus(): { connected: boolean; syncActive: boolean } {
    return {
      connected: this.isConnected,
      syncActive: this.syncInterval !== null
    }
  }
}

// Default configuration factory
export const createWatiRealTimeService = (): WatiRealTimeService => {
  const config: WatiConfig = {
    baseUrl: import.meta.env.VITE_WATI_BASE_URL || 'https://live-server-XXX.wati.io',
    accessToken: import.meta.env.VITE_WATI_ACCESS_TOKEN || 'Bearer your_token_here',
    instanceId: import.meta.env.VITE_WATI_INSTANCE_ID || 'your_instance_id'
  }

  return new WatiRealTimeService(config)
}

// Global service instance
let globalWatiService: WatiRealTimeService | null = null

export const getWatiService = (): WatiRealTimeService => {
  if (!globalWatiService) {
    globalWatiService = createWatiRealTimeService()
  }
  return globalWatiService
}

// Auto-start real-time sync when service is created
export const startWatiRealTimeService = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const service = getWatiService()
    
    // Test connection first
    const connectionTest = await service.testConnection()
    if (!connectionTest.success) {
      return connectionTest
    }

    // Start real-time sync
    service.startRealTimeSync(30000) // Every 30 seconds

    // Initial sync
    await service.syncMessages()

    return {
      success: true,
      message: '🚀 WATI real-time service started successfully'
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to start WATI service: ${(error as Error).message}`
    }
  }
}