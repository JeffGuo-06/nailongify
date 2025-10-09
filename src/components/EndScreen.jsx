import { useState, useEffect, useRef } from 'react';
import { submitLeaderboardEntry, getPlayerRank } from '../lib/leaderboard';

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

    // Canvas dimensions - make it wider and more spacious
    const width = 1400;
    const height = 800;
    const padding = 60;
    const imageSize = 450;
    const gap = 80;

    canvas.width = width;
    canvas.height = height;

    // Background - white with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8f9fa');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Title "Nailongify" with better styling
    ctx.fillStyle = '#ff6b9d';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nailongify', width / 2, 100);

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

      const imageY = 160;
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

      // Draw shadow for left image
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(leftImageX - 15, imageY - 15, imageSize + 30, imageSize + 30, 20);
      ctx.fill();
      ctx.restore();

      // Draw user capture on left (flip horizontal, rounded)
      ctx.save();
      drawRoundedRect(leftImageX, imageY, imageSize, imageSize, 15);
      ctx.clip();
      ctx.translate(leftImageX + imageSize, imageY);
      ctx.scale(-1, 1);
      ctx.drawImage(userImg, 0, 0, imageSize, imageSize);
      ctx.restore();

      // Draw shadow for right image
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(rightImageX - 15, imageY - 15, imageSize + 30, imageSize + 30, 20);
      ctx.fill();
      ctx.restore();

      // Draw meme image on right (rounded)
      ctx.save();
      drawRoundedRect(rightImageX, imageY, imageSize, imageSize, 15);
      ctx.clip();
      ctx.drawImage(memeImg, rightImageX, imageY, imageSize, imageSize);
      ctx.restore();

      // Draw labels with better styling
      const labelY = imageY + imageSize + 50;

      // User label
      ctx.fillStyle = '#6c757d';
      ctx.font = '600 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Your Face', leftImageX + imageSize / 2, labelY);

      // Meme label with name
      ctx.fillStyle = '#6c757d';
      ctx.font = '600 28px sans-serif';
      ctx.fillText(capture.expressionName.toUpperCase(), rightImageX + imageSize / 2, labelY);

      // Similarity score with background badge
      const badgeY = height - 100;
      const badgeWidth = 350;
      const badgeHeight = 80;
      const badgeX = width / 2 - badgeWidth / 2;

      // Draw badge background with gradient
      ctx.save();
      const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY + badgeHeight);
      badgeGradient.addColorStop(0, '#ff6b9d');
      badgeGradient.addColorStop(1, '#ff4581');
      ctx.fillStyle = badgeGradient;
      ctx.shadowColor = 'rgba(255, 107, 157, 0.4)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 5;
      drawRoundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 15);
      ctx.fill();
      ctx.restore();

      // Draw similarity text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(capture.similarity)}% Match`, width / 2, badgeY + 57);

      return {
        dataUrl: canvas.toDataURL('image/png'),
        capture: capture
      };
    } catch (error) {
      console.error('Error creating composite for', capture.expressionId, error);
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

  const handleSubmitToLeaderboard = async () => {
    if (!nickname.trim()) {
      setSubmitError('Please enter a nickname');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const result = await submitLeaderboardEntry(nickname.trim(), completionTime);

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
        <h1 className="end-title">🏆 Challenge Complete!</h1>
        <p className="end-time">Your Time: <span className="time-display">{formatTime(completionTime)}</span></p>

        {/* Leaderboard submission form */}
        {!submitted ? (
          <div className="leaderboard-submit">
            <h3>Submit to Global Leaderboard</h3>
            <div className="submit-form">
              <input
                type="text"
                placeholder="Enter nickname (max 20 chars)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 20))}
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
            </div>
            {submitError && <p className="submit-error">{submitError}</p>}
          </div>
        ) : (
          <div className="leaderboard-success">
            <p className="success-message">✅ Score submitted successfully!</p>
            {playerRank && <p className="rank-display">Your Rank: <strong>#{playerRank}</strong></p>}
          </div>
        )}

        {loading ? (
          <div className="loading-graphics">
            <div className="spinner"></div>
            <p>Generating your graphics...</p>
          </div>
        ) : compositeGraphics.length > 0 ? (
          <>
            <div className="capture-carousel">
              <div className="carousel-header">
                <h2 className="carousel-title">
                  {compositeGraphics[currentIndex].capture.expressionName}
                </h2>
                <p className="carousel-counter">
                  {currentIndex + 1} / {compositeGraphics.length}
                </p>
              </div>

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
                    📥 Download
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

            <div className="end-actions">
              {compositeGraphics.length > 1 && (
                <button className="btn-primary" onClick={handleDownloadAll}>
                  📥 Download All ({compositeGraphics.length})
                </button>
              )}
              <button className="btn-secondary" onClick={onRestart}>
                🔄 Try Again
              </button>
            </div>
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
