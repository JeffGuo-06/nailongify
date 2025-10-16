-- Create a single-row table to store leaderboard statistics
-- This is much more efficient than counting all entries on every request
CREATE TABLE IF NOT EXISTS leaderboard_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_entries INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert the initial row
INSERT INTO leaderboard_stats (id, total_entries)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Initialize counter with current count from leaderboard table
UPDATE leaderboard_stats
SET total_entries = (SELECT COUNT(*) FROM leaderboard),
    updated_at = NOW()
WHERE id = 1;

-- Function to increment counter when a new entry is added
CREATE OR REPLACE FUNCTION increment_leaderboard_counter()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leaderboard_stats
  SET total_entries = total_entries + 1,
      updated_at = NOW()
  WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement counter when an entry is deleted
CREATE OR REPLACE FUNCTION decrement_leaderboard_counter()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leaderboard_stats
  SET total_entries = total_entries - 1,
      updated_at = NOW()
  WHERE id = 1;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS leaderboard_insert_trigger ON leaderboard;
CREATE TRIGGER leaderboard_insert_trigger
  AFTER INSERT ON leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION increment_leaderboard_counter();

-- Create trigger for DELETE operations
DROP TRIGGER IF EXISTS leaderboard_delete_trigger ON leaderboard;
CREATE TRIGGER leaderboard_delete_trigger
  AFTER DELETE ON leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION decrement_leaderboard_counter();

-- Add RLS policy to allow public read access to stats
ALTER TABLE leaderboard_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to leaderboard stats"
  ON leaderboard_stats
  FOR SELECT
  TO public
  USING (true);

-- Comment explaining the purpose
COMMENT ON TABLE leaderboard_stats IS 'Stores aggregate statistics for the leaderboard. Auto-updated via triggers for performance.';
COMMENT ON COLUMN leaderboard_stats.total_entries IS 'Total number of entries in the leaderboard. Auto-incremented/decremented via triggers.';
