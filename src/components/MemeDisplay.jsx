import { useState, useEffect } from 'react';

function MemeDisplay({ match }) {
  const [displayedMatch, setDisplayedMatch] = useState(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (match) {
      setIsNew(true);
      setDisplayedMatch(match);

      // Remove "new" animation after a short delay
      const timer = setTimeout(() => {
        setIsNew(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [match]);

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
    <div className={`meme-display ${isNew ? 'new-match' : ''}`}>
      <div className="meme-card">
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
