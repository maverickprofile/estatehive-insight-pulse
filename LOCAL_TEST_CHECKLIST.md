# Voice CRM Local Testing Checklist

## 🚀 Server Status
- Development server running at: http://localhost:8080
- Navigate to: http://localhost:8080/#/ai-tools/voice-to-crm

## ✅ Changes Made
1. **Deleted old telegram.service.ts** - No more corsproxy.io errors
2. **Fixed OpenAI initialization** - Won't try to use OpenAI without API key
3. **Fixed Speech Recognition** - No more "already started" errors
4. **Updated config service** - Properly handles empty API keys

## 🧪 Test Scenarios

### 1. Check Browser Console (F12)
Open browser console and verify:
- [ ] No CORS proxy errors (403 from corsproxy.io)
- [ ] No OpenAI 429 rate limit errors
- [ ] No "Speech recognition already started" errors
- [ ] Console shows "Using Web Speech API" messages

### 2. Test Audio Upload
1. Go to Voice to CRM page
2. Click "Upload Audio" button
3. Select any audio file (MP3, WAV, OGG)
4. Verify:
   - [ ] File uploads successfully
   - [ ] Transcription starts automatically
   - [ ] Uses Web Speech API (check console)
   - [ ] No errors in console

### 3. Test Microphone Recording (HTTPS Required)
**Note**: For microphone to work locally, use https://localhost:8080 instead
1. Click microphone button
2. Allow microphone permission
3. Speak for a few seconds
4. Stop recording
5. Verify:
   - [ ] Recording works
   - [ ] Transcription happens automatically
   - [ ] No concurrent recognition errors

### 4. Test Telegram Bot Integration
1. Configure your Telegram bot in the UI
2. Send a voice message to your bot
3. Check the Voice Processing Queue
4. Verify:
   - [ ] Voice message appears in queue
   - [ ] Download happens via Vercel proxy (not corsproxy.io)
   - [ ] Transcription completes successfully
   - [ ] No authentication errors

### 5. Monitor Network Tab (F12 → Network)
While testing, check:
- [ ] NO requests to corsproxy.io
- [ ] NO requests to OpenAI API (api.openai.com)
- [ ] Telegram downloads go through: https://estatehive-insight-pulse.vercel.app/api/telegram/download

## 🔍 Expected Console Output
```
Configuration service initialized
Web Speech API initialized successfully
OpenAI not available, using Web Speech API...
Transcribing with Web Speech API...
Successfully transcribed audio
```

## ⚠️ Common Issues & Solutions

1. **Microphone not working?**
   - Use HTTPS: https://localhost:8080
   - Or use Chrome with flag: --unsafely-treat-insecure-origin-as-secure=http://localhost:8080

2. **Still seeing old errors?**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear browser cache
   - Restart dev server: `npm run dev`

3. **Telegram bot not receiving messages?**
   - Check bot token is correct
   - Ensure bot is started in UI
   - Check allowed chat IDs

## 📊 Success Criteria
- ✅ No CORS proxy errors
- ✅ No OpenAI rate limits
- ✅ Web Speech API working as primary
- ✅ Audio files transcribe successfully
- ✅ Telegram integration works without errors

## 🎯 Ready for Production?
Once all tests pass locally:
1. All checklist items verified ✓
2. No errors in browser console
3. Voice processing working smoothly
4. Then push to git and deploy to Vercel

---

**Test Duration**: Allow 10-15 minutes for thorough testing
**Test Environment**: Chrome/Edge browser recommended