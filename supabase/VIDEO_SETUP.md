# Video Replay Setup Instructions

This guide will help you set up video replay functionality for Nailongify.

## Overview

The video replay system records the entire game (UnlockableFaces, WebcamCapture + Timer, and MemeDisplay) at 720p and 2x speed. Videos are stored in Supabase Storage and displayed in the leaderboard.

## Prerequisites

- Supabase project already set up
- Supabase CLI installed (optional, for running migrations)
- Access to Supabase Dashboard

## Step 1: Create the Videos Bucket

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Configure the bucket:
   - **Name**: `videos`
   - **Public**: ✅ Yes (enable public access)
   - **File size limit**: 10 MB (recommended)
   - **Allowed MIME types**: `video/webm`, `video/mp4` (optional)
5. Click **Create Bucket**

## Step 2: Apply Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **Database** → **SQL Editor** in your Supabase Dashboard
2. Copy and paste the contents of `migrations/20250115_add_video_url.sql`
3. Click **Run** to execute
4. Copy and paste the contents of `migrations/20250115_create_videos_bucket.sql`
5. Click **Run** to execute

### Option B: Using Supabase CLI

```bash
# Make sure you're in the project directory
cd nailongify

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Step 3: Verify Setup

### Check Database Changes

Run this query in SQL Editor to verify the column was added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leaderboard'
AND column_name = 'video_url';
```

### Check Storage Policies

Run this query to verify storage policies:

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%videos%';
```

You should see two policies:
- `Anyone can upload videos`
- `Anyone can view videos`

### Test Video Upload

1. Go to **Storage** → **videos** bucket
2. Try uploading a test video file
3. Verify it appears in the bucket
4. Copy the public URL and test it opens in a browser

## Video Specifications

- **Format**: WebM (video/webm;codecs=vp9 or vp8)
- **Resolution**: 1280x720 (720p)
- **Frame Rate**: 15 fps (plays at 30fps for 2x speed effect)
- **Maximum Upload Duration**: 30 seconds (at 2x speed)
  - This means original gameplay can be up to 60 seconds
  - Videos longer than 30s can still be downloaded but won't be uploaded to leaderboard
- **Bitrate**: 2.5 Mbps
- **Typical File Size**: 3-7 MB for a 20-30 second video

## Troubleshooting

### Videos Not Uploading

1. Check browser console for errors
2. Verify the `videos` bucket exists and is public
3. Check storage policies are applied correctly
4. Ensure file size doesn't exceed bucket limit (10 MB)

### Videos Not Displaying on Leaderboard

1. Verify `video_url` column exists in leaderboard table
2. Check that video URLs are properly stored in database
3. Verify videos are accessible via their public URLs
4. Check browser console for CORS or loading errors

### "Video Too Long" Warning

This is expected behavior for games that take longer than 60 seconds:
- Video is still recorded and can be downloaded
- It just won't be uploaded to the leaderboard
- User will see a warning message on the end screen
- The capture grid and completion time are still submitted

## Security Notes

- Videos are publicly accessible (no authentication required)
- Anyone can upload to the videos bucket (consider adding rate limiting)
- No automatic deletion of old videos (consider implementing cleanup)
- Consider adding file size validation in your app before upload

## Optional Enhancements

Consider implementing these features:

1. **Automatic Cleanup**: Delete old videos after 30 days
2. **Video Compression**: Further compress videos before upload
3. **Upload Progress**: Show upload progress bar
4. **Video Thumbnails**: Generate and store thumbnail images
5. **Playback Controls**: Add play/pause/seek controls to video player
6. **Download All**: Allow downloading all captures + video as a zip file

## Cost Considerations

Supabase Storage pricing (as of 2025):
- **Free tier**: 1 GB storage
- **Pro tier**: $0.021 per GB per month

Estimated storage needs:
- Average video: 5 MB
- 1000 videos ≈ 5 GB ≈ $0.10/month

Monitor your storage usage in the Supabase Dashboard under **Settings** → **Usage**.
