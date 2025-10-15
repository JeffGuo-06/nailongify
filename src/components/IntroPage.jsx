import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function IntroPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    setLoading(true);

    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately, we just wanted permission
      stream.getTracks().forEach(track => track.stop());

      // Navigate to the game page
      navigate('/game');
    } catch (err) {
      console.error('Camera permission denied:', err);
      alert('Camera permission is required to play. Please allow camera access and refresh the page.');
      setLoading(false);
    }
  };

  return (
    <div className="intro-page">
      <div className="intro-content">
        <div className="intro-header-section">
          <div className="intro-text">
            <h1>Welcome to Nailongify!</h1>
            <p className="intro-description">
              Match your facial expressions to unlock all 8 Nailong memes as fast as you can!
            </p>
          </div>
          <img
            src="/nailong/nailong-wave.png"
            alt="Nailong Mascot"
            className="intro-mascot"
          />
        </div>
        <div className="intro-instructions">
          <h2>How to Play:</h2>
          <ol>
            <li>Press START to begin the timer</li>
            <li>Make different facial expressions to match the Nailongs</li>
            <li>Hold each expression for 3 seconds to unlock it</li>
            <li>Unlock all 8 Nailongs to see your time!</li>
          </ol>
        </div>
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Requesting camera access...</p>
          </div>
        ) : (
          <button className="btn-start-game" onClick={handleGetStarted}>
            <span className="play-icon">▶</span> LET'S GO!
          </button>
        )}
      </div>
    </div>
  );
}

export default IntroPage;
