# WhatsApp Integration Deployment Guide

## Current Status
✅ Fixed ResizablePanel layout issues  
✅ Fixed TypeScript errors in Messages.tsx  
✅ Installed Supabase CLI  
❌ **Need to deploy edge functions to fix API errors**

## The Main Problem
The error `Failed to fetch messages: Failed to send a request to the Edge Function` occurs because:
1. Your edge function exists locally but isn't deployed to your remote Supabase project
2. The URL `https://mtjxfyzcuuvtplemliwe.supabase.co/functions/v1/get-messages` returns 404

## Step-by-Step Solution

### 1. Login to Supabase CLI
```bash
# Option A: Interactive login (recommended)
npx supabase login

# Option B: If you have an access token
npx supabase login --token YOUR_ACCESS_TOKEN
```

### 2. Link to your existing project
```bash
# Link to your existing Supabase project
npx supabase link --project-ref mtjxfyzcuuvtplemliwe
```

### 3. Set up environment variables in Supabase
Go to your Supabase dashboard → Project Settings → Edge Functions → Environment variables

Add these variables:
- `WATI_BASE_URL`: Your WATI API base URL (e.g., `https://live-server-XXX.wati.io`)
- `WATI_API_KEY`: Your WATI API key (with `Bearer ` prefix if required)

### 4. Deploy the edge functions
```bash
# Deploy all functions
npx supabase functions deploy

# Or deploy just the get-messages function
npx supabase functions deploy get-messages
```

### 5. Test the deployment
After deployment, test the function:
```bash
curl -X GET "https://mtjxfyzcuuvtplemliwe.supabase.co/functions/v1/get-messages" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

## Alternative: Test Locally First

If you want to test locally before deploying:

### 1. Start Supabase locally
```bash
npx supabase start
```

### 2. Create a local .env file
Create `.env` file with:
```
WATI_BASE_URL=https://live-server-XXX.wati.io
WATI_API_KEY=Bearer your_api_key_here
```

### 3. Update your React app to use local Supabase
Temporarily change your Supabase URL in the React app to point to local instance:
```typescript
// In src/lib/supabaseClient.ts
const localSupabaseUrl = 'http://localhost:54321'
```

## Quick Fix Commands

Run these commands in order:

```bash
# 1. Login to Supabase
npx supabase login

# 2. Link project
npx supabase link --project-ref mtjxfyzcuuvtplemliwe

# 3. Deploy functions
npx supabase functions deploy get-messages

# 4. Test your app
npm run dev
```

## Expected Results

After successful deployment:
- ✅ No more CORS errors
- ✅ No more 404 errors  
- ✅ Messages will load from WATI API
- ✅ UI layout will render correctly

## Need Help?

If you encounter issues:
1. Check Supabase dashboard → Edge Functions → Logs for error details
2. Verify environment variables are set correctly
3. Test the WATI API directly to ensure credentials work