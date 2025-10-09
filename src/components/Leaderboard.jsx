import { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../lib/leaderboard';

function Leaderboard({ onBack }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchLeaderboard(100); // Top 100 entries

    if (result.success) {
      setLeaderboard(result.data);
    } else {
      setError(result.error || 'Failed to load leaderboard');
    }

    setLoading(false);
  };

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
      <div className="leaderboard-page">
        <div className="leaderboard-header">
          <button onClick={onBack} className="btn-back">
            ← Back
          </button>
          <h1>🏆 Global Leaderboard</h1>
        </div>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-header">
          <button onClick={onBack} className="btn-back">
            ← Back
          </button>
          <h1>🏆 Global Leaderboard</h1>
        </div>
        <div className="leaderboard-error">
          <p>{error}</p>
          <button onClick={loadLeaderboard} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <button onClick={onBack} className="btn-back">
          ← Back
        </button>
        <h1>🏆 Global Leaderboard</h1>
        <button onClick={loadLeaderboard} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>

      {leaderboard.length === 0 ? (
        <p className="empty-message">No entries yet. Be the first!</p>
      ) : (
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
              {leaderboard.map((entry, index) => (
                <tr key={entry.id} className={index < 3 ? `rank-${index + 1}` : ''}>
                  <td className="rank-cell">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </td>
                  <td className="nickname-cell">{entry.nickname}</td>
                  <td className="time-cell">{formatTime(entry.time_ms)}</td>
                  <td className="date-cell">{formatDate(entry.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
