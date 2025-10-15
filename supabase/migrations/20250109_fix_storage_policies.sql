-- Migration: Fix storage policies for captures bucket
-- Created: 2025-01-09
-- This fixes RLS policy issues with the captures bucket

-- First, drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can upload captures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view captures" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- Create new policies with proper permissions
-- Policy: Allow anyone to INSERT (upload) files to captures bucket
CREATE POLICY "Public captures upload"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'captures');

-- Policy: Allow anyone to SELECT (view/download) files from captures bucket
CREATE POLICY "Public captures read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'captures');

-- Optional: Allow anyone to UPDATE files in captures bucket
CREATE POLICY "Public captures update"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'captures');

-- Optional: Allow anyone to DELETE files from captures bucket
-- Uncomment if you want to allow deletions:
-- CREATE POLICY "Public captures delete"
-- ON storage.objects
-- FOR DELETE
-- TO public
-- USING (bucket_id = 'captures');
