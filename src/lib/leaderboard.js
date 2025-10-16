import { supabase } from './supabase';

/**
 * Upload capture grid image to Supabase Storage
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {string} nickname - Player's nickname (used in filename)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadCaptureImage(dataUrl, nickname) {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedNickname = nickname.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedNickname}_${timestamp}.png`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('captures')
      .upload(filename, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[STORAGE] Error uploading image:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('captures')
      .getPublicUrl(filename);

    console.log('[STORAGE] Image uploaded successfully:', publicUrlData.publicUrl);
    return { success: true, url: publicUrlData.publicUrl };
  } catch (err) {
    console.error('[STORAGE] Unexpected error:', err);
    return { success: false, error: 'Failed to upload image' };
  }
}

/**
 * Upload replay video to Supabase Storage
 * @param {Blob} videoBlob - Video blob to upload
 * @param {string} nickname - Player's nickname (used in filename)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadReplayVideo(videoBlob, nickname) {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedNickname = nickname.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedNickname}_${timestamp}.webm`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filename, videoBlob, {
        contentType: 'video/webm',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[STORAGE] Error uploading video:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filename);

    console.log('[STORAGE] Video uploaded successfully:', publicUrlData.publicUrl);
    return { success: true, url: publicUrlData.publicUrl };
  } catch (err) {
    console.error('[STORAGE] Unexpected error:', err);
    return { success: false, error: 'Failed to upload video' };
  }
}

/**
 * Submit a new leaderboard entry
 * @param {string} nickname - Player's nickname (1-50 characters)
 * @param {number} timeMs - Completion time in milliseconds
 * @param {string} captureImageUrl - Optional URL to the capture grid image
 * @param {string} videoUrl - Optional URL to the replay video
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function submitLeaderboardEntry(nickname, timeMs, captureImageUrl = null, videoUrl = null) {
  try {
    // Validate inputs
    if (!nickname || nickname.trim().length === 0) {
      return { success: false, error: 'Nickname is required' };
    }
    if (nickname.length > 50) {
      return { success: false, error: 'Nickname must be 50 characters or less' };
    }
    if (!timeMs || timeMs <= 0) {
      return { success: false, error: 'Invalid time value' };
    }

    const { data, error } = await supabase
      .from('leaderboard')
      .insert([
        {
          nickname: nickname.trim(),
          time_ms: timeMs,
          capture_image_url: captureImageUrl,
          video_url: videoUrl,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[LEADERBOARD] Error submitting entry:', error);
      return { success: false, error: error.message };
    }

    console.log('[LEADERBOARD] Entry submitted successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('[LEADERBOARD] Unexpected error:', err);
    return { success: false, error: 'Failed to submit entry' };
  }
}

/**
 * Fetch top leaderboard entries
 * @param {number} limit - Maximum number of entries to fetch (default: 100)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function fetchLeaderboard(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('time_ms', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[LEADERBOARD] Error fetching leaderboard:', error);
      return { success: false, error: error.message };
    }

    console.log('[LEADERBOARD] Fetched', data?.length, 'entries');
    return { success: true, data: data || [] };
  } catch (err) {
    console.error('[LEADERBOARD] Unexpected error:', err);
    return { success: false, error: 'Failed to fetch leaderboard' };
  }
}

/**
 * Get player's rank for a given time
 * @param {number} timeMs - Time in milliseconds
 * @returns {Promise<{success: boolean, rank?: number, totalEntries?: number, error?: string}>}
 */
export async function getPlayerRank(timeMs) {
  try {
    // Count how many entries have a better (lower) time
    const { count: betterCount, error: betterError } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .lt('time_ms', timeMs);

    if (betterError) {
      console.error('[LEADERBOARD] Error getting rank:', betterError);
      return { success: false, error: betterError.message };
    }

    // Fetch total entries from counter table (much faster than counting)
    const { data: statsData, error: statsError } = await supabase
      .from('leaderboard_stats')
      .select('total_entries')
      .eq('id', 1)
      .single();

    if (statsError) {
      console.error('[LEADERBOARD] Error getting total count:', statsError);
      // Fallback to counting if stats table doesn't exist
      const { count: totalCount, error: countError } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        return { success: false, error: 'Failed to get total entries' };
      }

      const rank = (betterCount || 0) + 1;
      const totalEntries = totalCount || 0;
      return { success: true, rank, totalEntries };
    }

    // Rank is count + 1 (if 0 people are faster, you're rank 1)
    const rank = (betterCount || 0) + 1;
    const totalEntries = statsData?.total_entries || 0;
    return { success: true, rank, totalEntries };
  } catch (err) {
    console.error('[LEADERBOARD] Unexpected error:', err);
    return { success: false, error: 'Failed to get rank' };
  }
}
