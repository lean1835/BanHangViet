import { useState, useEffect } from "react";

/**
 * Returns an animated progress scalar from 0 (blank/empty) to 1 (full data)
 * using quartic ease-out. Triggers whenever deps change.
 */
export const useProgressAnimation = (
  deps: unknown[] = [],
  duration: number = 1800,
  delay: number = 150
): number => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    let animId: number;
    let startTimestamp: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const p = Math.min(elapsed / duration, 1);
      // Smooth cubic-out easing for natural cinematic drawing
      const ease = 1 - Math.pow(1 - p, 3);
      setProgress(ease);

      if (p < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setProgress(1);
      }
    };

    timeoutId = setTimeout(() => {
      animId = requestAnimationFrame(step);
    }, delay);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (typeof cancelAnimationFrame !== "undefined" && animId) {
        cancelAnimationFrame(animId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return progress;
};
