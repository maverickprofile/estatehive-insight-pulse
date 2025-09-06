# 🎤 Telegram Voice Notes + Approval System Setup

## Quick Start Guide

Since the microphone feature is temporarily being updated, use **Telegram voice notes** for the best experience with the approval system.

## 📱 Step 1: Setup Telegram Bot

### A. Create Your Bot
1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Choose a name for your bot (e.g., "Estate Hive Voice")
4. Choose a username ending in `bot` (e.g., "estatehive_voice_bot")
5. Save the **Bot Token** you receive (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### B. Configure Bot in CRM
1. Go to: http://localhost:8080/#/ai-tools/voice-to-crm
2. Click **"Setup Telegram Bot"** button
3. Enter your Bot Token
4. Click **"Test Connection"**
5. Once connected, click **"Complete Setup"**

## 🎙️ Step 2: Send Voice Notes

### Method 1: Direct to Bot
1. Open Telegram
2. Search for your bot username (e.g., @estatehive_voice_bot)
3. Start a chat with `/start`
4. **Hold the microphone button** and speak your message
5. Release to send the voice note

### Method 2: Group Chat
1. Create a new Telegram group
2. Add your bot to the group
3. Send voice messages in the group
4. Bot will process all voice messages

## 📝 Step 3: Test Approval System

### Send Test Voice Messages

**Test 1: Create Lead (Requires Approval)**
```
"Create a new lead for John Smith. 
Phone number 555-0123. 
He's interested in luxury apartments in downtown. 
Budget is 2 million dollars."
```
Expected: Creates approval request for new lead

**Test 2: Schedule Appointment (Requires Approval)**
```
"Schedule a property viewing for tomorrow at 3 PM 
for the client Sarah Johnson 
at the Marina Bay property."
```
Expected: Creates approval request for appointment

**Test 3: Add Note (Auto-Approved)**
```
"Add a note that the client prefers 
morning appointments only."
```
Expected: Auto-approved if confidence > 90%

## ✅ Step 4: Review & Approve Actions

### In Voice-to-CRM Page
1. After sending voice note, wait 5-10 seconds
2. Click the **"Approvals"** tab
3. You'll see pending actions with:
   - Action type and details
   - Confidence score
   - Approve/Reject buttons

### In Approval Queue Dashboard
1. Go to: http://localhost:8080/#/approval-queue
2. See all pending approvals
3. Click "View Details" for full information
4. Approve or reject with notes

## 🔍 How to Verify It's Working

### Check Telegram Bot
```
Send: /status
Response: Bot should reply with active status
```

### Check Voice Notes Processing
1. Go to Voice-to-CRM → "Voice Notes" tab
2. You should see your transcribed messages
3. Each should have:
   - Transcription text
   - AI summary
   - Key points
   - Suggested actions

### Check Approval Creation
1. After sending voice note with CRM actions
2. Check browser console (F12):
```javascript
// See pending approvals
const { data } = await supabase
  .from('approval_requests')
  .select('*')
  .eq('status', 'pending');
console.table(data);
```

## 🎯 Voice Command Examples

### Lead Management
- "Create lead for [Name], phone [number], interested in [property type]"
- "Update lead status to qualified"
- "Convert lead John Doe to client"

### Appointments
- "Schedule viewing tomorrow at 2 PM"
- "Cancel appointment for Friday"
- "Reschedule meeting to next Monday"

### Tasks & Follow-ups
- "Create follow-up task for next week"
- "Remind me to call client tomorrow"
- "Set task to send property details"

### Notes & Updates
- "Add note about client preferences"
- "Update budget to 3 million"
- "Client prefers ground floor units"

## 🚨 Troubleshooting

### Bot Not Responding
1. Check bot token is correct
2. Ensure bot is active in Voice-to-CRM
3. Try sending `/start` to bot first

### No Approvals Appearing
1. Check if OpenAI API key is configured
2. Ensure voice note mentions CRM actions
3. Check "Realtime Logs" for errors

### Voice Not Transcribing
1. Speak clearly and not too fast
2. Keep voice notes under 1 minute
3. Check internet connection
4. Try in quiet environment

### Approvals Not Loading
Run this SQL to check:
```sql
SELECT COUNT(*) as pending_count 
FROM approval_requests 
WHERE status = 'pending';
```

## 📊 Monitor Activity

### Real-time Logs
- Voice-to-CRM → Dashboard tab
- Shows all processing steps
- Check for errors or warnings

### Voice Notes History
- Voice-to-CRM → Voice Notes tab
- See all processed voice messages
- Filter and search capabilities

### Approval Statistics
- Approval Queue page
- Shows approval rate
- Average processing time
- Auto-approval stats

## 🔐 Security Notes

1. **Bot Token**: Keep it secret, don't share
2. **Allowed Chats**: Configure which chats bot responds to
3. **Auto-Approval**: Only for high-confidence, low-risk actions
4. **Audit Trail**: All actions are logged

## 💡 Tips for Best Results

1. **Speak Clearly**: Articulate words properly
2. **Be Specific**: Include names, numbers, dates
3. **One Topic**: Focus on one action per voice note
4. **Quiet Environment**: Reduce background noise
5. **Shorter Messages**: 15-30 seconds work best

## 🎬 Quick Demo Script

Try this complete workflow:

1. **Send Voice Note**:
   "Create a new lead for Alice Brown, phone 555-9876, interested in 2-bedroom condos, budget around 800,000"

2. **Check Approvals Tab**:
   - See "Create New Lead" card
   - Shows 85% confidence
   - Click "Approve"

3. **Verify in Database**:
   ```sql
   SELECT * FROM leads 
   WHERE name LIKE '%Alice Brown%' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

4. **Check Audit Trail**:
   ```sql
   SELECT * FROM crm_audit_trail 
   WHERE entity_type = 'lead' 
   ORDER BY timestamp DESC 
   LIMIT 5;
   ```

## Need Help?

1. Check console for errors (F12)
2. Review Realtime Logs in Dashboard
3. Verify bot is active and connected
4. Ensure all tables exist in database

The Telegram voice notes provide a convenient way to interact with the CRM through natural speech, with the approval system ensuring all actions are properly authorized before execution!