# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nailongify** is a real-time web application that captures facial expressions via webcam and matches them to the most similar Nailong meme from a library of 13 images using facial landmark detection. The app runs entirely client-side for privacy, with no backend required.

## Architecture

### Core Technology Stack
- **React 18+** with **Vite** - Fast build tooling
- **face-api.js** - Facial landmark detection (68-point model)
- **Plain CSS** - Styling
- **Vercel** - Deployment platform

### Matching Algorithm (Critical)

The app uses **facial landmark matching** with Euclidean distance:

1. Extract 68 facial landmarks from both user's face and Nailong meme images
2. Normalize landmarks (center around mean, scale to unit variance)
3. Calculate Euclidean distance between normalized landmark sets
4. Return meme with minimum distance (highest similarity)

This approach is preferred over expression recognition because:
- More accurate for matching specific cartoon expressions
- Works better with stylized/cartoon faces (Nailong memes)
- Captures subtle facial geometry differences

### Project Structure

```
nailongify/
├── public/
│   ├── models/              # face-api.js model files (must be served)
│   │   ├── tiny_face_detector_model-*
│   │   └── face_landmark_68_model-*
│   └── nailong/             # 13 Nailong meme images (already collected)
│
├── src/
│   ├── components/
│   │   ├── WebcamCapture.jsx      # Camera stream & real-time detection
│   │   ├── MemeDisplay.jsx        # Shows matched Nailong meme
│   │   └── LandmarkProcessor.jsx  # Processes face landmarks
│   ├── utils/
│   │   ├── faceDetection.js       # face-api.js model loading & detection
│   │   └── landmarkMatching.js    # Normalization & distance calculation
│   ├── styles/
│   │   └── App.css                # Main application styles
│   ├── App.jsx
│   └── main.jsx
```

## Development Commands

### Project Setup (Phase 1)
```bash
# Create React app with Vite
npm create vite@latest nailongify -- --template react
cd nailongify
npm install

# Install dependencies
npm install face-api.js
```

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Deployment
```bash
vercel --prod        # Deploy to Vercel
```

## Critical Implementation Details

### face-api.js Model Loading

Models must be loaded before any face detection can occur:

```javascript
// src/utils/faceDetection.js
import * as faceapi from 'face-api.js';

export async function loadModels() {
  const MODEL_URL = '/models';
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
}

export async function detectFace(video) {
  const detections = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();
  return detections?.landmarks; // Returns 68 landmark points
}
```

**Important:** Use `TinyFaceDetector` for performance (10-15 fps target). Models must be in `public/models/` directory and served via HTTP/HTTPS.

### Landmark Normalization

Normalization is essential for accurate matching across different face sizes/positions:

```javascript
// src/utils/landmarkMatching.js
function normalizeLandmarks(landmarks) {
  // 1. Extract positions as array
  // 2. Calculate mean (center point)
  // 3. Subtract mean from all points (center around origin)
  // 4. Calculate standard deviation
  // 5. Divide by std dev (scale to unit variance)
  return normalizedPoints;
}
```

### Performance Targets

- **Camera feed:** 30 fps
- **Face detection:** 10-15 fps (throttle if needed)
- **Matching calculation:** 5-10 fps
- **First paint:** <2 seconds

Use `requestAnimationFrame` for detection loop and throttle calculations to maintain performance.

### Webcam Requirements

- **HTTPS required** - Browser WebRTC API requires secure context
- Handle camera permissions gracefully with clear UI prompts
- Implement error boundaries for camera access failures
- Add camera flip/mirror option (users expect to see themselves mirrored)

### Nailong Meme Preprocessing

Before runtime matching, preprocess all Nailong memes once:

1. Load each image into an HTML Image element
2. Extract facial landmarks using face-api.js
3. Normalize and cache landmarks (localStorage or state)
4. This avoids re-processing memes on every frame

**Note:** 13 Nailong meme images are already collected in `nailong/` directory with descriptive names (angry.jpg, blushing.jpg, cry.jpg, etc.)

## Technical Considerations

### Privacy & Security
- All processing is client-side (no data transmission)
- Camera stream never leaves the browser
- No images stored or uploaded
- Emphasize privacy in UI messaging

### Browser Compatibility
- Primary: Chrome/Edge (best WebRTC support)
- Test on Firefox, Safari
- Mobile: iOS Safari and Chrome Android
- Camera API requires HTTPS in production

### Common Pitfalls

1. **Models not loading:** Verify model files are in `public/models/` and paths are correct
2. **Poor matching:** Ensure good lighting, face camera directly, stay 1-2 feet from camera
3. **Slow performance:** Reduce detection frequency, use TinyFaceDetector, lower video resolution
4. **Camera blocked:** Check browser permissions and HTTPS connection

## Vercel Deployment

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Critical:** Ensure all assets in `public/` (models and Nailong images) are included in the build output.

## Current Project Status

Project is in **planning phase**. Phase 1 (Project Setup) has not been started. See PLAN.md for full 8-phase implementation roadmap (estimated 17-24 hours total).
