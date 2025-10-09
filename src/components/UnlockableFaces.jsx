import { useEffect, useState } from 'react';

function UnlockableFaces({ memes, unlockedFaces, holdProgress, timerStarted, onStartTimer }) {
  const [showConfetti, setShowConfetti] = useState(false);

  // Expression order for display
  const expressionOrder = [
    'smirk',
    'smiling',
    'winking',
    'cry',
    'angry',
    'woah-woah-woah',
    'geeked',
    'off-the-deep-end'
  ];

  // Check if all faces are unlocked
  useEffect(() => {
    const allUnlocked = expressionOrder.every(expr => unlockedFaces[expr]);
    if (allUnlocked && !showConfetti) {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      const timeout = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [unlockedFaces, showConfetti]);

  return (
    <div className="unlockable-faces">
      {showConfetti && <Confetti />}

      {!timerStarted && (
        <div className="start-button-overlay">
          <button className="btn-start-timer-overlay" onClick={onStartTimer}>
            ⏱️ START TIMER!
          </button>
        </div>
      )}

      <div className="faces-container">
        {expressionOrder.map(expressionId => {
          const meme = memes.find(m => m.id === expressionId);
          if (!meme) return null;

          const isUnlocked = unlockedFaces[expressionId];
          const progress = holdProgress[expressionId] || 0;

          return (
            <div key={expressionId} className="unlockable-face">
              <div className={`face-image ${!isUnlocked ? 'locked' : 'unlocked'}`}>
                <img src={meme.path} alt={meme.name} />
                {!isUnlocked && <div className="blur-overlay" />}
                {!isUnlocked && progress > 0 && (
                  <div className="progress-ring">
                    <svg width="60" height="60">
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke="#ff6b9d"
                        strokeWidth="4"
                        strokeDasharray={`${progress * 157} 157`}
                        transform="rotate(-90 30 30)"
                      />
                    </svg>
                  </div>
                )}
                {isUnlocked && (
                  <div className="unlock-badge">✓</div>
                )}
              </div>
              <div className="face-label">{expressionId.replace(/-/g, ' ')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Confetti() {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    // Generate confetti pieces
    const newPieces = [];
    for (let i = 0; i < 100; i++) {
      newPieces.push({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 3,
        backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
      });
    }
    setPieces(newPieces);
  }, []);

  return (
    <div className="confetti-container">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.animationDelay}s`,
            backgroundColor: piece.backgroundColor
          }}
        />
      ))}
    </div>
  );
}

export default UnlockableFaces;
