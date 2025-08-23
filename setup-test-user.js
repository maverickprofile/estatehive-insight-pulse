// =====================================================
// ESTATE HIVE CRM - TEST USER SETUP
// =====================================================
// Run this file with: node setup-test-user.js
// =====================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // You'll need to add this to .env

// If you don't have service key, you can use this in Supabase SQL Editor instead:
const SQL_CREATE_TEST_USER = `
-- =====================================================
-- CREATE TEST USER AND DATA
-- =====================================================

-- First, create a test user in auth.users (if not exists)
-- Note: You'll need to manually create the user through Supabase Auth UI
-- or use the signup form with these credentials:
-- Email: test@estatehive.com
-- Password: TestPassword123!

-- Once the user exists, get their ID and use it here:
-- Replace 'YOUR_USER_ID' with the actual user ID from auth.users table

DO $$
DECLARE
    v_user_id UUID;
    v_agent_id UUID;
    v_property_id BIGINT;
    v_lead_id BIGINT;
    v_client_id BIGINT;
BEGIN
    -- Get the test user ID (you need to create user first via Auth UI)
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'test@estatehive.com'
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Test user not found. Please create user via Auth UI first.';
        RETURN;
    END IF;
    
    -- Ensure profile exists and is admin
    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES (
        v_user_id,
        'test@estatehive.com',
        'Test Admin',
        'admin',
        '+91 9876543210'
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        full_name = 'Test Admin';
    
    -- Create test agent profile
    v_agent_id := v_user_id;
    INSERT INTO public.agents (
        id, name, email, phone, specialization, 
        experience_years, bio, commission_rate, rating
    )
    VALUES (
        v_agent_id,
        'Test Agent',
        'test@estatehive.com',
        '+91 9876543210',
        ARRAY['Residential', 'Commercial'],
        5,
        'Experienced real estate agent specializing in residential and commercial properties.',
        2.5,
        4.5
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create sample properties
    INSERT INTO public.properties (
        created_by, agent_id, title, description, property_type, 
        property_subtype, category, status, city, state, 
        price, area_sqft, bedrooms, bathrooms, parking_spaces,
        amenities, image_urls
    )
    VALUES 
    (
        v_user_id,
        v_agent_id,
        'Luxury 3BHK Apartment in Whitefield',
        'Spacious 3BHK apartment with modern amenities in prime location',
        'residential',
        'apartment',
        'sale',
        'active',
        'Bangalore',
        'Karnataka',
        8500000,
        1850,
        3,
        2,
        2,
        ARRAY['Swimming Pool', 'Gymnasium', 'Security', 'Power Backup', 'Lift'],
        ARRAY['/placeholder.svg']
    ),
    (
        v_user_id,
        v_agent_id,
        'Commercial Office Space in MG Road',
        'Premium office space suitable for IT companies',
        'commercial',
        'office',
        'rent',
        'active',
        'Bangalore',
        'Karnataka',
        150000,
        5000,
        NULL,
        4,
        10,
        ARRAY['Power Backup', 'Lift', 'Security', 'Cafeteria'],
        ARRAY['/placeholder.svg']
    ),
    (
        v_user_id,
        v_agent_id,
        'Villa in Electronic City',
        '4BHK Independent villa with garden',
        'residential',
        'villa',
        'sale',
        'active',
        'Bangalore',
        'Karnataka',
        15000000,
        3200,
        4,
        4,
        3,
        ARRAY['Garden', 'Servant Quarters', 'Security'],
        ARRAY['/placeholder.svg']
    )
    RETURNING id INTO v_property_id;
    
    -- Create sample leads
    INSERT INTO public.leads (
        assigned_to, assigned_by, name, email, phone,
        source, interest_type, budget_min, budget_max,
        stage, priority, score
    )
    VALUES
    (
        v_user_id,
        v_user_id,
        'Rahul Sharma',
        'rahul@example.com',
        '+91 9876543211',
        'website',
        'buy',
        5000000,
        8000000,
        'qualified',
        'high',
        75
    ),
    (
        v_user_id,
        v_user_id,
        'Priya Patel',
        'priya@example.com',
        '+91 9876543212',
        'referral',
        'rent',
        50000,
        80000,
        'contacted',
        'medium',
        60
    ),
    (
        v_user_id,
        v_user_id,
        'Amit Kumar',
        'amit@example.com',
        '+91 9876543213',
        'social_media',
        'buy',
        10000000,
        15000000,
        'negotiation',
        'high',
        85
    )
    RETURNING id INTO v_lead_id;
    
    -- Create sample clients
    INSERT INTO public.clients (
        created_by, assigned_agent, name, email, phone,
        client_type, city, state, status, loyalty_tier
    )
    VALUES
    (
        v_user_id,
        v_agent_id,
        'Sunita Reddy',
        'sunita@example.com',
        '+91 9876543214',
        'individual',
        'Bangalore',
        'Karnataka',
        'active',
        'gold'
    ),
    (
        v_user_id,
        v_agent_id,
        'TechCorp Solutions',
        'contact@techcorp.com',
        '+91 9876543215',
        'corporate',
        'Bangalore',
        'Karnataka',
        'vip',
        'platinum'
    )
    RETURNING id INTO v_client_id;
    
    -- Create sample appointments
    INSERT INTO public.appointments (
        title, description, appointment_type, property_id,
        client_id, agent_id, created_by, start_time,
        end_time, location, status
    )
    VALUES
    (
        'Property Viewing - Whitefield Apartment',
        'Site visit for 3BHK apartment',
        'property_viewing',
        v_property_id,
        v_client_id,
        v_agent_id,
        v_user_id,
        NOW() + INTERVAL '2 days',
        NOW() + INTERVAL '2 days' + INTERVAL '1 hour',
        'Whitefield, Bangalore',
        'scheduled'
    ),
    (
        'Consultation Meeting',
        'Discuss investment opportunities',
        'consultation',
        NULL,
        v_client_id,
        v_agent_id,
        v_user_id,
        NOW() + INTERVAL '5 days',
        NOW() + INTERVAL '5 days' + INTERVAL '30 minutes',
        'Office',
        'scheduled'
    );
    
    -- Create sample invoice
    INSERT INTO public.invoices (
        invoice_number, client_id, property_id, agent_id,
        created_by, invoice_type, status, subtotal,
        tax_amount, total_amount, items
    )
    VALUES
    (
        'INV-2024-001',
        v_client_id,
        v_property_id,
        v_agent_id,
        v_user_id,
        'booking',
        'sent',
        100000,
        18000,
        118000,
        '[{"description": "Booking Amount", "amount": 100000}]'::JSONB
    );
    
    -- Create sample notifications
    INSERT INTO public.notifications (
        user_id, title, message, notification_type, priority
    )
    VALUES
    (
        v_user_id,
        'New Lead Assigned',
        'A new high-priority lead has been assigned to you',
        'lead',
        'high'
    ),
    (
        v_user_id,
        'Upcoming Appointment',
        'You have a property viewing scheduled tomorrow',
        'appointment',
        'normal'
    );
    
    RAISE NOTICE 'Test data created successfully!';
END $$;

-- Verify the data
SELECT 'Profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'Agents', COUNT(*) FROM public.agents
UNION ALL
SELECT 'Properties', COUNT(*) FROM public.properties
UNION ALL
SELECT 'Leads', COUNT(*) FROM public.leads
UNION ALL
SELECT 'Clients', COUNT(*) FROM public.clients
UNION ALL
SELECT 'Appointments', COUNT(*) FROM public.appointments
UNION ALL
SELECT 'Invoices', COUNT(*) FROM public.invoices
UNION ALL
SELECT 'Notifications', COUNT(*) FROM public.notifications;
`;

console.log('Test User Setup Instructions:');
console.log('================================');
console.log('1. First, create a user via the Auth UI or signup form:');
console.log('   Email: test@estatehive.com');
console.log('   Password: TestPassword123!');
console.log('');
console.log('2. Then run this SQL in Supabase SQL Editor:');
console.log('');
console.log(SQL_CREATE_TEST_USER);