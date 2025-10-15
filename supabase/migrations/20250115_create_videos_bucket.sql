-- Migration: Create storage policies for videos bucket
-- Created: 2025-01-15
-- Description: Creates storage policies for replay videos bucket

-- IMPORTANT: The 'videos' bucket must be created manually via Supabase Dashboard first!
-- Go to: Storage → New Bucket → Name: "videos" → Public: Yes → Create
--
-- Bucket Configuration:
--   - Name: videos
--   - Public: Yes (so videos can be viewed without authentication)
--   - File size limit: 10 MB (recommended)
--   - Allowed MIME types: video/webm, video/mp4 (optional)

-- Policy: Anyone can upload to videos bucket
CREATE POLICY "Anyone can upload videos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'videos');

-- Policy: Anyone can view videos
CREATE POLICY "Anyone can view videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'videos');

-- Optional: Policy to allow deletions
-- Uncomment if you want users to be able to delete their videos:
-- CREATE POLICY "Anyone can delete videos"
-- ON storage.objects
-- FOR DELETE
-- USING (bucket_id = 'videos');
