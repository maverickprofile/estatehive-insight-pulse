-- SQL script to add REAL WhatsApp conversation data
-- WATI Business Number: +15557735226
-- Client Number: 917259778145
-- Run this in your Supabase SQL editor

-- First, let's check if we have any users in the system
-- You'll need to replace 'your-user-id-here' with your actual user ID from auth.users table
-- To find your user ID, run: SELECT id FROM auth.users LIMIT 1;

-- Create conversation for REAL phone number 917259778145
-- This represents messages between your WATI business number (+15557735226) and the client (917259778145)
INSERT INTO conversations (user_id, client_telegram_id, client_name, last_message, last_message_at, unread_count)
VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Gets first user ID  
  917259778145, -- Client phone number as numeric ID
  'Real WhatsApp Client (+91 7259778145)', -- Updated name to reflect real number
  'I am interested in your property services',
  NOW(),
  1
) ON CONFLICT (client_telegram_id) DO NOTHING; -- Avoid duplicates

-- Get the conversation ID we just created
WITH conv AS (
  SELECT id FROM conversations WHERE client_telegram_id = 917259778145 LIMIT 1
)

-- Insert REALISTIC messages for property inquiry from 917259778145 to WATI number +15557735226
INSERT INTO messages (conversation_id, sender_id, content, sent_at, is_read)
SELECT 
  conv.id,
  NULL, -- Client message from 917259778145
  'Hello, I found your contact from your property website. Do you have any 2-3 BHK apartments available in Mumbai?',
  NOW() - INTERVAL '3 hours',
  false
FROM conv

UNION ALL

SELECT 
  conv.id,
  (SELECT id FROM auth.users LIMIT 1), -- Agent response via WATI (+15557735226)
  'Hello! Thank you for contacting us. Yes, we have several 2-3 BHK options in Mumbai. What is your preferred location and budget range?',
  NOW() - INTERVAL '2 hours 45 minutes',
  true
FROM conv

UNION ALL

SELECT 
  conv.id,
  NULL, -- Client message
  'I am looking for something in Andheri or Bandra area. Budget around ₹50,000-₹80,000 per month.',
  NOW() - INTERVAL '2 hours 30 minutes',
  false
FROM conv

UNION ALL

SELECT 
  conv.id,
  (SELECT id FROM auth.users LIMIT 1), -- Agent message
  'Perfect! I have 3 excellent properties in that range. Let me share the details: 1) 2BHK in Andheri West - ₹55,000/month, 2) 3BHK in Bandra East - ₹75,000/month, 3) 2BHK in Andheri East - ₹48,000/month',
  NOW() - INTERVAL '2 hours',
  true
FROM conv

UNION ALL

SELECT 
  conv.id,
  NULL, -- Client message  
  'The 3BHK in Bandra East sounds interesting. Can you share more details and photos?',
  NOW() - INTERVAL '1 hour 30 minutes',
  false
FROM conv

UNION ALL

SELECT 
  conv.id,
  (SELECT id FROM auth.users LIMIT 1), -- Agent message
  'Sure! The Bandra East property is a premium 3BHK with 1400 sq ft, fully furnished, with parking and gym facilities. Would you like to schedule a viewing this weekend?',
  NOW() - INTERVAL '1 hour',
  true
FROM conv

UNION ALL

SELECT 
  conv.id,
  NULL, -- Client message
  'Yes, I would like to see it. Saturday afternoon works for me. What time is convenient?',
  NOW() - INTERVAL '45 minutes',
  false
FROM conv

UNION ALL

SELECT 
  conv.id,
  (SELECT id FROM auth.users LIMIT 1), -- Agent message
  'Great! How about Saturday at 3 PM? I will send you the exact location and my contact details for the meeting.',
  NOW() - INTERVAL '30 minutes',
  true
FROM conv

UNION ALL

SELECT 
  conv.id,
  NULL, -- Client message - this will be the last message showing unread
  'I am interested in your property services',
  NOW() - INTERVAL '10 minutes',
  false
FROM conv;

-- Add another test conversation with a different number for more variety
INSERT INTO conversations (user_id, client_telegram_id, client_name, last_message, last_message_at, unread_count)
VALUES (
  (SELECT id FROM auth.users LIMIT 1), 
  918765432100, 
  'Property Inquiry', 
  'What is the price range for 2BHK?',
  NOW() - INTERVAL '1 day',
  1
) ON CONFLICT (client_telegram_id) DO NOTHING;

-- Add messages for second conversation
WITH conv2 AS (
  SELECT id FROM conversations WHERE client_telegram_id = 918765432100 LIMIT 1
)

INSERT INTO messages (conversation_id, sender_id, content, sent_at, is_read)
SELECT 
  conv2.id,
  NULL,
  'Hello, I am looking for a 2BHK apartment. What options do you have?',
  NOW() - INTERVAL '1 day 2 hours',
  false
FROM conv2

UNION ALL

SELECT 
  conv2.id,
  (SELECT id FROM auth.users LIMIT 1),
  'Hi! We have several 2BHK options available. The price range is ₹15,000 - ₹25,000 per month depending on location and amenities.',
  NOW() - INTERVAL '1 day 1 hour',
  true
FROM conv2

UNION ALL

SELECT 
  conv2.id,
  NULL,
  'What is the price range for 2BHK?',
  NOW() - INTERVAL '1 day',
  false
FROM conv2;

-- Verify the data was inserted
SELECT 
  c.id,
  c.client_telegram_id,
  c.client_name,
  c.last_message,
  c.unread_count,
  COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.client_telegram_id IN (917259778145, 918765432100)
GROUP BY c.id, c.client_telegram_id, c.client_name, c.last_message, c.unread_count
ORDER BY c.last_message_at DESC;