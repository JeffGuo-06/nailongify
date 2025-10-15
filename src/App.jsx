import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { loadModels, areModelsLoaded } from "./utils/faceDetection";
import WebcamCapture from "./components/WebcamCapture";
import MemeDisplay from "./components/MemeDisplay";
import CaptureScreen from "./components/CaptureScreen";
import CalibrationMode from "./components/CalibrationMode";
import UnlockableFaces from "./components/UnlockableFaces";
import IntroModal from "./components/IntroModal";
import Timer from "./components/Timer";
import Countdown from "./components/Countdown";
import Header from "./components/Header";
import TipBox from "./components/TipBox";
import { GameRecorder } from "./utils/videoRecorder";

// DEV mode - set to true to show debug/dev features
const DEV = false;

function App() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState(null);
  const [memes, setMemes] = useState([]);
  const [facialData, setFacialData] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [captureMode, setCaptureMode] = useState(false);
  const [captureData, setCaptureData] = useState(null);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [unlockedFaces, setUnlockedFaces] = useState({});
  const [holdProgress, setHoldProgress] = useState({});

  // Challenge mode state
  const [showCountdown, setShowCountdown] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0); // Lifted timer state
  const [completionTime, setCompletionTime] = useState(null);
  const [captures, setCaptures] = useState([]);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const [resetKey, setResetKey] = useState(0); // Key to force WebcamCapture remount
  const [easyMode, setEasyMode] = useState(false); // Easy mode - win after 4 instead of 8
  const [justUnlockedExpression, setJustUnlockedExpression] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Use ref to avoid stale closure for easyMode
  const easyModeRef = useRef(easyMode);
  // Use ref to avoid stale closure for startTime
  const startTimeRef = useRef(startTime);

  // Video recording refs
  const videoRecorderRef = useRef(null);
  const videoElementRef = useRef(null);
  const [replayVideoBlob, setReplayVideoBlob] = useState(null);

  // Update ref when easyMode changes
  useEffect(() => {
    easyModeRef.current = easyMode;
    console.log("[APP DEBUG] Easy Mode changed:", easyMode);
  }, [easyMode]);

  // Update ref when startTime changes
  useEffect(() => {
    startTimeRef.current = startTime;
    console.log("[TIMER DEBUG] startTime changed:", startTime);
  }, [startTime]);

  // Memoize the time update callback to prevent timer resets
  const handleTimeUpdate = useCallback((elapsed) => {
    console.log("[TIMER DEBUG] handleTimeUpdate called with elapsed:", elapsed);
    setElapsedTime(elapsed);
  }, []);

  // Update recorder data during recording
  useEffect(() => {
    if (videoRecorderRef.current && videoRecorderRef.current.isRecording) {
      videoRecorderRef.current.recordingData = {
        videoElement: videoElementRef.current,
        memes,
        unlockedFaces,
        holdProgress,
        currentMatch,
        getElapsedTime: () => elapsedTime,
      };
    }
  }, [currentMatch, unlockedFaces, holdProgress, elapsedTime, memes]);

  // Navigate to results page when challenge is complete
  useEffect(() => {
    if (challengeComplete && captures.length > 0 && completionTime !== null) {
      console.log("[APP] ========== Challenge Complete ==========");
      console.log("[APP] Captures:", captures.length);
      console.log("[APP] Completion time:", completionTime);
      console.log("[APP] Has video recorder:", !!videoRecorderRef.current);
      console.log("[APP] Is recording:", videoRecorderRef.current?.isRecording);

      // Stop recording if still recording
      if (videoRecorderRef.current) {
        console.log("[APP] Stopping video recording...");
        videoRecorderRef.current
          .stopRecording()
          .then((result) => {
            console.log("[APP] ✅ Video recording stopped successfully");
            console.log("[APP]   - Has blob:", !!result?.blob);
            console.log("[APP]   - Blob size:", result?.blob?.size, "bytes");
            console.log("[APP]   - Blob type:", result?.blob?.type);
            console.log("[APP]   - Duration:", result?.duration, "seconds");
            setReplayVideoBlob(result?.blob || null);

            // Navigate after video is processed
            console.log("[APP] Navigating to results with video...");
            navigate("/results", {
              state: {
                captures,
                completionTime,
                replayVideoBlob: result?.blob || null,
              },
            });
          })
          .catch((err) => {
            console.error("[APP] ❌ Error stopping video recording:", err);
            // Navigate anyway without video
            console.log("[APP] Navigating to results without video...");
            navigate("/results", {
              state: {
                captures,
                completionTime,
                replayVideoBlob: null,
              },
            });
          });
      } else {
        console.log("[APP] No video recorder, navigating without video...");
        // No recording, navigate without video
        navigate("/results", {
          state: {
            captures,
            completionTime,
            replayVideoBlob: null,
          },
        });
      }
    }
  }, [challengeComplete, captures, completionTime, navigate]);

  useEffect(() => {
    async function initialize() {
      try {
        // Step 1: Load face-api.js models
        setStatus("Loading face detection models...");
        await loadModels();
        setStatus("Models loaded successfully!");

        // Step 2: Fetch memes.json
        setStatus("Loading Nailong meme library...");
        const response = await fetch("/memes.json");
        if (!response.ok) {
          throw new Error("Failed to load memes.json");
        }
        const data = await response.json();
        setMemes(data.memes);

        // Step 3: Fetch facialdata.json (personalized reference data)
        setStatus("Loading personalized facial data...");
        const facialResponse = await fetch("/facialdata.json");
        if (!facialResponse.ok) {
          throw new Error("Failed to load facialdata.json");
        }
        const facialDataJson = await facialResponse.json();
        setFacialData(facialDataJson);

        setStatus(`Ready! Loaded ${data.memes.length} Nailong expressions`);
        setLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err.message);
        setStatus("Error during initialization");
        setLoading(false);
      }
    }

    initialize();
  }, []);

  if (error) {
    return (
      <div className="app">
        <Header variant="simple" />
        <main className="app-main">
          <div className="error">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Reload</button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <Header variant="simple" />
        <main className="app-main">
          <div className="loading">
            <div className="spinner"></div>
            <p>{status}</p>
          </div>
        </main>
      </div>
    );
  }

  const handleMatchFound = (match) => {
    setCurrentMatch(match);
  };

  const handleCapture = (data) => {
    setCaptureData(data);
    setCaptureMode(true);
  };

  const handleBack = () => {
    setCaptureMode(false);
    setCaptureData(null);
  };

  const handleStartTimer = () => {
    console.log("[TIMER DEBUG] Showing countdown...");
    setShowCountdown(true);
  };

  const handleCountdownComplete = async () => {
    const now = Date.now();
    console.log("[TIMER DEBUG] Countdown complete, starting timer at:", now);
    setShowCountdown(false);
    setTimerStarted(true);
    setStartTime(now);

    // Start video recording
    console.log(
      "[APP] ========== Attempting to Start Video Recording =========="
    );
    console.log("[APP] Has video element:", !!videoElementRef.current);
    console.log("[APP] Has video recorder:", !!videoRecorderRef.current);
    console.log(
      "[APP] Video element ready state:",
      videoElementRef.current?.readyState
    );

    if (videoElementRef.current && videoRecorderRef.current) {
      try {
        console.log("[APP] Starting video recording...");
        console.log("[APP] Recording data:");
        console.log("[APP]   - Video element:", !!videoElementRef.current);
        console.log("[APP]   - Memes count:", memes.length);
        console.log(
          "[APP]   - Unlocked faces:",
          Object.keys(unlockedFaces).length
        );
        console.log(
          "[APP]   - Current match:",
          currentMatch?.meme?.name || "none"
        );

        await videoRecorderRef.current.startRecording({
          videoElement: videoElementRef.current,
          memes,
          unlockedFaces,
          holdProgress,
          currentMatch,
          getElapsedTime: () => elapsedTime,
        });
        console.log("[APP] ✅ Video recording started successfully");
      } catch (err) {
        console.error("[APP] ❌ Error starting video recording:", err);
        console.error("[APP] Error stack:", err.stack);
      }
    } else {
      console.warn(
        "[APP] ⚠️ Cannot start recording - missing video element or recorder"
      );
    }
  };

  const handleVideoReady = (videoElement) => {
    console.log("[APP] ========== Video Element Ready ==========");
    console.log("[APP] Video element:", !!videoElement);
    console.log(
      "[APP] Video dimensions:",
      videoElement?.videoWidth,
      "x",
      videoElement?.videoHeight
    );
    console.log("[APP] Video ready state:", videoElement?.readyState);
    videoElementRef.current = videoElement;

    // Initialize recorder if not already done
    if (!videoRecorderRef.current) {
      console.log("[APP] Creating new GameRecorder instance...");
      videoRecorderRef.current = new GameRecorder();
      console.log("[APP] ✅ GameRecorder created");
    } else {
      console.log("[APP] GameRecorder already exists");
    }
  };

  const handleUnlockFace = (expressionId, captureImageData, matchInfo) => {
    console.log("[APP DEBUG] handleUnlockFace called:", expressionId);
    console.log("[APP DEBUG] captureImageData exists?:", !!captureImageData);
    console.log(
      "[APP DEBUG] captureImageData preview:",
      captureImageData?.substring(0, 50)
    );
    console.log("[APP DEBUG] matchInfo:", matchInfo);

    // Set just unlocked expression for MemeDisplay animation
    setJustUnlockedExpression(expressionId);
    // Clear it after a short delay
    setTimeout(() => {
      setJustUnlockedExpression(null);
    }, 700);

    // Use ref to get the current easyMode value (avoids stale closure)
    const currentEasyMode = easyModeRef.current;
    console.log(
      "[APP DEBUG] Current easyMode at unlock (from ref):",
      currentEasyMode
    );

    // Mark as unlocked
    setUnlockedFaces((prev) => {
      const newUnlocked = { ...prev, [expressionId]: true };

      // Check if required faces are unlocked (4 for easy mode, 8 for normal)
      const allExpressions = [
        "smirk",
        "smiling",
        "sad",
        "cry",
        "angry",
        "woah-woah-woah",
        "geeked",
        "off-the-deep-end",
      ];
      const unlockedCount = Object.keys(newUnlocked).filter(
        (k) => newUnlocked[k]
      ).length;
      const requiredCount = currentEasyMode ? 2 : 8;
      const allUnlocked = unlockedCount >= requiredCount;

      console.log(
        "[APP DEBUG] Unlocked count:",
        unlockedCount,
        "/",
        requiredCount,
        `(${currentEasyMode ? "EASY MODE" : "NORMAL MODE"})`
      );
      console.log("[APP DEBUG] All unlocked?:", allUnlocked);
      console.log(
        "[APP DEBUG] Unlocked faces:",
        Object.keys(newUnlocked).filter((k) => newUnlocked[k])
      );

      if (allUnlocked && !challengeComplete) {
        // Calculate final time directly from startTimeRef to avoid stale state
        const finalTime = startTimeRef.current
          ? Date.now() - startTimeRef.current
          : 0;
        console.log(
          "[APP DEBUG] Challenge complete! Calculated finalTime:",
          finalTime,
          "startTimeRef.current:",
          startTimeRef.current
        );
        console.log("[TIMER DEBUG] Stopping timer. Final time:", finalTime);

        setCompletionTime(finalTime);
        setChallengeComplete(true);
      }

      return newUnlocked;
    });

    // Store the capture with match info
    if (captureImageData && matchInfo) {
      console.log("[APP DEBUG] Storing capture for:", expressionId);
      console.log("[APP DEBUG] matchInfo.meme.path:", matchInfo.meme?.path);
      console.log("[APP DEBUG] matchInfo.similarity:", matchInfo.similarity);
      setCaptures((prev) => {
        const newCaptures = [
          ...prev,
          {
            expressionId,
            expressionName: expressionId.replace(/-/g, " "),
            imageData: captureImageData,
            memePath: matchInfo.meme.path, // Path is inside the meme object
            similarity: matchInfo.similarity,
          },
        ];
        console.log("[APP DEBUG] Total captures now:", newCaptures.length);
        return newCaptures;
      });
    } else {
      console.warn(
        "[APP DEBUG] No captureImageData or matchInfo provided for:",
        expressionId
      );
    }
  };

  const handleHoldProgress = (expressionId, progress) => {
    setHoldProgress((prev) => ({ ...prev, [expressionId]: progress }));
  };

  const handleRestart = () => {
    console.log("[APP DEBUG] Restarting game...");
    console.log("[TIMER DEBUG] Resetting timer state");

    // Cleanup video recorder
    if (videoRecorderRef.current) {
      videoRecorderRef.current.cleanup();
      videoRecorderRef.current = null;
    }

    // Reset everything
    setUnlockedFaces({});
    setHoldProgress({});
    setCaptures([]);
    setElapsedTime(0);
    setCompletionTime(null);
    setChallengeComplete(false);
    setShowCountdown(false);
    setTimerStarted(false);
    setStartTime(null);
    setReplayVideoBlob(null);
    setResetKey((prev) => prev + 1); // Force WebcamCapture to remount
  };

  return (
    <div className="app">
      {showCountdown && <Countdown onComplete={handleCountdownComplete} />}

      <Header>
        {!loading && !error && !calibrationMode && !captureMode && (
          <>
            <button
              onClick={() => navigate("/leaderboard")}
              className="btn-leaderboard"
            >
              Leaderboard
            </button>
            <button
              onClick={() => setShowInfoModal(true)}
              className="btn-info-header"
              title="How to play"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              How to Play
            </button>
            {!timerStarted && DEV && (
              <>
                <button
                  onClick={() => setCalibrationMode(true)}
                  className="btn-calibration"
                >
                  Calibration Mode
                </button>
                <button
                  onClick={() => setEasyMode((prev) => !prev)}
                  className={`btn-easy-mode ${easyMode ? "active" : ""}`}
                >
                  {easyMode ? "Easy Mode (2/8) [ON]" : "Easy Mode (2/8)"}
                </button>
              </>
            )}
          </>
        )}
      </Header>

      <button
        onClick={() => navigate("/")}
        style={{
          position: "fixed",
          top: "1.76rem",
          left: "1.76rem",
          background: "white",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          padding: "0.5rem",
          transition: "transform 0.2s",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          zIndex: 100,
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <img
          src="/nailong/app-icon.png"
          alt="Home"
          style={{
            width: "48px",
            height: "48px",
            display: "block",
            borderRadius: "50%",
          }}
        />
      </button>

      <main className="app-main app-main-active">
        {calibrationMode ? (
          <CalibrationMode
            memes={memes}
            facialData={facialData}
            onBack={() => setCalibrationMode(false)}
          />
        ) : captureMode ? (
          <CaptureScreen captureData={captureData} onBack={handleBack} />
        ) : (
          <>
            {showInfoModal && (
              <IntroModal onClose={() => setShowInfoModal(false)} />
            )}

            <UnlockableFaces
              memes={memes}
              unlockedFaces={unlockedFaces}
              holdProgress={holdProgress}
            />

            <div className="content-grid">
              <div className="webcam-section">
                <h2>Your Face</h2>
                <WebcamCapture
                  key={resetKey}
                  memes={memes}
                  facialData={facialData}
                  onMatchFound={handleMatchFound}
                  onCapture={handleCapture}
                  onUnlockFace={handleUnlockFace}
                  onHoldProgress={handleHoldProgress}
                  autoStart={true}
                  trackProgress={timerStarted}
                  unlockedFaces={unlockedFaces}
                  showTimer={timerStarted}
                  startTime={startTime}
                  isRunning={!challengeComplete}
                  onTimeUpdate={handleTimeUpdate}
                  onVideoReady={handleVideoReady}
                />
                {!timerStarted ? (
                  <div className="webcam-start-button">
                    <button
                      className="btn-start-timer"
                      onClick={handleStartTimer}
                    >
                      <span className="play-icon">▶</span> START
                    </button>
                  </div>
                ) : (
                  <div className="webcam-restart-button">
                    <button
                      className="btn-restart-timer"
                      onClick={handleRestart}
                    >
                      ↻ Restart
                    </button>
                  </div>
                )}
              </div>

              <div className="meme-section">
                <h2>Your Nailong Match</h2>
                <MemeDisplay
                  match={currentMatch}
                  justUnlockedExpression={justUnlockedExpression}
                />
              </div>
            </div>
          </>
        )}
      </main>
      <footer className="app-footer">
        <p>
          hi i hope you enjoy nailongify, check out some of my other fun stuff
          at{" "}
          <a
            href="https://guojeff.com/fun"
            target="_blank"
            rel="noopener noreferrer"
          >
            guojeff.com
          </a>
          . the support for nailongify has been crazy, i seriously appreciate
          everyone who has played it.
        </p>
        <br></br>
        <p>
          also thank you to{" "}
          <a
            href="https://www.linkedin.com/in/mableliu/"
            target="_blank"
            rel="noopener noreferrer"
          >
            mable
          </a>{" "}
          for being the head of QA at nailongify
        </p>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;
