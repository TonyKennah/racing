import React, { useState } from 'react';
import PastRace from './PastRace';
import Odds from './Odds';
import '../css/HorseRow.css';

const HorseRow = ({ horse, sortBy }) => {
  const [showForm, setShowForm] = useState(false);

  const pastRuns = horse.past || [];

  let displayRating = null;
  if (sortBy === 'high') {
    // Show career highest rating
    displayRating = pastRuns.length > 0 ? Math.max(...pastRuns.map(r => Number(r.name) || 0)) : null;
  } else {
    // Default: Calculate average rating of the last 3 runs (L3)
    const lastThree = pastRuns.slice(0, 3);
    displayRating = lastThree.length > 0
      ? (lastThree.reduce((acc, race) => acc + (Number(race.name) || 0), 0) / lastThree.length).toFixed(0)
      : null;
  }

  return (
    <div className="horse-row">
      <div className="horse-main">
        <div className="horse-info-container">
          <div className="horse-silks-wrapper">
            {horse.silks && <img src={horse.silks} alt="silks" className="horse-silks" />}
          </div>
          <div className="horse-details-column">
            <span className="horse-name-row">
              <span className="cell-no">{horse.number}.</span>
              <span className="cell-draw">{horse.draw ? `(${horse.draw})` : ''}</span>
              <span className="cell-form">{horse.form}</span>
              <span className="cell-name"><strong>{horse.name}</strong></span>
              <span className="cell-lastrun">{horse.lastRun && `${horse.lastRun}`}</span>
              <span className="cell-age">{horse.age}yo</span>
              <span className="cell-weight">{horse.weight}</span>
              <span className="cell-jockey">
                <strong>J:</strong> {horse.jockey}
              </span>          
            </span>
            <span className="trainer-row">
              <span className="cell-owner">
                <strong>O:</strong> {horse.owner}
              </span>
              <span className="cell-breeding">
                {horse.breeding && <><strong>B:</strong> {horse.breeding}</>}
              </span> 
              <span className="cell-trainer">
                <strong>T:</strong> {horse.trainer}
              </span>
            </span>
          </div>
        </div>
      <span className="avg-rating"> {displayRating !== null ? displayRating : '-'}</span>
      <Odds horseName={horse.name} />
      <button className="past-button" onClick={() => setShowForm(!showForm)}>{pastRuns.length}</button>
      </div>

      {showForm && (
        <div className="past-races-container">
          {horse.past.map((race, idx) => (
            <PastRace key={idx} race={race} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HorseRow