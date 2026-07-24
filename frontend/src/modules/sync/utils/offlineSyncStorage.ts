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
