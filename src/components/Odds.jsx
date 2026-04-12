import React, { useState, useEffect } from 'react';
import '../css/Odds.css';

// Shared variables to ensure we only fetch the data once for all components
let cachedOdds = null;
let fetchPromise = null;

const Odds = ({ horseName }) => {
  const [odds, setOdds] = useState('..');

  useEffect(() => {
    const getOdds = async () => {
      // 1. Use cached data if available
      if (cachedOdds) {
        findAndSet(cachedOdds);
        return;
      }

      // 2. If a fetch is already in progress, wait for it. Otherwise, start it.
      if (!fetchPromise) {
        fetchPromise = fetch('https://www.pluckier.co.uk/odds.json', { cache: 'no-store' })
          .then(res => res.ok ? res.json() : [])
          .catch(() => []);
      }

      const data = await fetchPromise;
      cachedOdds = data;
      findAndSet(data);
    };

    const findAndSet = (data) => {
      if (!Array.isArray(data)) return;
      const normalize = (name) => name?.toUpperCase().replace(/['\s]/g, '');
      const targetName = normalize(horseName);
      const match = data.find(item => normalize(item.name) === targetName);
      setOdds(match ? (match.odds ?? 'NR') : 'n/a');
    };

    getOdds();
  }, [horseName]);

  return <span className="odds-value">{odds}</span>;
};

export default Odds;