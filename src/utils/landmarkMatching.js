/**
 * Normalize facial landmarks for consistent comparison
 * Steps:
 * 1. Center landmarks around their mean (translate to origin)
 * 2. Scale to unit variance (normalize size)
 *
 * @param {Array} landmarks - Array of {x, y} points (68 landmarks)
 * @returns {Array} Normalized landmarks
 */
export function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  // Calculate mean (center point)
  const meanX = landmarks.reduce((sum, p) => sum + p.x, 0) / landmarks.length;
  const meanY = landmarks.reduce((sum, p) => sum + p.y, 0) / landmarks.length;

  // Center landmarks around origin
  const centered = landmarks.map(p => ({
    x: p.x - meanX,
    y: p.y - meanY
  }));

  // Calculate standard deviation for scaling
  const variances = centered.map(p => p.x * p.x + p.y * p.y);
  const meanVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;
  const stdDev = Math.sqrt(meanVariance);

  // Scale to unit variance (if stdDev is not zero)
  if (stdDev === 0) {
    return centered;
  }

  const normalized = centered.map(p => ({
    x: p.x / stdDev,
    y: p.y / stdDev
  }));

  return normalized;
}

/**
 * Calculate Euclidean distance between two sets of normalized landmarks
 * Lower distance = more similar faces
 *
 * @param {Array} landmarks1 - First set of normalized landmarks
 * @param {Array} landmarks2 - Second set of normalized landmarks
 * @returns {number} Euclidean distance
 */
export function calculateDistance(landmarks1, landmarks2) {
  if (!landmarks1 || !landmarks2) {
    return Infinity;
  }

  if (landmarks1.length !== landmarks2.length) {
    console.error('Landmark arrays must be same length');
    return Infinity;
  }

  let sumSquaredDiff = 0;

  for (let i = 0; i < landmarks1.length; i++) {
    const dx = landmarks1[i].x - landmarks2[i].x;
    const dy = landmarks1[i].y - landmarks2[i].y;
    sumSquaredDiff += dx * dx + dy * dy;
  }

  return Math.sqrt(sumSquaredDiff);
}

/**
 * Find the best matching Nailong meme for user's face landmarks
 *
 * @param {Array} userLandmarks - User's normalized facial landmarks
 * @param {Array} memeLandmarks - Array of {meme, landmarks} objects
 * @returns {Object} Best match with {meme, distance, similarity}
 */
export function findBestMatch(userLandmarks, memeLandmarks) {
  if (!userLandmarks || !memeLandmarks || memeLandmarks.length === 0) {
    return null;
  }

  let bestMatch = null;
  let minDistance = Infinity;
  const allDistances = [];

  // Compare user landmarks with each meme's landmarks
  for (const memeData of memeLandmarks) {
    const distance = calculateDistance(userLandmarks, memeData.landmarks);

    allDistances.push({
      name: memeData.meme.name,
      distance: distance.toFixed(2)
    });

    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = memeData;
    }
  }

  if (!bestMatch) {
    return null;
  }

  // Convert distance to similarity percentage (0-100%)
  // Lower distance = higher similarity
  // Use exponential decay for better UX
  const similarity = Math.max(0, Math.min(100, 100 * Math.exp(-minDistance / 10)));

  return {
    meme: bestMatch.meme,
    distance: minDistance,
    similarity: Math.round(similarity)
  };
}

/**
 * Extract key facial landmarks for more focused matching
 * Focus on: eyebrows, eyes, nose, mouth
 *
 * @param {Array} landmarks - Full 68-point landmarks
 * @returns {Array} Subset of key landmarks
 */
export function extractKeyLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 68) {
    return landmarks;
  }

  // Face-api.js 68-point landmark indices:
  // Jaw: 0-16
  // Right eyebrow: 17-21
  // Left eyebrow: 22-26
  // Nose: 27-35
  // Right eye: 36-41
  // Left eye: 42-47
  // Mouth: 48-67

  const keyIndices = [
    // Eyebrows (expression-critical)
    ...Array.from({ length: 10 }, (_, i) => i + 17), // 17-26
    // Eyes
    ...Array.from({ length: 12 }, (_, i) => i + 36), // 36-47
    // Nose bridge and tip
    27, 28, 29, 30, 33, 34, 35,
    // Mouth (expression-critical)
    ...Array.from({ length: 20 }, (_, i) => i + 48), // 48-67
  ];

  return keyIndices.map(i => landmarks[i]);
}
