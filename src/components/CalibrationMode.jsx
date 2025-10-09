import { useState, useRef, useEffect } from 'react';
import { detectFace } from '../utils/faceDetection';

function CalibrationMode({ memes, facialData, onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const currentDetectionRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [selectedExpression, setSelectedExpression] = useState('');
  const [calibrationData, setCalibrationData] = useState({});
  const [detecting, setDetecting] = useState(false);
  const [captureNotification, setCaptureNotification] = useState(null);
  const [errorNotification, setErrorNotification] = useState(null);

  const captureNotificationTimeoutRef = useRef(null);
  const errorNotificationTimeoutRef = useRef(null);

  // Load existing calibration data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nailongify_calibration');
    if (saved) {
      try {
        setCalibrationData(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load calibration data:', err);
      }
    }
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;

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

    setCameraActive(false);
    setDetecting(false);
  };

  // Real-time face detection loop
  const startDetection = () => {
    const detect = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.readyState < 2) {
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(detect);
        }, 100);
        return;
      }

      try {
        setDetecting(true);
        const detection = await detectFace(videoRef.current);

        if (detection && detection.landmarks) {
          // Store current detection for capture
          currentDetectionRef.current = detection;
          // Draw landmarks on canvas
          drawLandmarks(detection.landmarks);
        } else {
          currentDetectionRef.current = null;
          // Clear canvas if no face detected
          clearCanvas();
        }
      } catch (err) {
        console.error('Detection error:', err);
      }

      setTimeout(() => {
        animationRef.current = requestAnimationFrame(detect);
      }, 100);
    };

    detect();
  };

  // Capture facial data on space key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();

        // Check for various error conditions
        if (!cameraActive) {
          showError('Camera is not active. Please start the camera first.');
          return;
        }

        if (!selectedExpression) {
          showError('No expression selected. Please select an expression first.');
          return;
        }

        if (!currentDetectionRef.current) {
          showError('No face detected. Please ensure your face is visible to the camera.');
          return;
        }

        // All checks passed, capture the facial data
        captureFacialData();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cameraActive, selectedExpression]);

  // Show error notification
  const showError = (message) => {
    // Clear existing timeout if any
    if (errorNotificationTimeoutRef.current) {
      clearTimeout(errorNotificationTimeoutRef.current);
    }

    setErrorNotification(message);
    errorNotificationTimeoutRef.current = setTimeout(() => {
      setErrorNotification(null);
      errorNotificationTimeoutRef.current = null;
    }, 3000);
  };

  // Capture and save facial data
  const captureFacialData = () => {
    if (!currentDetectionRef.current || !selectedExpression) return;

    const detection = currentDetectionRef.current;
    const landmarks = detection.landmarks;
    const expressions = detection.expressions;

    // Calculate useful metrics
    const mouthRatio = calculateMouthRatio(landmarks);
    const eyeRatio = calculateEyeRatio(landmarks);
    const eyebrowDistance = calculateEyebrowDistance(landmarks);

    const facialData = {
      expression: selectedExpression,
      timestamp: new Date().toISOString(),
      mouthRatio,
      eyeRatio,
      eyebrowDistance,
      expressions,
      landmarks: landmarks.positions.map(p => ({ x: p.x, y: p.y }))
    };

    // Save to calibration data
    const newCalibrationData = {
      ...calibrationData,
      [selectedExpression]: facialData
    };

    setCalibrationData(newCalibrationData);
    localStorage.setItem('nailongify_calibration', JSON.stringify(newCalibrationData));

    console.log(`✓ Captured ${selectedExpression}: MR=${mouthRatio.toFixed(3)}, ER=${eyeRatio.toFixed(3)}, ED=${eyebrowDistance.toFixed(2)}`);

    // Show capture notification
    const memeName = memes.find(m => m.id === selectedExpression)?.name || selectedExpression;

    // Clear existing timeout if any
    if (captureNotificationTimeoutRef.current) {
      clearTimeout(captureNotificationTimeoutRef.current);
    }

    setCaptureNotification(memeName);

    // Hide notification after 3 seconds
    captureNotificationTimeoutRef.current = setTimeout(() => {
      setCaptureNotification(null);
      captureNotificationTimeoutRef.current = null;
    }, 3000);
  };

  // Helper functions to calculate metrics
  const calculateMouthRatio = (landmarks) => {
    const points = landmarks.positions;
    const upperLipTop = points[51];
    const lowerLipBottom = points[57];
    const leftCorner = points[48];
    const rightCorner = points[54];

    const mouthHeight = Math.abs(lowerLipBottom.y - upperLipTop.y);
    const mouthWidth = Math.abs(rightCorner.x - leftCorner.x);

    return mouthHeight / mouthWidth;
  };

  const calculateEyeRatio = (landmarks) => {
    const points = landmarks.positions;

    // Left eye
    const leftVertical1 = Math.abs(points[37].y - points[41].y);
    const leftVertical2 = Math.abs(points[38].y - points[40].y);
    const leftHorizontal = Math.abs(points[39].x - points[36].x);
    const leftEAR = (leftVertical1 + leftVertical2) / (2 * leftHorizontal);

    // Right eye
    const rightVertical1 = Math.abs(points[43].y - points[47].y);
    const rightVertical2 = Math.abs(points[44].y - points[46].y);
    const rightHorizontal = Math.abs(points[45].x - points[42].x);
    const rightEAR = (rightVertical1 + rightVertical2) / (2 * rightHorizontal);

    return (leftEAR + rightEAR) / 2;
  };

  const calculateEyebrowDistance = (landmarks) => {
    const points = landmarks.positions;

    const leftBrowCenter = points[19];
    const leftEyeTop = points[37];
    const rightBrowCenter = points[24];
    const rightEyeTop = points[43];

    const leftDistance = Math.abs(leftBrowCenter.y - leftEyeTop.y);
    const rightDistance = Math.abs(rightBrowCenter.y - rightEyeTop.y);

    return (leftDistance + rightDistance) / 2;
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

  // Export calibration data
  const exportCalibration = () => {
    // Merge original facialData with new calibrationData
    // Original data is the base, calibrationData overrides any recalibrated expressions
    const mergedData = {
      ...facialData,
      ...calibrationData
    };

    const dataStr = JSON.stringify(mergedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'facialdata.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear calibration data
  const clearCalibration = () => {
    if (confirm('Clear all calibration data?')) {
      setCalibrationData({});
      localStorage.removeItem('nailongify_calibration');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      // Clear any pending timeouts
      if (captureNotificationTimeoutRef.current) {
        clearTimeout(captureNotificationTimeoutRef.current);
      }
      if (errorNotificationTimeoutRef.current) {
        clearTimeout(errorNotificationTimeoutRef.current);
      }
    };
  }, []);

  const selectedMeme = memes.find(m => m.id === selectedExpression);

  return (
    <div className="calibration-mode">
      <div className="calibration-header">
        <h2>Calibration Mode</h2>
        <p>Click an expression below to calibrate, then press SPACE to capture</p>
        <div className="calibration-header-actions">
          <button onClick={onBack} className="btn-secondary">
            Back to App
          </button>
          <button onClick={exportCalibration} className="btn-primary">
            📥 Export All Data
          </button>
        </div>
      </div>

      <div className="calibration-main">
        {/* Expression Grid */}
        <div className="expression-grid">
          <h3>Select Expression ({Object.keys(calibrationData).length}/{memes.length} captured)</h3>
          <div className="expression-cards">
            {memes.map(meme => (
              <div
                key={meme.id}
                className={`expression-card ${selectedExpression === meme.id ? 'selected' : ''} ${calibrationData[meme.id] ? 'calibrated' : ''}`}
                onClick={() => setSelectedExpression(meme.id)}
              >
                <img src={meme.path} alt={meme.name} className="expression-img" />
                <div className="expression-name">{meme.name}</div>
                {calibrationData[meme.id] && (
                  <div className="calibrated-badge">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Camera and Reference Display */}
        <div className="calibration-workspace">
          <div className="calibration-video-section">
            <h3>Your Face</h3>
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
              {!cameraActive && (
                <div className="video-placeholder">
                  <p>Camera not active</p>
                </div>
              )}
            </div>

            <div className="webcam-controls">
              {!cameraActive ? (
                <button onClick={startCamera} className="btn-primary">
                  Start Camera
                </button>
              ) : (
                <button onClick={stopCamera} className="btn-secondary">
                  Stop Camera
                </button>
              )}
            </div>

            {cameraActive && detecting && (
              <div className="status-indicator">
                <span className="status-dot"></span>
                Detecting...
              </div>
            )}
          </div>

          {/* Reference Meme Display */}
          {selectedMeme && (
            <div className="reference-display">
              <h3>Match This Expression</h3>
              <div className="reference-meme-container">
                <img src={selectedMeme.path} alt={selectedMeme.name} className="reference-meme" />
                <div className="reference-name">{selectedMeme.name}</div>
              </div>
              {cameraActive && (
                <div className="capture-instruction">
                  <p className="instruction-text">
                    Press <kbd>SPACE</kbd> to capture
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Capture Notification Toast */}
      {captureNotification && (
        <div className="capture-notification">
          <div className="capture-notification-content">
            <span className="capture-notification-icon">✓</span>
            <span className="capture-notification-text">
              Calibrated <strong>{captureNotification}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Error Notification Toast */}
      {errorNotification && (
        <div className="error-notification">
          <div className="error-notification-content">
            <span className="error-notification-icon">✕</span>
            <span className="error-notification-text">
              {errorNotification}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalibrationMode;
