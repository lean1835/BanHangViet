import type { ILocalOfflineOrder, IOfflineOrderRequest, TSyncStatus } from "../types/ISync";

const STORAGE_KEY = "bhv_offline_orders_v1";

/**
 * Lấy danh sách các đơn hàng ngoại tuyến đang lưu trong LocalStorage
 */
export const getPendingOfflineOrders = (): ILocalOfflineOrder[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Lỗi khi đọc danh sách đơn hàng ngoại tuyến:", error);
    return [];
  }
};

/**
 * Lưu một đơn hàng ngoại tuyến mới vào kho lưu trữ cục bộ
 */
export const saveOfflineOrder = (order: IOfflineOrderRequest): ILocalOfflineOrder => {
  const currentOrders = getPendingOfflineOrders();
  
  // Tránh tạo trùng orderNumber trong local storage
  const existingIndex = currentOrders.findIndex((o) => o.orderNumber === order.orderNumber);
  
  const newLocalOrder: ILocalOfflineOrder = {
    ...order,
    localId: existingIndex >= 0 ? currentOrders[existingIndex].localId : `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    syncStatus: "PENDING",
    createdAt: order.createdAt || new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    currentOrders[existingIndex] = newLocalOrder;
  } else {
    currentOrders.push(newLocalOrder);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrders));
  } catch (error) {
    console.error("Lỗi khi lưu đơn hàng ngoại tuyến:", error);
  }

  return newLocalOrder;
};

/**
 * Cập nhật trạng thái của đơn hàng ngoại tuyến
 */
export const updateOfflineOrderStatus = (
  orderNumber: string,
  syncStatus: TSyncStatus,
  errorMessage?: string
): void => {
  const currentOrders = getPendingOfflineOrders();
  const index = currentOrders.findIndex((o) => o.orderNumber === orderNumber);
  if (index >= 0) {
    currentOrders[index].syncStatus = syncStatus;
    if (errorMessage !== undefined) {
      currentOrders[index].errorMessage = errorMessage;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrders));
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng ngoại tuyến:", error);
    }
  }
};

/**
 * Đánh dấu một đơn hàng ngoại tuyến đã được người dùng chọn phát hành HĐĐT ngay lúc bán POS
 */
export const markOfflineOrderInvoiceIssued = (orderNumber: string): void => {
  if (!orderNumber) return;
  const currentOrders = getPendingOfflineOrders();
  const index = currentOrders.findIndex((o) => o.orderNumber === orderNumber);
  if (index >= 0) {
    currentOrders[index].isInvoiceIssuedOffline = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrders));
    } catch (error) {
      console.error("Lỗi khi đánh dấu hóa đơn offline đã phát hành:", error);
    }
  }
};

/**
 * Xóa một đơn hàng ngoại tuyến khỏi kho lưu trữ
 */
export const removeOfflineOrder = (orderNumber: string): void => {
  const currentOrders = getPendingOfflineOrders();
  const filtered = currentOrders.filter((o) => o.orderNumber !== orderNumber);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Lỗi khi xóa đơn hàng ngoại tuyến:", error);
  }
};

/**
 * Xóa danh sách các đơn hàng đã được đồng bộ thành công
 */
export const clearSyncedOrders = (orderNumbers: string[]): void => {
  if (!orderNumbers || orderNumbers.length === 0) return;
  const set = new Set(orderNumbers);
  const currentOrders = getPendingOfflineOrders();
  const filtered = currentOrders.filter((o) => !set.has(o.orderNumber));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    const remainingPending = filtered.filter((o) => o.syncStatus === "PENDING" || o.syncStatus === "CONFLICT").length;
    if (remainingPending === 0) {
      setOfflineStartTime(null);
    }
  } catch (error) {
    console.error("Lỗi khi xóa danh sách đơn hàng đã đồng bộ:", error);
  }
};

/**
 * Đếm số lượng đơn hàng ngoại tuyến chưa đồng bộ
 */
export const getOfflineOrderCount = (): number => {
  return getPendingOfflineOrders().filter((o) => o.syncStatus === "PENDING" || o.syncStatus === "CONFLICT").length;
};

/**
 * QUẢN LÝ CẤU HÌNH VÀ GIỚI HẠN BÁN KHI MẤT MẠNG (OFFLINE)
 */

const OFFLINE_CONFIG_KEY = "bhv_offline_config_v1";
const OFFLINE_START_TIME_KEY = "bhv_offline_start_time_v1";

export interface IOfflineConfig {
  maxOrders: number;
  maxHours: number;
}

export const getOfflineConfig = (): IOfflineConfig => {
  try {
    const raw = localStorage.getItem(OFFLINE_CONFIG_KEY);
    if (!raw) return { maxOrders: 50, maxHours: 24 };
    const parsed = JSON.parse(raw);
    return {
      maxOrders: typeof parsed.maxOrders === "number" && parsed.maxOrders >= 0 ? parsed.maxOrders : 50,
      maxHours: typeof parsed.maxHours === "number" && parsed.maxHours >= 0 ? parsed.maxHours : 24,
    };
  } catch {
    return { maxOrders: 50, maxHours: 24 };
  }
};

export const saveOfflineConfig = (config: Partial<IOfflineConfig>): void => {
  try {
    const current = getOfflineConfig();
    const updated: IOfflineConfig = {
      maxOrders: typeof config.maxOrders === "number" && config.maxOrders >= 0 ? config.maxOrders : current.maxOrders,
      maxHours: typeof config.maxHours === "number" && config.maxHours >= 0 ? config.maxHours : current.maxHours,
    };
    localStorage.setItem(OFFLINE_CONFIG_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Lỗi khi lưu cấu hình bán ngoại tuyến:", error);
  }
};

export const getOfflineStartTime = (): number | null => {
  try {
    const raw = localStorage.getItem(OFFLINE_START_TIME_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
};

export const setOfflineStartTime = (time: number | null): void => {
  try {
    if (time === null) {
      localStorage.removeItem(OFFLINE_START_TIME_KEY);
    } else {
      localStorage.setItem(OFFLINE_START_TIME_KEY, time.toString());
    }
  } catch (error) {
    console.error("Lỗi khi ghi nhận thời gian bắt đầu mất mạng:", error);
  }
};

export interface IOfflineLimitStatus {
  maxOrders: number;
  maxHours: number;
  currentOrdersCount: number;
  elapsedHours: number;
  isOrderNearLimit: boolean;
  isTimeNearLimit: boolean;
  isOrderExceeded: boolean;
  isTimeExceeded: boolean;
  isExceeded: boolean;
  warningMessage?: string;
  errorMessage?: string;
}

export const checkOfflineLimitStatus = (): IOfflineLimitStatus => {
  const config = getOfflineConfig();
  const pendingOrders = getPendingOfflineOrders().filter(
    (o) => o.syncStatus === "PENDING" || o.syncStatus === "CONFLICT"
  );
  const currentOrdersCount = pendingOrders.length;

  let offlineStartTime = getOfflineStartTime();

  // Reset thời gian bắt đầu mất mạng nếu không còn đơn hàng offline nào chưa đồng bộ
  if (currentOrdersCount === 0) {
    if (offlineStartTime !== null) {
      setOfflineStartTime(null);
      offlineStartTime = null;
    }
  } else if (!offlineStartTime) {
    offlineStartTime = Date.now();
    setOfflineStartTime(offlineStartTime);
  }

  const elapsedMs = offlineStartTime ? Date.now() - offlineStartTime : 0;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  // 0 đại diện cho "Không giới hạn" (Unlimited)
  const isOrderNearLimit = config.maxOrders > 0 && currentOrdersCount >= Math.ceil(config.maxOrders * 0.9);
  const isTimeNearLimit = config.maxHours > 0 && elapsedHours >= config.maxHours * 0.9;
  const isOrderExceeded = config.maxOrders > 0 && currentOrdersCount >= config.maxOrders;
  const isTimeExceeded = config.maxHours > 0 && elapsedHours >= config.maxHours;
  const isExceeded = isOrderExceeded || isTimeExceeded;

  let warningMessage: string | undefined;
  let errorMessage: string | undefined;

  if (isOrderExceeded) {
    errorMessage = `Đã đạt giới hạn tối đa ${config.maxOrders} đơn hàng bán khi mất mạng. Vui lòng kết nối mạng để đồng bộ trước khi tạo thêm đơn mới!`;
  } else if (isTimeExceeded) {
    errorMessage = `Đã vượt quá thời hạn ${config.maxHours} giờ bán khi mất mạng. Vui lòng kết nối mạng để đồng bộ trước khi tạo thêm đơn mới!`;
  } else if (isOrderNearLimit) {
    warningMessage = `Cảnh báo: Đã bán ${currentOrdersCount}/${config.maxOrders} đơn hàng ngoại tuyến (gần chạm ngưỡng). Vui lòng kết nối mạng sớm!`;
  } else if (isTimeNearLimit) {
    warningMessage = `Cảnh báo: Thời gian bán hàng khi mất mạng đã gần chạm ngưỡng ${config.maxHours} giờ. Vui lòng kết nối mạng sớm!`;
  }

  return {
    maxOrders: config.maxOrders,
    maxHours: config.maxHours,
    currentOrdersCount,
    elapsedHours,
    isOrderNearLimit,
    isTimeNearLimit,
    isOrderExceeded,
    isTimeExceeded,
    isExceeded,
    warningMessage,
    errorMessage,
  };
};
