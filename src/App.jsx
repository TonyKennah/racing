import React from 'react';
import { useAppState } from './hooks/useAppState';
import SkeletonRaceCard from './components/SkeletonRaceCard';
import SkeletonRaceTimeline from './components/SkeletonRaceTimeline';
import RaceTimeline from './components/RaceTimeline';
import Modal from './components/Modal';
import OddsMovementSummary from './components/OddsMovementSummary';
import FavoriteSelections from './components/FavoriteSelections';
import Layout from './components/Layout';
import FilterBar from './components/FilterBar';
import RaceGrid from './components/RaceGrid';
import './css/App.css';

function App() {
  const s = useAppState(); // 's' for state - keeping the JSX below ultra-concise

  return (
    <Layout 
      navProps={{
        theme: s.theme, 
        setTheme: s.setTheme,
        onRefresh: s.handleManualRefresh, 
        refreshCooldown: s.loading || s.refreshCooldown,
        displayDate: s.displayDate, 
        setDisplayDate: s.setDisplayDate,
        formattedDateTime: s.formattedDateTime
      }}
      searchRaces={s.loading || s.error ? [] : s.races}
    >
      {s.loading ? (
        <>
          <SkeletonRaceTimeline />
          <SkeletonRaceCard />
          <SkeletonRaceCard />
          <SkeletonRaceCard />
        </>
      ) : s.error ? (
        <div className="full-page-center">
          <p className="error">Error: {s.error}</p>
          <button className="filter-btn error-retry-btn" onClick={() => s.setDisplayDate(new Date())}>
            Go to Today
          </button>
        </div>
      ) : (
        <>
          <FilterBar 
            filters={s.filters} 
            setFilters={s.setFilters} 
            uniquePlaces={s.uniquePlaces} 
            onShowMovement={() => s.setActiveModal('movement')} 
            onShowFavorites={() => s.setActiveModal('favorites')} 
          />

          {s.showNextRaceBanner && (
            <div className="next-race-banner">
              🕒 Race finished. Moved to next scheduled off...
            </div>
          )}
          
          <RaceTimeline races={s.filteredRaces} theme={s.theme} />

          <Modal 
            isOpen={!!s.activeModal} 
            onClose={() => s.setActiveModal(null)} 
            title={s.activeModal === 'movement' ? "Card-wide Odds Movement" : "Strong Favourites"}
          >
            {s.activeModal === 'movement' && (
              <OddsMovementSummary races={s.filteredRaces} onClose={() => s.setActiveModal(null)} />
            )}
            {s.activeModal === 'favorites' && (
              <FavoriteSelections races={s.filteredRaces} onClose={() => s.setActiveModal(null)} />
            )}
          </Modal>
          
          <RaceGrid races={s.filteredRaces} filters={s.filters} />
        </>
      )}
    </Layout>
  );
}

export default App;