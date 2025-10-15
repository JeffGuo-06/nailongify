import { useState, useEffect, useRef } from 'react';

function Countdown({ onComplete }) {
  const [count, setCount] = useState(3);
  const onCompleteRef = useRef(onComplete);

  // Keep ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished, call onComplete after a brief delay
      const timer = setTimeout(() => {
        onCompleteRef.current();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <div className="countdown-overlay">
      <div className="countdown-circle">
        {count > 0 ? (
          <span className="countdown-number">{count}</span>
        ) : (
          <span className="countdown-go">GO!</span>
        )}
      </div>
    </div>
  );
}

export default Countdown;
