import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Load face-api.js models from public/models directory
 * Must be called before any face detection can occur
 */
export async function loadModels() {
  if (modelsLoaded) {
    return;
  }

  try {
    const MODEL_URL = '/models';

    // Load TinyFaceDetector (fast, lightweight detector)
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

    // Load 68-point face landmark model
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

    // Load face expression model
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

    modelsLoaded = true;
  } catch (error) {
    console.error('Error loading models:', error);
    throw new Error('Failed to load face detection models');
  }
}

/**
 * Detect face and extract landmarks from video element
 * @param {HTMLVideoElement} video - The video element from webcam
 * @returns {Promise<Object|null>} Detection result with landmarks, or null if no face detected
 */
export async function detectFace(video) {
  if (!modelsLoaded) {
    throw new Error('Models not loaded. Call loadModels() first.');
  }

  try {
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.3  // Lower threshold for better detection
      }))
      .withFaceLandmarks()
      .withFaceExpressions(); // Add expression recognition

    return detections;
  } catch (error) {
    console.error('Error detecting face:', error);
    return null;
  }
}

/**
 * Detect face and extract landmarks from an image element
 * Used for preprocessing Nailong meme images (cartoon faces)
 * @param {HTMLImageElement} image - The image element
 * @returns {Promise<Object|null>} Detection result with landmarks, or null if no face detected
 */
export async function detectFaceFromImage(image) {
  if (!modelsLoaded) {
    throw new Error('Models not loaded. Call loadModels() first.');
  }

  // Try multiple detection strategies for cartoon faces
  const strategies = [
    { inputSize: 512, scoreThreshold: 0.1 },
    { inputSize: 416, scoreThreshold: 0.1 },
    { inputSize: 320, scoreThreshold: 0.1 },
    { inputSize: 512, scoreThreshold: 0.05 },
    { inputSize: 416, scoreThreshold: 0.05 },
  ];

  for (const strategy of strategies) {
    try {
      const detections = await faceapi
        .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions(strategy))
        .withFaceLandmarks();

      if (detections && detections.landmarks) {
        return detections;
      }
    } catch (error) {
      // Try next strategy
      continue;
    }
  }

  // No face detected with any strategy
  return null;
}

/**
 * Extract landmark points as a simple array of {x, y} coordinates
 * @param {Object} landmarks - FaceLandmarks68 object from face-api.js
 * @returns {Array} Array of 68 {x, y} points
 */
export function extractLandmarkPoints(landmarks) {
  if (!landmarks || !landmarks.positions) {
    return null;
  }

  // Convert landmarks to simple array of points
  return landmarks.positions.map(point => ({
    x: point.x,
    y: point.y
  }));
}

/**
 * Check if models are loaded
 * @returns {boolean}
 */
export function areModelsLoaded() {
  return modelsLoaded;
}
