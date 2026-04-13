import React, { useState, useEffect, useRef, useMemo } from 'react';
import RaceCard from './components/Racecard';
import SkeletonRaceCard from './components/SkeletonRaceCard';
import RaceTimeline from './components/RaceTimeline';
import './css/App.css';

function App() {
  const [races, setRaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [handicapOnly, setHandicapOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasScrolled = useRef(false);

  const uniquePlaces = useMemo(() => 
    [...new Set(races.map(r => r.place))].sort(),
    [races]
  );

  const filteredRaces = useMemo(() =>
    races.filter(race => {
      const matchesPlace = selectedPlaces.length === 0 || selectedPlaces.includes(race.place);
      const matchesHandicap = !handicapOnly || (race.detail && race.detail.toLowerCase().includes('handicap'));
      return matchesPlace && matchesHandicap;
    }),
    [races, selectedPlaces, handicapOnly]
  );

  useEffect(() => {
    if (!loading && filteredRaces.length > 0 && !hasScrolled.current) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const nextRace = filteredRaces.find(r => r.time >= currentTime);
      
      if (nextRace) {
        setTimeout(() => {
          // 1. Check if the user navigated via a deep link (URL hash)
          const hash = window.location.hash.substring(1); // Remove the '#'
          const hashedElement = hash ? document.getElementById(hash) : null;

          if (hashedElement) {
            hashedElement.scrollIntoView({ behavior: 'auto', block: 'start' });
            hasScrolled.current = true;
          } else {
            // 2. Fallback to automatic "next race" scrolling if no valid hash exists
            // Only scroll if the next race is within the next 10 minutes
            const [h, m] = nextRace.time.split(':').map(Number);
            const nextRaceTime = new Date(now);
            nextRaceTime.setHours(h, m, 0, 0);
            const diffMs = nextRaceTime - now;

            if (diffMs >= 0 && diffMs <= 10 * 60 * 1000) {
              const id = `${nextRace.time}${nextRace.place.replace(/\s+/g, '')}`;
              const element = document.getElementById(id);
              if (element) {
                element.scrollIntoView({ behavior: 'auto', block: 'start' });
                hasScrolled.current = true;
              }
            }
          }
        }, 600);
      }
    }
  }, [loading, filteredRaces]);

  useEffect(() => {
    fetch('https://www.pluckier.co.uk/todays.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setRaces(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <main>
      <h2>The Racing</h2>
      <SkeletonRaceCard />
      <SkeletonRaceCard />
      <SkeletonRaceCard />
    </main>
  );

  if (error) return (
    <div className="full-page-center">
      <p className="error">Error: {error}</p>
    </div>
  );

  return (
    <main>
      <h2>The Racing</h2>

      <div className="place-filters">
        <button
          onClick={() => setHandicapOnly(!handicapOnly)}
          className={`filter-btn handicap-btn ${handicapOnly ? 'active' : ''}`}
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
              className={`filter-btn ${isActive ? 'active' : ''}`}
            >
              {place}
            </button>
          );
        })}
      </div>

      <RaceTimeline races={filteredRaces} />
      {filteredRaces.map((race) => (
        <RaceCard key={`${race.time}-${race.place}`} race={race} />
      ))}
    </main>
  );
}

export default App;