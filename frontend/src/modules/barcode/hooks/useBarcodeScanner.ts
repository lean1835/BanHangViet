import { useEffect, useRef } from "react";

interface IUseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minBarcodeLength?: number;
  maxIntervalMs?: number;
}

/**
 * Custom hook to detect USB/Bluetooth barcode scanner HID keystroke events.
 * Barcode scanners type characters extremely fast (<35ms per character) followed by "Enter".
 */
export const useBarcodeScanner = ({
  onScan,
  enabled = true,
  minBarcodeLength = 3,
  maxIntervalMs = 45,
}: IUseBarcodeScannerOptions): void => {
  const bufferRef = useRef<string[]>([]);
  const lastTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  // Keep latest onScan callback reference
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys alone
      if (
        e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta" ||
        e.key === "CapsLock" ||
        e.key === "Tab"
      ) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // If key is Enter, evaluate if we have a rapid barcode sequence
      if (e.key === "Enter") {
        if (bufferRef.current.length >= minBarcodeLength) {
          const barcode = bufferRef.current.join("").trim();
          bufferRef.current = [];
          if (barcode.length >= minBarcodeLength) {
            e.preventDefault();
            e.stopPropagation();
            onScanRef.current(barcode);
          }
        } else {
          bufferRef.current = [];
        }
        return;
      }

      // If time between keystrokes is too long (> maxIntervalMs), reset buffer to single character
      if (timeDiff > maxIntervalMs) {
        bufferRef.current = [];
      }

      // Only accept printable 1-character keystrokes
      if (e.key.length === 1) {
        bufferRef.current.push(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, minBarcodeLength, maxIntervalMs]);
};
