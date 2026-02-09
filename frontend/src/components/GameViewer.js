// frontend/src/components/GameViewer.js
import React, { useState } from 'react';
import '../styles/GameViewer.css';

function GameViewer({ game, onBack, onGenerateGame, isGenerating }) {
  const [activeTab, setActiveTab] = useState('overview');
  const fullData = game.full_data || {};
  const gdd = fullData.game_design_spec || {};
  const balancing = fullData.balancing || {};
  const progression = fullData.progression || {};

  const handleGenerate = () => {
    onGenerateGame(game);
  };

  return (
    <div className="game-viewer">
      <div className="viewer-header">
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
        <div className="header-content">
          <h1>{game.project_name}</h1>
          <div className="header-meta">
            <span className="badge">{fullData.inputs?.genre}</span>
            <span className="badge">{fullData.inputs?.platform}</span>
            <span className="badge">{fullData.inputs?.skill_ceiling} skill</span>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          className="generate-button"
          disabled={isGenerating}
        >
          {isGenerating ? '🔄 Generating...' : '🎮 Generate Playable Game'}
        </button>
      </div>

      <div className="viewer-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📋 Overview
        </button>
        <button
          className={activeTab === 'factions' ? 'active' : ''}
          onClick={() => setActiveTab('factions')}
        >
          ⚔️ Factions
        </button>
        <button
          className={activeTab === 'balancing' ? 'active' : ''}
          onClick={() => setActiveTab('balancing')}
        >
          ⚖️ Balancing
        </button>
        <button
          className={activeTab === 'progression' ? 'active' : ''}
          onClick={() => setActiveTab('progression')}
        >
          📈 Progression
        </button>
        <button
          className={activeTab === 'raw' ? 'active' : ''}
          onClick={() => setActiveTab('raw')}
        >
          🔧 Raw JSON
        </button>
      </div>

      <div className="viewer-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <section className="info-section">
              <h2>Core Gameplay Loop</h2>
              <p className="loop-summary">{gdd.core_loop?.summary}</p>
              
              <h3>Game Phases</h3>
              <div className="phases-list">
                {gdd.core_loop?.phases?.map((phase, i) => (
                  <div key={i} className="phase-item">
                    <span className="phase-number">{i + 1}</span>
                    <span className="phase-name">{phase}</span>
                  </div>
                ))}
              </div>

              <h3>Key Decisions</h3>
              <ul className="decisions-list">
                {gdd.core_loop?.key_decisions?.map((decision, i) => (
                  <li key={i}>{decision}</li>
                ))}
              </ul>
            </section>

            <section className="info-section">
              <h2>Economy System</h2>
              <div className="resources-grid">
                {gdd.economy?.resources?.map((resource, i) => (
                  <div key={i} className="resource-card">
                    <h4>{resource.name}</h4>
                    <p>{resource.purpose}</p>
                  </div>
                ))}
              </div>
              <p className="generation-rules">{gdd.economy?.generation_rules}</p>
            </section>

            <section className="info-section">
              <h2>Win Conditions</h2>
              <div className="win-conditions">
                {gdd.win_conditions?.map((condition, i) => (
                  <div key={i} className="condition-card">
                    <h4>{condition.type}</h4>
                    <p>{condition.description}</p>
                    <span className="duration">⏱️ {condition.typical_duration}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'factions' && (
          <div className="factions-tab">
            {gdd.factions?.map((faction, i) => (
              <div key={i} className="faction-detail">
                <div className="faction-header">
                  <h2>{faction.name}</h2>
                  <span className="playstyle-badge">{faction.playstyle}</span>
                </div>
                
                <p className="faction-fantasy">{faction.fantasy}</p>

                <div className="faction-grid">
                  <div className="faction-section">
                    <h3>💪 Strengths</h3>
                    <ul>
                      {faction.strengths?.map((s, idx) => (
                        <li key={idx} className="strength-item">{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="faction-section">
                    <h3>🔻 Weaknesses</h3>
                    <ul>
                      {faction.weaknesses?.map((w, idx) => (
                        <li key={idx} className="weakness-item">{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="faction-section">
                  <h3>⚡ Unique Mechanics</h3>
                  <div className="mechanics-list">
                    {faction.unique_mechanics?.map((mechanic, idx) => (
                      <span key={idx} className="mechanic-tag">{mechanic}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'balancing' && (
          <div className="balancing-tab">
            <h2>Unit Statistics</h2>
            <div className="units-table">
              <table>
                <thead>
                  <tr>
                    <th>Faction</th>
                    <th>Unit</th>
                    <th>Tier</th>
                    <th>Role</th>
                    <th>HP</th>
                    <th>ATK</th>
                    <th>DEF</th>
                    <th>SPD</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {balancing.units?.map((unit, i) => (
                    <tr key={i}>
                      <td>{unit.faction}</td>
                      <td><strong>{unit.unit_name}</strong></td>
                      <td><span className="tier-badge">{unit.tier}</span></td>
                      <td><span className="role-badge">{unit.role}</span></td>
                      <td>{unit.stats?.hp}</td>
                      <td>{unit.stats?.attack}</td>
                      <td>{unit.stats?.defense}</td>
                      <td>{unit.stats?.speed}</td>
                      <td>{unit.costs?.gold}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {balancing.tuning_recommendations?.length > 0 && (
              <div className="tuning-section">
                <h3>🔧 Tuning Recommendations</h3>
                {balancing.tuning_recommendations.map((rec, i) => (
                  <div key={i} className="tuning-card">
                    <h4>{rec.unit_id}</h4>
                    <p>
                      <strong>{rec.stat}:</strong> {rec.direction} by {rec.magnitude}
                    </p>
                    <p className="rationale">{rec.rationale}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'progression' && (
          <div className="progression-tab">
            <h2>Technology Tree</h2>
            {progression.tech_tree?.map((tier, i) => (
              <div key={i} className="tech-tier">
                <div className="tier-header">
                  <h3>Tier {tier.tier}: {tier.tier_name}</h3>
                </div>
                <div className="technologies-grid">
                  {tier.technologies?.map((tech, idx) => (
                    <div key={idx} className="tech-card">
                      <h4>{tech.tech_name}</h4>
                      <p>{tech.description}</p>
                      <div className="tech-meta">
                        <span>⏱️ {tech.research_time}s</span>
                        <span>
                          💰 {Object.entries(tech.cost || {}).map(([k, v]) => `${v} ${k}`).join(', ')}
                        </span>
                      </div>
                      {tech.unlocks && (
                        <div className="unlocks">
                          Unlocks: {tech.unlocks.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <h2>Retention Hooks</h2>
            <div className="hooks-grid">
              {progression.meta_retention_hooks?.map((hook, i) => (
                <div key={i} className="hook-card">
                  <h4>{hook.hook_name}</h4>
                  <span className="hook-type">{hook.hook_type}</span>
                  <span className="hook-frequency">{hook.hook_frequency}</span>
                  {hook.rewards && (
                    <div className="rewards">
                      {Object.entries(hook.rewards).map(([k, v]) => (
                        <span key={k}>{v} {k}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="raw-tab">
            <pre>{JSON.stringify(fullData, null, 2)}</pre>
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="generating-overlay">
          <div className="generating-modal">
            <div className="spinner-large"></div>
            <h2>🎮 Generating Your Game...</h2>
            <p>AI is creating a playable version of {game.project_name}</p>
            <p className="note">This may take 30-60 seconds</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameViewer;
