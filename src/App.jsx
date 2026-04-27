import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import RaceCard from './components/Racecard';
import SkeletonRaceCard from './components/SkeletonRaceCard';
import SkeletonRaceTimeline from './components/SkeletonRaceTimeline';
import RaceTimeline from './components/RaceTimeline';
import Modal from './components/Modal';
import OddsMovementSummary from './components/OddsMovementSummary';
import FavoriteSelections from './components/FavoriteSelections';
import { useFilteredRaces } from './hooks/useFilteredRaces';
import { useRaces } from './hooks/useRaces';
import { useTheme } from './hooks/useTheme';
import './css/App.css';

function App() {
  const [displayDate, setDisplayDate] = useState(() => new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const { races, loading, error, refreshCooldown, handleManualRefresh } = useRaces(displayDate);
  const [filters, setFilters] = useState({
    places: [],
    handicap: false,
    follow: false,
    value: false,
    fiddle: false
  });
  const hasScrolled = useRef(false);
  const [theme, setTheme] = useTheme();

  const [showNextRaceBanner, setShowNextRaceBanner] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
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

  const filteredRaces = useFilteredRaces(races, filters, currentTime, displayDate);

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
      filters.follow && 
      currentTime.getTime() !== prevTime.getTime() && 
      filteredRaces.length < prevCount && 
      prevCount > 0
    ) {
      setShowNextRaceBanner(true);
      const timer = setTimeout(() => setShowNextRaceBanner(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [filteredRaces.length, currentTime, filters.follow]);

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
      id="main-date-picker"
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
      className="hidden-date-input"
    />
  );

  const searchBar = (
    <div className="top-bar">
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Search..."
          className="filter-btn search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((res, i) => (
              <div
                key={`${res.id}-${i}`}
                onClick={() => handleSearchSelect(res.id)}
                className="search-result-item"
              >
                <span className="search-result-name">{res.name}</span>
                <span className="search-result-info">{res.info}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button 
        className={`filter-btn refresh-btn ${refreshCooldown ? 'disabled' : ''}`}
        onClick={handleManualRefresh}
        disabled={refreshCooldown}
        title={refreshCooldown ? "Cooldown active" : "Refresh data"}
      >
        ↻
      </button>
      <div> 
        <form action="https://www.paypal.com/donate" method="post" target="_blank"><input type="hidden" name="hosted_button_id" value="P9PLRQL24TBAN" /><input type="image" src="https://www.paypalobjects.com/en_GB/i/btn/btn_donate_SM.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" /><img alt="" border="0" src="https://www.paypal.com/en_GB/i/scr/pixel.gif" width="1" height="1" /></form>
      </div>
      <div className="theme-toggle-group">
        <button onClick={() => setTheme('light')} className={`theme-btn ${theme === 'light' ? 'active' : ''}`} title="Light Mode">☀️</button>
        <button onClick={() => setTheme('dark')} className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} title="Dark Mode">🌙</button>
      </div>
    </div>
  );

  if (loading) return (
    <main>
      {searchBar}
      <label htmlFor="main-date-picker">
        <h2 
          onClick={handleOpenDatePicker} 
          className="date-header"
          title="Click to change date"
        >
          The Racing {formattedDateTime}
          <span className="date-icon">📅</span>
        </h2>
      </label>
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
      <label htmlFor="main-date-picker">
        <h2 
          onClick={handleOpenDatePicker} 
          className="date-header"
          title="Click to change date"
        >
          The Racing {formattedDateTime}
          <span className="date-icon">📅</span>
        </h2>
      </label>
      {datePickerInput}
      <div className="full-page-center">
        <p className="error">Error: {error}</p>
        <button 
          className="filter-btn error-retry-btn" 
          onClick={() => setDisplayDate(new Date())}
        >
          Go to Today
        </button>
      </div>
    </main>
  );

  return (
    <main id="home">
      {searchBar}
      <label htmlFor="main-date-picker">
        <h2 
          onClick={handleOpenDatePicker} 
          className="date-header" 
          title="Click to change date"
        >
          The Racing {formattedDateTime}
          <span className="date-icon">📅</span>
        </h2>
      </label>
      {datePickerInput}

      <div className="place-filters">
        <button
          onClick={() => setFilters(f => ({ ...f, handicap: !f.handicap }))}
          className={`filter-btn handicap-btn ${filters.handicap ? 'active' : ''}`}
        >
          Handicap Only
        </button>

        {uniquePlaces.map(place => {
          const isActive = filters.places.includes(place);
          return (
            <button
              key={place}
              onClick={() => setFilters(f => ({
                ...f,
                places: isActive ? f.places.filter(p => p !== place) : [...f.places, place]
              }))}
              className={`filter-btn ${isActive ? 'active' : ''}`}
            >
              {place}
            </button>
          );
        })}
      </div>

      <RaceTimeline races={filteredRaces} theme={theme} />

      <div className="summary-controls">
        <button 
          className={`filter-btn follow-btn ${filters.follow ? 'active' : ''}`}
          onClick={() => setFilters(f => ({ ...f, follow: !f.follow }))}
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
          className={`filter-btn interesting-selections-btn ${filters.value ? 'active' : ''}`}
          onClick={() => setFilters(f => ({ ...f, value: !f.value }))}
          title="Highlight well rated big prices"
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
          className={`filter-btn fiddle-btn ${filters.fiddle ? 'active' : ''}`}
          onClick={() => setFilters(f => ({ ...f, fiddle: !f.fiddle }))}
          title="Highlight well connected horses"
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
        isOpen={showFavoriteModal} 
        onClose={() => setShowFavoriteModal(false)} 
        title="Strong Favourites (Top Rated & Shortest Odds)"
      >
        <FavoriteSelections 
          races={filteredRaces} 
          onClose={() => setShowFavoriteModal(false)} 
        />
      </Modal>

      {showNextRaceBanner && (
        <div className="next-race-banner">
          🕒 Race finished. Moved to next scheduled off...
        </div>
      )}
      
      {filteredRaces.map((race) => (
        <RaceCard 
          key={`${race.time}-${race.place}`} 
          race={race} 
          allRaces={filteredRaces} 
          highlightFiddles={filters.fiddle}
          highlightValues={filters.value}
        />
      ))}
    </main>
  );
}

export default App;