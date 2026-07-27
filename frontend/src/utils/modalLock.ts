let modalLockCount = 0;
let savedBodyOverflow = "";
let savedRootAriaHidden: string | null = null;
let savedRootHadInert = false;

interface IModalLayer {
  token: symbol;
  element: HTMLElement;
  originalAriaHidden: string | null;
  originallyInert: boolean;
}

const modalLayers: IModalLayer[] = [];

const restoreLayerState = (layer: IModalLayer): void => {
  if (!layer.element.isConnected) return;
  if (layer.originalAriaHidden === null) {
    layer.element.removeAttribute("aria-hidden");
  } else {
    layer.element.setAttribute("aria-hidden", layer.originalAriaHidden);
  }
  if (layer.originallyInert) layer.element.setAttribute("inert", "");
  else layer.element.removeAttribute("inert");
};

const syncModalLayers = (): void => {
  const connectedLayers = modalLayers.filter((layer) => layer.element.isConnected);
  const topLayer = connectedLayers.at(-1) ?? null;

  for (const layer of connectedLayers) {
    if (layer === topLayer) {
      restoreLayerState(layer);
    } else {
      layer.element.setAttribute("aria-hidden", "true");
      layer.element.setAttribute("inert", "");
    }
  }
};

export const getTopModalLayer = (): HTMLElement | null => {
  for (let index = modalLayers.length - 1; index >= 0; index -= 1) {
    if (modalLayers[index].element.isConnected) return modalLayers[index].element;
  }
  return null;
};

export const acquireModalLock = (
  modalLayerElement?: HTMLElement | null,
): (() => void) => {
  const applicationRoot = document.getElementById("root");
  if (modalLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    savedRootAriaHidden = applicationRoot?.getAttribute("aria-hidden") ?? null;
    savedRootHadInert = applicationRoot?.hasAttribute("inert") ?? false;
    document.body.style.overflow = "hidden";
    applicationRoot?.setAttribute("aria-hidden", "true");
    applicationRoot?.setAttribute("inert", "");
  }
  modalLockCount += 1;

  const modalLayer = modalLayerElement
    ? {
        token: Symbol("modal-layer"),
        element: modalLayerElement,
        originalAriaHidden: modalLayerElement.getAttribute("aria-hidden"),
        originallyInert: modalLayerElement.hasAttribute("inert"),
      }
    : null;
  if (modalLayer) {
    modalLayers.push(modalLayer);
    syncModalLayers();
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (modalLayer) {
      const layerIndex = modalLayers.findIndex(
        (layer) => layer.token === modalLayer.token,
      );
      if (layerIndex >= 0) modalLayers.splice(layerIndex, 1);
      restoreLayerState(modalLayer);
      syncModalLayers();
    }
    modalLockCount = Math.max(0, modalLockCount - 1);
    if (modalLockCount !== 0) return;

    const currentApplicationRoot = document.getElementById("root");
    document.body.style.overflow = savedBodyOverflow;
    if (!currentApplicationRoot) return;

    if (savedRootAriaHidden === null) {
      currentApplicationRoot.removeAttribute("aria-hidden");
    } else {
      currentApplicationRoot.setAttribute("aria-hidden", savedRootAriaHidden);
    }
    if (!savedRootHadInert) currentApplicationRoot.removeAttribute("inert");
  };
};
