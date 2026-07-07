'use client';

export const CurrentYear = () => {
  const year = new Date().getFullYear();

  return <span suppressHydrationWarning>{year}</span>;
};
