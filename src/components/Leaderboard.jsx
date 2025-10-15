import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLeaderboard } from '../lib/leaderboard';
import Header from './Header';

function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [displayCount, setDisplayCount] = useState(50);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Set first place as selected by default when leaderboard loads
  useEffect(() => {
    if (leaderboard.length > 0 && !selectedEntry) {
      const firstPlaceWithPhoto = leaderboard.find(entry => entry.capture_image_url);
      if (firstPlaceWithPhoto) {
        setSelectedEntry(firstPlaceWithPhoto);
      }
    }
  }, [leaderboard, selectedEntry]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchLeaderboard(1000); // Fetch more entries

    if (result.success) {
      setLeaderboard(result.data);
    } else {
      setError(result.error || 'Failed to load leaderboard');
    }

    setLoading(false);
  };

  const handleViewMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + 50);
      setLoadingMore(false);
    }, 300);
  };

  const visibleLeaderboard = leaderboard.slice(0, displayCount);
  const hasMore = displayCount < leaderboard.length;

  const formatTime = (ms) => {
    if (!ms || ms < 0 || !isFinite(ms)) {
      return '0.00s';
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}.${milliseconds.toString().padStart(2, '0')}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
      <Header />

      <button
        onClick={() => navigate('/game')}
        style={{
          position: 'fixed',
          top: '1.76rem',
          left: '1.76rem',
          background: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          padding: '0.5rem',
          transition: 'transform 0.2s',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          zIndex: 100
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <img
          src="/nailong/app-icon.png"
          alt="Home"
          style={{
            width: '48px',
            height: '48px',
            display: 'block',
            borderRadius: '50%'
          }}
        />
      </button>

      <main className="app-main app-main-active">
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            position: 'relative'
          }}>
            <h1 style={{
              textAlign: 'center',
              color: '#ff6b9d',
              fontSize: '2.5rem',
              margin: '0',
              fontWeight: '700'
            }}>
              Global Leaderboard
            </h1>
            <button
              onClick={loadLeaderboard}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                padding: '0'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'rotate(180deg)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.6)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'rotate(0deg)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.4)';
              }}
              title="Refresh leaderboard"
            >
              ↻
            </button>
          </div>

          {leaderboard.length === 0 ? (
            <p className="empty-message" style={{
              textAlign: 'center',
              fontSize: '1.2rem',
              color: '#666',
              padding: '3rem',
              background: 'white',
              borderRadius: '12px'
            }}>
              No entries yet. Be the first!
            </p>
          ) : (
            <div className="leaderboard-split-container">
              {/* Left side: Leaderboard table */}
              <div className="leaderboard-table-container">
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
                        className={`
                          ${index < 3 ? `rank-${index + 1}` : ''}
                          ${entry.capture_image_url ? 'has-capture' : ''}
                          ${selectedEntry?.id === entry.id ? 'selected' : ''}
                        `}
                        onClick={() => setSelectedEntry(entry)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="rank-cell">
                          {index === 0 && '#1'}
                          {index === 1 && '#2'}
                          {index === 2 && '#3'}
                          {index > 2 && `#${index + 1}`}
                        </td>
                        <td className="nickname-cell">
                          {entry.nickname}
                        </td>
                        <td className="time-cell">{formatTime(entry.time_ms)}</td>
                        <td className="date-cell">{formatDate(entry.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {hasMore && (
                  <div style={{
                    textAlign: 'center',
                    marginTop: '1.5rem'
                  }}>
                    <button
                      onClick={handleViewMore}
                      disabled={loadingMore}
                      style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        background: loadingMore
                          ? '#ccc'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loadingMore ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: loadingMore
                          ? 'none'
                          : '0 2px 8px rgba(102, 126, 234, 0.4)'
                      }}
                      onMouseOver={(e) => {
                        if (!loadingMore) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.6)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!loadingMore) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.4)';
                        }
                      }}
                    >
                      {loadingMore ? 'Loading...' : 'View More'}
                    </button>
                  </div>
                )}
              </div>

              {/* Right side: Capture image preview - now opaque */}
              <div className="leaderboard-preview-container">
                {selectedEntry ? (
                  selectedEntry.capture_image_url ? (
                    <div className="capture-preview" style={{ opacity: 1 }}>
                      <div className="preview-header">
                        <h3>{selectedEntry.nickname}'s Capture</h3>
                      </div>
                      <div className="preview-image-wrapper">
                        <img
                          src={selectedEntry.capture_image_url}
                          alt={`${selectedEntry.nickname}'s capture`}
                          className="preview-image"
                        />
                      </div>
                      <div className="preview-info">
                        <p className="preview-time">Time: {formatTime(selectedEntry.time_ms)}</p>
                        <p className="preview-date">Date: {formatDate(selectedEntry.created_at)}</p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="capture-preview"
                      style={{
                        opacity: 1,
                        textAlign: 'center',
                        padding: '3rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '300px'
                      }}
                    >
                      <p style={{
                        fontSize: '3rem',
                        marginBottom: '1rem',
                        opacity: 0.3
                      }}>
                        📸
                      </p>
                      <p style={{
                        fontSize: '1.1rem',
                        color: '#999',
                        fontWeight: '600'
                      }}>
                        {selectedEntry.nickname}'s entry does not have a capture
                      </p>
                    </div>
                  )
                ) : (
                  <div className="preview-placeholder" style={{ opacity: 1 }}>
                    <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</p>
                    <p style={{ fontSize: '1rem', color: '#667eea', fontWeight: '600' }}>
                      Click on an entry to view their capture!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>
          hi i hope you enjoy nailongify, check out some of my other stuff at{' '}
          <a href="https://guojeff.com" target="_blank" rel="noopener noreferrer">
            guojeff.com
          </a>
          . i promise i don't just make bullshit
        </p>
        <br></br>
        <p>
          also thanks to{' '}
          <a href="https://www.linkedin.com/in/mableliu/" target="_blank" rel="noopener noreferrer">
            mable
          </a>{' '}
          for being training data
        </p>
      </footer>
    </div>
  );
}

export default Leaderboard;
