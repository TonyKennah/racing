import React, { useState, useEffect, useRef } from 'react';
import RaceCard from './components/Racecard';

function App() {
  const [races, setRaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [handicapOnly, setHandicapOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasScrolled = useRef(false);

  const uniquePlaces = [...new Set(races.map(r => r.place))].sort();

  const filteredRaces = races.filter(race => {
    const matchesPlace = selectedPlaces.length === 0 || selectedPlaces.includes(race.place);
    const matchesHandicap = !handicapOnly || (race.detail && race.detail.toLowerCase().includes('handicap'));
    return matchesPlace && matchesHandicap;
  });

  useEffect(() => {
    // Only attempt scroll once data is ready and we haven't scrolled yet
    if (!loading && filteredRaces.length > 0 && !hasScrolled.current) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // Find the first race scheduled for now or in the future
      const nextRace = filteredRaces.find(r => r.time >= currentTime);
      
      if (nextRace) {
        // The 600ms delay gives the browser time to finish the initial render and paint
        setTimeout(() => {
          const id = `race-${nextRace.time}-${nextRace.place.replace(/\s+/g, '-')}`;
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Mark as scrolled so we don't snap back if user manually filters later
            hasScrolled.current = true;
          }
        }, 600);
      }
    }
  }, [loading, filteredRaces]);

  useEffect(() => {

    fetch('https://www.pluckier.co.uk/todays.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setRaces(data); // Assuming the JSON is an array of races
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []); // Empty array means "run once on load"

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p className="loading">Loading today's races...</p>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p className="error">Error: {error}</p>
    </div>
  );

  return (
    <main>
      <h2>The Racing</h2>

      <div className="place-filters" style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'center',
        marginBottom: '30px',
        padding: '0 20px'
      }}>
        <button
          onClick={() => setHandicapOnly(!handicapOnly)}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            border: `1px solid ${handicapOnly ? 'var(--accent)' : 'var(--border)'}`,
            backgroundColor: handicapOnly ? 'var(--accent-bg)' : 'transparent',
            color: handicapOnly ? 'var(--text-h)' : 'var(--text)',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          Handicap Only
        </button>

        {uniquePlaces.map(place => {
          const isActive = selectedPlaces.includes(place);
          return (
            <button
              key={place}
              onClick={() => setSelectedPlaces(prev => 
                isActive ? prev.filter(p => p !== place) : [...prev, place]
              )}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                cursor: 'pointer',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
                color: isActive ? 'var(--text-h)' : 'var(--text)',
                fontSize: '13px',
                transition: 'all 0.2s ease'
              }}
            >
              {place}
            </button>
          );
        })}
        
      </div>

      {filteredRaces.map((race, index) => (
        <RaceCard key={`${race.time}-${race.place}`} race={race} />
      ))}
    </main>
  );
}

export default App;