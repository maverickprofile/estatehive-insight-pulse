-- =====================================================
-- ESTATE HIVE CRM - STORAGE BUCKET SETUP
-- =====================================================
-- Create storage bucket for property images
-- =====================================================

-- Create the storage bucket for property images
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
    'property-images',
    'property-images',
    true, -- Public bucket for easier access
    false,
    5242880, -- 5MB file size limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete property images" ON storage.objects;

-- Create RLS policies for the storage bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

-- Allow anyone to view property images (public bucket)
CREATE POLICY "Anyone can view property images" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'property-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update property images" ON storage.objects
    FOR UPDATE 
    USING (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    )
    WITH CHECK (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete property images" ON storage.objects
    FOR DELETE 
    USING (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- =====================================================
-- INSTRUCTIONS TO RUN THIS SCRIPT:
-- =====================================================
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire script
-- 5. Click "Run" to execute
-- 
-- OR run via Supabase CLI:
-- supabase db push setup-storage-bucket.sql
-- =====================================================