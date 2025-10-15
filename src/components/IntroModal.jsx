function IntroModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="intro-content" onClick={(e) => e.stopPropagation()}>
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

        <button className="btn-got-it" onClick={onClose}>
          Got It
        </button>
      </div>
    </div>
  );
}

export default IntroModal;
