'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const Lenis = dynamic(
  () => import('@studio-freight/lenis').then(m => m.default),
  { ssr: false }
);

export function useSmoothScroll() {
  useEffect(() => {
    let lenis: any;

    import('@studio-freight/lenis').then(({ default: LenisLib }) => {
      lenis = new LenisLib({
        duration: 1.2,
        smooth: true,
      });

      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    });

    return () => {
      lenis?.destroy?.();
    };
  }, []);
}
