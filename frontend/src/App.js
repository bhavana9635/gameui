// frontend/src/App.js - UPDATED WITH FORM
import React, { useState, useEffect } from 'react';
import GameList from './components/GameList';
import GameViewer from './components/GameViewer';
import GameDesignForm from './components/GameDesignForm';
import './styles/App.css';

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [generatingGame, setGeneratingGame] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'viewer', 'play', 'create'
  const [gameUrl, setGameUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/games');
      
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      
      const data = await response.json();
      setGames(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setCurrentView('viewer');
  };

  const handleGenerateGame = async (gameData) => {
    try {
      setGeneratingGame(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/generate-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameDesign: gameData.full_data,
          pipelineId: gameData.pipeline_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate game');
      }

      const result = await response.json();
      
      const saveResponse = await fetch('http://localhost:5000/api/save-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pipelineId: gameData.pipeline_id,
          gameHtml: result.gameHtml
        })
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save game');
      }

      const saveResult = await saveResponse.json();
      
      setGameUrl(`http://localhost:5000${saveResult.url}`);
      setCurrentView('play');
      
    } catch (err) {
      console.error('Error generating game:', err);
      setError('Failed to generate game. Please try again.');
    } finally {
      setGeneratingGame(false);
    }
  };

  const handleFormSuccess = (result) => {
    setSuccessMessage(`✅ "${result.metadata?.project_name || 'Game'}" created successfully!`);
    
    // Auto-dismiss success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000);
    
    // Refresh the games list
    fetchGames();
    
    // Switch back to list view
    setCurrentView('list');
  };

  const handleFormError = (errorMessage) => {
    setError(`Form submission failed: ${errorMessage}`);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedGame(null);
    setGameUrl(null);
    setError(null);
  };

  const handleCreateNew = () => {
    setCurrentView('create');
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎮 AI Game Generator</h1>
        <p>Transform game designs into playable experiences</p>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {successMessage && (
        <div className="success-banner">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      <div className="app-container">
        {currentView === 'list' && (
          <>
            <div className="list-actions">
              <button onClick={handleCreateNew} className="create-new-button">
                ➕ Create New Game Design
              </button>
            </div>
            <GameList
              games={games}
              loading={loading}
              onSelectGame={handleSelectGame}
              onRefresh={fetchGames}
            />
          </>
        )}

        {currentView === 'create' && (
          <div className="create-view">
            <div className="create-header">
              <button onClick={handleBackToList} className="back-button">
                ← Back to List
              </button>
            </div>
            <GameDesignForm
              onSuccess={handleFormSuccess}
              onError={handleFormError}
            />
          </div>
        )}

        {currentView === 'viewer' && selectedGame && (
          <GameViewer
            game={selectedGame}
            onBack={handleBackToList}
            onGenerateGame={handleGenerateGame}
            isGenerating={generatingGame}
          />
        )}

        {currentView === 'play' && gameUrl && (
          <div className="game-player">
            <div className="player-controls">
              <button onClick={handleBackToList} className="back-button">
                ← Back to Games
              </button>
              <h2>🎮 Playing: {selectedGame?.project_name}</h2>
            </div>
            <iframe
              src={gameUrl}
              title="Generated Game"
              className="game-iframe"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>Powered by Google AI Studio, n8n Workflows & Claude</p>
      </footer>
    </div>
  );
}

export default App;
