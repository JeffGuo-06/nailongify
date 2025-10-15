-- Migration: Add capture_image_url to leaderboard table
-- Created: 2025-01-09

ALTER TABLE leaderboard
ADD COLUMN capture_image_url TEXT;

-- Add index for faster lookups when filtering by entries with images
CREATE INDEX idx_leaderboard_has_image ON leaderboard(capture_image_url)
WHERE capture_image_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN leaderboard.capture_image_url IS 'Public URL to the capture grid image stored in Supabase Storage';
