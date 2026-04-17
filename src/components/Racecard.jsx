import React, { useState, useMemo } from 'react';
import HorseRow from './HorseRow';
import FormChart from './FormChart';
import OddsChart from './OddsChart';
import Modal from './Modal';
import '../css/RaceCard.css';

const RaceCard = ({ race }) => {
  const [showChart, setShowChart] = useState(false);
  const [showOdds, setShowOdds] = useState(false);
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

  const getLatestOdds = (h) => {
    const odds = h.odds || [];
    const last = odds[odds.length - 1];
    return (last && last !== "null" && last !== "NR" && !isNaN(last)) ? parseFloat(last) : Infinity;
  };

  const sortedHorses = useMemo(() =>
    [...race.horses].sort((a, b) => {
      if (sortBy === 'avg') return getAvg(b) - getAvg(a);
      if (sortBy === 'high') return getMax(b) - getMax(a);
      if (sortBy === 'last') return getLast(b) - getLast(a);
      if (sortBy === 'all') return getAllAvg(b) - getAllAvg(a);
      if (sortBy === 'odds') return getLatestOdds(a) - getLatestOdds(b);
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
            <a href="#home" className="home-link" title="Return to top" style={{ textDecoration: 'none', marginRight: '8px' }}>
              🏠
            </a>
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
            <option value="odds">Latest Odds</option>
            <option value="number">Number</option>
            <option value="avg">Avg Rating (L3)</option>
            <option value="last">Last Run Rating</option>
            <option value="high">Highest Rating</option>
            <option value="all">Avg Rating (All)</option>
          </select>
          <button onClick={() => setShowOdds(!showOdds)} className="race-analytics-btn">
            Odds
          </button>
          <button onClick={() => setShowChart(!showChart)} className="race-analytics-btn">
            Chart
          </button>
        </div>
      </header>

      <Modal 
        isOpen={showOdds} 
        onClose={() => setShowOdds(false)} 
        title={`Odds Movement: ${race.time} ${race.place}`}
      >
          <OddsChart horses={race.horses} />
      </Modal>

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