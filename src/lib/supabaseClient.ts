import { createClient } from '@supabase/supabase-js';

// The Project URL from your Supabase dashboard
const supabaseUrl = 'https://mtjxfyzcuuvtplemliwe.supabase.co';

// The anon public key from your Supabase dashboard
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10anhmeXpjdXV2dHBsZW1saXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzU3NTYsImV4cCI6MjA2ODg1MTc1Nn0.KxsHhDcmJIDcPncNXgL05QvDvOm20l0t0vTQdSF0qPg';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
