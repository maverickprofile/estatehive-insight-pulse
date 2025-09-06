# 🧪 Testing the Approval System

## Prerequisites
1. Ensure you've run the `RUN_APPROVAL_SYSTEM.sql` in Supabase SQL Editor
2. Development server is running (`npm run dev`)
3. You're logged into the application

## Step-by-Step Testing Guide

### 1️⃣ Verify Database Tables
First, check if tables were created successfully in Supabase:

```sql
-- Run this in Supabase SQL Editor to verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_roles',
    'approval_requests',
    'approval_workflows',
    'auto_approval_rules',
    'crm_audit_trail'
);
```

Expected result: Should return 5 rows with all table names.

### 2️⃣ Check Default Data
```sql
-- Check if default roles were created
SELECT role_name, role_code, hierarchy_level, can_auto_approve 
FROM public.user_roles 
WHERE is_system_role = true;

-- Check if workflows exist
SELECT workflow_name, entity_type, action_type 
FROM public.approval_workflows;

-- Check auto-approval rules
SELECT rule_name, entity_type, conditions 
FROM public.auto_approval_rules;
```

### 3️⃣ Test Voice-to-CRM with Approvals

1. **Navigate to Voice-to-CRM**
   - Go to: `http://localhost:8080/#/ai-tools/voice-to-crm`
   - Click on the "Dashboard" tab

2. **Record a Test Voice Note**
   - Click the microphone button to start recording
   - Say something like:
     ```
     "Please create a new lead for John Smith. 
     His phone number is 555-1234. 
     He's interested in a 3-bedroom apartment in downtown. 
     His budget is around 500,000 dollars. 
     Schedule a property viewing for next Tuesday at 2 PM."
     ```
   - Click stop recording

3. **Check for Approval Notifications**
   - After processing, you should see:
     - A toast notification saying "X CRM action(s) require your approval"
     - The "Approvals" tab should show a red badge with pending count

4. **Review Pending Approvals**
   - Click on the "Approvals" tab
   - You should see cards for each suggested action:
     - Create Lead (John Smith)
     - Schedule Appointment (Property viewing)
   - Each card shows:
     - Action type icon
     - Confidence score (percentage)
     - Priority badge
     - Action details
     - Approve/Reject buttons

### 4️⃣ Test Approval Queue Dashboard

1. **Navigate to Approval Queue**
   - Go to: `http://localhost:8080/#/approval-queue`
   - Or click "View All" in the Approvals tab

2. **Check Dashboard Features**
   - ✅ Statistics cards showing:
     - Total Requests
     - Approval Rate
     - Average Approval Time
     - Auto-Approved count
   - ✅ Filter options:
     - Status filter (Pending, Approved, Rejected)
     - Entity type filter
     - Priority filter
     - Search box
   - ✅ Approval requests table with all details

3. **Test Approval Actions**
   - Click "View Details" on any request
   - The approval dialog should show:
     - Request details
     - Before/After changes comparison
     - Impact analysis
     - Approval progress bar
   - Try approving or rejecting a request

### 5️⃣ Test Role Configuration

1. **Navigate to Role Configuration**
   - Go to: `http://localhost:8080/#/role-configuration`

2. **Verify Default Roles**
   - You should see 4 default roles:
     - Administrator (Level 1)
     - Manager (Level 2)
     - Agent (Level 3)
     - Viewer (Level 4)

3. **Test Role Creation**
   - Click "Add Role"
   - Fill in:
     - Role Name: "Senior Agent"
     - Role Code: "senior_agent"
     - Description: "Senior sales agent with approval rights"
     - Hierarchy Level: 2
     - Approval Levels: 2
     - Toggle "Can Auto-Approve" ON
   - Click "Save Role"

### 6️⃣ Check Audit Trail

Run this query in Supabase to see audit logs:

```sql
-- View recent audit trail entries
SELECT 
    action_type,
    entity_type,
    user_id,
    operation,
    success,
    timestamp
FROM public.crm_audit_trail
ORDER BY timestamp DESC
LIMIT 20;
```

## 🎯 Success Indicators

The system is working correctly if:

✅ **Database**
- All 6 tables exist in Supabase
- Default data is populated

✅ **Voice CRM Integration**
- Voice notes trigger AI decision analysis
- Pending approvals appear in the Approvals tab
- Approval badge shows correct count

✅ **Approval Dialog**
- Opens when clicking on approval actions
- Shows detailed before/after comparison
- Approve/Reject buttons work

✅ **Approval Queue**
- Page loads without errors
- Shows statistics and pending requests
- Filters and search work

✅ **Role Configuration**
- Shows default roles
- Can create/edit roles
- Changes persist in database

✅ **Audit Trail**
- All actions are logged
- Audit entries show in database

## 🔍 Troubleshooting

### If tables don't exist:
1. Make sure you ran the entire SQL script
2. Check for any error messages in SQL Editor
3. Verify you're in the correct Supabase project

### If no approvals appear:
1. Ensure OpenAI API key is configured
2. Check browser console for errors
3. Verify AI decision service is initialized

### If pages show errors:
1. Check browser console (F12)
2. Ensure all services are running
3. Try refreshing the page

### Console Commands for Debugging:
```javascript
// Run these in browser console to check services

// Check if approval service is loaded
console.log(window.approvalService);

// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Check pending approvals
const { data } = await supabase
  .from('approval_requests')
  .select('*')
  .eq('status', 'pending');
console.log('Pending approvals:', data);
```

## 📊 Test Scenarios

### Scenario 1: High Confidence Auto-Approval
- Record: "Add a note that the client prefers morning appointments"
- Expected: Auto-approved (confidence > 0.9 for notes)

### Scenario 2: Manual Approval Required
- Record: "Create a new lead for ABC Company, budget 10 million"
- Expected: Requires manual approval (high value)

### Scenario 3: Multiple Actions
- Record: "Update John's budget to 800k and schedule viewing tomorrow at 3pm"
- Expected: 2 approval requests created

## ✅ Testing Checklist

- [ ] Database tables created
- [ ] Default roles visible
- [ ] Voice note creates approval requests
- [ ] Approval dialog opens and works
- [ ] Approval queue shows statistics
- [ ] Can approve/reject actions
- [ ] Audit trail records actions
- [ ] Auto-approval rules work for high confidence
- [ ] Role configuration page works
- [ ] No console errors

## 📝 Notes
- The system uses your Supabase auth user ID as the organization ID
- First-time setup creates default roles and workflows
- Auto-approval works for actions with confidence > 0.9
- All actions are logged in the audit trail for compliance