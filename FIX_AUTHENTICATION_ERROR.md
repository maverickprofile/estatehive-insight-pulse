# 🔧 Fix Authentication Error - Invalid API Key

## Problem
Getting "Authentication error: invalid API key" when trying to login/signup.

## Root Causes
1. **Incomplete Service Role Key** - The service role key in `.env` appears truncated
2. **Database not initialized** - Tables might not be created yet
3. **Auth not configured** - Supabase Auth might not be enabled

## Solution Steps

### Step 1: Get Fresh API Keys from Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/nepstrbszgqczpphhknv
   - Login with your Supabase account

2. **Navigate to Settings → API**
   - You'll see multiple keys:
     - `anon` (public) key - Safe for client-side
     - `service_role` (secret) key - Server-side only

3. **Copy the Complete Keys**
   - Make sure to copy the ENTIRE key (they're quite long)
   - The anon key should be ~250+ characters
   - The service role key should be ~250+ characters

4. **Update .env File**
   ```env
   VITE_SUPABASE_URL=https://nepstrbszgqczpphhknv.supabase.co
   VITE_SUPABASE_ANON_KEY=<paste-complete-anon-key-here>
   VITE_SUPABASE_SERVICE_ROLE=<paste-complete-service-role-key-here>
   ```

### Step 2: Initialize Database (CRITICAL!)

1. **Go to SQL Editor in Supabase Dashboard**
2. **Run Migration #1:**
   - Copy entire contents of `001_complete_database_setup.sql`
   - Paste in SQL Editor
   - Click "Run"
   - You should see: "Estate Hive CRM database setup completed successfully!"

3. **Run Migration #2:**
   - Copy entire contents of `002_add_missing_fields.sql`
   - Paste in SQL Editor
   - Click "Run"
   - You should see: "Missing fields added successfully!"

### Step 3: Enable Authentication

1. **In Supabase Dashboard → Authentication → Providers**
   - Enable "Email" provider
   - Set these options:
     - ✅ Enable Email provider
     - ✅ Confirm email (can disable for testing)
     - ✅ Enable signup

2. **Check Authentication Settings**
   - Go to Authentication → Settings
   - Ensure "Enable signup" is ON
   - Set Site URL: `http://localhost:8081`
   - Add Redirect URL: `http://localhost:8081/*`

### Step 4: Test Authentication

1. **Restart Dev Server**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

2. **Create Test User via Supabase Dashboard**
   - Go to Authentication → Users
   - Click "Add user" → "Create new user"
   - Email: test@example.com
   - Password: Test@123456
   - ✅ Auto Confirm User (for testing)

3. **Try Login**
   - Go to http://localhost:8081
   - Login with test credentials

### Step 5: Verify Tables Exist

Run this in SQL Editor to check:
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- profiles
- agents
- properties
- leads
- clients
- appointments
- invoices
- etc.

### Step 6: Alternative - Direct User Creation

If auth still fails, create user directly:
```sql
-- Create test profile (after signing up a user)
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'YOUR-USER-UUID-HERE', -- Get from auth.users table
  'test@example.com',
  'Test User',
  'admin'
);
```

## Common Issues & Fixes

### Issue: "Invalid API key"
**Fix:** Your API key is wrong or incomplete. Get fresh keys from Supabase.

### Issue: "relation 'profiles' does not exist"
**Fix:** Database not initialized. Run the migrations.

### Issue: "password authentication failed"
**Fix:** Wrong database credentials. Check Supabase project is active.

### Issue: "Failed to fetch"
**Fix:** CORS issue. Add localhost:8081 to allowed URLs in Supabase.

## Quick Debug Commands

Test connection with curl:
```bash
curl https://nepstrbszgqczpphhknv.supabase.co/rest/v1/ \
  -H "apikey: YOUR-ANON-KEY" \
  -H "Authorization: Bearer YOUR-ANON-KEY"
```

## Emergency Fix

If nothing works, create new Supabase project:
1. Create new project at supabase.com
2. Get new URL and keys
3. Update .env file
4. Run migrations
5. Test again

## Need the Correct Keys?

The keys you provided seem incomplete. Please:
1. Go to your Supabase dashboard
2. Copy the COMPLETE anon key (should end properly, not cut off)
3. Copy the COMPLETE service role key
4. Update .env file
5. Restart dev server

The service role key in your .env appears to end abruptly with: `...cyNlcnZpY2VfchgskGFZGlPnj50CU76Pr0UPROBGQZEiUhEVmjQE`

This looks truncated. A valid JWT should have three parts separated by dots and end properly.