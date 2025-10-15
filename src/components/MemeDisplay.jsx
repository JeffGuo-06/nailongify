import { useState, useEffect, useRef } from 'react';

function MemeDisplay({ match, justUnlockedExpression }) {
  const [displayedMatch, setDisplayedMatch] = useState(null);
  const [showUnlockPop, setShowUnlockPop] = useState(false);
  const previousUnlockRef = useRef(null);

  useEffect(() => {
    if (match) {
      setDisplayedMatch(match);
    }
  }, [match]);

  // Trigger pop animation when a face is unlocked and it matches current display
  useEffect(() => {
    if (justUnlockedExpression && justUnlockedExpression !== previousUnlockRef.current) {
      console.log('[MEME DISPLAY] Unlocked expression:', justUnlockedExpression);

      // Check if the currently displayed match is the one that was just unlocked
      if (displayedMatch && displayedMatch.expression === justUnlockedExpression) {
        console.log('[MEME DISPLAY] Triggering pop animation');
        setShowUnlockPop(true);

        // Clear animation after it completes
        setTimeout(() => {
          setShowUnlockPop(false);
        }, 600);
      }

      previousUnlockRef.current = justUnlockedExpression;
    }
  }, [justUnlockedExpression, displayedMatch]);

  if (!displayedMatch) {
    return (
      <div className="meme-display">
        <div className="meme-placeholder">
          <p>Make a face to find your Nailong match!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meme-display">
      <div className={`meme-card ${showUnlockPop ? 'unlock-pop' : ''}`}>
        <div className="meme-image-container">
          <img
            src={displayedMatch.meme.path}
            alt={displayedMatch.meme.name}
            className="meme-image"
          />
        </div>

        <div className="meme-info">
          <h3>{displayedMatch.meme.name}</h3>
          <p className="expression-label">{displayedMatch.meme.expression}</p>

          <div className="similarity-bar">
            <div className="similarity-label">
              <span>Match</span>
              <span className="similarity-percentage">
                {displayedMatch.similarity}%
              </span>
            </div>
            <div className="similarity-progress">
              <div
                className="similarity-fill"
                style={{ width: `${displayedMatch.similarity}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemeDisplay;
