import React, { useState } from 'react';
import PastRace from './PastRace';
import '../css/HorseRow.css';

const HorseRow = ({ horse }) => {
  const [showForm, setShowForm] = useState(false);

  // Calculate average rating of the last 3 runs
  const pastRuns = horse.past || [];
  const lastThree = pastRuns.slice(0, 3);
  const avgRating = lastThree.length > 0
    ? (lastThree.reduce((acc, race) => acc + (Number(race.name) || 0), 0) / lastThree.length).toFixed(0)
    : null;

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
              <span className="stats-inline">{horse.lastRun && `(${horse.lastRun}d)`} {horse.age}yo {horse.weight} <strong>J:</strong> {horse.jockey}</span>
              {avgRating && <span className="avg-rating"> • {avgRating}</span>}
            </span>
            <span className="jockey-trainer-row">
               <strong>T:</strong> {horse.trainer} / <strong>O:</strong> {horse.owner} {horse.breeding && <> / <strong>B:</strong> {horse.breeding}</>}
            </span>
          </div>
        </div>
        <button className="past-button" onClick={() => setShowForm(!showForm)}>{showForm ? 'hide' : 'past'}</button>
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