/**
 * Telegram Proxy API Endpoint
 * This should be deployed as a serverless function (Vercel, Netlify, etc.)
 * or run on your backend server to handle Telegram file downloads
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bot_token, file_path } = req.body;

    if (!bot_token || !file_path) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Download file from Telegram
    const fileUrl = `https://api.telegram.org/file/bot${bot_token}/${file_path}`;
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    // Get the file data
    const buffer = await response.arrayBuffer();
    
    // Determine content type
    let contentType = 'audio/ogg';
    if (file_path.endsWith('.mp3')) {
      contentType = 'audio/mpeg';
    } else if (file_path.endsWith('.wav')) {
      contentType = 'audio/wav';
    }

    // Send the file back
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.byteLength);
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Telegram proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to download file from Telegram',
      message: error.message 
    });
  }
}

// For local Express.js server
export function setupTelegramProxy(app) {
  app.post('/api/telegram/download', async (req, res) => {
    await handler(req, res);
  });
}