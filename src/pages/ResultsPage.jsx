import { useLocation, useNavigate } from 'react-router-dom';
import EndScreen from '../components/EndScreen';

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get data passed from the game
  const { captures, completionTime, replayVideoBlob } = location.state || {};

  // If no data is available, redirect to home
  if (!captures || !completionTime) {
    navigate('/');
    return null;
  }

  const handleRestart = () => {
    navigate('/game');
  };

  const handleViewLeaderboard = () => {
    navigate('/leaderboard');
  };

  return (
    <EndScreen
      captures={captures}
      completionTime={completionTime}
      replayVideoBlob={replayVideoBlob}
      onRestart={handleRestart}
      onViewLeaderboard={handleViewLeaderboard}
    />
  );
}

export default ResultsPage;
