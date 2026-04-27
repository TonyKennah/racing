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
import { useAutoScroll } from './hooks/useAutoScroll';
import { useClock } from './hooks/useClock';
import { useNextRaceBanner } from './hooks/useNextRaceBanner';
import { useRaces } from './hooks/useRaces';
import { useTheme } from './hooks/useTheme';
import { formatDisplayDateTime } from './utils/dateUtils';
import './css/App.css';

function App() {
  const [displayDate, setDisplayDate] = useState(() => new Date());
  const currentTime = useClock();
  const { races, loading, error, refreshCooldown, handleManualRefresh } = useRaces(displayDate);
  const [filters, setFilters] = useState({places: [], handicap: false, follow: false, value: false, fiddle: false});
  const [theme, setTheme] = useTheme();
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const formattedDateTime = useMemo(() => {
    return formatDisplayDateTime(displayDate, currentTime);
  }, [currentTime, displayDate]);
  const uniquePlaces = useMemo(() => 
    [...new Set((Array.isArray(races) ? races : []).map(r => r.place))].sort(),
    [races]
  );
  const filteredRaces = useFilteredRaces(races, filters, currentTime, displayDate);
  const showNextRaceBanner = useNextRaceBanner(filteredRaces.length, currentTime, filters.follow);
  
  useAutoScroll(loading, filteredRaces);

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

      {showNextRaceBanner && (
        <div className="next-race-banner">
          🕒 Race finished. Moved to next scheduled off...
        </div>
      )}

      <Modal isOpen={showMovementModal} onClose={() => setShowMovementModal(false)} title="Card-wide Odds Movement">
        <OddsMovementSummary races={filteredRaces} onClose={() => setShowMovementModal(false)} />
      </Modal>

      <Modal isOpen={showFavoriteModal} onClose={() => setShowFavoriteModal(false)} title="Strong Favourites (Top Rated & Shortest Odds)">
        <FavoriteSelections races={filteredRaces} onClose={() => setShowFavoriteModal(false)} />
      </Modal>
      
      <RaceGrid races={filteredRaces} filters={filters} />

    </main>
  );
}

export default App;