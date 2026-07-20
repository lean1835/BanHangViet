import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { acquireModalLock, getTopModalLayer } from "@/utils/modalLock";

export type TNotificationType = "success" | "error" | "info" | "warning";

interface INotificationState {
  id: number;
  type: TNotificationType;
  message: string;
}

interface INotificationVisual {
  title: string;
  accentClassName: string;
  iconClassName: string;
  titleClassName: string;
  buttonClassName: string;
}

export interface INotificationContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  closeNotification: () => void;
}

type TNotificationPhase = "open" | "closing";

const NOTIFICATION_EXIT_DURATION_MS = 200;
const FOCUSABLE_ELEMENT_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const NOTIFICATION_VISUALS: Record<TNotificationType, INotificationVisual> = {
  success: {
    title: "Thành công",
    accentClassName: "bg-emerald-500",
    iconClassName: "bg-emerald-50 text-emerald-600",
    titleClassName: "text-emerald-700",
    buttonClassName:
      "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-200",
  },
  error: {
    title: "Thất bại",
    accentClassName: "bg-rose-500",
    iconClassName: "bg-rose-50 text-rose-600",
    titleClassName: "text-rose-700",
    buttonClassName: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-200",
  },
  info: {
    title: "Thông tin",
    accentClassName: "bg-blue-500",
    iconClassName: "bg-blue-50 text-blue-600",
    titleClassName: "text-blue-700",
    buttonClassName: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-200",
  },
  warning: {
    title: "Cảnh báo",
    accentClassName: "bg-amber-500",
    iconClassName: "bg-amber-50 text-amber-600",
    titleClassName: "text-amber-700",
    buttonClassName: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-200",
  },
};

const isValidFocusTarget = (element: HTMLElement | null): element is HTMLElement =>
  Boolean(
    element?.isConnected &&
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      !element.closest("[aria-hidden='true'], [inert]") &&
      element.getClientRects().length > 0,
  );

const restoreFocus = (previousFocus: HTMLElement | null): void => {
  if (isValidFocusTarget(previousFocus)) {
    previousFocus.focus({ preventScroll: true });
    return;
  }

  const topModalLayer = getTopModalLayer();
  if (topModalLayer) {
    const nextModalFocus = Array.from(
      topModalLayer.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR),
    ).find((element) => isValidFocusTarget(element));
    (nextModalFocus ?? topModalLayer).focus({ preventScroll: true });
    return;
  }

  const fallback = document.querySelector<HTMLElement>(
    "[data-notification-focus-fallback], main, #root",
  );
  if (!fallback?.isConnected) return;

  const previousTabIndex = fallback.getAttribute("tabindex");
  fallback.setAttribute("tabindex", "-1");
  fallback.focus({ preventScroll: true });
  if (previousTabIndex === null) {
    fallback.removeAttribute("tabindex");
  } else {
    fallback.setAttribute("tabindex", previousTabIndex);
  }
};

const getNotificationExitDuration = (): number =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ? 0
    : NOTIFICATION_EXIT_DURATION_MS;

const NotificationIcon = ({ type }: { type: TNotificationType }) => {
  if (type === "success") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-9 w-9 fill-none stroke-current"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (type === "error") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-9 w-9 fill-none stroke-current"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }

  if (type === "warning") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-9 w-9 fill-none stroke-current"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.3 3.8 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-9 w-9 fill-none stroke-current"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
};

