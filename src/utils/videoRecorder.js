/**
 * Video Recording Utility
 *
 * Records the game area (UnlockableFaces, WebcamCapture + Timer, MemeDisplay)
 * Composites them into a 720p canvas at 15fps and plays back at 2x speed via playbackRate
 */

// Configuration constants
export const MAX_VIDEO_DURATION_SECONDS = 300; // Maximum game time in seconds for uploadable videos (checked against completionTime, not video metadata)
export const VIDEO_PLAYBACK_SPEED = 2.0; // Playback speed multiplier (2.0 = 2x speed)
// Note: A 60 second game time limit with 2x playback means the video will appear to be 30 seconds long when played

export class GameRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.isRecording = false;
    this.stream = null;

    // Canvas dimensions (720p - 1280x720)
    this.width = 1280;
    this.height = 720;

    // For 2x speed: record at 15fps instead of 30fps
    this.fps = 15;
    this.frameInterval = 1000 / this.fps;
    this.lastFrameTime = 0;
  }

  /**
   * Initialize the canvas for recording
   */
  initCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d", {
      willReadFrequently: true,
      alpha: false,
    });
    console.log(
      "[VIDEO RECORDER] Canvas initialized:",
      this.width,
      "x",
      this.height
    );
  }

  /**
   * Start recording the game area
   * @param {Object} data - Recording data
   * @param {HTMLVideoElement} data.videoElement - The webcam video element
   * @param {string} data.currentMemeImage - Current meme image URL
   * @param {number} data.similarity - Match similarity percentage
   * @param {Object} data.unlockedFaces - Object with unlocked faces
   * @param {Array} data.memes - Array of all memes
   * @param {Function} data.getElapsedTime - Function to get current elapsed time
   */
  async startRecording(data) {
    console.log("[VIDEO RECORDER] Starting recording...");

    if (this.isRecording) {
      console.warn("[VIDEO RECORDER] Already recording");
      return;
    }

    this.initCanvas();
    this.recordedChunks = [];
    this.isRecording = true;
    this.lastFrameTime = performance.now();
    this.startTime = Date.now();

    // Store data for compositing
    this.recordingData = data;

    // Preload meme images for faster rendering
    this.memeImages = {};
    await this.preloadMemeImages(data.memes);

    // Start capturing frames
    this.captureFrame();

    // Create stream from canvas
    this.stream = this.canvas.captureStream(this.fps);

    // Setup MediaRecorder
    const options = {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
    };

    // Fallback to vp8 if vp9 not supported
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = "video/webm;codecs=vp8";
      console.log("[VIDEO RECORDER] VP9 not supported, using VP8");
    }

    this.mediaRecorder = new MediaRecorder(this.stream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error("[VIDEO RECORDER] MediaRecorder error:", event);
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
    console.log("[VIDEO RECORDER] Recording started");
  }

  /**
   * Preload all meme images for faster rendering
   */
  async preloadMemeImages(memes) {
    const promises = memes.map((meme) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.memeImages[meme.id] = img;
          resolve();
        };
        img.onerror = () => resolve(); // Continue even if image fails
        img.src = meme.path;
      });
    });

    await Promise.all(promises);
    console.log(
      "[VIDEO RECORDER] Preloaded",
      Object.keys(this.memeImages).length,
      "meme images"
    );
  }

  /**
   * Capture a single frame and composite all elements
   */
  captureFrame = () => {
    if (!this.isRecording) return;

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    // Only capture frame if enough time has passed (for target FPS)
    if (elapsed >= this.frameInterval) {
      this.lastFrameTime = now;
      this.compositeFrame();
    }

    // Continue capture loop
    this.animationId = requestAnimationFrame(this.captureFrame);
  };

  /**
   * Composite all game elements into a single frame
   */
  compositeFrame() {
    if (!this.ctx || !this.recordingData) return;

    const {
      videoElement,
      unlockedFaces,
      memes,
      getElapsedTime,
      holdProgress,
      currentMatch,
    } = this.recordingData;

    // Clear canvas with gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#f8f9fa");
    gradient.addColorStop(1, "#ffffff");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    try {
      const padding = 20;
      const topSectionHeight = 100; // For unlockable faces

      // Calculate layout
      const contentTop = topSectionHeight + padding * 2;
      const contentHeight = this.height - contentTop - padding;
      const contentWidth = this.width - padding * 2;

      // Split content area into left (webcam) and right (meme)
      const halfWidth = contentWidth / 2 - padding / 2;

      // 1. Draw UnlockableFaces at top
      this.drawUnlockableFaces(
        padding,
        padding,
        contentWidth,
        topSectionHeight,
        memes,
        unlockedFaces,
        holdProgress
      );

      // 2. Draw Webcam Section (left side) with video and timer overlay
      this.drawWebcamSection(
        padding,
        contentTop,
        halfWidth,
        contentHeight,
        videoElement,
        getElapsedTime
      );

      // 3. Draw Meme Section (right side)
      this.drawMemeSection(
        padding + halfWidth + padding,
        contentTop,
        halfWidth,
        contentHeight,
        currentMatch
      );
    } catch (err) {
      console.error("[VIDEO RECORDER] Error compositing frame:", err);
    }
  }

  /**
   * Draw unlockable faces section at top
   */
  drawUnlockableFaces(x, y, width, height, memes, unlockedFaces, holdProgress) {
    const faceSize = 80;
    const faceGap = 10;
    const totalWidth = (faceSize + faceGap) * 8 - faceGap;
    const startX = x + (width - totalWidth) / 2;

    const expressionOrder = [
      "smirk",
      "smiling",
      "sad",
      "cry",
      "angry",
      "woah-woah-woah",
      "geeked",
      "off-the-deep-end",
    ];

    expressionOrder.forEach((expressionId, index) => {
      const faceX = startX + index * (faceSize + faceGap);
      const faceY = y;

      const meme = memes.find((m) => m.id === expressionId);
      if (!meme) return;

      const isUnlocked = unlockedFaces[expressionId];
      const progress = holdProgress?.[expressionId] || 0;

      // Draw face background
      this.ctx.fillStyle = "#ffffff";
      this.roundRect(faceX, faceY, faceSize, faceSize, 8, true, false);

      // Draw meme image
      const img = this.memeImages[expressionId];
      if (img) {
        this.ctx.save();
        this.ctx.globalAlpha = isUnlocked ? 1 : 0.3;
        this.ctx.drawImage(
          img,
          faceX + 5,
          faceY + 5,
          faceSize - 10,
          faceSize - 10
        );
        this.ctx.restore();
      }

      // Draw progress ring if not unlocked
      if (!isUnlocked && progress > 0) {
        this.ctx.strokeStyle = "#ffd414ff";
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = "round";

        this.ctx.beginPath();
        this.ctx.arc(
          faceX + faceSize / 2,
          faceY + faceSize / 2,
          faceSize / 2 - 2,
          -Math.PI / 2,
          -Math.PI / 2 + 2 * Math.PI * progress,
          false
        );
        this.ctx.stroke();
      }

      // Draw checkmark if unlocked
      if (isUnlocked) {
        this.ctx.fillStyle = "#4ade80";
        this.ctx.font = "bold 24px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("✓", faceX + faceSize / 2, faceY + faceSize / 2);
      }
    });
  }

  /**
   * Draw webcam section with video and timer
   */
  drawWebcamSection(x, y, width, height, videoElement, getElapsedTime) {
    // Draw section background
    this.ctx.fillStyle = "#ffffff";
    this.roundRect(x, y, width, height, 12, true, false);

    // Draw title
    this.ctx.fillStyle = "#333";
    this.ctx.font = "bold 24px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Your Face", x + width / 2, y + 30);

    // Calculate video area
    const videoAreaY = y + 50;
    const videoAreaHeight = height - 60;

    // Draw video if available
    if (videoElement && videoElement.readyState >= 2) {
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;

      // Calculate scaling to fit
      const scale = Math.min(width / videoWidth, videoAreaHeight / videoHeight);
      const scaledWidth = videoWidth * scale;
      const scaledHeight = videoHeight * scale;

      const videoX = x + (width - scaledWidth) / 2;
      const videoY = videoAreaY + (videoAreaHeight - scaledHeight) / 2;

      // Draw video (flipped horizontally like a mirror)
      this.ctx.save();
      this.ctx.translate(videoX + scaledWidth, videoY);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(videoElement, 0, 0, scaledWidth, scaledHeight);
      this.ctx.restore();

      // Draw timer overlay in top-left of video
      if (getElapsedTime) {
        const elapsed = getElapsedTime();
        const timeString = this.formatTime(elapsed);

        const timerPadding = 10;
        const timerX = videoX + timerPadding;
        const timerY = videoY + timerPadding;

        // Timer background
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        this.ctx.fillRect(timerX, timerY, 120, 35);

        // Timer text
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 18px monospace";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";
        this.ctx.fillText("⏱️ " + timeString, timerX + 5, timerY + 8);
      }
    }
  }

  /**
   * Draw meme section
   */
  drawMemeSection(x, y, width, height, currentMatch) {
    // Draw section background
    this.ctx.fillStyle = "#ffffff";
    this.roundRect(x, y, width, height, 12, true, false);

    // Draw title
    this.ctx.fillStyle = "#333";
    this.ctx.font = "bold 24px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Your Nailong Match", x + width / 2, y + 30);

    if (!currentMatch || !currentMatch.meme) {
      // Draw placeholder
      this.ctx.fillStyle = "#999";
      this.ctx.font = "16px sans-serif";
      this.ctx.fillText(
        "Make a face to find your match!",
        x + width / 2,
        y + height / 2
      );
      return;
    }

    // Calculate meme area
    const memeAreaY = y + 60;
    const memeAreaHeight = height - 150;
    const memeSize = Math.min(width - 40, memeAreaHeight);
    const memeX = x + (width - memeSize) / 2;
    const memeY = memeAreaY + (memeAreaHeight - memeSize) / 2;

    // Draw meme image
    const img = this.memeImages[currentMatch.meme.id];
    if (img) {
      this.ctx.drawImage(img, memeX, memeY, memeSize, memeSize);
    }

    // Draw meme info at bottom
    const infoY = y + height - 80;

    // Meme name
    this.ctx.fillStyle = "#333";
    this.ctx.font = "bold 20px sans-serif";
    this.ctx.fillText(currentMatch.meme.name, x + width / 2, infoY);

    // Expression label
    this.ctx.fillStyle = "#666";
    this.ctx.font = "16px sans-serif";
    this.ctx.fillText(currentMatch.meme.expression, x + width / 2, infoY + 25);

    // Similarity bar
    const barWidth = width - 80;
    const barHeight = 20;
    const barX = x + 40;
    const barY = infoY + 40;

    // Background
    this.ctx.fillStyle = "#e5e7eb";
    this.roundRect(barX, barY, barWidth, barHeight, 10, true, false);

    // Fill
    const fillWidth = (barWidth * currentMatch.similarity) / 100;
    this.ctx.fillStyle = "#ff6b9d";
    this.roundRect(barX, barY, fillWidth, barHeight, 10, true, false);

    // Percentage text
    this.ctx.fillStyle = "#333";
    this.ctx.font = "bold 14px sans-serif";
    this.ctx.fillText(
      `${currentMatch.similarity}% Match`,
      x + width / 2,
      barY + 15
    );
  }

  /**
   * Helper to draw rounded rectangle
   */
  roundRect(x, y, width, height, radius, fill, stroke) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();

    if (fill) this.ctx.fill();
    if (stroke) this.ctx.stroke();
  }

  /**
   * Format time in MM:SS.ms format
   */
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
    }
    return `${remainingSeconds}.${milliseconds.toString().padStart(2, "0")}s`;
  }

  /**
   * Stop recording and return the video blob
   * @returns {Promise<{blob: Blob, duration: number}>}
   */
  async stopRecording() {
    console.log("[VIDEO RECORDER] Stopping recording...");

    if (!this.isRecording) {
      console.warn("[VIDEO RECORDER] Not currently recording");
      return null;
    }

    this.isRecording = false;

    // Stop animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Stop stream tracks
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    // Stop MediaRecorder and wait for final data
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No media recorder"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        console.log("[VIDEO RECORDER] Recording stopped, creating blob...");

        if (this.recordedChunks.length === 0) {
          reject(new Error("No recorded data"));
          return;
        }

        const blob = new Blob(this.recordedChunks, { type: "video/webm" });
        const duration = this.calculateDuration();

        console.log("[VIDEO RECORDER] Video blob created:", {
          size: blob.size,
          type: blob.type,
          duration: duration,
        });

        resolve({ blob, duration });
      };

      this.mediaRecorder.onerror = (event) => {
        console.error("[VIDEO RECORDER] Error on stop:", event);
        reject(event);
      };

      // Stop the recorder
      if (this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
    });
  }

  /**
   * Calculate actual video duration based on recording time
   */
  calculateDuration() {
    if (!this.startTime) {
      console.warn("[VIDEO RECORDER] No start time recorded");
      return 0;
    }

    const endTime = Date.now();
    const durationMs = endTime - this.startTime;
    const durationSeconds = durationMs / 1000;

    console.log("[VIDEO RECORDER] Calculated duration:", {
      startTime: this.startTime,
      endTime: endTime,
      durationMs: durationMs,
      durationSeconds: durationSeconds,
    });

    return durationSeconds;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.isRecording) {
      this.stopRecording();
    }

    this.recordedChunks = [];
    this.canvas = null;
    this.ctx = null;
    this.elements = null;
    this.stream = null;
    this.mediaRecorder = null;
  }
}

/**
 * Convert video blob to 2x speed
 * Since we recorded at 15fps, playing at 30fps gives us 2x speed naturally
 * This function creates a video element that can be used for preview
 */
export function createVideoPreview(blob) {
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.src = url;
  video.controls = true;
  video.playbackRate = 1.0; // Normal playback because we recorded at half speed
  return { video, url };
}
