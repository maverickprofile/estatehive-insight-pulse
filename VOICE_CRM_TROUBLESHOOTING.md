# Voice CRM Troubleshooting Guide

## Quick Fixes for Common Issues

### 1. CORS Proxy Blocked (403 Forbidden)
**Problem**: `GET https://corsproxy.io/?... 403 (Forbidden)`

**Solutions**:
1. **Deploy the Telegram proxy endpoint** (Recommended):
   ```bash
   vercel deploy
   ```
   Then update your `.env` file:
   ```
   VITE_TELEGRAM_PROXY_URL=https://your-app.vercel.app/api/telegram/download
   ```

2. **Use local development proxy**:
   ```bash
   npm run dev -- --host
   ```
   Access via `https://localhost:8084` (HTTPS required)

3. **Fallback mode**: The system will automatically use placeholder audio when download fails

### 2. Microphone Access Denied
**Problem**: `Speech recognition error: not-allowed`

**Solutions**:
1. **Ensure HTTPS**: 
   - Use `https://localhost:8084` not `http://`
   - Deploy to a proper HTTPS domain

2. **Grant microphone permission**:
   - Click the lock icon in browser address bar
   - Set Microphone to "Allow"
   - Refresh the page

3. **Test microphone**:
   ```javascript
   // Run in browser console
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(() => console.log('Microphone OK'))
     .catch(err => console.error('Microphone blocked:', err));
   ```

### 3. OpenAI Rate Limit (429)
**Problem**: `429 You exceeded your current quota`

**Solutions**:
1. **Remove hardcoded API key** from `.env`:
   ```
   VITE_OPENAI_API_KEY=
   ```
   System will use FREE Web Speech API only

2. **Get a new API key**:
   - Go to https://platform.openai.com/api-keys
   - Create new key with proper limits
   - Update `.env` file

3. **Use Web Speech API only**:
   ```
   VITE_TRANSCRIPTION_PROVIDER=web-speech
   VITE_USE_WEB_SPEECH_API=true
   ```

### 4. Telegram Bot Conflicts (409)
**Problem**: `Conflict: terminated by other getUpdates request`

**Solutions**:
1. **Stop other bot instances**:
   - Close all browser tabs with the app
   - Restart the application
   - Clear browser local storage

2. **Use webhook mode** (for production):
   - Deploy to Vercel/Netlify
   - Configure webhook URL in bot settings

### 5. Audio Decoding Errors
**Problem**: `Unable to decode audio data`

**Solutions**:
1. **The improved services handle this automatically** by:
   - Converting OGG to WAV
   - Using fallback audio
   - Providing mock transcriptions

2. **Ensure you're using improved services**:
   Check imports in `VoiceToCRM.tsx`:
   ```typescript
   import { improvedTelegramService as telegramService } from '@/services/telegram-improved.service';
   import { improvedWebSpeech as webSpeechTranscription } from '@/services/web-speech-improved.service';
   ```

## Environment Setup

### Required `.env` Configuration
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your values:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Optional (leave empty to use FREE Web Speech API)
VITE_OPENAI_API_KEY=

# Optional (leave empty for demo bot)
VITE_TELEGRAM_BOT_TOKEN=
VITE_TELEGRAM_BOT_USERNAME=

# Transcription Settings
VITE_TRANSCRIPTION_PROVIDER=web-speech
VITE_USE_WEB_SPEECH_API=true

# Server endpoint for Telegram downloads (after deployment)
VITE_TELEGRAM_PROXY_URL=
```

### Browser Requirements
- **Chrome/Edge**: Version 90+ (recommended)
- **Firefox**: Version 94+ (limited Web Speech API support)
- **Safari**: Version 14.1+ (experimental Web Speech API)
- **HTTPS Required**: Web Speech API only works on HTTPS or localhost

### Permissions Required
1. **Microphone**: For Web Speech API
2. **Notifications**: Optional, for desktop alerts
3. **Storage**: For caching and offline support

## Testing the System

### 1. Test Web Speech API
```javascript
// Run in browser console
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.start();
console.log('If no error, Web Speech API is working');
```

### 2. Test Telegram Bot
1. Open Telegram
2. Search for your bot (@estatehive_voice_bot or your custom bot)
3. Send `/start` command
4. Send a voice message
5. Check browser console for processing logs

### 3. Test with Mock Data
The system includes fallback mechanisms:
- Placeholder audio generation
- Mock transcriptions
- Demo AI responses

## Production Deployment

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Option 2: Netlify
```bash
# Build the app
npm run build

# Deploy dist folder to Netlify
```

### Option 3: Self-hosted
1. Set up HTTPS with SSL certificate
2. Configure reverse proxy (nginx/Apache)
3. Set up PM2 for process management
4. Configure environment variables

## Common Error Messages and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `403 Forbidden` | CORS proxy blocked | Deploy server endpoint |
| `429 Too Many Requests` | API rate limit | Use Web Speech API |
| `409 Conflict` | Multiple bot instances | Stop other instances |
| `not-allowed` | No microphone permission | Grant permission |
| `Unable to decode` | Unsupported audio format | System auto-converts |
| `Chat not found` | Bot not in chat | Add bot to Telegram chat |

## Support

For additional help:
1. Check browser console for detailed errors
2. Review service worker logs
3. Check network tab for failed requests
4. Contact support with error screenshots

## Quick Start Commands

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run development server with HTTPS
npm run dev -- --host --https

# Build for production
npm run build

# Deploy to Vercel
vercel

# Check for issues
npm run lint
npm run type-check
```

## Testing Without External Services

The system can run in "demo mode" without:
- OpenAI API key (uses Web Speech API)
- Telegram bot token (uses UI upload)
- CORS proxy (uses fallback audio)

Just run:
```bash
npm run dev
```

And use the web interface to:
1. Upload audio files directly
2. Test with microphone input
3. See mock transcriptions
4. Test workflow automation