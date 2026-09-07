import "@testing-library/jest-dom/vitest";

const safeRaf = (callback: FrameRequestCallback) => Number(setTimeout(callback, 0));
const safeCaf = (id?: number) => {
  if (id) clearTimeout(id);
};

if (typeof window !== "undefined") {
  window.requestAnimationFrame = safeRaf;
  window.cancelAnimationFrame = safeCaf;
}

if (typeof globalThis !== "undefined") {
  globalThis.requestAnimationFrame = safeRaf;
  globalThis.cancelAnimationFrame = safeCaf;
}

if (typeof global !== "undefined") {
  (global as unknown as Window & typeof globalThis).requestAnimationFrame = safeRaf;
  (global as unknown as Window & typeof globalThis).cancelAnimationFrame = safeCaf;
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

