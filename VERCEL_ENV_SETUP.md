# 🔐 Vercel Environment Variables Setup Guide

## 📋 Required Environment Variables for Voice CRM

### Method 1: Vercel Dashboard (Recommended)

1. **Go to your Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `estatehive-insight-pulse`

2. **Navigate to Settings**
   - Click on your project
   - Go to "Settings" tab
   - Select "Environment Variables" from the left sidebar

3. **Add Each Variable**
   
   Click "Add New" and add these variables one by one:

   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `VITE_OPENAI_API_KEY` | Your OpenAI API key | Get from https://platform.openai.com/api-keys |
   | `VITE_TELEGRAM_BOT_TOKEN` | Your Telegram bot token | Get from @BotFather on Telegram |
   | `VITE_SUPABASE_URL` | Your Supabase URL | From Supabase project settings |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | From Supabase project settings |
   | `VITE_TRANSCRIPTION_PROVIDER` | `openai` | Use OpenAI Whisper |
   | `VITE_USE_WEB_SPEECH_API` | `false` | Disable Web Speech API |
   | `VITE_TELEGRAM_PROXY_URL` | `https://estatehive-insight-pulse.vercel.app/api/telegram/download` | Your Vercel proxy URL |
   | `TELEGRAM_BOT_TOKEN` | Same as VITE_TELEGRAM_BOT_TOKEN | For serverless functions |
   | `OPENAI_API_KEY` | Same as VITE_OPENAI_API_KEY | For serverless functions |
   | `VITE_WATI_BASE_URL` | (Optional - leave empty if not using WhatsApp) | WATI API base URL |
   | `VITE_WATI_API_KEY` | (Optional - leave empty if not using WhatsApp) | WATI API key |

4. **Select Environments**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. **Save Changes**
   - Click "Save" after adding each variable

### Method 2: Vercel CLI

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Add Environment Variables via CLI**
   ```bash
   # Navigate to your project
   cd estatehive-insight-pulse

   # Add each variable
   vercel env add VITE_OPENAI_API_KEY
   vercel env add VITE_TELEGRAM_BOT_TOKEN
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add VITE_TRANSCRIPTION_PROVIDER
   vercel env add VITE_USE_WEB_SPEECH_API
   vercel env add VITE_TELEGRAM_PROXY_URL
   vercel env add TELEGRAM_BOT_TOKEN
   vercel env add OPENAI_API_KEY
   ```

   For each variable, you'll be prompted to:
   - Enter the value
   - Select environments (choose all)

### Method 3: Import from .env File

1. **Create a .env.production file locally**
   ```bash
   cp .env.example .env.production
   ```

2. **Fill in your actual values in .env.production**

3. **Use Vercel CLI to import**
   ```bash
   vercel env pull .env.production
   ```

## 🔄 Trigger Redeployment

After adding all environment variables:

1. **Go to Deployments tab**
2. **Click on the latest deployment**
3. **Click "Redeploy"**
4. **Select "Redeploy with existing Build Cache"**

Or via CLI:
```bash
vercel --prod
```

## ✅ Verify Environment Variables

1. **Check in Vercel Dashboard**
   - Go to Settings → Environment Variables
   - All variables should be listed with hidden values

2. **Test the deployment**
   - Visit your deployment URL
   - Check browser console for any missing env var errors
   - Test Voice CRM functionality

## 🚨 Important Security Notes

1. **Never commit .env files** to Git
2. **Keep API keys secret** - don't share in public repos
3. **Use different keys** for development and production
4. **Rotate keys regularly** for security

## 📝 Environment Variable Details

### OpenAI API Key
- Get from: https://platform.openai.com/api-keys
- Required for: Voice transcription (Whisper)
- Cost: $0.006 per minute of audio

### Telegram Bot Token
- Get from: @BotFather on Telegram
- Format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
- Required for: Receiving voice messages

### Supabase Credentials
- Get from: Supabase Dashboard → Settings → API
- URL format: `https://xxxxx.supabase.co`
- Anon key: Long JWT token

### Telegram Proxy URL
- Your Vercel deployment URL + `/api/telegram/download`
- Example: `https://estatehive-insight-pulse.vercel.app/api/telegram/download`

## 🔧 Troubleshooting

### Variables not working?
1. Check spelling (case-sensitive)
2. Ensure no quotes around values in Vercel
3. Redeploy after adding variables
4. Check both VITE_ and non-VITE versions

### Getting 401/403 errors?
- Verify API keys are correct
- Check API key has sufficient credits
- Ensure bot token is valid

### Telegram not downloading files?
- Verify VITE_TELEGRAM_PROXY_URL is correct
- Check api/telegram-proxy.js is deployed

## 🎉 Success!

Once all environment variables are added and the site is redeployed, your Voice CRM will be fully operational on Vercel with:
- ✅ Voice message processing
- ✅ AI transcription and analysis
- ✅ Instant webhook responses
- ✅ Secure API handling