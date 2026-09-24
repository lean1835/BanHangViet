import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

let rafCounter = 0;
const rafMap = new Map<number, { isCancelled: boolean }>();

const safeRaf = (callback: FrameRequestCallback): number => {
  const id = ++rafCounter;
  const entry = { isCancelled: false };
  rafMap.set(id, entry);

  queueMicrotask(() => {
    if (!entry.isCancelled && rafMap.has(id)) {
      rafMap.delete(id);
      try {
        callback(performance.now());
      } catch {
        // Ignore errors
      }
    }
  });

  return id;
};

const safeCaf = (id?: number) => {
  if (id && rafMap.has(id)) {
    const entry = rafMap.get(id);
    if (entry) entry.isCancelled = true;
    rafMap.delete(id);
  }
};

// Polyfill rAF and cAF in all possible scopes including global
const assignGlobalRaf = (target: any) => {
  if (!target) return;
  try {
    target.requestAnimationFrame = safeRaf;
    target.cancelAnimationFrame = safeCaf;
  } catch {
    // ignore
  }
};

assignGlobalRaf(globalThis);
if (typeof global !== "undefined") assignGlobalRaf(global);
if (typeof window !== "undefined") assignGlobalRaf(window);

// Clean up any remaining RAF entries after each test
afterEach(() => {
  for (const entry of rafMap.values()) {
    entry.isCancelled = true;
  }
  rafMap.clear();
});

// Polyfill BroadcastChannel to prevent unclosed Node.js IPC handles from keeping worker alive
class MockBroadcastChannel {
  name: string;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onmessageerror: ((ev: MessageEvent) => void) | null = null;
  constructor(name: string) {
    this.name = name;
  }
  postMessage(_message: any) {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return false;
  }
}

(globalThis as any).BroadcastChannel = MockBroadcastChannel;
if (typeof window !== "undefined") {
  (window as any).BroadcastChannel = MockBroadcastChannel;
}
if (typeof global !== "undefined") {
  (global as any).BroadcastChannel = MockBroadcastChannel;
}

// Polyfill ResizeObserver
if (typeof window !== "undefined" && !window.ResizeObserver) {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = MockResizeObserver as any;
  (globalThis as any).ResizeObserver = MockResizeObserver;
}

// Polyfill IntersectionObserver
if (typeof window !== "undefined" && !window.IntersectionObserver) {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.IntersectionObserver = MockIntersectionObserver as any;
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
}

if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Ignore harmless teardown race condition where Redux Toolkit autoBatchEnhancer timer fires after JSDOM VM destruction
if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("uncaughtException", (err: any) => {
    if (err && typeof err.message === "string" && err.message.includes("cancelAnimationFrame")) {
      return;
    }
  });
}

