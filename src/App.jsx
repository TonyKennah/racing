import React, { useState, useEffect } from 'react';
import RaceCard from './components/Racecard';

function App() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <h1>Today's Racing</h1>
      {races.map((race, index) => (
        <RaceCard key={index} race={race} />
      ))}
    </main>
  );
}

export default App;