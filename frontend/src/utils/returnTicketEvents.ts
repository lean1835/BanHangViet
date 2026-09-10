import { useEffect, useRef } from "react";
import { SALES_EVENTS_CHANNEL } from "./orderEvents";

export const RETURN_TICKET_APPROVED_EVENT = "banhangviet:return-ticket-approved";
export const RETURN_TICKET_STORAGE_KEY = "banhangviet_last_return_ticket_approved_at";

export interface IReturnTicketApprovedPayload {
  ticketId?: string;
  ticketNumber?: string;
  productIds?: string[];
  timestamp: number;
}

/**
 * Phát tín hiệu khi phiếu trả hàng được duyệt / xác nhận thành công
 * tới tất cả các thành phần trong tab hiện tại và các tab/cửa sổ khác (Cross-tab sync).
 */
export const notifyReturnTicketApproved = (payload?: {
  ticketId?: string;
  ticketNumber?: string;
  productIds?: string[];
}): void => {
  if (typeof window === "undefined") return;

  const eventData: IReturnTicketApprovedPayload = {
    ticketId: payload?.ticketId,
    ticketNumber: payload?.ticketNumber,
    productIds: payload?.productIds,
    timestamp: Date.now(),
  };

  // 1. Phát sự kiện CustomEvent cho tab/cửa sổ hiện tại
  try {
    window.dispatchEvent(
      new CustomEvent(RETURN_TICKET_APPROVED_EVENT, {
        detail: eventData,
      })
    );
  } catch (e) {
    void e;
  }

  // 2. Kích hoạt sự kiện storage cho các tab khác cùng nguồn (origin)
  try {
    localStorage.setItem(RETURN_TICKET_STORAGE_KEY, JSON.stringify(eventData));
  } catch (e) {
    void e;
  }

  // 3. Sử dụng BroadcastChannel cho các trình duyệt hiện đại
  if ("BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(SALES_EVENTS_CHANNEL);
      channel.postMessage({
        type: "RETURN_TICKET_APPROVED",
        payload: eventData,
      });
      channel.close();
    } catch (e) {
      void e;
    }
  }
};

/**
 * Hook lắng nghe sự kiện duyệt phiếu trả hàng từ bất kỳ đâu (cùng tab hoặc khác tab)
 * và tự động gọi callback (refetch chi tiết hàng hóa & thẻ kho) ngay lập tức mà không cần F5.
 */
export const useOnReturnTicketApproved = (
  onReturnTicketApproved: (payload?: IReturnTicketApprovedPayload) => void
): void => {
  const savedCallback = useRef(onReturnTicketApproved);

  useEffect(() => {
    savedCallback.current = onReturnTicketApproved;
  }, [onReturnTicketApproved]);

  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<IReturnTicketApprovedPayload>;
      savedCallback.current(customEvent.detail);
    };

    // Lắng nghe sự kiện trong cùng tab
    window.addEventListener(RETURN_TICKET_APPROVED_EVENT, handleCustomEvent);

    // Lắng nghe sự kiện giữa các tab khác nhau qua localStorage
    const handleStorage = (event: StorageEvent) => {
      if (event.key === RETURN_TICKET_STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as IReturnTicketApprovedPayload;
          savedCallback.current(parsed);
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
          if (messageEvent.data?.type === "RETURN_TICKET_APPROVED") {
            savedCallback.current(messageEvent.data.payload);
          }
        };
      } catch (e) {
        void e;
      }
    }

    return () => {
      window.removeEventListener(RETURN_TICKET_APPROVED_EVENT, handleCustomEvent);
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.close();
      }
    };
  }, []);
};
