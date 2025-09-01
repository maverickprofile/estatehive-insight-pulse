import fetch from 'node-fetch';
import formidable from 'formidable';

// Telegram Bot Token
// Get tokens from environment variables (set in Vercel dashboard)
const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    // Check if this is a voice message
    if (update.message && update.message.voice) {
      const chatId = update.message.chat.id;
      const messageId = update.message.message_id;
      const fileId = update.message.voice.file_id;
      const duration = update.message.voice.duration;
      const firstName = update.message.from.first_name || 'User';
      
      // Send immediate acknowledgment (< 1 second)
      await sendTelegramMessage(chatId, `🎤 Voice message received, ${firstName}! Processing...`, messageId);
      
      // Process voice in background (don't wait)
      processVoiceAsync(chatId, messageId, fileId, duration, firstName);
      
      // Return immediately for fast response
      return res.status(200).json({ ok: true });
    }
    
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true }); // Always return 200 to Telegram
  }
}

// Process voice asynchronously (runs in background)
async function processVoiceAsync(chatId, messageId, fileId, duration, firstName) {
  try {
    // Step 1: Download voice file
    const audioBuffer = await downloadVoiceFile(fileId);
    
    // Step 2: Transcribe with Whisper
    const transcription = await transcribeAudio(audioBuffer);
    
    // Step 3: Process with AI
    const analysis = await analyzeTranscription(transcription.text);
    
    // Step 4: Send formatted response
    const response = formatResponse(transcription.text, analysis, transcription.language, duration);
    await sendTelegramMessage(chatId, response, messageId);
    
  } catch (error) {
    console.error('Processing error:', error);
    await sendTelegramMessage(
      chatId, 
      `❌ Sorry ${firstName}, I couldn't process your voice message. Please try again.`,
      messageId
    );
  }
}

// Download voice file from Telegram
async function downloadVoiceFile(fileId) {
  // Get file path
  const fileResponse = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
  );
  const fileData = await fileResponse.json();
  
  if (!fileData.ok) {
    throw new Error('Failed to get file info');
  }
  
  // Download file
  const filePath = fileData.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
  const audioResponse = await fetch(downloadUrl);
  
  if (!audioResponse.ok) {
    throw new Error('Failed to download audio');
  }
  
  return await audioResponse.buffer();
}

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(audioBuffer) {
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
  formData.append('file', blob, 'audio.ogg');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.statusText}`);
  }
  
  return await response.json();
}

// Analyze transcription with GPT
async function analyzeTranscription(text) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a real estate CRM. Analyze voice transcriptions and return JSON:
{
  "summary": "1-2 sentence summary",
  "keyPoints": ["key points"],
  "actionItems": ["action items"],
  "sentiment": "positive/neutral/negative",
  "entities": {
    "people": [], "locations": [], "dates": [], "amounts": [], "propertyTypes": []
  },
  "subject": "short title (max 50 chars)",
  "category": "inquiry/follow-up/viewing/negotiation/documentation/general",
  "urgency": "low/medium/high"
}`
        },
        {
          role: 'user',
          content: `Analyze this real estate voice note transcription:\n\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// Format the response message
function formatResponse(transcription, analysis, language, duration) {
  let message = '✅ <b>Voice Note Processed Successfully</b>\n\n';
  
  message += `📝 <b>Subject:</b> ${analysis.subject}\n`;
  message += `🎯 <b>Sentiment:</b> ${analysis.sentiment}\n`;
  message += `🌐 <b>Language:</b> ${language || 'en'}\n`;
  message += `⏱️ <b>Duration:</b> ${duration}s\n\n`;
  
  // Add transcription
  message += '<b>🎤 Transcription:</b>\n';
  message += `<i>${transcription}</i>\n\n`;
  
  // Add AI summary
  message += '<b>📄 AI Summary:</b>\n';
  message += `${analysis.summary}\n\n`;
  
  // Add key points
  if (analysis.keyPoints && analysis.keyPoints.length > 0) {
    message += '<b>🔑 Key Points:</b>\n';
    analysis.keyPoints.forEach(point => {
      message += `• ${point}\n`;
    });
    message += '\n';
  }
  
  // Add action items
  if (analysis.actionItems && analysis.actionItems.length > 0) {
    message += '<b>✔️ Action Items:</b>\n';
    analysis.actionItems.forEach(item => {
      message += `• ${item}\n`;
    });
    message += '\n';
  }
  
  // Add entities if found
  if (analysis.entities) {
    const { people, locations, amounts, propertyTypes } = analysis.entities;
    
    if (people && people.length > 0) {
      message += `👥 <b>People:</b> ${people.join(', ')}\n`;
    }
    if (locations && locations.length > 0) {
      message += `📍 <b>Locations:</b> ${locations.join(', ')}\n`;
    }
    if (amounts && amounts.length > 0) {
      message += `💰 <b>Amounts:</b> ${amounts.join(', ')}\n`;
    }
    if (propertyTypes && propertyTypes.length > 0) {
      message += `🏠 <b>Properties:</b> ${propertyTypes.join(', ')}\n`;
    }
  }
  
  message += `\n⚡ <i>Processed in real-time by Estate Hive AI</i>`;
  
  return message;
}

// Send message to Telegram
async function sendTelegramMessage(chatId, text, replyToMessageId = null) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
  };
  
  if (replyToMessageId) {
    body.reply_to_message_id = replyToMessageId;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  return await response.json();
}