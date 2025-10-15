/**
 * Expression-based matching for Nailong memes
 * Maps face-api.js expressions to Nailong meme expressions
 */

/**
 * Get mouth opening aspect ratio
 * @param {Object} landmarks - face-api.js landmarks
 * @returns {number} Aspect ratio (height / width), or 0 if no landmarks
 */
function getMouthAspectRatio(landmarks) {
  if (!landmarks || !landmarks.positions) {
    return 0;
  }

  const points = landmarks.positions;

  // Mouth landmarks: 48-67 (20 points)
  // Upper lip: 50-52 (top center)
  // Lower lip: 57-59 (bottom center)
  const upperLipTop = points[51]; // Center of upper lip
  const lowerLipBottom = points[57]; // Center of lower lip

  // Mouth corners
  const leftCorner = points[48];
  const rightCorner = points[54];

  // Calculate mouth height (vertical opening)
  const mouthHeight = Math.abs(lowerLipBottom.y - upperLipTop.y);

  // Calculate mouth width
  const mouthWidth = Math.abs(rightCorner.x - leftCorner.x);

  // Calculate aspect ratio (height / width)
  return mouthHeight / mouthWidth;
}

/**
 * Classify mouth opening level based on aspect ratio
 * @param {number} aspectRatio - Mouth aspect ratio (height / width)
 * @returns {string} 'closed', 'moderate', 'very_open', or 'incredibly_open'
 */
function classifyMouthOpening(aspectRatio) {
  // Mouth opening levels based on user's meme comments:
  // closed: < 0.35
  // moderately open: 0.35 - 0.5
  // very open: 0.5 - 0.65
  // incredibly open: > 0.65

  if (aspectRatio > 0.65) {
    return 'incredibly_open';
  } else if (aspectRatio > 0.5) {
    return 'very_open';
  } else if (aspectRatio > 0.35) {
    return 'moderate';
  } else {
    return 'closed';
  }
}

/**
 * Calculate Eye Aspect Ratio (EAR) to detect wide eyes
 * @param {Object} landmarks - face-api.js landmarks
 * @returns {number} Average EAR for both eyes (0 if no landmarks)
 */
function getEyeAspectRatio(landmarks) {
  if (!landmarks || !landmarks.positions) {
    return 0;
  }

  const points = landmarks.positions;

  // Left eye landmarks: 36-41
  // Right eye landmarks: 42-47

  // Calculate EAR for left eye
  const leftVertical1 = Math.abs(points[37].y - points[41].y); // Top to bottom (outer)
  const leftVertical2 = Math.abs(points[38].y - points[40].y); // Top to bottom (inner)
  const leftHorizontal = Math.abs(points[39].x - points[36].x); // Left to right
  const leftEAR = (leftVertical1 + leftVertical2) / (2 * leftHorizontal);

  // Calculate EAR for right eye
  const rightVertical1 = Math.abs(points[43].y - points[47].y);
  const rightVertical2 = Math.abs(points[44].y - points[46].y);
  const rightHorizontal = Math.abs(points[45].x - points[42].x);
  const rightEAR = (rightVertical1 + rightVertical2) / (2 * rightHorizontal);

  // Return average of both eyes
  return (leftEAR + rightEAR) / 2;
}

/**
 * Detect if eyebrows are raised
 * @param {Object} landmarks - face-api.js landmarks
 * @returns {boolean} True if eyebrows appear raised
 */
function areEyebrowsRaised(landmarks) {
  if (!landmarks || !landmarks.positions) {
    return false;
  }

  const points = landmarks.positions;

  // Left eyebrow: points 17-21
  // Left eye: points 36-41
  // Right eyebrow: points 22-26
  // Right eye: points 42-47

  // Get center of left eyebrow and left eye
  const leftBrowCenter = points[19]; // Middle of left eyebrow
  const leftEyeTop = points[37]; // Top of left eye

  // Get center of right eyebrow and right eye
  const rightBrowCenter = points[24]; // Middle of right eyebrow
  const rightEyeTop = points[43]; // Top of right eye

  // Calculate distance between eyebrow and eye (vertical distance)
  const leftDistance = Math.abs(leftBrowCenter.y - leftEyeTop.y);
  const rightDistance = Math.abs(rightBrowCenter.y - rightEyeTop.y);
  const avgDistance = (leftDistance + rightDistance) / 2;

  // Eyebrows are considered raised if distance is above threshold
  // Typical neutral: ~15-25 pixels, raised: >30 pixels (adjust as needed)
  return avgDistance > 25;
}

/**
 * Calculate similarity score between current facial measurements and reference data
 * @param {number} currentMouth - Current mouth aspect ratio
 * @param {number} currentEye - Current eye aspect ratio
 * @param {number} currentEyebrow - Current eyebrow distance
 * @param {number} refMouth - Reference mouth aspect ratio
 * @param {number} refEye - Reference eye aspect ratio
 * @param {number} refEyebrow - Reference eyebrow distance
 * @returns {number} Similarity score (0-100, higher is better)
 */
