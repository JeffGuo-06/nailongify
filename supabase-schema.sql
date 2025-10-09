-- Leaderboard table for Nailongify
-- Run this in your Supabase SQL Editor

CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL CHECK (char_length(nickname) >= 1 AND char_length(nickname) <= 20),
  time_ms INTEGER NOT NULL CHECK (time_ms > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries ordered by time
CREATE INDEX idx_leaderboard_time ON leaderboard(time_ms ASC);

-- Index for faster queries ordered by date
CREATE INDEX idx_leaderboard_created_at ON leaderboard(created_at DESC);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read leaderboard entries
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert leaderboard entries
CREATE POLICY "Anyone can insert leaderboard entries"
  ON leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Optional: Add a comment
COMMENT ON TABLE leaderboard IS 'Global leaderboard for Nailongify challenge times';
