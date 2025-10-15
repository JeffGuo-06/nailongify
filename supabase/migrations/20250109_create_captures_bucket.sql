-- Migration: Create storage policies for capture grids bucket
-- Created: 2025-01-09

-- IMPORTANT: The 'captures' bucket must be created manually via Supabase Dashboard first!
-- Go to: Storage → New Bucket → Name: "captures" → Public: Yes → Create

-- Policy: Anyone can upload to captures bucket
CREATE POLICY "Anyone can upload captures"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'captures');

-- Policy: Anyone can view captures
CREATE POLICY "Anyone can view captures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'captures');

-- Optional: Policy to allow deletions
-- Uncomment if you want users to be able to delete their captures:
-- CREATE POLICY "Anyone can delete captures"
-- ON storage.objects
-- FOR DELETE
-- USING (bucket_id = 'captures');
