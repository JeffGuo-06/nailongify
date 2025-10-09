# Leaderboard Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to finish setting up

## 2. Run the Database Migration

1. In your Supabase project dashboard, go to the **SQL Editor**
2. Copy the contents of `supabase/migrations/20250109_create_leaderboard.sql`
3. Paste it into the SQL Editor and click **Run**
4. You should see a success message

## 3. Get Your API Credentials

1. In your Supabase dashboard, go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## 4. Configure Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

3. **Restart your dev server** after changing `.env.local`:

```bash
npm run dev
```

## 5. Test the Leaderboard

1. Complete the Nailongify challenge
2. On the end screen, enter a nickname
3. Click "Submit Score"
4. You should see "Score submitted successfully!" with your rank
5. The leaderboard table should appear below showing all entries

## Features

### Leaderboard Table Schema

- **nickname**: Player name (1-20 characters)
- **time_ms**: Completion time in milliseconds
- **created_at**: Timestamp of submission

### Security (Row Level Security)

- Anyone can **read** leaderboard entries
- Anyone can **insert** new entries
- No one can update or delete entries (preventing cheating)

### API Functions

Located in `src/lib/leaderboard.js`:

- `submitLeaderboardEntry(nickname, timeMs)` - Submit a new entry
- `fetchLeaderboard(limit)` - Get top N entries
- `getPlayerRank(timeMs)` - Calculate rank for a given time

## Troubleshooting

### "Missing Supabase environment variables"

- Make sure `.env.local` exists and has correct values
- Restart your dev server after changing `.env.local`

### "Failed to submit to leaderboard"

- Check browser console for detailed error messages
- Verify the database migration ran successfully
- Check that RLS policies are enabled in Supabase

### Table doesn't exist

- Run the migration SQL in Supabase SQL Editor
- Check the "Table Editor" in Supabase to confirm `leaderboard` table exists

## Production Deployment (Vercel)

Add environment variables in your Vercel project settings:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
3. Redeploy your project
