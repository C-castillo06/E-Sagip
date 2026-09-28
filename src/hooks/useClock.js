'use client';

import { useEffect, useState } from 'react';

// ========================================
// LIVE CLOCK
// ========================================

export function useClock(intervalMs = 30000) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
