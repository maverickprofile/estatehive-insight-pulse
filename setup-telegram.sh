#!/bin/bash

# Telegram Bot Integration Setup Script
# Estate Hive CRM - Supabase Project: mtjxfyzcuuvtplemliwe

echo "🚀 Setting up Telegram Integration for Estate Hive CRM"
echo "=================================================="

# Your Supabase project details
SUPABASE_PROJECT_ID="mtjxfyzcuuvtplemliwe"
TELEGRAM_BOT_TOKEN="8395864876:AAGp4QSunYOlLAUGLjquk_ECrMME83eTtq4"
WEBHOOK_URL="https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/telegram-webhook"

echo ""
echo "📋 Configuration:"
echo "  Supabase Project: ${SUPABASE_PROJECT_ID}"
echo "  Bot Token: ${TELEGRAM_BOT_TOKEN:0:20}..."
echo "  Webhook URL: ${WEBHOOK_URL}"
echo ""

# Step 1: Set webhook
echo "1️⃣ Setting Telegram webhook..."
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"allowed_updates\": [\"message\", \"edited_message\"]
  }"

echo ""
echo ""

# Step 2: Verify webhook
echo "2️⃣ Verifying webhook configuration..."
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"

echo ""
echo ""
echo "✅ Telegram webhook setup complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Deploy the Edge Functions in Supabase Dashboard"
echo "  2. Run the SQL migration in Supabase SQL Editor"
echo "  3. Test by messaging @estatehivebot on Telegram"
echo ""
echo "For detailed instructions, see TELEGRAM_SETUP_GUIDE.md"