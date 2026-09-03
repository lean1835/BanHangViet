import { useState, useEffect } from "react";

/**
 * Smoothly animates a number from 0 to target value
 * using quartic easing for a natural, satisfying counter effect.
 */
export const useAnimatedNumber = (
  target: number,
  duration: number = 1800,
  delay: number = 150
): number => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let startTimestamp: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (!target || target === 0) {
      setValue(0);
      return;
    }

    const startValue = 0;
    const diff = target - startValue;

    const startAnimation = () => {
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);

        // Quartic out easing: starts fast, then eases gracefully into final number
        const ease = 1 - Math.pow(1 - progress, 4);
        const nextValue = Math.round(startValue + diff * ease);
        setValue(nextValue);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setValue(target);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    };

    if (delay > 0) {
      timeoutId = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (typeof cancelAnimationFrame !== "undefined" && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [target, duration, delay]);

  return value;
};
