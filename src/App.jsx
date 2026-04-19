import React, { useState, useEffect, useRef, useMemo } from 'react';
import RaceCard from './components/Racecard';
import SkeletonRaceCard from './components/SkeletonRaceCard';
import SkeletonRaceTimeline from './components/SkeletonRaceTimeline';
import RaceTimeline from './components/RaceTimeline';
import Modal from './components/Modal';
import OddsMovementSummary from './components/OddsMovementSummary';
import InterestingSelections from './components/InterestingSelections';
import FavoriteSelections from './components/FavoriteSelections';
import FiddleSelections from './components/FiddleSelections';
import './css/App.css';

function App() {
  const [races, setRaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [handicapOnly, setHandicapOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasScrolled = useRef(false);
  const [showNextRaceBanner, setShowNextRaceBanner] = useState(false);
  const [followRacing, setFollowRacing] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showInterestingModal, setShowInterestingModal] = useState(false);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [showFiddleModal, setShowFiddleModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formattedDateTime = useMemo(() => {
    const targetDate = new Date(currentTime);
    // If it's 9 PM or later, the racing data shown is for tomorrow
    if (currentTime.getHours() >= 21) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const time = currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(/\s/g, '');

    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const day = targetDate.getDate();
    const month = targetDate.toLocaleString('default', { month: 'long' });

    return `for ${getOrdinal(day)} ${month} (${time})`;
  }, [currentTime]);

  const uniquePlaces = useMemo(() => 
    [...new Set(races.map(r => r.place))].sort(),
    [races]
  );

  const filteredRaces = useMemo(() =>
    {
      const isShowingTomorrow = currentTime.getHours() >= 21;
      const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

      return races.filter(race => {
      const matchesPlace = selectedPlaces.length === 0 || selectedPlaces.includes(race.place);
      const matchesHandicap = !handicapOnly || (race.detail && race.detail.toLowerCase().includes('handicap'));

      const [rH, rM] = race.time.split(':').map(Number);
      const raceMinutes = rH * 60 + rM;
      const matchesFollow = !followRacing || isShowingTomorrow || nowMinutes <= (raceMinutes + 3);

      return matchesPlace && matchesHandicap && matchesFollow;
    })},
    [races, selectedPlaces, handicapOnly, followRacing, currentTime]
  );

  // Track changes to show a "Next Race" transition message
  const prevCountRef = useRef(filteredRaces.length);
  const prevTimeRef = useRef(currentTime);

  useEffect(() => {
    // If followRacing is active and the count dropped because time moved forward
    if (
      followRacing && 
      currentTime !== prevTimeRef.current && 
      filteredRaces.length < prevCountRef.current && 
      prevCountRef.current > 0
    ) {
      setShowNextRaceBanner(true);
      const timer = setTimeout(() => setShowNextRaceBanner(false), 4000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = filteredRaces.length;
    prevTimeRef.current = currentTime;
  }, [filteredRaces.length, currentTime, followRacing]);

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
    const now = new Date();
    const currentHour = now.getHours(); // 0-23

    let targetDate = new Date(now);
    // If it's 9 PM or later, fetch tomorrow's data
    if (currentHour >= 21) { 
      targetDate.setDate(now.getDate() + 1);
    }

    const day = String(targetDate.getDate()).padStart(2, '0');
    const month = String(targetDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = targetDate.getFullYear();
    const dateString = `${day}-${month}-${year}`;

    fetch(`https://www.pluckier.co.uk/${dateString}-races.json`, { cache: 'no-store' })
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
      <h2>The Racing {formattedDateTime}</h2>
      <SkeletonRaceTimeline />
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
    <main id="home">
      <h2>The Racing {formattedDateTime}</h2>

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

      <div className="summary-controls">
        <button 
          className={`filter-btn follow-btn ${followRacing ? 'active' : ''}`}
          onClick={() => setFollowRacing(!followRacing)}
          title="Only show races that haven't run yet"
        >
          ⏱️ Follow
        </button>
        <button 
          className="filter-btn movement-summary-btn"
          onClick={() => setShowMovementModal(true)}
          title="Show odds movements"
        >
          📊 Odds 
        </button>
        <button 
          className="filter-btn interesting-selections-btn"
          onClick={() => setShowInterestingModal(true)}
          title="Show well rated big prices"
        >
          ⭐ Value
        </button>
        <button 
          className="filter-btn strong-favorites-btn"
          onClick={() => setShowFavoriteModal(true)}
          title="Show short priced favourites"
        >
          🎯 Short
        </button>
        <button 
          className="filter-btn fiddle-btn"
          onClick={() => setShowFiddleModal(true)}
          title="Show well connected horses"
        >
          🎻 Fiddles
        </button>
      </div>

      <Modal 
        isOpen={showMovementModal} 
        onClose={() => setShowMovementModal(false)} 
        title="Card-wide Odds Movement"
      >
        <OddsMovementSummary 
          races={filteredRaces} 
          onClose={() => setShowMovementModal(false)} 
        />
      </Modal>

      <Modal 
        isOpen={showInterestingModal} 
        onClose={() => setShowInterestingModal(false)} 
        title="Interesting Selections (Top Rated & Odds > 9 & > 80% FORM)"
      >
        <InterestingSelections 
          races={filteredRaces} 
          onClose={() => setShowInterestingModal(false)} 
        />
      </Modal>

      <Modal 
        isOpen={showFavoriteModal} 
        onClose={() => setShowFavoriteModal(false)} 
        title="Strong Favourites (Top Rated & Shortest Odds)"
      >
        <FavoriteSelections 
          races={filteredRaces} 
          onClose={() => setShowFavoriteModal(false)} 
        />
      </Modal>

      <Modal 
        isOpen={showFiddleModal} 
        onClose={() => setShowFiddleModal(false)} 
        title="Fiddle Selections (Key Connections)"
      >
        <FiddleSelections 
          races={filteredRaces} 
          onClose={() => setShowFiddleModal(false)} 
        />
      </Modal>
      
      {showNextRaceBanner && (
        <div className="next-race-banner">
          🕒 Race finished. Moving to next scheduled off...
        </div>
      )}
      
      {filteredRaces.map((race) => (
        <RaceCard 
          key={`${race.time}-${race.place}`} 
          race={race} 
          allRaces={filteredRaces} 
        />
      ))}
    </main>
  );
}

export default App;