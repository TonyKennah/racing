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
    raceClass,
    distBeaten, 
    url 
  } = race;

  return (
    <div className="past-race-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', whiteSpace: 'nowrap', fontSize: '14px', padding: '6px 8px', borderBottom: '1px solid var(--border)', width: '100%', boxSizing: 'border-box' }}>
      <span style={{ width: '80px', flexShrink: 0 }}>{date}</span>
      <span style={{ width: '45px', flexShrink: 0 }}>{time}</span>
      <span style={{ width: '230px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <strong>{course}</strong> <small className="past-race-meta">({raceClass && ` C${raceClass}`}, {distance}, {going})</small>
      </span>
      <span style={{ width: '100px', flexShrink: 0 }}>
        <small>Pos: </small><strong>{position}</strong> {distBeaten && <small>({distBeaten} btn)</small>}
      </span>
      <span style={{ width: '125px', flexShrink: 0 }}>
        <small>Wt: </small><strong>{weight}</strong> • <small>Rtg: </small><strong>{name}</strong>
      </span>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 'bold', flexShrink: 0 }}>↗</a>
    </div>
  );
};

export default PastRace;