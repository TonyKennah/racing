import React, { useMemo, useState } from 'react';
import '../css/FiddleSelections.css';

const FiddleSelections = ({ races, onClose }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'time', direction: 'asc' });

  const selections = useMemo(() => {
    // Lists for "Hot" connections
    const hotOwners = ["J P MacManus"];
    const hotTrainers = ["A P O'Brien", "T D Easterby", "L Russell & M Scudamore",
        "W P Mullins", "G Elliott", "R Hannon", "G P Cromwell"
    ];

    const results = [];

    races.forEach(race => {
      race.horses.forEach(horse => {
        const owner = horse.owner || "";
        const trainer = horse.trainer || "";

        // Check for matches (case-insensitive partial matches are safer)
        const isHotOwner = hotOwners.some(o => owner.toLowerCase().includes(o.toLowerCase()));
        const isHotTrainer = hotTrainers.some(t => trainer.toLowerCase().includes(t.toLowerCase()));

        if (isHotOwner || isHotTrainer) {
          results.push({
            name: horse.name,
            venue: `${race.time} ${race.place}`,
            time: race.time,
            place: race.place,
            owner: horse.owner,
            trainer: horse.trainer
          });
        }
      });
    });

    // Sort the results based on sortConfig
    return results.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
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
    return <div className="no-data">No connections for J P MacManus or A P O'Brien found today.</div>;
  }

  return (
    <div className="fiddle-selections-container">
      <table className="fiddle-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('venue')} className="sortable">
              Race{getSortIndicator('venue')}
            </th>
            <th onClick={() => requestSort('name')} className="sortable">
              Horse{getSortIndicator('name')}
            </th>
            <th onClick={() => requestSort('trainer')} className="sortable">
              Trainer{getSortIndicator('trainer')}
            </th>
            <th onClick={() => requestSort('owner')} className="sortable">
              Owner{getSortIndicator('owner')}
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
              <td>{item.trainer}</td>
              <td>{item.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FiddleSelections;
