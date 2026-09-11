import { useEffect, useRef } from "react";

export const ORDER_COMPLETED_EVENT = "banhangviet:order-completed";
export const ORDER_COMPLETED_STORAGE_KEY = "banhangviet_last_order_completed_at";
export const ORDER_CANCELED_EVENT = "banhangviet:order-canceled";
export const ORDER_CANCELED_STORAGE_KEY = "banhangviet_last_order_canceled_at";
export const SALES_EVENTS_CHANNEL = "banhangviet_sales_events";

export interface IOrderCanceledEventDetail {
  orderId: string;
  orderNumber?: string;
  timestamp: number;
}

export interface IOrderCompletedEventDetail {
  orderId?: string;
  orderNumber?: string;
  timestamp: number;
}

/**
 * Phát tín hiệu hoàn tất đơn hàng tới tất cả các thành phần trong tab hiện tại
 * và các tab/cửa sổ khác của trình duyệt (Cross-tab sync).
 * Tự động đồng bộ dọn sạch đơn hàng đã thanh toán tại bộ nhớ lưu trữ giỏ hàng POS (localStorage).
 */
export const notifyOrderCompleted = (orderId?: string, orderNumber?: string): void => {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const detail: IOrderCompletedEventDetail = {
    orderId,
    orderNumber,
    timestamp: now,
  };

  // 0. Dọn sạch tab đơn hàng đã thanh toán trong localStorage của POS ngay lập tức
  if (orderId || orderNumber) {
    try {
      const saved = localStorage.getItem("pos_tabs_state_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.tabs)) {
          const remainingTabs = parsed.tabs.filter(
            (t: { backendOrderId?: string; orderNumber?: string; status?: string }) =>
              t.status !== "COMPLETED" &&
              (!orderId || t.backendOrderId !== orderId) &&
              (!orderNumber || (t.orderNumber !== orderNumber && !t.orderNumber?.includes(orderNumber)))
          );
          if (remainingTabs.length !== parsed.tabs.length) {
            if (remainingTabs.length === 0) {
              const nextCounter = (typeof parsed.tabCounter === "number" ? parsed.tabCounter : 1) + 1;
              const newTab = {
                id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                orderNumber: `Hóa đơn ${nextCounter}`,
                status: "PENDING",
                saleMode: "FAST",
                items: [],
                discountType: "PERCENTAGE",
                discountValue: 0,
                paymentMethod: "CASH",
                amountGiven: 0,
                isSaved: false,
              };
              localStorage.setItem(
                "pos_tabs_state_v1",
                JSON.stringify({
                  tabs: [newTab],
                  activeTabId: newTab.id,
                  tabCounter: nextCounter,
                })
              );
            } else {
              const newActiveId = remainingTabs.some((t: { id: string }) => t.id === parsed.activeTabId)
                ? parsed.activeTabId
                : remainingTabs[remainingTabs.length - 1].id;
              localStorage.setItem(
                "pos_tabs_state_v1",
                JSON.stringify({
                  ...parsed,
                  tabs: remainingTabs,
                  activeTabId: newActiveId,
                })
              );
            }
          }
        }
      }
    } catch (e) {
      void e;
    }
  }

  // 1. Phát sự kiện CustomEvent cho tab/cửa sổ hiện tại
  try {
    window.dispatchEvent(
      new CustomEvent(ORDER_COMPLETED_EVENT, {
        detail,
      })
    );
  } catch (e) {
    void e;
  }

  // 2. Kích hoạt sự kiện storage cho các tab khác cùng nguồn (origin)
  try {
    localStorage.setItem(ORDER_COMPLETED_STORAGE_KEY, JSON.stringify(detail));
  } catch (e) {
    void e;
  }

  // 3. Sử dụng BroadcastChannel cho các trình duyệt hiện đại
  if ("BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(SALES_EVENTS_CHANNEL);
      channel.postMessage({ type: "ORDER_COMPLETED", ...detail });
      channel.close();
    } catch (e) {
      void e;
    }
  }
};

/**
 * Phát tín hiệu hủy đơn hàng tới tất cả các thành phần trong tab hiện tại
 * và các tab/cửa sổ khác của trình duyệt (Cross-tab sync).
 * Tự động đồng bộ dọn sạch đơn hủy tại bộ nhớ lưu trữ giỏ hàng POS (localStorage).
 */