function calculateSimilarity(currentMouth, currentEye, currentEyebrow, refMouth, refEye, refEyebrow) {
  // Calculate normalized differences (0-1 range)
  const mouthDiff = Math.abs(currentMouth - refMouth) / Math.max(currentMouth, refMouth, 1);
  const eyeDiff = Math.abs(currentEye - refEye) / Math.max(currentEye, refEye, 1);
  const eyebrowDiff = Math.abs(currentEyebrow - refEyebrow) / Math.max(currentEyebrow, refEyebrow, 1);

  // Weighted average (mouth is most important for expressions)
  const weightedDiff = (mouthDiff * 0.5) + (eyeDiff * 0.3) + (eyebrowDiff * 0.2);

  // Convert to similarity score (0-100)
  const similarity = Math.max(0, (1 - weightedDiff) * 100);

  return similarity;
}

/**
 * Find best match using personalized facial reference data
 * @param {Object} expressions - face-api.js expression probabilities
 * @param {Array} memes - Array of meme objects
 * @param {Object} landmarks - face-api.js landmarks
 * @param {Object} facialData - Personalized reference facial data
 * @returns {Object} Best match with {meme, expression, confidence, similarity}
 */
function findBestPersonalizedMatch(expressions, memes, landmarks, facialData) {
  // Calculate current facial measurements
  const currentMouth = getMouthAspectRatio(landmarks);
  const currentEye = getEyeAspectRatio(landmarks);
  const currentEyebrow = landmarks ? calculateEyebrowDistance(landmarks) : 0;

  // Map of expression IDs to meme IDs
  const expressionToMemeId = {
    'angry': 'angry',
    'cry': 'cry',
    'geeked': 'geeked',
    'off-the-deep-end': 'off-the-deep-end',
    'smiling': 'smiling',
    'smirk': 'smirk',
    'sad': 'sad',
    'woah-woah-woah': 'woah-woah-woah'
  };

  let bestMatch = null;
  let bestSimilarity = 0;

  // Compare against each reference expression
  for (const [expressionId, refData] of Object.entries(facialData)) {
    const similarity = calculateSimilarity(
      currentMouth,
      currentEye,
      currentEyebrow,
      refData.mouthRatio,
      refData.eyeRatio,
      refData.eyebrowDistance
    );

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      const memeId = expressionToMemeId[expressionId];
      const meme = memes.find(m => m.id === memeId);

      if (meme) {
        bestMatch = {
          meme,
          expression: expressionId,
          confidence: Math.round(similarity),
          similarity: Math.round(similarity)
        };
      }
    }
  }

  // If no good match found (similarity < 40), return null
  if (!bestMatch || bestSimilarity < 40) {
    return null;
  }

  return bestMatch;
}

/**
 * Helper to calculate eyebrow distance (used in personalized matching)
 */
function calculateEyebrowDistance(landmarks) {
  if (!landmarks || !landmarks.positions) {
    return 0;
  }

  const points = landmarks.positions;

  // Left eyebrow and eye
  const leftBrowCenter = points[19];
  const leftEyeTop = points[37];

  // Right eyebrow and eye
  const rightBrowCenter = points[24];
  const rightEyeTop = points[43];

  // Calculate distances
  const leftDistance = Math.abs(leftBrowCenter.y - leftEyeTop.y);
  const rightDistance = Math.abs(rightBrowCenter.y - rightEyeTop.y);

  return (leftDistance + rightDistance) / 2;
}

/**
 * Find best matching Nailong meme based on facial expression and mouth opening
 * @param {Object} expressions - face-api.js expression probabilities
 * @param {Array} memes - Array of meme objects with expression tags
 * @param {Object} landmarks - face-api.js landmarks (optional, for mouth detection)
 * @param {Object} facialData - Personalized reference facial data (optional)
 * @returns {Object} Best match with {meme, expression, confidence}
 */
