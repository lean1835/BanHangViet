// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  saveOfflineOrder,
  getPendingOfflineOrders,
  removeOfflineOrder,
  clearSyncedOrders,
  getOfflineOrderCount,
} from "./offlineSyncStorage";

vi.hoisted(() => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      get length() {
        return values.size;
      },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => [...values.keys()][index] ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, String(value)),
    } satisfies Storage,
  });
});

describe("offlineSyncStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("lưu đơn hàng ngoại tuyến thành công vào local storage", () => {
    const order = saveOfflineOrder({
      orderNumber: "HD-OFF-101",
      totalAmount: 150000,
      finalAmount: 150000,
      paymentMethod: "CASH",
      items: [],
    });

    expect(order.orderNumber).toBe("HD-OFF-101");
    expect(order.syncStatus).toBe("PENDING");

    const pending = getPendingOfflineOrders();
    expect(pending.length).toBe(1);
    expect(pending[0].orderNumber).toBe("HD-OFF-101");
    expect(getOfflineOrderCount()).toBe(1);
  });

  it("xóa đơn hàng ngoại tuyến theo orderNumber", () => {
    saveOfflineOrder({
      orderNumber: "HD-OFF-102",
      totalAmount: 200000,
      finalAmount: 200000,
      paymentMethod: "CASH",
      items: [],
    });

    removeOfflineOrder("HD-OFF-102");
    expect(getPendingOfflineOrders().length).toBe(0);
    expect(getOfflineOrderCount()).toBe(0);
  });

  it("xóa hàng loạt danh sách đơn hàng đã đồng bộ", () => {
    saveOfflineOrder({
      orderNumber: "HD-OFF-201",
      totalAmount: 100000,
      finalAmount: 100000,
      paymentMethod: "CASH",
      items: [],
    });
    saveOfflineOrder({
      orderNumber: "HD-OFF-202",
      totalAmount: 200000,
      finalAmount: 200000,
      paymentMethod: "CASH",
      items: [],
    });

    clearSyncedOrders(["HD-OFF-201"]);
    const pending = getPendingOfflineOrders();
    expect(pending.length).toBe(1);
    expect(pending[0].orderNumber).toBe("HD-OFF-202");
  });
});