export const NotificationContext =
  createContext<INotificationContextValue | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notificationQueue, setNotificationQueue] = useState<
    INotificationState[]
  >([]);
  const [phase, setPhase] = useState<TNotificationPhase>("open");
  const nextNotificationIdRef = useRef(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const hasNotificationSessionRef = useRef(false);
  const hadActiveNotificationRef = useRef(false);

  const notification = notificationQueue[0] ?? null;
  const hasNotification = notification !== null;

  const enqueueNotification = useCallback(
    (type: TNotificationType, message: string) => {
      const normalizedMessage = message.trim();
      if (!normalizedMessage) return;

      if (!hasNotificationSessionRef.current) {
        hasNotificationSessionRef.current = true;
        previousFocusRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      }

      nextNotificationIdRef.current += 1;
      const nextNotification: INotificationState = {
        id: nextNotificationIdRef.current,
        type,
        message: normalizedMessage,
      };
      setNotificationQueue((currentQueue) => [
        ...currentQueue,
        nextNotification,
      ]);
    },
    [],
  );

  const showSuccess = useCallback(
    (message: string) => enqueueNotification("success", message),
    [enqueueNotification],
  );
  const showError = useCallback(
    (message: string) => enqueueNotification("error", message),
    [enqueueNotification],
  );
  const showInfo = useCallback(
    (message: string) => enqueueNotification("info", message),
    [enqueueNotification],
  );
  const showWarning = useCallback(
    (message: string) => enqueueNotification("warning", message),
    [enqueueNotification],
  );
  const closeNotification = useCallback(() => {
    if (!notification) return;
    setPhase((currentPhase) =>
      currentPhase === "open" ? "closing" : currentPhase,
    );
  }, [notification]);

  useEffect(() => {
    if (phase !== "closing" || !notification) return;

    const closingNotificationId = notification.id;
    const closeTimer = window.setTimeout(() => {
      setNotificationQueue((currentQueue) =>
        currentQueue[0]?.id === closingNotificationId
          ? currentQueue.slice(1)
          : currentQueue,
      );
      setPhase("open");
    }, getNotificationExitDuration());

    return () => window.clearTimeout(closeTimer);
  }, [notification, phase]);

  useEffect(() => {
    if (!notification) return;

    closeButtonRef.current?.focus({ preventScroll: true });
    return acquireModalLock(dialogRef.current);
  }, [notification]);

  useEffect(() => {
    if (hasNotification) {
      hadActiveNotificationRef.current = true;
      return;
    }

    if (!hadActiveNotificationRef.current) return;
    hadActiveNotificationRef.current = false;
    hasNotificationSessionRef.current = false;
    restoreFocus(previousFocusRef.current);
    previousFocusRef.current = null;
  }, [hasNotification]);

  useEffect(() => {
    if (!notification || phase === "closing") return;

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [notification, phase]);

  useEffect(() => {
    if (!notification) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeNotification();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR),
      ).filter((element) => isValidFocusTarget(element));

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
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [closeNotification, notification]);

  const contextValue = useMemo(
    () => ({
      showSuccess,
      showError,
      showInfo,
      showWarning,
      closeNotification,
    }),
    [closeNotification, showError, showInfo, showSuccess, showWarning],
  );

  const visual = notification
    ? NOTIFICATION_VISUALS[notification.type]
    : null;
  const isClosing = phase === "closing";

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notification &&
        visual &&
        createPortal(
          <div
            key={notification.id}
            data-notification-id={notification.id}
            data-notification-phase={phase}
            className={`fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-900/55 p-3 backdrop-blur-[2px] ${
              isClosing
                ? "animate-notification-backdrop-out"
                : "animate-notification-backdrop"
            }`}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeNotification();
            }}
          >
            <section
              ref={dialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={`notification-title-${notification.id}`}
              aria-describedby={`notification-message-${notification.id}`}
              tabIndex={-1}
              className={`flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl focus:outline-none ${
                isClosing
                  ? "animate-notification-modal-out"
                  : "animate-notification-modal"
              }`}
            >
              <div
                className={`h-1.5 shrink-0 ${visual.accentClassName}`}
              />
              <div className="flex min-h-0 flex-1 flex-col items-center px-5 pb-5 pt-6 text-center sm:px-7 sm:pb-6">
                <div
                  key={`notification-icon-${notification.id}`}
                  className={`mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${visual.iconClassName} ${
                    isClosing ? "" : "animate-notification-icon"
                  }`}
                >
                  <NotificationIcon type={notification.type} />
                </div>
                <h2
                  id={`notification-title-${notification.id}`}
                  className={`shrink-0 text-lg font-extrabold ${visual.titleClassName}`}
                >
                  {visual.title}
                </h2>
                <div className="mt-2 min-h-0 w-full max-h-[min(40dvh,16rem)] overflow-y-auto overscroll-contain px-1">
                  <p
                    id={`notification-message-${notification.id}`}
                    className="whitespace-pre-line break-words text-sm font-medium leading-6 text-slate-600"
                  >
                    {notification.message}
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeNotification}
                  disabled={isClosing}
                  className={`mt-6 min-h-11 w-full shrink-0 rounded-xl px-5 text-sm font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-4 disabled:cursor-wait disabled:opacity-75 ${visual.buttonClassName}`}
                >
                  {notification.type === "info" || notification.type === "warning"
                    ? "Đã hiểu"
                    : "Đóng"}
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
