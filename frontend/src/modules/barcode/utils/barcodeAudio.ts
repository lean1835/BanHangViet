/**
 * Web Audio API synthesizer for instant POS barcode scan feedback.
 * No external audio files needed; works with zero latency and offline.
 */
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const playBarcodeBeepSound = (type: "success" | "error" = "success"): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      // Pleasant high-pitch cash register scan chirp (1800Hz)
      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, now); // Note A6
      osc.frequency.exponentialRampToValueAtTime(2200, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.start(now);
      osc.stop(now + 0.09);
    } else {
      // Warning low dual beep for unrecognized / invalid barcode
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(240, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch {
    // Gracefully ignore audio synthesis errors in non-audio or restricted environments
  }
};
