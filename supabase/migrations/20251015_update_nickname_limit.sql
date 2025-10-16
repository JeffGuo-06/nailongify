-- Migration: Update nickname character limit from 20 to 50
-- Created: 2025-10-15

-- Drop the old constraint
ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS leaderboard_nickname_check;

-- Add new constraint with updated limit
ALTER TABLE leaderboard ADD CONSTRAINT leaderboard_nickname_check
  CHECK (char_length(nickname) >= 1 AND char_length(nickname) <= 50);

-- Add a comment
COMMENT ON CONSTRAINT leaderboard_nickname_check ON leaderboard IS 'Nickname must be between 1 and 50 characters';
