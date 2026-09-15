import "@testing-library/jest-dom/vitest";

const safeRaf = (callback: FrameRequestCallback) => Number(setTimeout(callback, 0));
const safeCaf = (id?: number) => {
  if (id) clearTimeout(id);
};

(globalThis as any).requestAnimationFrame = safeRaf;
(globalThis as any).cancelAnimationFrame = safeCaf;

if (typeof global !== "undefined") {
  (global as any).requestAnimationFrame = safeRaf;
  (global as any).cancelAnimationFrame = safeCaf;
}

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

