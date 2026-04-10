import React, { useState, useMemo } from 'react';
import HorseRow from './HorseRow';
import FormChart from './FormChart';
import '../css/RaceCard.css';

const RaceCard = ({ race }) => {
  const [showChart, setShowChart] = useState(false);
  const [sortBy, setSortBy] = useState('avg');

  const getAvg = (h) => {
    const past = h.past || [];
    const last3 = past.slice(0, 3);
    if (last3.length === 0) return 0;
    return last3.reduce((acc, r) => acc + (Number(r.name) || 0), 0) / last3.length;
  };

  const getMax = (h) => {
    const past = h.past || [];
    if (past.length === 0) return 0;
    return Math.max(...past.map(r => Number(r.name) || 0));
  };

  const sortedHorses = useMemo(() =>
    [...race.horses].sort((a, b) => {
      if (sortBy === 'avg') return getAvg(b) - getAvg(a);
      if (sortBy === 'high') return getMax(b) - getMax(a);
      return Number(a.number) - Number(b.number);
    }),
    [race.horses, sortBy]
  );

  return (
    <div id={`race-${race.time}-${race.place.replace(/\s+/g, '-')}`} className="race-card">
      <header className="race-header">
        <div className="race-title-group">
          <h2>{race.time} {race.place}</h2>
          <h5 className="race-detail">— {race.detail}</h5>
        </div>
        <div className="race-controls">
          <label>Sort by:</label>
          <select 
            value={sortBy}
            aria-label="Sort horses by"
            onChange={(e) => setSortBy(e.target.value)}
            className="race-sort-select"
          >
            <option value="number">Number</option>
            <option value="avg">Avg Rating (L3)</option>
            <option value="high">Highest Rating</option>
          </select>
          <button 
            onClick={() => setShowChart(!showChart)}
            className="race-analytics-btn"
          >
            {showChart ? 'Close Analytics' : 'Show Race Chart'}
          </button>
        </div>
      </header>

      {showChart && (
        <div className="race-visuals">
          <FormChart horses={race.horses} />
        </div>
      )}

      <div className="entries">
        {sortedHorses.map(horse => (
          <HorseRow key={horse.number} horse={horse} sortBy={sortBy} />
        ))}
      </div>
    </div>
  );
};

export default RaceCard;