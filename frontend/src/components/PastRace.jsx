import React from 'react';
import '../css/PastRace.css';

const PastRace = ({ race }) => {
  // Destructuring the JSON properties for cleaner code
  const { 
    course, 
    date, 
    time, 
    name, 
    position, 
    weight, 
    distance, 
    going, 
    distBeaten, 
    url 
  } = race;

  return (
    <div className="past-race-row">
      <span className="past-race-date">{date}</span>
      <span className="past-race-pos">{position}</span>
      <span className="past-race-details">
        {course} <small className="past-race-meta">({distance}, {going})</small>
      </span>
      <span className="past-race-rtg">Rtg: <strong>{name}</strong></span>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="past-race-link"
      >
        ↗
      </a>
    </div>
  );
};

export default PastRace;