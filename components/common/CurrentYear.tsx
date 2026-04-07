'use client';

import { useState, useEffect } from 'react';

export const CurrentYear = () => {
  // Use a fixed year for initial render on server to satisfy static generation
  const [year, setYear] = useState<number>(2026);

  useEffect(() => {
    // Only call date dynamic API on the client
    setYear(new Date().getFullYear());
  }, []);

  return <span suppressHydrationWarning>{year}</span>;
};
