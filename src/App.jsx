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
  const [displayDate, setDisplayDate] = useState(() => {
    const now = new Date();
    // If it's 9 PM or later, initialize with tomorrow's date
    if (now.getHours() >= 21) {
      now.setDate(now.getDate() + 1);
    }
    return now;
  });
  const dateInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || !Array.isArray(races)) return [];
    
    const matches = [];
    races.forEach(race => {
      race.horses?.forEach(horse => {
        if (horse.name?.toLowerCase().includes(term) || horse.trainer?.toLowerCase().includes(term)) {
          matches.push({
            name: horse.name,
            id: `${race.time}${race.place.replace(/\s+/g, '')}`,
            info: `${horse.trainer} - ${race.time} ${race.place}`
          });
        }
      });
    });
    return matches.slice(0, 10);
  }, [searchTerm, races]);

  const handleSearchSelect = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
      setSearchTerm('');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formattedDateTime = useMemo(() => {
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

    const day = displayDate.getDate();
    const month = displayDate.toLocaleString('default', { month: 'long' });

    return `for ${getOrdinal(day)} ${month} (${time})`;
  }, [currentTime, displayDate]);

  const uniquePlaces = useMemo(() => 
    [...new Set((Array.isArray(races) ? races : []).map(r => r.place))].sort(),
    [races]
  );

  const filteredRaces = useMemo(() =>
    {
      const today = new Date();
      today.setHours(0,0,0,0);
      const dDate = new Date(displayDate);
      dDate.setHours(0,0,0,0);
      // Determine if the selected card is in the future relative to today
      const isShowingFuture = dDate > today;

      const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

      const pool = Array.isArray(races) ? races : [];

      return pool.filter(race => {
      if (!race?.time) return false;
      const matchesPlace = selectedPlaces.length === 0 || selectedPlaces.includes(race.place);
      const matchesHandicap = !handicapOnly || (race.detail && race.detail.toLowerCase().includes('handicap'));

      const [rH, rM] = race.time.split(':').map(Number);
      const raceMinutes = rH * 60 + rM;
      const matchesFollow = !followRacing || isShowingFuture || nowMinutes <= (raceMinutes + 3);

      return matchesPlace && matchesHandicap && matchesFollow;
    })},
    [races, selectedPlaces, handicapOnly, followRacing, currentTime, displayDate]
  );

  // Track changes to show a "Next Race" transition message
  const prevCountRef = useRef(filteredRaces.length);
  const prevTimeRef = useRef(currentTime);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    const prevTime = prevTimeRef.current;

    // Always update tracking refs to current values for the next cycle
    prevCountRef.current = filteredRaces.length;
    prevTimeRef.current = currentTime;

    // If followRacing is active and the count dropped because time moved forward
    if (
      followRacing && 
      currentTime.getTime() !== prevTime.getTime() && 
      filteredRaces.length < prevCount && 
      prevCount > 0
    ) {
      setShowNextRaceBanner(true);
      const timer = setTimeout(() => setShowNextRaceBanner(false), 4000);
      return () => clearTimeout(timer);
    }
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
    setLoading(true);
    setError(null);
    const day = String(displayDate.getDate()).padStart(2, '0');
    const month = String(displayDate.getMonth() + 1).padStart(2, '0');
    const year = displayDate.getFullYear();
    const dateString = `${day}-${month}-${year}`;

    fetch(`https://www.pluckier.co.uk/${dateString}-races.json`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Races for this date are not available');
        }
        return response.json();
      })
      .then((data) => {
        // Ensure data is an array before setting state
        if (Array.isArray(data)) {
          setRaces(data);
        } else {
          throw new Error('Unexpected data format from server');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [displayDate]);

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  const dateInputValue = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, '0')}-${String(displayDate.getDate()).padStart(2, '0')}`;

  const datePickerInput = (
    <input
      type="date"
      ref={dateInputRef}
      value={dateInputValue}
      onChange={(e) => {
        if (e.target.value) {
          const [y, m, d] = e.target.value.split('-').map(Number);
          const newDate = new Date(y, m - 1, d);
          setDisplayDate(newDate);
          hasScrolled.current = false;
        }
      }}
      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
    />
  );

  const searchBar = (
    <div className="search-container" style={{ position: 'relative', marginBottom: '15px' }}>
      <input
        type="text"
        placeholder="🔍 Search horse name..."
        className="filter-btn"
        style={{ width: '100%', textAlign: 'left', cursor: 'text', background: '#1a1a1a', paddingLeft: '15px' }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchResults.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#2a2a2a',
          zIndex: 2000,
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #444',
          marginTop: '5px'
        }}>
          {searchResults.map((res, i) => (
            <div
              key={`${res.id}-${i}`}
              onClick={() => handleSearchSelect(res.id)}
              style={{
                padding: '12px 15px',
                borderBottom: i === searchResults.length - 1 ? 'none' : '1px solid #3d3d3d',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3d3d3d'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ fontWeight: '600' }}>{res.name}</span>
              <span style={{ color: '#888', fontSize: '0.9em' }}>{res.info}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return (
    <main>
      {searchBar}
      <h2 
        onClick={handleOpenDatePicker} 
        style={{ cursor: 'pointer' }}
        title="Click to change date"
      >
        The Racing {formattedDateTime}
        <span style={{ marginLeft: '10px', fontSize: '1rem' }}>📅</span>
      </h2>
      {datePickerInput}
      <SkeletonRaceTimeline />
      <SkeletonRaceCard />
      <SkeletonRaceCard />
      <SkeletonRaceCard />
    </main>
  );

  if (error) return (
    <main>
      {searchBar}
      <h2 
        onClick={handleOpenDatePicker} 
        style={{ cursor: 'pointer' }}
        title="Click to change date"
      >
        The Racing {formattedDateTime}
        <span style={{ marginLeft: '10px', fontSize: '1rem' }}>📅</span>
      </h2>
      {datePickerInput}
      <div className="full-page-center">
        <p className="error">Error: {error}</p>
        <button 
          className="filter-btn" 
          onClick={() => setDisplayDate(new Date())}
          style={{ marginTop: '20px' }}
        >
          Go to Today
        </button>
      </div>
    </main>
  );

  return (
    <main id="home">
      {searchBar}
      <h2 
        onClick={handleOpenDatePicker} 
        style={{ cursor: 'pointer' }} 
        title="Click to change date"
      >
        The Racing {formattedDateTime}
        <span style={{ marginLeft: '10px', fontSize: '1rem' }}>📅</span>
      </h2>
      {datePickerInput}

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