export function findBestExpressionMatch(expressions, memes, landmarks = null, facialData = null) {
  if (!expressions || !memes || memes.length === 0) {
    return null;
  }

  // If personalized facial data is available, use it for matching
  if (facialData && landmarks) {
    return findBestPersonalizedMatch(expressions, memes, landmarks, facialData);
  }

  // Get the dominant expression
  let dominantExpression = 'neutral';
  let maxProbability = 0;

  for (const [expr, prob] of Object.entries(expressions)) {
    if (prob > maxProbability) {
      maxProbability = prob;
      dominantExpression = expr;
    }
  }

  // Get mouth opening level
  const mouthRatio = landmarks ? getMouthAspectRatio(landmarks) : 0;
  const mouthLevel = mouthRatio > 0 ? classifyMouthOpening(mouthRatio) : null;

  // Get eye and eyebrow data
  const eyeRatio = landmarks ? getEyeAspectRatio(landmarks) : 0;
  const eyebrowsRaised = landmarks ? areEyebrowsRaised(landmarks) : false;

  // 1. INCREDIBLY OPEN (>0.65)
  if (mouthLevel === 'incredibly_open') {
    // off-the-deep-end: "mouth incredibly open, eyes wide open, eyebrows very raised"
    // Requires: incredibly open mouth + wide eyes (EAR > 0.25) + raised eyebrows
    const hasWideEyes = eyeRatio > 0.25;

    if (hasWideEyes && eyebrowsRaised) {
      const crazyMeme = memes.find(m => m.id === 'off-the-deep-end');
      if (crazyMeme) {
        return {
          meme: crazyMeme,
          expression: 'incredibly_open',
          confidence: 95,
          similarity: 95
        };
      }
    }

    // cry: "mouth incredibly open" + sad expression (fallback for incredibly open without wide eyes)
    if (dominantExpression === 'sad') {
      const cryMeme = memes.find(m => m.id === 'cry');
      if (cryMeme) {
        return {
          meme: cryMeme,
          expression: 'sad_crying',
          confidence: Math.round(maxProbability * 100),
          similarity: Math.round(maxProbability * 100)
        };
      }
    }

    // If incredibly open but doesn't match off-the-deep-end criteria, still return it as fallback
    const crazyMeme = memes.find(m => m.id === 'off-the-deep-end');
    if (crazyMeme) {
      return {
        meme: crazyMeme,
        expression: 'incredibly_open',
        confidence: 85,
        similarity: 85
      };
    }
  }

  // 2. VERY OPEN (0.5-0.65)
  if (mouthLevel === 'very_open') {
    // smiling: wide smile, mouth open showing teeth
    const smilingMeme = memes.find(m => m.id === 'smiling');
    if (smilingMeme && dominantExpression === 'happy') {
      return {
        meme: smilingMeme,
        expression: 'happy_very_open',
        confidence: 90,
        similarity: 90
      };
    }
  }

  // 3. MODERATELY OPEN (0.35-0.5)
  if (mouthLevel === 'moderate') {
    // geeked: "mouth moderately open, eyebrows very raised" + happy
    if (dominantExpression === 'happy') {
      const geekedMeme = memes.find(m => m.id === 'geeked');
      if (geekedMeme) {
        return {
          meme: geekedMeme,
          expression: 'happy_moderate',
          confidence: Math.round(maxProbability * 100),
          similarity: Math.round(maxProbability * 100)
        };
      }
    }

    // angry: "mouth moderately open" + angry
    if (dominantExpression === 'angry') {
      const angryMeme = memes.find(m => m.id === 'angry');
      if (angryMeme) {
        return {
          meme: angryMeme,
          expression: 'angry',
          confidence: Math.round(maxProbability * 100),
          similarity: Math.round(maxProbability * 100)
        };
      }
    }

    // woah-woah-woah: "mouth moderately open, face tilted downwards" + fearful
    if (dominantExpression === 'fearful') {
      const woahMeme = memes.find(m => m.id === 'woah-woah-woah');
      if (woahMeme) {
        return {
          meme: woahMeme,
          expression: 'fearful',
          confidence: Math.round(maxProbability * 100),
          similarity: Math.round(maxProbability * 100)
        };
      }
    }
  }

  // 4. CLOSED (<0.35)
  if (mouthLevel === 'closed') {
    // smirk: "mouth closed" + neutral
    if (dominantExpression === 'neutral') {
      const smirkMeme = memes.find(m => m.id === 'smirk');
      if (smirkMeme) {
        return {
          meme: smirkMeme,
          expression: 'neutral',
          confidence: Math.round(maxProbability * 100),
          similarity: Math.round(maxProbability * 100)
        };
      }
    }

    // sad: downturned mouth, closed
    if (dominantExpression === 'sad') {
      const sadMeme = memes.find(m => m.id === 'sad');
      if (sadMeme) {
        return {
          meme: sadMeme,
          expression: 'sad',
          confidence: Math.round(maxProbability * 100),
          similarity: Math.round(maxProbability * 100)
        };
      }
    }
  }

  // Fallback: Pick best match based on expression only

  // Direct expression mapping for fallback
  const expressionToMemeId = {
    'sad': 'cry',
    'angry': 'angry',
    'happy': 'smiling',
    'fearful': 'woah-woah-woah',
    'neutral': 'smirk',
    'disgusted': 'woah-woah-woah',
    'surprised': 'off-the-deep-end'
  };

  const fallbackId = expressionToMemeId[dominantExpression];
  if (fallbackId) {
    const fallbackMeme = memes.find(m => m.id === fallbackId);
    if (fallbackMeme) {
      return {
        meme: fallbackMeme,
        expression: dominantExpression,
        confidence: Math.round(maxProbability * 100),
        similarity: Math.round(maxProbability * 80)
      };
    }
  }

  // Ultimate fallback: random meme
  const randomMeme = memes[Math.floor(Math.random() * memes.length)];

  return {
    meme: randomMeme,
    expression: dominantExpression,
    confidence: Math.round(maxProbability * 100),
    similarity: Math.round(maxProbability * 50)
  };
}
