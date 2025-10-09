import { supabase } from './supabase';

/**
 * Submit a new leaderboard entry
 * @param {string} nickname - Player's nickname (1-20 characters)
 * @param {number} timeMs - Completion time in milliseconds
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function submitLeaderboardEntry(nickname, timeMs) {
  try {
    // Validate inputs
    if (!nickname || nickname.trim().length === 0) {
      return { success: false, error: 'Nickname is required' };
    }
    if (nickname.length > 20) {
      return { success: false, error: 'Nickname must be 20 characters or less' };
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
 * @returns {Promise<{success: boolean, rank?: number, error?: string}>}
 */
export async function getPlayerRank(timeMs) {
  try {
    // Count how many entries have a better (lower) time
    const { count, error } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .lt('time_ms', timeMs);

    if (error) {
      console.error('[LEADERBOARD] Error getting rank:', error);
      return { success: false, error: error.message };
    }

    // Rank is count + 1 (if 0 people are faster, you're rank 1)
    const rank = (count || 0) + 1;
    return { success: true, rank };
  } catch (err) {
    console.error('[LEADERBOARD] Unexpected error:', err);
    return { success: false, error: 'Failed to get rank' };
  }
}
