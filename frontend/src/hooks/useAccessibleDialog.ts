import { useEffect, useRef } from "react";
import { acquireModalLock, getTopModalLayer } from "@/utils/modalLock";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const dialogStack: symbol[] = [];

const getFocusableElements = (dialog: HTMLElement): HTMLElement[] =>
  Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      element.isConnected &&
      element.getAttribute("aria-hidden") !== "true" &&
      !element.closest("[aria-hidden='true'], [inert]") &&
      element.getClientRects().length > 0,
  );

interface IAccessibleDialogOptions {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
}

export const useAccessibleDialog = <T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  canClose = true,
}: IAccessibleDialogOptions) => {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  const canCloseRef = useRef(canClose);

  useEffect(() => {
    onCloseRef.current = onClose;
    canCloseRef.current = canClose;
  }, [canClose, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const dialogToken = Symbol("dialog");
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialogStack.push(dialogToken);
    const releaseModalLock = acquireModalLock(dialogRef.current);

    const focusTimer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog || dialogStack.at(-1) !== dialogToken) return;
      const firstFocusableElement = getFocusableElements(dialog)[0];
      (firstFocusableElement ?? dialog).focus({ preventScroll: true });
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        dialogStack.at(-1) !== dialogToken ||
        document.querySelector("[data-notification-id]")
      ) {
        return;
      }

      if (event.key === "Escape" && onCloseRef.current && canCloseRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (!dialog.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      } else if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown, true);
      const dialogIndex = dialogStack.lastIndexOf(dialogToken);
      if (dialogIndex >= 0) dialogStack.splice(dialogIndex, 1);
      releaseModalLock();

      if (document.querySelector("[data-notification-id]")) return;

      if (
        previouslyFocusedElement?.isConnected &&
        !previouslyFocusedElement.closest("[aria-hidden='true'], [inert]")
      ) {
        previouslyFocusedElement.focus({ preventScroll: true });
        return;
      }

      const topModalLayer = getTopModalLayer();
      if (topModalLayer) {
        const nextModalFocus = getFocusableElements(topModalLayer)[0] ?? topModalLayer;
        nextModalFocus.focus({ preventScroll: true });
        return;
      }

      const fallback = document.querySelector<HTMLElement>(
        "[data-notification-focus-fallback], main, #root",
      );
      if (!fallback?.isConnected) return;
      const previousTabIndex = fallback.getAttribute("tabindex");
      fallback.setAttribute("tabindex", "-1");
      fallback.focus({ preventScroll: true });
      if (previousTabIndex === null) fallback.removeAttribute("tabindex");
      else fallback.setAttribute("tabindex", previousTabIndex);
    };
  }, [isOpen]);

  return dialogRef;
};
