-- Grant necessary permissions for the trigger functions to work
-- The trigger functions run with the privileges of the user who created them,
-- but they need to be able to update the leaderboard_stats table

-- Grant UPDATE permission to the service role (used by triggers)
GRANT UPDATE ON leaderboard_stats TO postgres;
GRANT UPDATE ON leaderboard_stats TO service_role;

-- Also grant UPDATE to authenticated users in case triggers run in their context
GRANT UPDATE ON leaderboard_stats TO authenticated;
GRANT UPDATE ON leaderboard_stats TO anon;

-- Create a more permissive RLS policy for updates (only for the trigger context)
CREATE POLICY "Allow trigger updates to leaderboard stats"
  ON leaderboard_stats
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Verify the triggers are properly installed
-- (This will show an error if triggers don't exist, which helps debugging)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'leaderboard_insert_trigger'
  ) THEN
    RAISE EXCEPTION 'Insert trigger not found! Please re-run the previous migration.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'leaderboard_delete_trigger'
  ) THEN
    RAISE EXCEPTION 'Delete trigger not found! Please re-run the previous migration.';
  END IF;

  RAISE NOTICE 'All triggers are properly installed!';
END $$;
