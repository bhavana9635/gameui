// frontend/src/components/GameList.js
import React from 'react';
import '../styles/GameList.css';

function GameList({ games, loading, onSelectGame, onRefresh }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading games from Google Sheets...</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="empty-state">
        <h2>📭 No Games Found</h2>
        <p>Generate some games using the n8n workflow first!</p>
        <button onClick={onRefresh} className="refresh-button">
          🔄 Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="game-list">
      <div className="list-header">
        <h2>🎲 Available Game Designs ({games.length})</h2>
        <button onClick={onRefresh} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      <div className="games-grid">
        {games.map((game, index) => {
          const fullData = game.full_data || {};
          const factionCount = fullData.exports?.faction_count || 0;
          const unitCount = fullData.exports?.unit_count || 0;
          
          return (
            <div
              key={game.pipeline_id || index}
              className="game-card"
              onClick={() => onSelectGame(game)}
            >
              <div className="card-header">
                <h3>{game.project_name || 'Untitled Game'}</h3>
                <span className="status-badge">{game.status || 'unknown'}</span>
              </div>

              <div className="card-body">
                <div className="game-meta">
                  <span className="meta-item">
                    <strong>Genre:</strong> {fullData.inputs?.genre || 'N/A'}
                  </span>
                  <span className="meta-item">
                    <strong>Platform:</strong> {fullData.inputs?.platform || 'N/A'}
                  </span>
                  <span className="meta-item">
                    <strong>Duration:</strong> {fullData.inputs?.match_duration || 'N/A'}
                  </span>
                </div>

                <div className="game-stats">
                  <div className="stat">
                    <span className="stat-value">{factionCount}</span>
                    <span className="stat-label">Factions</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{unitCount}</span>
                    <span className="stat-label">Units</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">
                      {fullData.exports?.tech_tiers || 0}
                    </span>
                    <span className="stat-label">Tech Tiers</span>
                  </div>
                </div>

                {fullData.exports?.faction_names && (
                  <div className="faction-preview">
                    <strong>Factions:</strong>
                    <div className="faction-tags">
                      {fullData.exports.faction_names.slice(0, 3).map((name, i) => (
                        <span key={i} className="faction-tag">{name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <span className="created-date">
                  {new Date(game.created_at).toLocaleDateString()}
                </span>
                <button className="view-button">
                  View Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GameList;
