import { useState, useEffect, useRef } from 'react';

function TipBox({ unlockedFaces, elapsedTime, timerStarted }) {
  const [currentDialogue, setCurrentDialogue] = useState('');
  const [fadeIn, setFadeIn] = useState(true);
  const [dialogueIndex, setDialogueIndex] = useState(0);

  // Sequential dialogue lines
  const dialogueLines = [
    "hey!",
    "walk with me",
    "let's say hypothetically",
    "that your life was like",
    "like a very very long road",
    "its not just long",
    "its wide",
    "perhaps theres trees to the sides",
    "or even endless farmland and livestock",
    "paths and paths and paths",
    "branching off of this road",
    "and on this road",
    "what would you do?",
    "no really think about it",
    "oh",
    "what would I do?",
    "well, thanks for asking",
    "hm",
    "if life was a highway",
    "i'd wanna ride it",
    "all nailong",
    "...",
    "all nailong",
    "this was never about a highway",
    
  ];

  // Set up interval only once on mount
  useEffect(() => {
    // Initial dialogue
    setCurrentDialogue(dialogueLines[0]);

    // Change dialogue every 5 seconds
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setDialogueIndex((prev) => {
          const nextIndex = prev + 1;
          // If we've reached the end, hide the box
          if (nextIndex >= dialogueLines.length) {
            setCurrentDialogue('');
            clearInterval(interval);
            return prev;
          }
          setCurrentDialogue(dialogueLines[nextIndex]);
          return nextIndex;
        });
        setFadeIn(true);
      }, 300); // Wait for fade out
    }, 5000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only runs once on mount

  // Hide the tip box if dialogue is empty (reached the end)
  if (!currentDialogue) return null;

  return (
    <div className={`tip-box ${fadeIn ? 'fade-in' : 'fade-out'}`}>
      <div className="tip-icon">💡</div>
      <div className="tip-text">{currentDialogue}</div>
    </div>
  );
}

export default TipBox;
