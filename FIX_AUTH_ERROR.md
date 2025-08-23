# Fix Authentication Error - Invalid API Key

## Problem
You're getting a 401 Unauthorized error when trying to sign in, indicating the Supabase Anon Key is invalid or expired.

## Solution Steps

### 1. Get Your Correct API Keys from Supabase

1. Go to your Supabase Dashboard:
   https://supabase.com/dashboard/project/mtjxfyzcuuvtplemliwe/settings/api

2. Copy these values:
   - **Project URL**: `https://mtjxfyzcuuvtplemliwe.supabase.co` (this should be correct already)
   - **anon public** key: (copy the entire key shown under "Project API keys")

### 2. Update Your .env File

Open your `.env` file and update the `VITE_SUPABASE_ANON_KEY` with the correct key from the dashboard:

```env
# Supabase Configuration  
VITE_SUPABASE_URL=https://mtjxfyzcuuvtplemliwe.supabase.co
VITE_SUPABASE_ANON_KEY=<PASTE_YOUR_ANON_KEY_HERE>
```

The anon key should look something like this format:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10anhmeXpjdXV2dHBsZW1saXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3XXXXXXXX,ImV4cCI6MjA2XXXXXXX}.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Restart Your Application

After updating the .env file:

1. Stop the current server (Ctrl+C)
2. Restart the development server:
   ```bash
   npm run dev
   ```
   Or for production preview:
   ```bash
   npm run build
   npm run preview
   ```

### 4. Verify Authentication Works

1. Go to http://localhost:4173 (or your dev port)
2. Try signing in again
3. If you don't have an account, you may need to:
   - Create one via Supabase Dashboard under Authentication → Users
   - Or enable Sign Up in Authentication → Settings

## Additional Troubleshooting

### If the error persists:

1. **Clear browser cache and cookies**
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

2. **Check Supabase Authentication Settings**
   - Go to: https://supabase.com/dashboard/project/mtjxfyzcuuvtplemliwe/auth/users
   - Ensure email authentication is enabled
   - Check if there are any users created

3. **Verify RLS Policies**
   - Some tables might have Row Level Security enabled
   - Check if policies allow authentication

4. **Create a Test User** (if needed)
   - In Supabase Dashboard → Authentication → Users
   - Click "Add user" → "Create new user"
   - Enter email and password
   - Try logging in with these credentials

## Common Issues

- **Expired Key**: Keys can expire, always get the latest from dashboard
- **Wrong Key Type**: Make sure you're using the `anon` key, not the `service_role` key
- **Environment Not Loaded**: Ensure the .env file is in the root directory
- **Caching Issues**: Vite sometimes caches env variables, restart the server

## Need the Current Key?

The current key in your .env file is:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10anhmeXpjdXV2dHBsZW1saXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzU3NTYsImV4cCI6MjA2ODg1MTc1Nn0.KxsHhDcmJIDcPncNXgL05QvDvOm20l0t0vTQdSF0qPg
```

This key appears to be valid (expires in 2035), but if authentication still fails, get a fresh one from the dashboard.