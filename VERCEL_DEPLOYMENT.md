# Vercel Deployment Guide for Estate Hive CRM

## ✅ Build Fix Applied
The const reassignment error in `web-speech-improved.service.ts` has been fixed and pushed to the main branch.

## Deployment Steps

### 1. Connect to Vercel
If not already connected:
```bash
npm i -g vercel
vercel
```

### 2. Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

```env
# Required - Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - Leave empty to use FREE Web Speech API
VITE_OPENAI_API_KEY=

# Optional - Telegram Bot (leave empty for demo)
VITE_TELEGRAM_BOT_TOKEN=
VITE_TELEGRAM_BOT_USERNAME=

# Recommended Settings for FREE operation
VITE_TRANSCRIPTION_PROVIDER=web-speech
VITE_USE_WEB_SPEECH_API=true

# After deployment, add your Vercel URL here
VITE_TELEGRAM_PROXY_URL=https://your-app.vercel.app/api/telegram/download
```

### 3. Build Settings in Vercel
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Deploy
```bash
# Deploy to production
vercel --prod

# Or push to GitHub (auto-deploys if connected)
git push origin main
```

## Post-Deployment Configuration

### 1. Update Telegram Proxy URL
After deployment, update your environment variable:
```
VITE_TELEGRAM_PROXY_URL=https://your-deployed-url.vercel.app/api/telegram/download
```

### 2. Test the Deployment
1. Visit: `https://your-app.vercel.app`
2. Navigate to AI Tools → Voice to CRM
3. Test features:
   - Upload audio file
   - Test microphone (HTTPS required)
   - Send Telegram voice message

### 3. Enable HTTPS for Microphone
Vercel automatically provides HTTPS, which is required for:
- Web Speech API
- Microphone access
- Service Workers

## Troubleshooting Vercel Deployment

### Build Errors
If you encounter build errors:

1. **Check Node version**:
   Add to `package.json`:
   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

2. **Clear build cache**:
   - Vercel Dashboard → Settings → Clear Build Cache

3. **Check dependencies**:
   ```bash
   npm ci
   npm run build
   ```

### Runtime Errors

1. **CORS Issues**:
   - The `/api/telegram-proxy.js` endpoint handles CORS
   - Ensure `vercel.json` is properly configured

2. **Environment Variables**:
   - Check they're set in Vercel Dashboard
   - Redeploy after changing env vars

3. **API Routes**:
   - Files in `/api` folder become serverless functions
   - Check function logs in Vercel Dashboard

## Features Working Without API Keys

The following features work completely FREE:
- ✅ Web Speech API transcription
- ✅ Voice recording from microphone
- ✅ Audio file upload and processing
- ✅ Workflow automation
- ✅ Mock data for testing
- ✅ Fallback audio generation

## Optional Features (Require API Keys)

- OpenAI transcription (better accuracy)
- AI-powered message processing
- Advanced language detection
- Sentiment analysis

## Monitoring

### Check Deployment Status
```bash
vercel ls
vercel inspect [deployment-url]
```

### View Logs
```bash
vercel logs [deployment-url]
```

### Function Logs
Check serverless function logs in Vercel Dashboard:
- Functions Tab → View logs for `/api/telegram-proxy`

## Performance Tips

1. **Enable Caching**:
   Already configured in `vercel.json`

2. **Optimize Bundle**:
   ```bash
   npm run build
   # Check dist folder size
   ```

3. **Use Edge Functions**:
   For better performance, consider edge functions for API routes

## Security

1. **API Keys**:
   - Never commit `.env` file
   - Use Vercel environment variables
   - Rotate keys regularly

2. **CORS**:
   - Configure allowed origins in production
   - Update `api/telegram-proxy.js` with specific origins

3. **Rate Limiting**:
   - Implement rate limiting for API routes
   - Use Vercel's built-in DDoS protection

## Support

If deployment fails:
1. Check build logs in Vercel Dashboard
2. Verify all environment variables are set
3. Ensure GitHub repo is up to date
4. Clear build cache and redeploy

## Quick Deploy Button

Add this to your README for one-click deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmaverickprofile%2Festatehive-insight-pulse&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&envDescription=Required%20environment%20variables&envLink=https%3A%2F%2Fgithub.com%2Fmaverickprofile%2Festatehive-insight-pulse%2Fblob%2Fmain%2F.env.example)