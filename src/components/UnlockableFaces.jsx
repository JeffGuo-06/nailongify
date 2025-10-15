import { useEffect, useState, useRef } from 'react';

function UnlockableFaces({ memes, unlockedFaces, holdProgress }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState({});
  const previouslyUnlockedRef = useRef({});

  // Expression order for display
  const expressionOrder = [
    'smirk',
    'smiling',
    'sad',
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

  // Track newly unlocked faces for animation
  useEffect(() => {
    Object.keys(unlockedFaces).forEach(expr => {
      // Only trigger if this face just became unlocked and we haven't seen it before
      if (unlockedFaces[expr] && !previouslyUnlockedRef.current[expr]) {
        console.log('[UNLOCK ANIMATION] Just unlocked:', expr);

        // Mark as previously unlocked (permanent)
        previouslyUnlockedRef.current[expr] = true;

        // Trigger animation
        setNewlyUnlocked(prev => ({ ...prev, [expr]: true }));

        // Clear the animation flag after animation completes
        setTimeout(() => {
          setNewlyUnlocked(prev => ({ ...prev, [expr]: false }));
        }, 600);
      }
    });
  }, [unlockedFaces]);

  // Calculate unlocked count
  const unlockedCount = Object.keys(unlockedFaces).filter(key => unlockedFaces[key]).length;
  const totalCount = expressionOrder.length;

  return (
    <div className="unlockable-faces">
      {showConfetti && <Confetti />}

      <div className="faces-container">
        {expressionOrder.map(expressionId => {
          const meme = memes.find(m => m.id === expressionId);
          if (!meme) return null;

          const isUnlocked = unlockedFaces[expressionId];
          const progress = holdProgress[expressionId] || 0;

          return (
            <div key={expressionId} className="unlockable-face">
              <div className={`face-image ${!isUnlocked ? 'locked' : 'unlocked'} ${newlyUnlocked[expressionId] ? 'just-unlocked' : ''}`}>
                <img src={meme.path} alt={meme.name} />
                {!isUnlocked && <div className="blur-overlay" />}
                {!isUnlocked && progress > 0 && (
                  <div className="progress-ring">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path
                        d="M 10,2 L 90,2 Q 98,2 98,10 L 98,90 Q 98,98 90,98 L 10,98 Q 2,98 2,90 L 2,10 Q 2,2 10,2"
                        fill="none"
                        stroke="#ffd414ff"
                        strokeWidth="7"
                        strokeDasharray={`${progress * 372} 372`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
                {isUnlocked && (
                  <div className="unlock-badge">✓</div>
                )}
              </div>
              <div className="face-label">{meme.name}</div>
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
