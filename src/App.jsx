import React, { useState, useEffect, useRef, useMemo } from 'react';
import SkeletonRaceCard from './components/SkeletonRaceCard';
import SkeletonRaceTimeline from './components/SkeletonRaceTimeline';
import RaceTimeline from './components/RaceTimeline';
import Modal from './components/Modal';
import OddsMovementSummary from './components/OddsMovementSummary';
import FavoriteSelections from './components/FavoriteSelections';
import Navigation from './components/Navigation';
import SearchOverlay from './components/SearchOverlay';
import FilterBar from './components/FilterBar';
import RaceGrid from './components/RaceGrid';
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const [showNextRaceBanner, setShowNextRaceBanner] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);

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

  const prevCountRef = useRef(filteredRaces.length);
  const prevTimeRef = useRef(currentTime);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    const prevTime = prevTimeRef.current;
    prevCountRef.current = filteredRaces.length;
    prevTimeRef.current = currentTime;

    if (filters.follow && currentTime.getTime() !== prevTime.getTime() && filteredRaces.length < prevCount && prevCount > 0) {
      setShowNextRaceBanner(true);
      const timer = setTimeout(() => setShowNextRaceBanner(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [filteredRaces.length, currentTime, filters.follow]);

  useEffect(() => {
    if (!loading && filteredRaces.length > 0 && !hasScrolled.current) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const nextRace = filteredRaces.find(r => r.time >= timeStr);
      
      if (nextRace) {
        setTimeout(() => {
          const hash = window.location.hash.substring(1);
          const hashedElement = hash ? document.getElementById(hash) : null;

          if (hashedElement) {
            hashedElement.scrollIntoView({ behavior: 'auto', block: 'start' });
            hasScrolled.current = true;
          } else {
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

  if (loading) {
    return (
      <main>
        <Navigation 
          theme={theme} setTheme={setTheme} 
          onRefresh={handleManualRefresh} refreshCooldown={true} 
          displayDate={displayDate} setDisplayDate={setDisplayDate} 
          formattedDateTime={formattedDateTime} 
        >
          <SearchOverlay races={[]} />
        </Navigation>
        <SkeletonRaceTimeline />
        <SkeletonRaceCard />
        <SkeletonRaceCard />
        <SkeletonRaceCard />
      </main>
    );
  }

  if (error) return (
    <main>
      <Navigation 
        theme={theme} setTheme={setTheme} 
        onRefresh={handleManualRefresh} refreshCooldown={refreshCooldown} 
        displayDate={displayDate} setDisplayDate={setDisplayDate} 
        formattedDateTime={formattedDateTime} 
      >
        <SearchOverlay races={[]} />
      </Navigation>
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
      <Navigation 
        theme={theme} 
        setTheme={setTheme} 
        onRefresh={handleManualRefresh} 
        refreshCooldown={refreshCooldown} 
        displayDate={displayDate} 
        setDisplayDate={setDisplayDate} 
        formattedDateTime={formattedDateTime} 
      >
        <SearchOverlay races={races} />
      </Navigation>

      <FilterBar 
        filters={filters} 
        setFilters={setFilters} 
        uniquePlaces={uniquePlaces} 
        onShowMovement={() => setShowMovementModal(true)} 
        onShowFavorites={() => setShowFavoriteModal(true)} 
      />

      <RaceTimeline races={filteredRaces} theme={theme} />

      <Modal isOpen={showMovementModal} onClose={() => setShowMovementModal(false)} title="Card-wide Odds Movement">
        <OddsMovementSummary races={filteredRaces} onClose={() => setShowMovementModal(false)} />
      </Modal>

      <Modal isOpen={showFavoriteModal} onClose={() => setShowFavoriteModal(false)} title="Strong Favourites (Top Rated & Shortest Odds)">
        <FavoriteSelections races={filteredRaces} onClose={() => setShowFavoriteModal(false)} />
      </Modal>

      {showNextRaceBanner && (
        <div className="next-race-banner">
          🕒 Race finished. Moved to next scheduled off...
        </div>
      )}
      
      <RaceGrid races={filteredRaces} filters={filters} />

    </main>
  );
}

export default App;