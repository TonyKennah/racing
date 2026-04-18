import React, { useMemo, useState } from 'react';
import '../css/InterestingSelections.css';

const InterestingSelections = ({ races, onClose }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'time', direction: 'asc' });

  const selections = useMemo(() => {
    const results = [];

    races.forEach(race => {
      // Filter for races with at least 80% FORM
      const formMatch = race.detail?.match(/FORM\s+(\d+)%/i);
      const formPercentage = formMatch ? parseInt(formMatch[1], 10) : 0;
      if (formPercentage < 80) return;

      // 1. Calculate max rating for each horse and get current odds
      const horseData = race.horses
        .filter(horse => {
          const lastOdd = horse.odds?.[horse.odds.length - 1];
          return lastOdd !== "null" && lastOdd !== "NR";
        })
        .map(horse => {
        const ratings = (horse.past || []).map(p => parseFloat(p.name)).filter(n => !isNaN(n));
        const maxRating = ratings.length > 0 ? Math.max(...ratings) : 0;
        
        const lastOdd = horse.odds?.[horse.odds.length - 1];
        const currentOdds = lastOdd ? parseFloat(lastOdd) : 0;
        
        return {
          name: horse.name,
          maxRating,
          currentOdds,
          venue: `${race.time} ${race.place}`,
          time: race.time,
          place: race.place
        };
      });

      // 2. Determine what the 1st and 2nd highest ratings are for this specific race
      const uniqueRatings = [...new Set(horseData.map(h => h.maxRating))]
        .sort((a, b) => b - a);
      
      const highest = uniqueRatings[0] || 0;
      const secondHighest = uniqueRatings[1] || 0;

      // 3. Filter horses that match: (Rank 1 or 2) AND (Odds > 9)
      horseData.forEach(h => {
        if (h.maxRating > 0 && (h.maxRating === highest || h.maxRating === secondHighest)) {
          if (h.currentOdds > 9) {
            results.push({
              ...h,
              rank: h.maxRating === highest ? '1st' : '2nd'
            });
          }
        }
      });
    });

    // Sort the results based on sortConfig
    return results.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Case-insensitive sorting for strings (Horse names and Venue/Times)
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [races, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ↓' : ' ↑';
  };

  const handleJump = (time, place) => {
    const id = `${time}${place.replace(/\s+/g, '')}`;
    window.location.hash = id;
    if (onClose) onClose();
  };

  if (selections.length === 0) {
    return <div className="no-selections">No high-rated value selections found at the moment.</div>;
  }

  return (
    <div className="interesting-selections-container">
      <table className="selections-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('venue')} className="sortable">
              Race{getSortIndicator('venue')}
            </th>
            <th onClick={() => requestSort('name')} className="sortable">
              Horse{getSortIndicator('name')}
            </th>
            <th onClick={() => requestSort('rank')} className="sortable">
              Rating Rank{getSortIndicator('rank')}
            </th>
            <th onClick={() => requestSort('currentOdds')} className="sortable">
              Current Odds{getSortIndicator('currentOdds')}
            </th>
          </tr>
        </thead>
        <tbody>
          {selections.map((item, idx) => (
            <tr key={`${item.name}-${idx}`}>
              <td 
                className="venue-cell jump-link" 
                onClick={() => handleJump(item.time, item.place)}
              >
                {item.venue}
              </td>
              <td><strong>{item.name}</strong></td>
              <td>
                <span className={`rank-badge ${item.rank === '1st' ? 'gold' : 'silver'}`}>
                  {item.rank} Highest
                </span>
              </td>
              <td className="odds-highlight">{item.currentOdds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InterestingSelections;