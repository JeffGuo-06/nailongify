import { useState, useEffect, useRef } from 'react';
import { submitLeaderboardEntry, getPlayerRank, uploadCaptureImage } from '../lib/leaderboard';

function EndScreen({ captures, completionTime, onRestart, onViewLeaderboard }) {
  const [compositeGraphics, setCompositeGraphics] = useState([]);
  const [loading, setLoading] = useState(true);
  const downloadTimeoutsRef = useRef([]);

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);

  // Leaderboard state
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [playerRank, setPlayerRank] = useState(null);

  useEffect(() => {
    console.log('[END SCREEN DEBUG] captures:', captures);
    console.log('[END SCREEN DEBUG] captures.length:', captures?.length);
    console.log('[END SCREEN DEBUG] completionTime:', completionTime);

    // Generate all composite graphics
    if (captures && captures.length > 0) {
      generateAllComposites();
    }
  }, [captures, completionTime]);

  const generateCompositeGraphic = async (capture) => {
    console.log('[COMPOSITE DEBUG] Generating graphic for:', capture.expressionId);
    console.log('[COMPOSITE DEBUG] memePath:', capture.memePath);
    console.log('[COMPOSITE DEBUG] imageData length:', capture.imageData?.length);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Canvas dimensions - scaled to 0.48x (0.6 × 0.8)
    const width = 672;
    const height = 384;
    const padding = 29;
    const imageSize = 216;
    const gap = 38;

    canvas.width = width;
    canvas.height = height;

    // Background - white with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8f9fa');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Title "Nailongify" with better styling (scaled to 0.48x)
    ctx.fillStyle = '#ff6b9d';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nailongify', width / 2, 48);

    try {
      // Load user capture
      const userImg = new Image();
      await new Promise((resolve, reject) => {
        userImg.onload = () => {
          console.log('[COMPOSITE DEBUG] User image loaded successfully');
          resolve();
        };
        userImg.onerror = (e) => {
          console.error('[COMPOSITE DEBUG] User image failed to load:', e);
          reject(e);
        };
        userImg.src = capture.imageData;
      });

      // Load meme image - ensure it's a proper path
      if (!capture.memePath) {
        console.error('[COMPOSITE DEBUG] memePath is undefined! Cannot load meme image');
        throw new Error('memePath is undefined');
      }

      const memeImg = new Image();
      const memePath = capture.memePath.startsWith('/') ? capture.memePath : `/${capture.memePath}`;
      console.log('[COMPOSITE DEBUG] Loading meme from:', memePath);

      await new Promise((resolve, reject) => {
        memeImg.onload = () => {
          console.log('[COMPOSITE DEBUG] Meme image loaded successfully');
          resolve();
        };
        memeImg.onerror = (e) => {
          console.error('[COMPOSITE DEBUG] Meme image failed to load from:', memePath, e);
          reject(e);
        };
        memeImg.src = memePath;
      });

      const imageY = 77;
      const leftImageX = (width / 2) - (imageSize + gap / 2);
      const rightImageX = (width / 2) + (gap / 2);

      // Draw white rounded rect backgrounds for images
      const drawRoundedRect = (x, y, w, h, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      // Draw shadow for left image (scaled to 0.48x)
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(leftImageX - 7, imageY - 7, imageSize + 14, imageSize + 14, 10);
      ctx.fill();
      ctx.restore();

      // Draw user capture on left (flip horizontal, rounded)
      ctx.save();
      drawRoundedRect(leftImageX, imageY, imageSize, imageSize, 7);
      ctx.clip();
      ctx.translate(leftImageX + imageSize, imageY);
      ctx.scale(-1, 1);
      ctx.drawImage(userImg, 0, 0, imageSize, imageSize);
      ctx.restore();

      // Draw shadow for right image (scaled to 0.48x)
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(rightImageX - 7, imageY - 7, imageSize + 14, imageSize + 14, 10);
      ctx.fill();
      ctx.restore();

      // Draw meme image on right (rounded)
      ctx.save();
      drawRoundedRect(rightImageX, imageY, imageSize, imageSize, 7);
      ctx.clip();
      ctx.drawImage(memeImg, rightImageX, imageY, imageSize, imageSize);
      ctx.restore();

      // Draw labels with better styling (scaled to 0.48x)
      const labelY = imageY + imageSize + 24;

      // User label
      ctx.fillStyle = '#6c757d';
      ctx.font = '600 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Your Face', leftImageX + imageSize / 2, labelY);

      // Meme label with name
      ctx.fillStyle = '#6c757d';
      ctx.font = '600 14px sans-serif';
      ctx.fillText(capture.expressionName.toUpperCase(), rightImageX + imageSize / 2, labelY);

      // Similarity score with background badge (scaled to 0.48x)
      const badgeY = height - 48;
      const badgeWidth = 168;
      const badgeHeight = 38;
      const badgeX = width / 2 - badgeWidth / 2;

      // Draw badge background with gradient
      ctx.save();
      const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY + badgeHeight);
      badgeGradient.addColorStop(0, '#ff6b9d');
      badgeGradient.addColorStop(1, '#ff4581');
      ctx.fillStyle = badgeGradient;
      ctx.shadowColor = 'rgba(255, 107, 157, 0.4)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 2;
      drawRoundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 7);
      ctx.fill();
      ctx.restore();

      // Draw similarity text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 25px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(capture.similarity)}% Match`, width / 2, badgeY + 27);

      return {
        dataUrl: canvas.toDataURL('image/png'),
        capture: capture
      };
    } catch (error) {
      console.error('Error creating composite for', capture.expressionId, error);
      return null;
    }
  };

  const generateAllCapturesComposite = async (captures) => {
    console.log('[ALL CAPTURES DEBUG] Generating grid composite for', captures.length, 'captures');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Canvas dimensions for 4x4 grid layout (4 rows, 4 columns) - scaled to 0.48x (0.6 × 0.8)
    // Each row has 2 pairs: [User][Nailong] [User][Nailong]
    const imageSize = 134;
    const gap = 7;
    const pairGap = 19; // Larger gap between pairs
    const padding = 29;
    const rows = 4;
    const cols = 4;

    const width = (imageSize * cols) + (gap * 2) + (pairGap) + (padding * 2);
    const height = (imageSize * rows) + (gap * (rows - 1)) + (padding * 2) + 48; // Extra space for title

    canvas.width = width;
    canvas.height = height;

    // Background - white with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8f9fa');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Title "Nailongify" with better styling (scaled to 0.48x)
    ctx.fillStyle = '#ff6b9d';
    ctx.font = 'bold 27px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nailongify', width / 2, 34);

    // Helper function for rounded rectangles
    const drawRoundedRect = (x, y, w, h, radius) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    try {
      // Load all images first
      const loadedImages = [];

      for (const capture of captures) {
        // Load user image
        const userImg = new Image();
        await new Promise((resolve, reject) => {
          userImg.onload = resolve;
          userImg.onerror = reject;
          userImg.src = capture.imageData;
        });

        // Load meme image
        const memeImg = new Image();
        const memePath = capture.memePath.startsWith('/') ? capture.memePath : `/${capture.memePath}`;
        await new Promise((resolve, reject) => {
          memeImg.onload = resolve;
          memeImg.onerror = reject;
          memeImg.src = memePath;
        });

        loadedImages.push({
          userImg,
          memeImg,
          expressionName: capture.expressionName,
          similarity: capture.similarity
        });
      }

      // Draw grid: 4 rows x 4 columns (scaled to 0.48x)
      // Each row has 2 pairs: [User][Nailong] [User][Nailong]
      loadedImages.forEach((images, index) => {
        const pairIndex = Math.floor(index / 2); // 0-3 (which pair in the grid)
        const isFirstPair = index % 2 === 0; // Left pair or right pair

        const row = pairIndex; // 0-3
        const startY = padding + 48 + (row * (imageSize + gap));

        // Calculate X positions
        let userX, memeX;
        if (isFirstPair) {
          // First pair: left side
          userX = padding;
          memeX = padding + imageSize + gap;
        } else {
          // Second pair: right side
          userX = padding + imageSize + gap + imageSize + pairGap;
          memeX = padding + imageSize + gap + imageSize + pairGap + imageSize + gap;
        }

        // Draw user face with shadow (scaled to 0.48x)
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 7;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#ffffff';
        drawRoundedRect(userX - 2, startY - 2, imageSize + 4, imageSize + 4, 5);
        ctx.fill();
        ctx.restore();

        // Draw user image (flipped)
        ctx.save();
        drawRoundedRect(userX, startY, imageSize, imageSize, 4);
        ctx.clip();
        ctx.translate(userX + imageSize, startY);
        ctx.scale(-1, 1);
        ctx.drawImage(images.userImg, 0, 0, imageSize, imageSize);
        ctx.restore();

        // Draw Nailong meme with shadow (scaled to 0.48x)
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 7;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#ffffff';
        drawRoundedRect(memeX - 2, startY - 2, imageSize + 4, imageSize + 4, 5);
        ctx.fill();
        ctx.restore();

        // Draw meme image
        ctx.save();
        drawRoundedRect(memeX, startY, imageSize, imageSize, 4);
        ctx.clip();
        ctx.drawImage(images.memeImg, memeX, startY, imageSize, imageSize);
        ctx.restore();
      });

      console.log('[ALL CAPTURES DEBUG] Grid composite generated successfully');

      return {
        dataUrl: canvas.toDataURL('image/png'),
        capture: { expressionId: 'all-captures', expressionName: 'All Expressions' }
      };
    } catch (error) {
      console.error('[ALL CAPTURES DEBUG] Error creating grid composite:', error);
      return null;
    }
  };

  const generateAllComposites = async () => {
    setLoading(true);
    const graphics = [];

    for (const capture of captures) {
      const graphic = await generateCompositeGraphic(capture);
      if (graphic) {
        graphics.push(graphic);
      }
    }

    // Generate the "all captures" grid composite if we have all 8 captures
    if (captures.length === 8) {
      const allCapturesGraphic = await generateAllCapturesComposite(captures);
      if (allCapturesGraphic) {
        graphics.push(allCapturesGraphic);
      }
    }

    setCompositeGraphics(graphics);
    setLoading(false);
    console.log('[END SCREEN DEBUG] Generated', graphics.length, 'composite graphics');
  };

  const formatTime = (ms) => {
    // Safety check - handle invalid or unreasonably large values
    if (!ms || ms < 0 || !isFinite(ms) || ms > 86400000) { // > 24 hours is unreasonable
      console.warn('[END SCREEN DEBUG] Invalid time value:', ms);
      return '0.00s';
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}.${milliseconds.toString().padStart(2, '0')}s`;
  };

  const handleDownload = (graphic) => {
    const link = document.createElement('a');
    link.download = `nailongify-${graphic.capture.expressionId}.png`;
    link.href = graphic.dataUrl;
    link.click();
  };

  const handleDownloadAll = () => {
    // Clear any existing download timeouts
    downloadTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    downloadTimeoutsRef.current = [];

    // Create new staggered downloads
    compositeGraphics.forEach((graphic, index) => {
      const timeout = setTimeout(() => {
        handleDownload(graphic);
      }, index * 200); // Stagger downloads by 200ms
      downloadTimeoutsRef.current.push(timeout);
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending download timeouts
      downloadTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      downloadTimeoutsRef.current = [];
    };
  }, []);

  // Remove emojis from text
  const removeEmojis = (text) => {
    // Remove emojis using regex - matches most emoji ranges
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu, '');
  };

  const handleSubmitToLeaderboard = async () => {
    if (!nickname.trim()) {
      setSubmitError('Please enter a nickname');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Find the "all captures" grid composite
      const allCapturesGraphic = compositeGraphics.find(
        g => g.capture.expressionId === 'all-captures'
      );

      let captureImageUrl = null;

      // Upload the grid composite if it exists
      if (allCapturesGraphic) {
        console.log('[SUBMIT] Uploading capture grid image...');
        const uploadResult = await uploadCaptureImage(
          allCapturesGraphic.dataUrl,
          nickname.trim()
        );

        if (uploadResult.success) {
          captureImageUrl = uploadResult.url;
          console.log('[SUBMIT] Image uploaded successfully:', captureImageUrl);
        } else {
          console.warn('[SUBMIT] Failed to upload image:', uploadResult.error);
          // Continue with submission even if image upload fails
        }
      }

      // Submit to leaderboard with the image URL
      const result = await submitLeaderboardEntry(
        nickname.trim(),
        completionTime,
        captureImageUrl
      );

      if (result.success) {
        setSubmitted(true);
        // Get player's rank
        const rankResult = await getPlayerRank(completionTime);
        if (rankResult.success) {
          setPlayerRank(rankResult.rank);
        }
        // Navigate to leaderboard after successful submission
        setTimeout(() => {
          onViewLeaderboard();
        }, 1500); // Show success message for 1.5s before navigating
      } else {
        setSubmitError(result.error || 'Failed to submit to leaderboard');
      }
    } catch (err) {
      console.error('[SUBMIT] Unexpected error:', err);
      setSubmitError('An unexpected error occurred');
    }

    setSubmitting(false);
  };

  // Carousel navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? compositeGraphics.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === compositeGraphics.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="end-screen">
      <div className="end-screen-content">
        <div className="end-header">
          <h1 className="end-title">Challenge Complete!</h1>
        </div>

        {loading ? (
          <div className="loading-graphics">
            <div className="spinner"></div>
            <p>Generating your graphics...</p>
          </div>
        ) : compositeGraphics.length > 0 ? (
          <>
            <div className="capture-carousel">
              <div className="carousel-content">
                {compositeGraphics.length > 1 && (
                  <button
                    className="carousel-btn"
                    onClick={goToPrevious}
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                )}

                <div className="carousel-image-container carousel-card">
                  <img
                    src={compositeGraphics[currentIndex].dataUrl}
                    alt={compositeGraphics[currentIndex].capture.expressionName}
                    className="carousel-image"
                  />
                  <button
                    className="btn-download-graphic"
                    onClick={() => handleDownload(compositeGraphics[currentIndex])}
                    title="Download this graphic"
                  >
                    Download
                  </button>
                </div>

                {compositeGraphics.length > 1 && (
                  <button
                    className="carousel-btn"
                    onClick={goToNext}
                    aria-label="Next"
                  >
                    ›
                  </button>
                )}
              </div>

              {compositeGraphics.length > 1 && (
                <div className="carousel-dots">
                  {compositeGraphics.map((_, index) => (
                    <button
                      key={index}
                      className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard submission form */}
            {!submitted ? (
              <div className="leaderboard-submit">
                <h3>Submit to Global Leaderboard - Time: <span className="time-display">{formatTime(completionTime)}</span></h3>
                <div className="submit-form">
                  <input
                    type="text"
                    placeholder="Enter nickname (max 20 chars)"
                    value={nickname}
                    onChange={(e) => setNickname(removeEmojis(e.target.value).slice(0, 20))}
                    maxLength={20}
                    disabled={submitting}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitToLeaderboard()}
                  />
                  <button
                    onClick={handleSubmitToLeaderboard}
                    disabled={submitting || !nickname.trim()}
                    className="btn-submit-leaderboard"
                  >
                    {submitting ? 'Submitting...' : 'Submit Score'}
                  </button>
                  <button className="btn-secondary" onClick={onRestart}>
                    Try Again
                  </button>
                </div>
                {submitError && <p className="submit-error">{submitError}</p>}
              </div>
            ) : (
              <div className="leaderboard-success">
                <p className="success-message">Score submitted successfully!</p>
                {playerRank && <p className="rank-display">Your Rank: <strong>#{playerRank}</strong></p>}
                <button className="btn-secondary" onClick={onRestart}>
                  Try Again
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-captures-message">
            <p style={{ color: '#666', fontSize: '1.2rem', textAlign: 'center', padding: '2rem' }}>
              No captures were collected. Captures: {captures?.length || 0}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EndScreen;
