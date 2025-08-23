@echo off
REM Telegram Bot Integration Setup Script for Windows
REM Estate Hive CRM - Supabase Project: mtjxfyzcuuvtplemliwe

echo.
echo 🚀 Setting up Telegram Integration for Estate Hive CRM
echo ==================================================
echo.

REM Your Supabase project details
set SUPABASE_PROJECT_ID=mtjxfyzcuuvtplemliwe
set TELEGRAM_BOT_TOKEN=8395864876:AAGp4QSunYOlLAUGLjquk_ECrMME83eTtq4
set WEBHOOK_URL=https://%SUPABASE_PROJECT_ID%.supabase.co/functions/v1/telegram-webhook

echo 📋 Configuration:
echo   Supabase Project: %SUPABASE_PROJECT_ID%
echo   Bot Username: @estatehivebot
echo   Webhook URL: %WEBHOOK_URL%
echo.

echo 1️⃣ Setting Telegram webhook...
echo.
curl -X POST "https://api.telegram.org/bot%TELEGRAM_BOT_TOKEN%/setWebhook" -H "Content-Type: application/json" -d "{\"url\": \"%WEBHOOK_URL%\", \"allowed_updates\": [\"message\", \"edited_message\"]}"

echo.
echo.
echo 2️⃣ Verifying webhook configuration...
echo.
curl "https://api.telegram.org/bot%TELEGRAM_BOT_TOKEN%/getWebhookInfo"

echo.
echo.
echo ✅ Telegram webhook setup complete!
echo.
echo 📝 Next Steps:
echo   1. Deploy the Edge Functions in Supabase Dashboard
echo   2. Run the SQL migration in Supabase SQL Editor  
echo   3. Test by messaging @estatehivebot on Telegram
echo.
echo For detailed instructions, see TELEGRAM_SETUP_GUIDE.md
echo.
pause