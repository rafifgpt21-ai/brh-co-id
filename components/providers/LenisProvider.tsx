"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, Suspense } from "react";

function LenisScrollHandler() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
      lenis.resize();
      
      // Sync with global window object for debugging and external scripts
      if (typeof window !== 'undefined') {
        (window as any).lenis = lenis;
      }
    }
  }, [pathname, lenis]);

  return null;
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <Suspense fallback={null}>
        <LenisScrollHandler />
      </Suspense>
      {children}
    </ReactLenis>
  );
}
