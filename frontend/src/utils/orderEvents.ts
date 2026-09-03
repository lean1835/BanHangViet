import { useEffect, useRef } from "react";

export const ORDER_COMPLETED_EVENT = "banhangviet:order-completed";
export const ORDER_COMPLETED_STORAGE_KEY = "banhangviet_last_order_completed_at";
export const SALES_EVENTS_CHANNEL = "banhangviet_sales_events";

/**
 * Phát tín hiệu hoàn tất đơn hàng tới tất cả các thành phần trong tab hiện tại
 * và các tab/cửa sổ khác của trình duyệt (Cross-tab sync).
 */
export const notifyOrderCompleted = (): void => {
  if (typeof window === "undefined") return;

  const now = Date.now();

  // 1. Phát sự kiện CustomEvent cho tab/cửa sổ hiện tại
  try {
    window.dispatchEvent(
      new CustomEvent(ORDER_COMPLETED_EVENT, {
        detail: { timestamp: now },
      })
    );
  } catch (e) {
    void e;
  }

  // 2. Kích hoạt sự kiện storage cho các tab khác cùng nguồn (origin)
  try {
    localStorage.setItem(ORDER_COMPLETED_STORAGE_KEY, String(now));
  } catch (e) {
    void e;
  }

  // 3. Sử dụng BroadcastChannel cho các trình duyệt hiện đại
  if ("BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(SALES_EVENTS_CHANNEL);
      channel.postMessage({ type: "ORDER_COMPLETED", timestamp: now });
      channel.close();
    } catch (e) {
      void e;
    }
  }
};

/**
 * Hook lắng nghe sự kiện bán đơn hàng thành công từ bất kỳ đâu (cùng tab hoặc khác tab)
 * và gọi callback (refetch) ngay lập tức mà không cần bấm F5.
 */
export const useOnOrderCompleted = (onOrderCompleted: () => void): void => {
  const savedCallback = useRef(onOrderCompleted);

  useEffect(() => {
    savedCallback.current = onOrderCompleted;
  }, [onOrderCompleted]);

  useEffect(() => {
    const handleOrderEvent = () => {
      savedCallback.current();
    };

    // Lắng nghe sự kiện trong cùng tab
    window.addEventListener(ORDER_COMPLETED_EVENT, handleOrderEvent);

    // Lắng nghe sự kiện giữa các tab khác nhau qua localStorage
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ORDER_COMPLETED_STORAGE_KEY) {
        savedCallback.current();
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
            savedCallback.current();
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
