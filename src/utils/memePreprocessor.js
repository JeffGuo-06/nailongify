import { detectFaceFromImage, extractLandmarkPoints } from './faceDetection';
import { normalizeLandmarks, extractKeyLandmarks } from './landmarkMatching';

// Cache version - increment this when detection algorithm changes
const CACHE_VERSION = 3; // Bumped for key landmarks

/**
 * Load and preprocess all Nailong meme images
 * Extract and normalize facial landmarks from each meme
 *
 * @param {Array} memes - Array of meme objects from memes.json
 * @returns {Promise<Array>} Array of {meme, landmarks} objects
 */
export async function preprocessMemes(memes) {
  console.log(`Preprocessing ${memes.length} Nailong memes...`);

  const processedMemes = [];
  const failedMemes = [];

  for (const meme of memes) {
    try {
      const landmarks = await extractMemeLandmarks(meme.path);

      if (landmarks) {
        processedMemes.push({
          meme: meme,
          landmarks: landmarks
        });
        console.log(`✓ Processed: ${meme.name}`);
      } else {
        failedMemes.push(meme.name);
        console.warn(`✗ No face detected in: ${meme.name}`);
      }
    } catch (error) {
      failedMemes.push(meme.name);
      console.error(`✗ Error processing ${meme.name}:`, error);
    }
  }

  console.log(`Preprocessing complete: ${processedMemes.length}/${memes.length} successful`);

  if (failedMemes.length > 0) {
    console.warn('Failed to process:', failedMemes);
  }

  return processedMemes;
}

/**
 * Extract and normalize landmarks from a single meme image
 *
 * @param {string} imagePath - Path to the meme image
 * @returns {Promise<Array|null>} Normalized landmarks or null if face not detected
 */
export async function extractMemeLandmarks(imagePath) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = async () => {
      try {
        // Detect face and get landmarks
        const detection = await detectFaceFromImage(img);

        if (!detection || !detection.landmarks) {
          resolve(null);
          return;
        }

        // Extract landmark points
        const landmarkPoints = extractLandmarkPoints(detection.landmarks);

        if (!landmarkPoints) {
          resolve(null);
          return;
        }

        // Focus on expression-critical features (eyebrows, eyes, mouth)
        const keyLandmarks = extractKeyLandmarks(landmarkPoints);

        // Normalize landmarks for consistent comparison
        const normalized = normalizeLandmarks(keyLandmarks);

        resolve(normalized);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imagePath}`));
    };

    // Load the image
    img.src = imagePath;
  });
}

/**
 * Save preprocessed landmarks to localStorage for faster subsequent loads
 *
 * @param {Array} processedMemes - Array of {meme, landmarks} objects
 */
export function cachePreprocessedMemes(processedMemes) {
  try {
    const cacheData = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      memes: processedMemes.map(pm => ({
        id: pm.meme.id,
        landmarks: pm.landmarks
      }))
    };

    localStorage.setItem('nailongify_meme_cache', JSON.stringify(cacheData));
    console.log('Cached preprocessed memes to localStorage (v' + CACHE_VERSION + ')');
  } catch (error) {
    console.warn('Failed to cache memes:', error);
  }
}

/**
 * Load preprocessed landmarks from localStorage cache
 *
 * @param {Array} memes - Array of meme objects from memes.json
 * @returns {Array|null} Cached processed memes or null if cache invalid/missing
 */
export function loadCachedMemes(memes) {
  try {
    const cached = localStorage.getItem('nailongify_meme_cache');

    if (!cached) {
      return null;
    }

    const cacheData = JSON.parse(cached);

    // Check cache version
    if (cacheData.version !== CACHE_VERSION) {
      console.log(`Cache outdated (version ${cacheData.version || 1} -> ${CACHE_VERSION})`);
      return null;
    }

    // Check if cache has all current memes
    if (cacheData.memes.length !== memes.length) {
      console.log('Cache outdated (meme count mismatch)');
      return null;
    }

    // Reconstruct processed memes from cache
    const processedMemes = cacheData.memes.map(cachedMeme => {
      const meme = memes.find(m => m.id === cachedMeme.id);
      if (!meme) return null;

      return {
        meme: meme,
        landmarks: cachedMeme.landmarks
      };
    }).filter(pm => pm !== null);

    if (processedMemes.length === memes.length) {
      console.log('Loaded preprocessed memes from cache');
      return processedMemes;
    }

    return null;
  } catch (error) {
    console.warn('Failed to load cache:', error);
    return null;
  }
}
