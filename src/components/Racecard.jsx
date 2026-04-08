// RaceCard.jsx
import React, { useState } from 'react';
import HorseRow from './HorseRow';
import FormChart from './FormChart'; // 1. Import it

const RaceCard = ({ race }) => {
  const [showChart, setShowChart] = useState(false);
  const [sortBy, setSortBy] = useState('avg'); // options: 'number', 'avg', 'high'

  // Helper to calculate average of last 3 runs
  const getAvg = (h) => {
    const past = h.past || [];
    const last3 = past.slice(0, 3);
    if (last3.length === 0) return 0;
    return last3.reduce((acc, r) => acc + (Number(r.name) || 0), 0) / last3.length;
  };

  // Helper to calculate best ever rating
  const getMax = (h) => {
    const past = h.past || [];
    if (past.length === 0) return 0;
    return Math.max(...past.map(r => Number(r.name) || 0));
  };

  // Reorder horses based on the selected sortBy state
  const sortedHorses = [...race.horses].sort((a, b) => {
    if (sortBy === 'avg') return getAvg(b) - getAvg(a);
    if (sortBy === 'high') return getMax(b) - getMax(a);
    return Number(a.number) - Number(b.number); // Default numeric sort
  });

  return (
    <div 
      id={`race-${race.time}-${race.place.replace(/\s+/g, '-')}`}
      className="race-card" 
      style={{ marginBottom: '40px', borderBottom: '2px solid #eee' }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h2 style={{ margin: 0, textAlign: 'left' }}>{race.time} {race.place}</h2>
          <h5 style={{ height: 45, overflow: 'auto', margin: 0, color: 'var(--text)', fontWeight: 400 }}>— {race.detail}</h5>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', color: '#666' }}>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
          >
            <option value="number">Number</option>
            <option value="avg">Avg Rating (L3)</option>
            <option value="high">Highest Rating</option>
          </select>
          <button 
            onClick={() => setShowChart(!showChart)}
            style={{ padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
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