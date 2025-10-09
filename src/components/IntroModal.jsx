import { useState } from 'react';

function IntroModal({ onClose }) {
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    setLoading(true);

    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately, we just wanted permission
      stream.getTracks().forEach(track => track.stop());

      // Close modal and let the app start
      onClose();
    } catch (err) {
      console.error('Camera permission denied:', err);
      alert('Camera permission is required to play. Please allow camera access and refresh the page.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content intro-modal">
        <h1>Welcome to Nailongify</h1>
        <div className="challenge-description">
          <p className="challenge-tagline">
            Use your face to unlock all 8 Nailong expressions in the fastest time!
          </p>
        </div>
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Requesting camera access...</p>
          </div>
        ) : (
          <button className="btn-start" onClick={handleGetStarted}>
            🚀 Get Started
          </button>
        )}
      </div>
    </div>
  );
}

export default IntroModal;
