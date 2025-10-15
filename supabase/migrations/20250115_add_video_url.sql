-- Migration: Add video_url to leaderboard table
-- Created: 2025-01-15
-- Description: Adds support for storing replay video URLs in leaderboard entries

ALTER TABLE leaderboard
ADD COLUMN video_url TEXT;

-- Add index for faster lookups when filtering by entries with videos
CREATE INDEX idx_leaderboard_has_video ON leaderboard(video_url)
WHERE video_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN leaderboard.video_url IS 'Public URL to the replay video stored in Supabase Storage (videos bucket). Videos must be ≤30 seconds (at 2x speed) to be uploadable.';
