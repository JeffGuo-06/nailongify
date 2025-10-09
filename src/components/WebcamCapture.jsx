import { useRef, useEffect, useState } from 'react';
import { detectFace } from '../utils/faceDetection';
import { findBestExpressionMatch } from '../utils/expressionMatching';
import Timer from './Timer';

function WebcamCapture({ memes, facialData, onMatchFound, onCapture, onUnlockFace, onHoldProgress, autoStart, trackProgress, unlockedFaces, showTimer, startTime, isRunning, onTimeUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const currentMatchRef = useRef(null); // Store current match for capture
  const accumulatedTimeRef = useRef({}); // Accumulated time for each expression (in ms)
  const lastUpdateTimeRef = useRef(null); // Last time we updated accumulation
  const locallyUnlockedRef = useRef({}); // Track which faces we've locally unlocked to prevent duplicate calls
  const lastLoggedProgressRef = useRef({}); // Track last logged progress to avoid spam
  const trackProgressRef = useRef(trackProgress); // Ref to avoid stale closure
  const unlockedFacesRef = useRef(unlockedFaces); // Ref to avoid stale closure

  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // Update refs when props change
  useEffect(() => {
    trackProgressRef.current = trackProgress;
  }, [trackProgress]);

  useEffect(() => {
    unlockedFacesRef.current = unlockedFaces;
  }, [unlockedFaces]);

  // Start camera
  const startCamera = async () => {
    try {
      setError(null);
      setPermissionDenied(false);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          startDetection();
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else {
        setError('Failed to access camera: ' + err.message);
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Stop accumulating time
    stopAccumulating();

    setCameraActive(false);
    setDetecting(false);
  };

  // Update expression hold tracking (accumulates time)
  const updateExpressionHold = (expressionId) => {
    const now = Date.now();

    // Initialize accumulated time if needed
    if (!accumulatedTimeRef.current[expressionId]) {
      accumulatedTimeRef.current[expressionId] = 0;
    }

    // If we have a last update time, add the elapsed time
    if (lastUpdateTimeRef.current) {
      const elapsed = now - lastUpdateTimeRef.current;
      accumulatedTimeRef.current[expressionId] += elapsed;
    }

    lastUpdateTimeRef.current = now;

    // Calculate progress (0-1)
    const totalTime = accumulatedTimeRef.current[expressionId];
    const progress = Math.min(totalTime / 3000, 1); // 3 seconds = 100%

    // Log progress at key milestones (avoid spam)
    const progressPercent = Math.floor(progress * 100);
    const lastLogged = lastLoggedProgressRef.current[expressionId] || 0;

    // Log every 25% milestone
    if (progressPercent >= lastLogged + 25) {
      lastLoggedProgressRef.current[expressionId] = progressPercent;
    }

    // Update progress display
    if (onHoldProgress) {
      onHoldProgress(expressionId, progress);
    }

    // Check if unlocked (3 seconds total accumulated)
    if (progress >= 1 && onUnlockFace && !locallyUnlockedRef.current[expressionId]) {
      // Mark as locally unlocked to prevent duplicate calls
      locallyUnlockedRef.current[expressionId] = true;

      // Capture the current video frame
      const captureImageData = captureCurrentFrame();

      // Pass both capture data and current match info
      onUnlockFace(expressionId, captureImageData, currentMatchRef.current);
    }
  };

  // Capture current video frame and return as data URL
  const captureCurrentFrame = () => {
    if (!videoRef.current) {
      console.log('[CAPTURE DEBUG] Video ref is null');
      return null;
    }

    const video = videoRef.current;

    // Check if video is actually ready (don't rely on state)
    if (video.readyState < 2) {
      console.log('[CAPTURE DEBUG] Video not ready, readyState:', video.readyState);
      return null;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('[CAPTURE DEBUG] Video has no dimensions:', video.videoWidth, 'x', video.videoHeight);
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    console.log('[CAPTURE DEBUG] Successfully captured frame:', canvas.width, 'x', canvas.height);
    return dataUrl;
  };

  // Stop accumulating time (when similarity drops below 80% or no face detected)
  const stopAccumulating = () => {
    lastUpdateTimeRef.current = null;
  };

  // Real-time face detection loop
  const startDetection = () => {
    const detect = async () => {
      if (!videoRef.current) {
        return;
      }

      // Check if video is actually playing instead of relying on state
      if (videoRef.current.paused || videoRef.current.readyState < 2) {
        // Continue loop but skip this frame
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(detect);
        }, 100);
        return;
      }

      try {
        setDetecting(true);

        // Detect face and get landmarks
        const detection = await detectFace(videoRef.current);

        if (detection && detection.expressions) {
          // Use expression-based matching with personalized facial data
          if (memes.length > 0) {
            const match = findBestExpressionMatch(detection.expressions, memes, detection.landmarks, facialData);

            if (match && onMatchFound) {
              onMatchFound(match);
              currentMatchRef.current = match; // Store for capture

              // Only track expression hold for unlocking if timer has started
              if (trackProgressRef.current) {
                // Don't track if already unlocked (check both parent state and local ref)
                const alreadyUnlocked = (unlockedFacesRef.current && unlockedFacesRef.current[match.expression]) || locallyUnlockedRef.current[match.expression];

                if (alreadyUnlocked) {
                  stopAccumulating();
                } else if (match.similarity >= 80) {
                  // Track expression hold for unlocking (only if similarity >= 80%)
                  updateExpressionHold(match.expression);
                } else {
                  // Similarity too low, stop accumulating
                  stopAccumulating();
                }
              }
            } else {
              // No match, stop accumulating
              if (trackProgressRef.current) {
                stopAccumulating();
              }
            }
          }

          // Draw landmarks on canvas (debug mode)
          drawLandmarks(detection.landmarks);
        } else {
          // Clear canvas if no face detected
          clearCanvas();
          // Stop accumulating when no face detected
          if (trackProgressRef.current) {
            stopAccumulating();
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
      }

      // Continue detection loop (throttled to ~10 fps)
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(detect);
      }, 100);
    };

    detect();
  };

  // Draw landmarks on canvas for visualization
  const drawLandmarks = (landmarks) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw landmark points
    ctx.fillStyle = '#ff6b9d';
    landmarks.positions.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Clear canvas
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // Capture current video frame
  const captureFrame = () => {
    if (!videoRef.current || !cameraActive || !currentMatchRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/png');

    if (onCapture) {
      onCapture({
        userImage: imageDataUrl,
        match: currentMatchRef.current
      });
    }
  };

  // Auto-start camera when autoStart becomes true
  useEffect(() => {
    if (autoStart && !cameraActive) {
      startCamera();
    }
  }, [autoStart, cameraActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="webcam-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="webcam-video"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="webcam-canvas"
        />
        {showTimer && (
          <div className="timer-overlay">
            <Timer
              startTime={startTime}
              isRunning={isRunning}
              onTimeUpdate={onTimeUpdate}
            />
          </div>
        )}
        {!cameraActive && (
          <div className="video-placeholder">
            <p>Camera not active</p>
          </div>
        )}
      </div>

      {error && (
        <div className="webcam-error">
          <p>{error}</p>
          {permissionDenied && (
            <p className="help-text">
              Check your browser settings to allow camera access for this site.
            </p>
          )}
        </div>
      )}

      {cameraActive && (
        <div className="status-indicator">
          <span className="status-dot"></span>
          {detecting ? 'Detecting...' : 'Ensure your face is centered and well lit'}
        </div>
      )}

      {!cameraActive && !error && (
        <div className="status-indicator">
          <span className="status-dot"></span>
          Camera is off
        </div>
      )}
    </div>
  );
}

export default WebcamCapture;
