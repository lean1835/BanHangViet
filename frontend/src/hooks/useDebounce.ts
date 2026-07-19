import { useState, useEffect } from "react";
import { APP_TIMING } from "@/constants/app";

/**
 * Custom hook to debounce a rapidly changing value.
 * @param value The value to debounce.
 * @param delay Delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(
  value: T,
  delay: number = APP_TIMING.DEFAULT_DEBOUNCE_MS,
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
