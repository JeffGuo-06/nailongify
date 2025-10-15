# Capture Storage Setup Guide

This guide explains how to set up the capture grid storage feature that allows leaderboard entries to be associated with their corresponding capture images.

## Overview

The feature enables:
- Uploading capture grid composites to Supabase Storage
- Storing image URLs in leaderboard entries
- Displaying clickable entries on the leaderboard
- Showing capture previews when entries are clicked

## Setup Steps

### 1. Create Storage Bucket (via Supabase Dashboard)

**IMPORTANT**: You must create the bucket via the UI first, not SQL!

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New Bucket"**
5. Configure the bucket:
   - **Name**: `captures`
   - **Public bucket**: Toggle **ON** (important!)
   - Click **"Create bucket"**

### 2. Run Database Migrations

Execute the following SQL migrations in your Supabase SQL Editor:

#### Migration 1: Add capture_image_url column

1. Go to **SQL Editor** in your Supabase Dashboard
2. Click **"New query"**
3. Paste this SQL:

```sql
-- File: supabase/migrations/20250109_add_capture_image_url.sql

ALTER TABLE leaderboard
ADD COLUMN capture_image_url TEXT;

-- Add index for faster lookups when filtering by entries with images
CREATE INDEX idx_leaderboard_has_image ON leaderboard(capture_image_url)
WHERE capture_image_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN leaderboard.capture_image_url IS 'Public URL to the capture grid image stored in Supabase Storage';
```

4. Click **"Run"**

#### Migration 2: Create storage policies

1. Still in **SQL Editor**, click **"New query"**
2. Paste this SQL:

```sql
-- File: supabase/migrations/20250109_fix_storage_policies.sql

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can upload captures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view captures" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create new policies with proper permissions
CREATE POLICY "Public captures upload"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'captures');

CREATE POLICY "Public captures read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'captures');

CREATE POLICY "Public captures update"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'captures');
```

3. Click **"Run"**

**Note**: If you get an error about policies not existing, that's fine - just continue to the next step.

### 3. Verify Supabase Configuration

Ensure your `.env.local` file contains the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Test the Feature

1. **Complete a challenge**: Finish all 8 expressions
2. **Submit to leaderboard**: Enter your nickname and submit
   - The app will automatically upload your capture grid to Supabase Storage
   - The leaderboard entry will be created with the image URL
3. **View the leaderboard**: Navigate to the leaderboard page
4. **Click an entry with a camera icon** 📸: The capture grid will appear on the right side

## Architecture

### Files Modified

1. **src/lib/leaderboard.js**
   - Added `uploadCaptureImage()` function for uploading images to Supabase Storage
   - Updated `submitLeaderboardEntry()` to accept optional `captureImageUrl` parameter

2. **src/components/EndScreen.jsx**
   - Modified `handleSubmitToLeaderboard()` to upload grid composite before submission
   - Finds the "all-captures" graphic and uploads it to Supabase

3. **src/components/Leaderboard.jsx**
   - Added split layout: entries on left, preview on right
   - Added `selectedEntry` state for tracking clicked entries
   - Made rows clickable for entries with capture images
   - Added camera icon 📸 to entries with images

4. **src/styles/App.css**
   - Added styles for split layout (`.leaderboard-split-container`)
   - Added preview container styles (`.leaderboard-preview-container`)
   - Added capture preview card styles (`.capture-preview`)
   - Added placeholder styles (`.preview-placeholder`)
   - Added clickable row states (`.has-capture`, `.selected`)
   - Added responsive styles for mobile

### Database Schema

The `leaderboard` table now has the following structure:

```sql
CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL CHECK (char_length(nickname) >= 1 AND char_length(nickname) <= 20),
  time_ms INTEGER NOT NULL CHECK (time_ms > 0),
  capture_image_url TEXT,                    -- NEW COLUMN
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage Bucket

- **Bucket name**: `captures`
- **Public**: Yes (images are publicly accessible)
- **File format**: PNG
- **Naming convention**: `{sanitized_nickname}_{timestamp}.png`

## User Experience Flow

1. **User completes challenge** → All 8 expressions captured
2. **End screen appears** → Grid composite generated
3. **User enters nickname** → Clicks "Submit Score"
4. **Upload process**:
   - Grid composite uploaded to Supabase Storage
   - Public URL returned
   - Leaderboard entry created with URL
5. **Leaderboard view**:
   - Entries with images show 📸 icon
   - Clicking an entry displays the capture on the right
   - Desktop: side-by-side layout
   - Mobile: stacked layout

## Troubleshooting

### "new row violates row-level security policy" error

**Symptoms**:
- Error in console: `StorageApiError: new row violates row-level security policy`
- 400 error when uploading images

**Solutions**:
1. **Run the fixed policies SQL** (Migration 2 from setup steps above)
2. **Verify bucket is public**:
   - Go to Storage → Buckets
   - Find `captures` bucket
   - Make sure "Public" toggle is ON
3. **Check existing policies**:
   - Go to Storage → Policies
   - You should see policies named:
     - "Public captures upload"
     - "Public captures read"
     - "Public captures update"
4. **If policies still don't work, recreate them manually**:
   - Go to Storage → Policies
   - Delete all policies for `captures` bucket
   - Click "New Policy"
   - Choose "For full customization"
   - Policy name: `Public captures upload`
   - Allowed operation: INSERT
   - Target roles: public
   - USING expression: `(bucket_id = 'captures')`
   - WITH CHECK expression: `(bucket_id = 'captures')`
   - Save
   - Repeat for SELECT and UPDATE operations

### Image upload fails (general)

**Symptoms**: Error message "Failed to upload image"

**Solutions**:
1. Check Supabase credentials in `.env.local`
2. Verify the `captures` bucket exists in Supabase Storage
3. Check browser console for detailed error messages
4. Clear browser cache and try again

### Images don't appear in preview

**Symptoms**: Clicking entries doesn't show images

**Solutions**:
1. Verify `capture_image_url` column was added to the database
2. Check that images are publicly accessible (bucket is public)
3. Inspect the URL in the database entry
4. Check browser network tab for 404 or CORS errors

### Split layout not working

**Symptoms**: Preview container missing or misaligned

**Solutions**:
1. Clear browser cache and reload
2. Check CSS file was updated with new styles
3. Verify responsive breakpoints in DevTools

## Performance Considerations

- **Image size**: Grid composites are ~500KB PNG files
- **Upload time**: ~1-2 seconds on average connection
- **Storage quota**: Monitor Supabase Storage usage
- **Bandwidth**: Public images served via Supabase CDN

## Security Notes

- **No authentication required**: Anyone can upload and view captures
- **No file validation**: App only uploads PNG from canvas
- **No deletion policy**: Images persist indefinitely (can add cleanup policy if needed)
- **Rate limiting**: Consider adding rate limits if spam becomes an issue

## Future Enhancements

Potential improvements:
- Add image compression before upload
- Implement pagination for leaderboard with many entries
- Add filter to show only entries with captures
- Allow users to delete their own submissions
- Add reporting system for inappropriate captures
- Implement CDN caching for faster image delivery

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify all migrations ran successfully in Supabase
3. Check Supabase Storage dashboard for uploaded files
4. Review this documentation for common issues
