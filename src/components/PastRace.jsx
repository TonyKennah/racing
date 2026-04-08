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

  // Helper function to convert furlongs string (e.g., "15f") to miles and furlongs (e.g., "1m 7f")
  const formatFurlongsToMiles = (furlongsStr) => {
    if (!furlongsStr || typeof furlongsStr !== 'string' || !furlongsStr.endsWith('f')) {
      return furlongsStr; // Return as is if not in expected format
    }

    const furlongs = parseInt(furlongsStr.slice(0, -1), 10); // Remove 'f' and parse
    if (isNaN(furlongs)) {
      return furlongsStr; // Return as is if parsing fails
    }

    const miles = Math.floor(furlongs / 8);
    const remainingFurlongs = furlongs % 8;

    let result = '';
    if (miles > 0) {
      result += `${miles}m`;
    }
    if (remainingFurlongs > 0) {
      if (result) {
        result += ' '; // Add space if both miles and furlongs are present
      }
      result += `${remainingFurlongs}f`;
    }

    return result || (furlongs === 0 ? '0f' : furlongsStr); // Handle 0 furlongs or original if no conversion happened
  };

  return (
    <div className="past-race-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', whiteSpace: 'nowrap', fontSize: '14px', padding: '6px 8px', borderBottom: '1px solid var(--border)', width: '100%', boxSizing: 'border-box' }}>
      <span style={{ width: '80px', flexShrink: 0 }}>{date}</span>
      <span style={{ width: '45px', flexShrink: 0 }}>{time}</span>
      <span style={{ width: '230px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <strong>{course}</strong> <small className="past-race-meta">({raceClass && ` C${raceClass}`}, {formatFurlongsToMiles(distance)}, {going})</small>
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