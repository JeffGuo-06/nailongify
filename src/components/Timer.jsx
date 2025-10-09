import { useState, useEffect } from 'react';

function Timer({ startTime, isRunning, onTimeUpdate }) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    console.log('[TIMER DEBUG] Timer useEffect triggered. isRunning:', isRunning, 'startTime:', startTime);

    if (!isRunning || !startTime) {
      console.log('[TIMER DEBUG] Timer not starting - isRunning or startTime is falsy');
      return;
    }

    console.log('[TIMER DEBUG] Starting timer interval');
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      setElapsedTime(elapsed);
      // Update parent component with current elapsed time
      if (onTimeUpdate) {
        onTimeUpdate(elapsed);
      }
    }, 100); // Update every 100ms (10 fps) - prevents excessive re-renders

    return () => {
      console.log('[TIMER DEBUG] Cleaning up timer interval');
      clearInterval(interval);
    };
  }, [isRunning, startTime, onTimeUpdate]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}.${milliseconds.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="timer-compact">
      <span className="timer-icon-small">⏱️</span>
      <span className="timer-value-small">{formatTime(elapsedTime)}</span>
    </div>
  );
}

export default Timer;