export const notifyOrderCanceled = (orderId: string, orderNumber?: string): void => {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const detail: IOrderCanceledEventDetail = {
    orderId,
    orderNumber,
    timestamp: now,
  };

  // 0. Dọn sạch tab đơn hàng tương ứng trong localStorage của POS ngay lập tức
  try {
    const saved = localStorage.getItem("pos_tabs_state_v1");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed?.tabs)) {
        const remainingTabs = parsed.tabs.filter(
          (t: { backendOrderId?: string; orderNumber?: string }) =>
            t.backendOrderId !== orderId &&
            (!orderNumber || (t.orderNumber !== orderNumber && !t.orderNumber?.includes(orderNumber)))
        );
        if (remainingTabs.length !== parsed.tabs.length) {
          if (remainingTabs.length === 0) {
            const nextCounter = (typeof parsed.tabCounter === "number" ? parsed.tabCounter : 1) + 1;
            const newTab = {
              id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              orderNumber: `Hóa đơn ${nextCounter}`,
              status: "PENDING",
              saleMode: "FAST",
              items: [],
              discountType: "PERCENTAGE",
              discountValue: 0,
              paymentMethod: "CASH",
              amountGiven: 0,
              isSaved: false,
            };
            localStorage.setItem(
              "pos_tabs_state_v1",
              JSON.stringify({
                tabs: [newTab],
                activeTabId: newTab.id,
                tabCounter: nextCounter,
              })
            );
          } else {
            const newActiveId = remainingTabs.some((t: { id: string }) => t.id === parsed.activeTabId)
              ? parsed.activeTabId
              : remainingTabs[remainingTabs.length - 1].id;
            localStorage.setItem(
              "pos_tabs_state_v1",
              JSON.stringify({
                ...parsed,
                tabs: remainingTabs,
                activeTabId: newActiveId,
              })
            );
          }
        }
      }
    }
  } catch (e) {
    void e;
  }

  // 1. Phát sự kiện CustomEvent cho tab/cửa sổ hiện tại
  try {
    window.dispatchEvent(
      new CustomEvent(ORDER_CANCELED_EVENT, { detail })
    );
  } catch (e) {
    void e;
  }

  // 2. Kích hoạt sự kiện storage cho các tab khác cùng nguồn (origin)
  try {
    localStorage.setItem(ORDER_CANCELED_STORAGE_KEY, JSON.stringify(detail));
  } catch (e) {
    void e;
  }

  // 3. Sử dụng BroadcastChannel cho các trình duyệt hiện đại
  if ("BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(SALES_EVENTS_CHANNEL);
      channel.postMessage({ type: "ORDER_CANCELED", ...detail });
      channel.close();
    } catch (e) {
      void e;
    }
  }
};

/**
 * Hook lắng nghe sự kiện bán đơn hàng thành công từ bất kỳ đâu (cùng tab hoặc khác tab)
 * và gọi callback (refetch/dọn sạch đơn hàng) ngay lập tức mà không cần bấm F5.
 */
export const useOnOrderCompleted = (
  onOrderCompleted: (detail?: IOrderCompletedEventDetail) => void
): void => {
  const savedCallback = useRef(onOrderCompleted);

  useEffect(() => {
    savedCallback.current = onOrderCompleted;
  }, [onOrderCompleted]);

  useEffect(() => {
    const handleOrderEvent = (e: Event) => {
      const customEvent = e as CustomEvent<IOrderCompletedEventDetail>;
      savedCallback.current(customEvent.detail);
    };

    // Lắng nghe sự kiện trong cùng tab
    window.addEventListener(ORDER_COMPLETED_EVENT, handleOrderEvent);

    // Lắng nghe sự kiện giữa các tab khác nhau qua localStorage
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ORDER_COMPLETED_STORAGE_KEY && event.newValue) {
        try {
          const detail = JSON.parse(event.newValue) as IOrderCompletedEventDetail;
          savedCallback.current(detail);
        } catch {
          savedCallback.current();
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    // Lắng nghe qua BroadcastChannel
    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel(SALES_EVENTS_CHANNEL);
        channel.onmessage = (messageEvent) => {
          if (messageEvent.data?.type === "ORDER_COMPLETED") {
            savedCallback.current(messageEvent.data as IOrderCompletedEventDetail);
          }
        };
      } catch (e) {
        void e;
      }
    }

    return () => {
      window.removeEventListener(ORDER_COMPLETED_EVENT, handleOrderEvent);
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.close();
      }
    };
  }, []);
};

/**
 * Hook lắng nghe sự kiện hủy đơn hàng từ bất kỳ đâu (cùng tab hoặc khác tab / từ màn Quản lý)
 * và gọi callback ngay lập tức để màn bán hàng (POS) tự động mất đơn / dọn sạch giỏ hàng.
 */
export const useOnOrderCanceled = (
  onOrderCanceled: (detail: IOrderCanceledEventDetail) => void
): void => {
  const savedCallback = useRef(onOrderCanceled);

  useEffect(() => {
    savedCallback.current = onOrderCanceled;
  }, [onOrderCanceled]);

  useEffect(() => {
    const handleOrderCanceledEvent = (e: Event) => {
      const customEvent = e as CustomEvent<IOrderCanceledEventDetail>;
      if (customEvent.detail) {
        savedCallback.current(customEvent.detail);
      }
    };

    window.addEventListener(ORDER_CANCELED_EVENT, handleOrderCanceledEvent);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ORDER_CANCELED_STORAGE_KEY && event.newValue) {
        try {
          const detail = JSON.parse(event.newValue) as IOrderCanceledEventDetail;
          savedCallback.current(detail);
        } catch {
          /* ignore storage parse */
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel(SALES_EVENTS_CHANNEL);
        channel.onmessage = (messageEvent) => {
          if (messageEvent.data?.type === "ORDER_CANCELED") {
            savedCallback.current(messageEvent.data as IOrderCanceledEventDetail);
          }
        };
      } catch (e) {
        void e;
      }
    }

    return () => {
      window.removeEventListener(ORDER_CANCELED_EVENT, handleOrderCanceledEvent);
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.close();
      }
    };
  }, []);
};
