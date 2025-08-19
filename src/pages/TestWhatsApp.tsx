import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { WhatsAppService } from '@/lib/whatsappService'
import { addTestWhatsAppData } from '@/lib/addTestData'
import { getWatiService, startWatiRealTimeService } from '@/lib/watiRealTimeService'

export default function TestWhatsApp() {
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [conversations, setConversations] = React.useState<any[]>([])
  const [testPhoneNumber, setTestPhoneNumber] = React.useState('917259778145')
  const [testMessage, setTestMessage] = React.useState('Hello! I am interested in your property services.')
  const [watiStatus, setWatiStatus] = React.useState<{connected: boolean; syncActive: boolean} | null>(null)

  const handleAddTestData = async () => {
    try {
      setLoading(true)
      setMessage('Adding test WhatsApp data...')
      
      const result = await addTestWhatsAppData()
      
      if (result.success) {
        setMessage('✅ Test data added successfully!')
        loadConversations()
      } else {
        setMessage('❌ Failed to add test data: ' + result.error)
      }
    } catch (error) {
      setMessage('❌ Error: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendRealWatiMessage = async () => {
    try {
      setLoading(true)
      setMessage('Sending REAL WhatsApp message via WATI API...')
      
      const watiService = getWatiService()
      const result = await watiService.sendWhatsAppMessage(testPhoneNumber, testMessage)
      
      if (result.success) {
        setMessage(`✅ REAL WhatsApp message sent to ${testPhoneNumber}! Check the phone.`)
      } else {
        setMessage(`❌ Failed to send: ${result.error}`)
      }
      
      loadConversations()
    } catch (error) {
      setMessage('❌ WATI send error: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncWatiMessages = async () => {
    try {
      setLoading(true)
      setMessage('Syncing messages from WATI...')
      
      const watiService = getWatiService()
      const result = await watiService.syncMessages()
      
      setMessage(`✅ Synced ${result.synced} messages from WATI (${result.errors} errors)`)
      loadConversations()
    } catch (error) {
      setMessage('❌ Sync error: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleTestWatiConnection = async () => {
    try {
      setLoading(true)
      setMessage('Testing WATI API connection...')
      
      const watiService = getWatiService()
      const result = await watiService.testConnection()
      
      setMessage(result.message)
      setWatiStatus(watiService.getStatus())
    } catch (error) {
      setMessage('❌ Connection test error: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleStartRealTimeService = async () => {
    try {
      setLoading(true)
      setMessage('Starting WATI real-time service...')
      
      const result = await startWatiRealTimeService()
      setMessage(result.message)
      
      if (result.success) {
        const watiService = getWatiService()
        setWatiStatus(watiService.getStatus())
      }
    } catch (error) {
      setMessage('❌ Service start error: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendTestMessage = async (phoneNumber: string) => {
    try {
      setLoading(true)
      await WhatsAppService.receiveMessage(
        phoneNumber,
        `Test message sent at ${new Date().toLocaleTimeString()}`,
        'Test User'
      )
      setMessage(`✅ Test message sent to ${phoneNumber}`)
      loadConversations()
    } catch (error) {
      setMessage('❌ Error sending test message: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async () => {
    try {
      const convos = await WhatsAppService.getConversations()
      setConversations(convos)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  React.useEffect(() => {
    loadConversations()
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>📱 WATI WhatsApp Integration Testing</CardTitle>
          <CardDescription>
            Test your real WATI integration with business number +15557735226 and client 917259778145
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* WATI Configuration Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900">🔧 WATI Configuration</h4>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Business Number:</strong> +15557735226 (Verified) <br />
              <strong>Test Client:</strong> 917259778145 <br />
              <strong>Status:</strong> {watiStatus ? 
                `${watiStatus.connected ? '🟢 Connected' : '🔴 Disconnected'} | ${watiStatus.syncActive ? '🔄 Sync Active' : '⏸️ Sync Stopped'}` : 
                '⚪ Unknown'
              }
            </p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={handleTestWatiConnection} disabled={loading}>
                🔗 Test Connection
              </Button>
              <Button size="sm" variant="outline" onClick={handleStartRealTimeService} disabled={loading}>
                🚀 Start Real-time Service
              </Button>
            </div>
          </div>

          {/* Real WATI Testing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🚀 Send Real WATI Message</h3>
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input 
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="917259778145"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Type your WhatsApp message..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSendRealWatiMessage}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? '⏳ Sending...' : '📤 Send REAL WhatsApp Message'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleSyncWatiMessages}
                  disabled={loading}
                >
                  🔄 Sync from WATI
                </Button>
              </div>
            </div>
          </div>

          {/* Test Data Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">📊 Database Test Data</h3>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddTestData}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? '⏳ Adding...' : '📱 Add Test Conversations'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleSendTestMessage('917259778145')}
                disabled={loading}
              >
                📤 Send DB Test Message
              </Button>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className="p-3 rounded-md bg-muted">
              <p className="text-sm">{message}</p>
            </div>
          )}

          {/* Current Conversations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Conversations</h3>
            {conversations.length === 0 ? (
              <p className="text-muted-foreground">No conversations found. Add test data to get started.</p>
            ) : (
              <div className="grid gap-3">
                {conversations.map((conv) => (
                  <Card key={conv.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {conv.client_name || `+${conv.client_telegram_id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {conv.last_message || 'No messages'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {conv.unread_count > 0 && (
                          <Badge variant="destructive">{conv.unread_count}</Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSendTestMessage(WhatsAppService.phoneNumberFromId(conv.client_telegram_id))}
                        >
                          Send Test Message
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">📋 Setup Instructions</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Step 1 - Configure WATI:</strong> Update your WATI API credentials in environment variables (WATI_BASE_URL, WATI_ACCESS_TOKEN)</p>
              <p><strong>Step 2 - Test Database:</strong> Click "Add Test Conversations" to create sample conversations with 917259778145</p>
              <p><strong>Step 3 - Real WATI Test:</strong> Send a real WhatsApp message from +15557735226 to 917259778145 using the form above</p>
              <p><strong>Step 4 - Webhook Setup:</strong> Configure WATI webhook to point to your app for receiving messages</p>
              <p><strong>Step 5 - View Messages:</strong> Go to Messages page to see real-time WhatsApp conversations</p>
            </div>
          </div>

          {/* Environment Setup */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🔧 Environment Variables</h3>
            <div className="p-3 bg-yellow-50 rounded-lg text-sm">
              <p className="font-medium text-yellow-800">Required Environment Variables:</p>
              <pre className="text-yellow-700 mt-2">
{`WATI_BASE_URL=https://live-server-XXX.wati.io
WATI_ACCESS_TOKEN=Bearer your_access_token_here`}
              </pre>
              <p className="text-yellow-700 mt-2">Update these in your .env file or Supabase project settings</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <a href="/#/messages" target="_blank">
                  📱 Open Messages Page
                </a>
              </Button>
              <Button variant="outline" onClick={loadConversations}>
                🔄 Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}