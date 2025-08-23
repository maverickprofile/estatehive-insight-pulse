# Telegram Integration Setup Guide

## Overview
This guide will help you set up Telegram messaging integration for your Estate Hive CRM system. After setup, all messages sent to your Telegram bot (@estatehivebot) will appear in your CRM messaging interface.

## Bot Details
- **Bot Username**: @estatehivebot
- **Bot Token**: `8395864876:AAGp4QSunYOlLAUGLjquk_ECrMME83eTtq4`
- **Bot Link**: https://t.me/estatehivebot

## Setup Steps

### 1. Database Migration (Supabase Web Interface)

1. Log into your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and run the migration from `supabase/migrations/0004_add_telegram_support.sql`
4. Verify the migration succeeded

### 2. Deploy Edge Functions (Supabase Dashboard)

#### Deploy telegram-webhook function:
1. Go to **Edge Functions** in Supabase dashboard
2. Click **New Function**
3. Name it `telegram-webhook`
4. Copy the code from `supabase/functions/telegram-webhook/index.ts`
5. Deploy the function
6. Note the function URL: `https://mtjxfyzcuuvtplemliwe.supabase.co/functions/v1/telegram-webhook`

#### Deploy send-telegram-message function:
1. Create another function named `send-telegram-message`
2. Copy the code from `supabase/functions/send-telegram-message/index.ts`
3. Deploy the function

### 3. Add Environment Variables

In Supabase Dashboard > Settings > Edge Functions:
```
TELEGRAM_BOT_TOKEN=8395864876:AAGp4QSunYOlLAUGLjquk_ECrMME83eTtq4
```

### 4. Configure Telegram Webhook

Run this command to set up the webhook:

```bash
curl -X POST "https://api.telegram.org/bot8395864876:AAGp4QSunYOlLAUGLjquk_ECrMME83eTtq4/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://mtjxfyzcuuvtplemliwe.supabase.co/functions/v1/telegram-webhook",
    "allowed_updates": ["message", "edited_message"]
  }'
```

### 5. Verify Webhook Setup

Check if the webhook is properly configured:
```bash
curl "https://api.telegram.org/bot8395864876:AAGp4QSunYOlLAUGLjquk_ECrMME83eTtq4/getWebhookInfo"
```

You should see:
- `url`: Your Supabase function URL
- `has_custom_certificate`: false
- `pending_update_count`: 0 or low number

### 6. Frontend Setup

The frontend code has already been updated to support Telegram. Just ensure you:
1. Rebuild the application: `npm run build`
2. Deploy the updated frontend

## Testing the Integration

### Test Receiving Messages:
1. Open Telegram and search for @estatehivebot
2. Start a conversation with `/start`
3. Send a test message: "Hello, I'm interested in properties"
4. Check your CRM Messages page - the conversation should appear

### Test Sending Messages:
1. In the CRM Messages interface, select the Telegram conversation
2. Type a reply and send it
3. Check Telegram - you should receive the message from the bot

## Features

### Platform Indicators
- 🟢 Green message icon = WhatsApp
- 🔵 Blue send icon = Telegram
- Usernames display as @username for Telegram

### Bot Commands (Auto-responses)
The bot automatically responds to these commands:
- `/start` - Welcome message
- `/help` - Show available commands
- `/properties` - Information about viewing properties
- `/contact` - Request agent contact

### Multi-Platform Support
- Both WhatsApp and Telegram conversations appear in the same interface
- Platform-specific sending logic handles each appropriately
- Unified conversation view with platform indicators

## Troubleshooting

### Messages not appearing in CRM:
1. Check webhook info: `curl "https://api.telegram.org/bot[TOKEN]/getWebhookInfo"`
2. Look for `pending_update_count` - if high, webhook might be failing
3. Check Supabase Edge Function logs for errors

### Can't send messages from CRM:
1. Verify the Edge Function `send-telegram-message` is deployed
2. Check browser console for errors
3. Ensure user is authenticated in Supabase

### Webhook errors:
1. Check Supabase Edge Function logs
2. Verify database migrations ran successfully
3. Ensure `TELEGRAM_BOT_TOKEN` environment variable is set

### Database issues:
1. Check if all columns were added: `platform`, `telegram_chat_id`, `telegram_username`
2. Verify RLS policies allow access
3. Check Supabase logs for database errors

## Security Considerations

1. **Keep bot token secure** - Never commit it to public repositories
2. **Validate webhooks** - Consider implementing webhook signature verification
3. **Rate limiting** - Monitor for abuse and implement rate limiting if needed
4. **User privacy** - Handle user data according to privacy regulations

## Advanced Configuration

### Custom Auto-responses
Edit the `handle_telegram_command` function in the database to add more bot commands.

### Group Chat Support
The current setup works with private chats. For group support:
1. Add the bot to your group
2. The bot will receive messages prefixed with its username
3. Modify webhook handler to process group messages

### Media Support
To handle images, documents, etc., update the webhook handler to process:
- `message.photo`
- `message.document`
- `message.voice`
- `message.video`

## Monitoring

1. **Supabase Dashboard**: Monitor Edge Function invocations and logs
2. **Database**: Check conversations and messages tables for data
3. **Telegram Bot API**: Use getWebhookInfo to check webhook health

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Review Telegram Bot API documentation
3. Verify all setup steps were completed

## Next Steps

1. Test the integration thoroughly
2. Train your team on using the unified messaging interface
3. Consider adding more bot commands for common queries
4. Set up monitoring and alerts for webhook failures