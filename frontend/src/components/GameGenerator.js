// frontend/src/components/GameGenerator.js
import React from 'react';
import '../styles/GameGenerator.css';

function GameGenerator({ onGenerate, isGenerating }) {
  return (
    <div className="game-generator">
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="generate-btn"
      >
        {isGenerating ? '🔄 Generating Game...' : '🎮 Generate Playable Game'}
      </button>
      
      {isGenerating && (
        <div className="progress-info">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p>creating your game... This may take 30-60 seconds</p>
        </div>
      )}
    </div>
  );
}

export default GameGenerator;
