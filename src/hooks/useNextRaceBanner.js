import { useState, useEffect, useRef } from 'react';

export function useNextRaceBanner(filteredRacesCount, currentTime, isFollowMode) {
  const [showBanner, setShowBanner] = useState(false);
  const prevCountRef = useRef(filteredRacesCount);
  const prevTimeRef = useRef(currentTime);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    const prevTime = prevTimeRef.current;
    
    prevCountRef.current = filteredRacesCount;
    prevTimeRef.current = currentTime;

    // Trigger banner if in Follow mode and a race just disappeared from the list due to a time update
    if (isFollowMode && currentTime.getTime() !== prevTime.getTime() && filteredRacesCount < prevCount && prevCount > 0) {
      setShowBanner(true);
      const timer = setTimeout(() => setShowBanner(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [filteredRacesCount, currentTime, isFollowMode]);

  return showBanner;
}
