import { useEffect, useState } from 'react';

function Snackbar({ message, show, duration = 4000, onClose }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);

    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) {
          onClose();
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!visible) return null;

  return (
    <div className="snackbar">
      <div className="snackbar-content">
        <span className="snackbar-message">{message}</span>
        {onClose && (
          <button className="snackbar-close" onClick={() => {
            setVisible(false);
            onClose();
          }}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default Snackbar;
