# 🧪 Test the Complete Telegram to Approval Workflow

## ✅ What We Fixed

1. **Enhanced lead detection** - Now recognizes "create lead", "create a new lead", "new lead" phrases
2. **Better entity extraction** - Extracts names, phone numbers, emails from voice notes
3. **Approval request creation** - All decisions now properly create approval requests
4. **Telegram notifications** - Shows which actions need approval vs auto-approved

## 📋 Test Steps

### Step 1: Send Test Voice Note via Telegram

Send a voice note to your bot with this exact phrase:
```
"Create a new lead for John Smith, phone number 555-0123, 
he's interested in luxury apartments, budget is 2 million dollars"
```

### Step 2: Monitor Processing (5-10 seconds)

The bot should respond with:
1. ✅ Initial "Processing..." message
2. 📝 Transcription result
3. 📋 Suggested actions with approval status

### Step 3: Check Approval Queue

1. Go to: http://localhost:8080/#/approval-queue
2. You should see:
   - **New approval request** for "Create New Lead"
   - Confidence score (should be ~80%)
   - Details showing: Name: John Smith, Phone: 5550123

### Step 4: Verify with SQL

Run the test queries in Supabase:
```sql
-- Check if decision was created
SELECT * FROM ai_decisions 
WHERE decision_type = 'create_lead' 
ORDER BY suggested_at DESC 
LIMIT 1;

-- Check if approval request exists
SELECT * FROM approval_requests 
WHERE action_type LIKE '%lead%' 
ORDER BY requested_at DESC 
LIMIT 1;
```

## 🔍 Expected Results

### ✅ Successful Flow:
1. Voice note transcribed correctly
2. AI identifies "create_lead" decision
3. Approval request created
4. Telegram shows "⏳ Awaiting approval"
5. Approval appears in queue

### ❌ If Still Not Working:

Check these common issues:

#### 1. OpenAI Not Configured?
If using rule-based analysis (no OpenAI key), the system will still work but with simpler entity extraction.

#### 2. No Decisions Created?
Check console for:
```
Generated 0 decision suggestions
```
This means the phrase wasn't recognized. Try:
- "I want to create a new lead for Alice Brown"
- "Add a new lead named Bob Johnson"
- "New client interested in properties"

#### 3. Decisions Created but No Approvals?
Check for this error in console:
```
Error processing decision: [error message]
```

#### 4. Database Connection Issues?
Verify tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('approval_requests', 'ai_decisions', 'approval_workflows');
```

## 🎯 Other Test Scenarios

### Test Auto-Approval (Add Note):
```
"Add a note that the client prefers morning appointments only"
```
Expected: Should auto-approve if confidence > 90%

### Test Appointment Scheduling:
```
"Schedule a property viewing for tomorrow at 3 PM for Sarah Johnson"
```
Expected: Creates approval request for appointment

### Test Task Creation:
```
"Create a follow-up task to call the client next week"
```
Expected: Creates approval request for task

## 📊 Debug Commands

### Check Current Processing Status:
```sql
-- See all processing stages for recent voice note
SELECT 
    vpj.status as job_status,
    cc.transcription,
    cc.entities,
    ad.decision_type,
    ar.status as approval_status
FROM voice_processing_jobs vpj
LEFT JOIN client_communications cc ON vpj.communication_id = cc.id
LEFT JOIN ai_decisions ad ON ad.communication_id = cc.id
LEFT JOIN approval_requests ar ON ar.decision_id = ad.id
WHERE vpj.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY vpj.created_at DESC;
```

### Force Reprocess:
If a job is stuck, update its status:
```sql
UPDATE voice_processing_jobs 
SET status = 'queued', retry_count = 0
WHERE id = '[job_id]';
```

## 🚀 Quick Test Script

Run all tests at once by sending these voice notes in sequence:

1. **Lead Creation**: "Create a new lead for Test User One, phone 555-0001"
2. **Add Note**: "Add a note that client is very interested" 
3. **Schedule Meeting**: "Schedule a viewing tomorrow at 2 PM"
4. **Create Task**: "Create a follow-up task for next Monday"

Then check:
- Approval Queue should show 3 pending (lead, meeting, task)
- Notes should be auto-approved
- All should appear in audit trail

## 📱 Telegram Bot Commands

Send these to your bot to check status:

- `/status` - Check if bot is active
- `/help` - Show available commands
- `/test` - Run a test approval creation

## ✨ Success Indicators

You'll know it's working when:

1. **Telegram shows decision suggestions** with icons:
   - 👤 Create New Lead
   - 📅 Schedule Appointment
   - 📋 Create Task
   - 📝 Add Note

2. **Approval Queue shows pending items** with:
   - Decision details
   - Confidence scores
   - Approve/Reject buttons

3. **Audit trail logs all actions** in CRM

## Need Help?

If issues persist after these tests:

1. Check browser console (F12) for errors
2. Review `TEST_TELEGRAM_APPROVAL.sql` queries
3. Check Realtime Logs in Voice-to-CRM dashboard
4. Verify all services initialized:
   - configService ✓
   - aiDecisionService ✓ 
   - crmActionsService ✓
   - approvalService ✓