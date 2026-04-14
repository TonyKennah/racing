import React, { useState, useMemo } from 'react';
import HorseRow from './HorseRow';
import FormChart from './FormChart';
import Modal from './Modal';
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

  const getLast = (h) => {
    const past = h.past || [];
    return past.length > 0 ? (Number(past[0].name) || 0) : 0;
  };

  const getAllAvg = (h) => {
    const past = h.past || [];
    if (past.length === 0) return 0;
    return past.reduce((acc, r) => acc + (Number(r.name) || 0), 0) / past.length;
  };

  const sortedHorses = useMemo(() =>
    [...race.horses].sort((a, b) => {
      if (sortBy === 'avg') return getAvg(b) - getAvg(a);
      if (sortBy === 'high') return getMax(b) - getMax(a);
      if (sortBy === 'last') return getLast(b) - getLast(a);
      if (sortBy === 'all') return getAllAvg(b) - getAllAvg(a);
      return Number(a.number) - Number(b.number);
    }),
    [race.horses, sortBy]
  );

  const raceId = `${race.time}${race.place.replace(/\s+/g, '')}`;

  return (
    <div id={raceId} className="race-card">
      <header className="race-header">
        <div className="race-title-group">
          <h2>
            <a href={`#${raceId}`} className="race-title-link">
              {race.time} {race.place}
            </a>
          </h2>
          <h5 className="race-detail">{race.detail} {race.going}</h5>
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
            <option value="last">Last Run Rating</option>
            <option value="high">Highest Rating</option>
            <option value="all">Avg Rating (All)</option>
          </select>
          <button 
            onClick={() => setShowChart(!showChart)}
            className="race-analytics-btn"
          >
            Show Race Chart
          </button>
        </div>
      </header>

      <Modal 
        isOpen={showChart} 
        onClose={() => setShowChart(false)} 
        title={`${race.time} ${race.place} - ${race.detail} ${race.going}`}
      >
          <FormChart horses={race.horses} />
      </Modal>

      <div className="entries">
        {sortedHorses.map(horse => (
          <HorseRow key={horse.number} horse={horse} sortBy={sortBy} />
        ))}
      </div>
    </div>
  );
};

export default RaceCard;