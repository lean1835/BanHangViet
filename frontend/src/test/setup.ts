import "@testing-library/jest-dom/vitest";

const safeRaf = (callback: FrameRequestCallback) => Number(setTimeout(callback, 0));
const safeCaf = (id?: number) => {
  if (id) clearTimeout(id);
};

Object.defineProperty(globalThis, "requestAnimationFrame", {
  writable: true,
  configurable: true,
  value: safeRaf,
});

Object.defineProperty(globalThis, "cancelAnimationFrame", {
  writable: true,
  configurable: true,
  value: safeCaf,
});

if (typeof window !== "undefined") {
  window.requestAnimationFrame = safeRaf;
  window.cancelAnimationFrame = safeCaf;
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

