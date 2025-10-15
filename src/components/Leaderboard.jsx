import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLeaderboard } from "../lib/leaderboard";
import { VIDEO_PLAYBACK_SPEED } from "../utils/videoRecorder";
import Header from "./Header";

function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [displayCount, setDisplayCount] = useState(50);
  const [loadingMore, setLoadingMore] = useState(false);
  const [previewCarouselIndex, setPreviewCarouselIndex] = useState(0);
  const [previewPosition, setPreviewPosition] = useState({ top: 0 });
  const tableContainerRef = useRef(null);
  const rowRefs = useRef({});

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Reset carousel index when entry changes
  useEffect(() => {
    setPreviewCarouselIndex(0);
  }, [selectedEntry]);

  // Handle entry click and calculate preview position
  const handleEntryClick = (entry) => {
    setSelectedEntry(entry);
    setPreviewCarouselIndex(0);

    // Calculate position for desktop preview
    const rowElement = rowRefs.current[entry.id];
    const tableContainer = tableContainerRef.current;

    if (rowElement && tableContainer) {
      const rowRect = rowElement.getBoundingClientRect();
      const containerRect = tableContainer.getBoundingClientRect();

      // Position preview centered on the clicked row
      const relativeTop =
        rowRect.top - containerRect.top + tableContainer.scrollTop;
      const previewHeight = 500; // Approximate preview height
      const centeredTop = relativeTop - previewHeight / 2 + rowRect.height / 2;

      setPreviewPosition({ top: Math.max(0, centeredTop) });
    }
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchLeaderboard(1000); // Fetch more entries

    if (result.success) {
      setLeaderboard(result.data);
    } else {
      setError(result.error || "Failed to load leaderboard");
    }

    setLoading(false);
  };

  const handleViewMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount((prev) => prev + 50);
      setLoadingMore(false);
    }, 300);
  };

  const visibleLeaderboard = leaderboard.slice(0, displayCount);
  const hasMore = displayCount < leaderboard.length;

  const formatTime = (ms) => {
    if (!ms || ms < 0 || !isFinite(ms)) {
      return "0.00s";
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
    }
    return `${remainingSeconds}.${milliseconds.toString().padStart(2, "0")}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="app">
        <Header variant="simple" />
        <main className="app-main">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Header variant="simple" />
        <main className="app-main">
          <div className="error">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={loadLeaderboard}>Retry</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{`
        /* Desktop: Hide modal, show positioned preview */
        @media (min-width: 769px) {
          .leaderboard-preview-modal {
            display: none !important;
          }
          .leaderboard-preview-desktop {
            display: block;
          }
          .leaderboard-split-container {
            position: relative;
          }
        }

        /* Mobile: Show modal, hide desktop preview */
        @media (max-width: 768px) {
          .leaderboard-preview-modal {
            display: flex !important;
          }
          .leaderboard-preview-desktop {
            display: none !important;
          }
        }
      `}</style>
      <Header />

      <button
        onClick={() => navigate("/game")}
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
        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
              position: "relative",
            }}
          >
            <h1
              style={{
                textAlign: "center",
                color: "#ff6b9d",
                fontSize: "2.5rem",
                margin: "0",
                fontWeight: "700",
              }}
            >
              Global Leaderboard
            </h1>
            <button
              onClick={loadLeaderboard}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "48px",
                height: "48px",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: "0 2px 8px rgba(102, 126, 234, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                padding: "0",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "rotate(180deg)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(102, 126, 234, 0.6)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "rotate(0deg)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(102, 126, 234, 0.4)";
              }}
              title="Refresh leaderboard"
            >
              ↻
            </button>
          </div>

          {leaderboard.length === 0 ? (
            <p
              className="empty-message"
              style={{
                textAlign: "center",
                fontSize: "1.2rem",
                color: "#666",
                padding: "3rem",
                background: "white",
                borderRadius: "12px",
              }}
            >
              No entries yet. Be the first!
            </p>
          ) : (
            <div className="leaderboard-split-container">
              {/* Leaderboard table */}
              <div
                className="leaderboard-table-container"
                ref={tableContainerRef}
              >
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Nickname</th>
                      <th>Time</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLeaderboard.map((entry, index) => (
                      <tr
                        key={entry.id}
                        ref={(el) => (rowRefs.current[entry.id] = el)}
                        className={`
                          ${index < 3 ? `rank-${index + 1}` : ""}
                          ${
                            entry.capture_image_url || entry.video_url
                              ? "has-capture"
                              : ""
                          }
                          ${selectedEntry?.id === entry.id ? "selected" : ""}
                        `}
                        onClick={() => handleEntryClick(entry)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="rank-cell">
                          {index === 0 && "#1"}
                          {index === 1 && "#2"}
                          {index === 2 && "#3"}
                          {index > 2 && `#${index + 1}`}
                        </td>
                        <td className="nickname-cell">{entry.nickname}</td>
                        <td className="time-cell">
                          {formatTime(entry.time_ms)}
                        </td>
                        <td className="date-cell">
                          {formatDate(entry.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {hasMore && (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "1.5rem",
                    }}
                  >
                    <button
                      onClick={handleViewMore}
                      disabled={loadingMore}
                      style={{
                        padding: "0.75rem 2rem",
                        fontSize: "1rem",
                        fontWeight: "600",
                        background: loadingMore
                          ? "#ccc"
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: loadingMore ? "not-allowed" : "pointer",
                        transition: "all 0.3s",
                        boxShadow: loadingMore
                          ? "none"
                          : "0 2px 8px rgba(102, 126, 234, 0.4)",
                      }}
                      onMouseOver={(e) => {
                        if (!loadingMore) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(102, 126, 234, 0.6)";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!loadingMore) {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 2px 8px rgba(102, 126, 234, 0.4)";
                        }
                      }}
                    >
                      {loadingMore ? "Loading..." : "View More"}
                    </button>
                  </div>
                )}
              </div>

              {/* Capture preview - Desktop: positioned, Mobile: modal */}
              {selectedEntry &&
                (() => {
                  // Build media array (video first, then image)
                  const media = [];
                  if (selectedEntry.video_url) {
                    media.push({ type: "video", url: selectedEntry.video_url });
                  }
                  if (selectedEntry.capture_image_url) {
                    media.push({
                      type: "image",
                      url: selectedEntry.capture_image_url,
                    });
                  }

                  const currentMedia = media[previewCarouselIndex];
                  const hasMedia = media.length > 0;

                  return (
                    <>
                      {/* Mobile: Modal overlay */}
                      <div
                        className="leaderboard-preview-modal"
                        onClick={() => setSelectedEntry(null)}
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "rgba(0, 0, 0, 0.8)",
                          zIndex: 1000,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "1rem",
                        }}
                      >
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            background: "white",
                            borderRadius: "16px",
                            maxWidth: "500px",
                            width: "100%",
                            maxHeight: "90vh",
                            overflow: "auto",
                            position: "relative",
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                          }}
                        >
                          {/* Close button */}
                          <button
                            onClick={() => setSelectedEntry(null)}
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              background: "rgba(0, 0, 0, 0.6)",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              width: "36px",
                              height: "36px",
                              fontSize: "1.5rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 10,
                            }}
                          >
                            ×
                          </button>

                          <div style={{ padding: "1.5rem" }}>
                            {hasMedia ? (
                              <>
                                <h3
                                  style={{
                                    margin: "0 0 1rem 0",
                                    fontSize: "1.3rem",
                                    color: "#333",
                                  }}
                                >
                                  {selectedEntry.nickname}'s{" "}
                                  {currentMedia.type === "video"
                                    ? "Replay"
                                    : "Capture"}
                                </h3>

                                {/* Media carousel */}
                                <div
                                  style={{
                                    position: "relative",
                                    marginBottom: "1rem",
                                  }}
                                >
                                  {media.length > 1 && (
                                    <button
                                      onClick={() =>
                                        setPreviewCarouselIndex(
                                          (previewCarouselIndex -
                                            1 +
                                            media.length) %
                                            media.length
                                        )
                                      }
                                      style={{
                                        position: "absolute",
                                        left: "8px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        zIndex: 10,
                                        background: "rgba(0,0,0,0.6)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "40px",
                                        height: "40px",
                                        fontSize: "1.5rem",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      ‹
                                    </button>
                                  )}

                                  <div
                                    style={{
                                      borderRadius: "8px",
                                      overflow: "hidden",
                                      background: "#f5f5f5",
                                    }}
                                  >
                                    {currentMedia.type === "video" ? (
                                      <video
                                        src={currentMedia.url}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        style={{
                                          width: "100%",
                                          display: "block",
                                        }}
                                        onLoadedMetadata={(e) => {
                                          e.target.playbackRate =
                                            VIDEO_PLAYBACK_SPEED;
                                        }}
                                        onLoadedData={(e) => {
                                          if (
                                            e.target.playbackRate !==
                                            VIDEO_PLAYBACK_SPEED
                                          )
                                            e.target.playbackRate =
                                              VIDEO_PLAYBACK_SPEED;
                                        }}
                                        onCanPlay={(e) => {
                                          if (
                                            e.target.playbackRate !==
                                            VIDEO_PLAYBACK_SPEED
                                          )
                                            e.target.playbackRate =
                                              VIDEO_PLAYBACK_SPEED;
                                        }}
                                        onPlay={(e) => {
                                          if (
                                            e.target.playbackRate !==
                                            VIDEO_PLAYBACK_SPEED
                                          )
                                            e.target.playbackRate =
                                              VIDEO_PLAYBACK_SPEED;
                                        }}
                                      />
                                    ) : (
                                      <img
                                        src={currentMedia.url}
                                        alt={`${selectedEntry.nickname}'s capture`}
                                        style={{
                                          width: "100%",
                                          display: "block",
                                        }}
                                      />
                                    )}
                                  </div>

                                  {media.length > 1 && (
                                    <button
                                      onClick={() =>
                                        setPreviewCarouselIndex(
                                          (previewCarouselIndex + 1) %
                                            media.length
                                        )
                                      }
                                      style={{
                                        position: "absolute",
                                        right: "8px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        zIndex: 10,
                                        background: "rgba(0,0,0,0.6)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "40px",
                                        height: "40px",
                                        fontSize: "1.5rem",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      ›
                                    </button>
                                  )}
                                </div>

                                {/* Carousel dots */}
                                {media.length > 1 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      gap: "8px",
                                      marginBottom: "1rem",
                                    }}
                                  >
                                    {media.map((_, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() =>
                                          setPreviewCarouselIndex(idx)
                                        }
                                        style={{
                                          width: "10px",
                                          height: "10px",
                                          borderRadius: "50%",
                                          border: "none",
                                          background:
                                            idx === previewCarouselIndex
                                              ? "#667eea"
                                              : "#ccc",
                                          cursor: "pointer",
                                          padding: 0,
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}

                                <div
                                  style={{
                                    textAlign: "center",
                                    fontSize: "0.9rem",
                                    color: "#666",
                                  }}
                                >
                                  <p style={{ margin: "0.25rem 0" }}>
                                    Time: {formatTime(selectedEntry.time_ms)}
                                  </p>
                                  <p style={{ margin: "0.25rem 0" }}>
                                    Date: {formatDate(selectedEntry.created_at)}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "2rem 0",
                                }}
                              >
                                <p
                                  style={{
                                    fontSize: "3rem",
                                    marginBottom: "1rem",
                                    opacity: 0.3,
                                  }}
                                >
                                  📸
                                </p>
                                <p
                                  style={{
                                    fontSize: "1.1rem",
                                    color: "#999",
                                    fontWeight: "600",
                                  }}
                                >
                                  {selectedEntry.nickname}'s entry does not have
                                  media
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Desktop: Positioned preview */}
                      <div
                        className="leaderboard-preview-desktop"
                        style={{
                          position: "absolute",
                          right: "20px",
                          top: `${previewPosition.top}px`,
                          width: "380px",
                          background: "white",
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                          padding: "1.5rem",
                          zIndex: 100,
                        }}
                      >
                        {/* Close button */}
                        <button
                          onClick={() => setSelectedEntry(null)}
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            background: "rgba(0, 0, 0, 0.1)",
                            color: "#666",
                            border: "none",
                            borderRadius: "50%",
                            width: "32px",
                            height: "32px",
                            fontSize: "1.5rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ×
                        </button>

                        {hasMedia ? (
                          <>
                            <h3
                              style={{
                                margin: "0 0 1rem 0",
                                fontSize: "1.2rem",
                                color: "#333",
                                paddingRight: "2rem",
                              }}
                            >
                              {selectedEntry.nickname}'s{" "}
                              {currentMedia.type === "video"
                                ? "Replay"
                                : "Capture"}
                            </h3>

                            {/* Media carousel */}
                            <div
                              style={{
                                position: "relative",
                                marginBottom: "1rem",
                              }}
                            >
                              {media.length > 1 && (
                                <button
                                  onClick={() =>
                                    setPreviewCarouselIndex(
                                      (previewCarouselIndex -
                                        1 +
                                        media.length) %
                                        media.length
                                    )
                                  }
                                  style={{
                                    position: "absolute",
                                    left: "8px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 10,
                                    background: "rgba(0,0,0,0.6)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "36px",
                                    height: "36px",
                                    fontSize: "1.3rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  ‹
                                </button>
                              )}

                              <div
                                style={{
                                  borderRadius: "8px",
                                  overflow: "hidden",
                                  background: "#f5f5f5",
                                }}
                              >
                                {currentMedia.type === "video" ? (
                                  <video
                                    src={currentMedia.url}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    style={{
                                      width: "100%",
                                      display: "block",
                                      maxHeight: "300px",
                                      objectFit: "contain",
                                    }}
                                    onLoadedMetadata={(e) => {
                                      e.target.playbackRate =
                                        VIDEO_PLAYBACK_SPEED;
                                    }}
                                    onLoadedData={(e) => {
                                      if (
                                        e.target.playbackRate !==
                                        VIDEO_PLAYBACK_SPEED
                                      )
                                        e.target.playbackRate =
                                          VIDEO_PLAYBACK_SPEED;
                                    }}
                                    onCanPlay={(e) => {
                                      if (
                                        e.target.playbackRate !==
                                        VIDEO_PLAYBACK_SPEED
                                      )
                                        e.target.playbackRate =
                                          VIDEO_PLAYBACK_SPEED;
                                    }}
                                    onPlay={(e) => {
                                      if (
                                        e.target.playbackRate !==
                                        VIDEO_PLAYBACK_SPEED
                                      )
                                        e.target.playbackRate =
                                          VIDEO_PLAYBACK_SPEED;
                                    }}
                                  />
                                ) : (
                                  <img
                                    src={currentMedia.url}
                                    alt={`${selectedEntry.nickname}'s capture`}
                                    style={{
                                      width: "100%",
                                      display: "block",
                                      maxHeight: "300px",
                                      objectFit: "contain",
                                    }}
                                  />
                                )}
                              </div>

                              {media.length > 1 && (
                                <button
                                  onClick={() =>
                                    setPreviewCarouselIndex(
                                      (previewCarouselIndex + 1) % media.length
                                    )
                                  }
                                  style={{
                                    position: "absolute",
                                    right: "8px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 10,
                                    background: "rgba(0,0,0,0.6)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "36px",
                                    height: "36px",
                                    fontSize: "1.3rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  ›
                                </button>
                              )}
                            </div>

                            {/* Carousel dots */}
                            {media.length > 1 && (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  gap: "8px",
                                  marginBottom: "1rem",
                                }}
                              >
                                {media.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setPreviewCarouselIndex(idx)}
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      border: "none",
                                      background:
                                        idx === previewCarouselIndex
                                          ? "#667eea"
                                          : "#ccc",
                                      cursor: "pointer",
                                      padding: 0,
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            <div
                              style={{
                                textAlign: "center",
                                fontSize: "0.85rem",
                                color: "#666",
                              }}
                            >
                              <p style={{ margin: "0.25rem 0" }}>
                                Time: {formatTime(selectedEntry.time_ms)}
                              </p>
                              <p style={{ margin: "0.25rem 0" }}>
                                Date: {formatDate(selectedEntry.created_at)}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div
                            style={{ textAlign: "center", padding: "2rem 0" }}
                          >
                            <p
                              style={{
                                fontSize: "3rem",
                                marginBottom: "1rem",
                                opacity: 0.3,
                              }}
                            >
                              📸
                            </p>
                            <p
                              style={{
                                fontSize: "1rem",
                                color: "#999",
                                fontWeight: "600",
                              }}
                            >
                              {selectedEntry.nickname}'s entry does not have
                              media
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
            </div>
          )}
        </div>
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
    </div>
  );
}

export default Leaderboard;
