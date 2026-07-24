// @vitest-environment node

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { baseApi } from "@/stores/baseApi";
import { syncApi } from "./syncApi";

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

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const createTestStore = () => {
  const rootReducer = combineReducers({
    [baseApi.reducerPath]: baseApi.reducer,
  });

  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

describe("syncApi endpoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("thực hiện checkConflicts API thành công", async () => {
    const mockCheckResponse = {
      code: 1000,
      message: "Kiểm tra xung đột hoàn tất",
      result: {
        duplicates: ["HD-OFFLINE-001"],
        conflicts: [],
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(mockCheckResponse))
    );

    const store = createTestStore();
    const result = await store.dispatch(
      syncApi.endpoints.checkConflicts.initiate({
        offlineOrderNumbers: ["HD-OFFLINE-001", "HD-OFFLINE-002"],
      })
    );

    expect(result.data).toEqual(mockCheckResponse);
    expect(result.data?.result.duplicates).toContain("HD-OFFLINE-001");
  });

  it("thực hiện bulkUpload API thành công", async () => {
    const mockUploadResponse = {
      code: 1000,
      message: "Đồng bộ danh sách đơn hàng hoàn tất",
      result: [
        {
          id: "ord-1",
          orderNumber: "HD-OFFLINE-002",
          totalAmount: 100000,
          finalAmount: 100000,
          paymentMethod: "CASH",
          paymentStatus: "PAID",
          status: "COMPLETED",
          syncStatus: "SYNCED",
          warningMessages: [],
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(mockUploadResponse))
    );

    const store = createTestStore();
    const result = await store.dispatch(
      syncApi.endpoints.bulkUpload.initiate([
        {
          orderNumber: "HD-OFFLINE-002",
          totalAmount: 100000,
          finalAmount: 100000,
          paymentMethod: "CASH",
          items: [
            {
              productId: "prod-1",
              quantity: 1,
              unitPrice: 100000,
            },
          ],
        },
      ])
    );

    expect(result.data).toEqual(mockUploadResponse);
    expect(result.data?.result[0].orderNumber).toBe("HD-OFFLINE-002");
  });

  it("thực hiện resolveConflict API thành công", async () => {
    const mockResolveResponse = {
      code: 1000,
      message: "Giải quyết xung đột đơn hàng thành công",
      result: {
        id: "ord-1",
        orderNumber: "HD-OFFLINE-003",
        syncStatus: "SYNCED",
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(mockResolveResponse))
    );

    const store = createTestStore();
    const result = await store.dispatch(
      syncApi.endpoints.resolveConflict.initiate({
        orderNumber: "HD-OFFLINE-003",
        resolutionStrategy: "KEEP_SERVER",
      })
    );

    expect(result.data).toEqual(mockResolveResponse);
    expect(result.data?.result.orderNumber).toBe("HD-OFFLINE-003");
  });
});
