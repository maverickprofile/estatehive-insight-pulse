# 🧪 Local Testing Guide - Voice CRM

## 📋 Pre-Deployment Checklist

### 1. Start Local Server
```bash
npm run dev
```
Access at: http://localhost:8084/#/ai-tools/voice-to-crm

### 2. Test Voice Processing Flow

#### Step 1: Send Voice Message
1. Open Telegram
2. Find @estatehive_voice_bot
3. Send a voice message (try different scenarios):
   - Short message (< 30 seconds)
   - Property inquiry
   - Client requirements
   - Appointment scheduling

#### Step 2: Check Console Output
Open browser console (F12) and verify:
```
✅ Organization settings table not found or empty, using environment configuration
✅ OpenAI transcription service initialized
✅ AI processing service initialized
✅ Starting voice processing worker...
✅ Processing job [ID] for communication [ID]
✅ Downloading voice file from Telegram...
✅ Transcribing audio...
✅ Processing with AI for insights...
✅ Successfully processed job [ID]
```

#### Step 3: Verify Telegram Response
You should receive:
```
✅ Voice Note Processed Successfully

🎤 Transcription:
[Your exact words]

📄 AI Summary:
[AI generated summary]

🔑 Key Points:
• [Extracted points]

✔️ Action Items:
• [Tasks identified]
```

### 3. Test Different Scenarios

#### A. Real Estate Inquiry
**Voice Message**: "I'm looking for a 3-bedroom apartment in downtown area, budget around 500k, need parking"

**Expected Response**:
- Extracts: 3-bedroom, downtown, 500k budget, parking requirement
- Category: inquiry
- Urgency: medium/high

#### B. Client Follow-up
**Voice Message**: "Just spoke with John Smith, he wants to see the property on Tuesday at 3 PM"

**Expected Response**:
- Extracts: John Smith, Tuesday, 3 PM
- Category: viewing
- Action: Schedule viewing

#### C. Multi-language Test
Try voice messages in different languages:
- Spanish: "Necesito una casa con tres habitaciones"
- Hindi: "मुझे तीन बेडरूम का घर चाहिए"
- Arabic: "أحتاج شقة بثلاث غرف نوم"

### 4. Performance Metrics to Check

| Metric | Expected | Actual |
|--------|----------|--------|
| Voice Download | < 2s | _____ |
| Transcription | < 5s | _____ |
| AI Processing | < 3s | _____ |
| Total Time | < 10s | _____ |
| Success Rate | 100% | _____ |

### 5. Error Handling Tests

#### Test 1: Very Long Voice Note
- Send 2+ minute voice note
- Should still process successfully

#### Test 2: Background Noise
- Record with TV/music in background
- Should transcribe main voice

#### Test 3: Multiple Languages in One Message
- Mix English and another language
- Should detect primary language

### 6. Database Verification

Check Supabase Dashboard:
1. `client_communications` table - New records created?
2. `voice_processing_jobs` table - Status = 'completed'?
3. Transcription and summary saved?

### 7. Monitor Resource Usage

Check browser Network tab (F12 → Network):
- API calls to OpenAI
- Telegram file downloads
- Supabase queries

Expected API calls per voice note:
- 1x Telegram getFile
- 1x Telegram download
- 1x OpenAI transcription
- 1x OpenAI chat completion
- 2-3x Supabase operations

### 8. Common Issues & Solutions

#### Issue: No response from bot
**Check**:
- Bot token is correct
- Bot is not blocked by another instance
- Network connection is stable

#### Issue: Transcription fails
**Check**:
- OpenAI API key is valid
- API has credits
- Audio file format is supported

#### Issue: AI analysis is generic
**Check**:
- System prompt includes real estate context
- GPT model is set to gpt-3.5-turbo

### 9. Final Validation

✅ **Success Criteria**:
- [ ] Voice messages process in < 10 seconds
- [ ] Transcription accuracy > 95%
- [ ] AI extracts real estate entities correctly
- [ ] Telegram sends formatted response
- [ ] No errors in console
- [ ] Database records created

### 10. Ready for Deployment?

If all tests pass:
1. ✅ Voice processing works
2. ✅ AI analysis is accurate
3. ✅ Response time < 10s
4. ✅ Error handling works
5. ✅ Multi-language support confirmed

**Then you're ready to deploy to Vercel!**

## 🎯 Quick Test Commands

### Test API Keys:
```javascript
// In browser console
console.log('OpenAI Key:', import.meta.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('Telegram Token:', import.meta.env.VITE_TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing');
```

### Test Telegram Bot:
```bash
curl https://api.telegram.org/botYOUR_TELEGRAM_BOT_TOKEN/getMe
```

### Test OpenAI:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY"
```

## 📊 Expected Console Output (Healthy System)

```
Service Worker registered
Web Speech API initialized successfully
Organization settings table not found or empty, using environment configuration
Configuration service initialized
OpenAI transcription service initialized
AI processing service initialized
Starting voice processing worker...
Telegram bot initialized successfully
Voice processing worker configured
Found 1 queued voice processing jobs
Processing job [ID] for communication [ID]
Downloading voice file from Telegram...
Transcribing audio...
Processing with AI for insights...
Successfully processed job [ID]
```

## ✅ All Tests Passed?

Great! Now you can proceed with Vercel deployment knowing everything works perfectly locally!