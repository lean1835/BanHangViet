// @vitest-environment node

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { baseApi } from "@/stores/baseApi";
import type { IShiftResponse } from "@/modules/shift/types/IShift";
import { shiftApi } from "./shiftApi";

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

const AUTHENTICATED_USER_ID = "owner-1";
const API_SUCCESS_CODE = 1000;

const createShift = (
  id: string,
  userId: string,
  status: IShiftResponse["status"] = "OPEN",
): IShiftResponse => ({
  id,
  userId,
  username: userId,
  fullName: userId,
  householdId: "household-1",
  openedAt: "2026-07-20T08:00:00",
  closedAt: status === "OPEN" ? null : "2026-07-20T10:00:00",
  openingCash: 100_000,
  closingCashExpected: 150_000,
  closingCashActual: status === "OPEN" ? null : 150_000,
  differenceAmount: status === "OPEN" ? null : 0,
  differenceReason: null,
  status,
  createdAt: "2026-07-20T08:00:00",
  updatedAt: "2026-07-20T08:00:00",
});

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const createTestStore = () => {
  const authReducer = () => ({
    user: { id: AUTHENTICATED_USER_ID },
    token: "test-token",
    isAuthenticated: true,
  });
  const reducer = combineReducers({
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  });

  return configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

const getRequest = (input: RequestInfo | URL, init?: RequestInit): Request =>
  input instanceof Request ? input : new Request(input, init);

describe("shiftApi active-shift cache", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("chuẩn hóa 404/code 3006 thành trạng thái không có ca", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            code: 3006,
            message: "Không tìm thấy ca bán hàng hoạt động của nhân viên",
          },
          404,
        ),
      ),
    );
    const store = createTestStore();

    const response = await store
      .dispatch(shiftApi.endpoints.getActiveShift.initiate())
      .unwrap();

    expect(response.result).toBeNull();
    expect(response.code).toBe(3006);
  });

  it("giữ nguyên lỗi máy chủ thay vì coi là chưa mở ca", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            code: 5000,
            message: "Không thể tải trạng thái ca",
          },
          500,
        ),
      ),
    );
    const store = createTestStore();

    await expect(
      store.dispatch(shiftApi.endpoints.getActiveShift.initiate()).unwrap(),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("đổi cache sau khi mở và đóng ca của chính người đăng nhập", async () => {
    const ownerShift = createShift("owner-shift", AUTHENTICATED_USER_ID);
    let serverActiveShift: IShiftResponse | null = null;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = getRequest(input, init);
        const { pathname } = new URL(request.url);

        if (request.method === "GET" && pathname.endsWith("/shifts/active")) {
          return serverActiveShift
            ? jsonResponse({ code: API_SUCCESS_CODE, message: "OK", result: serverActiveShift })
            : jsonResponse({ code: 3006, message: "Không có ca" }, 404);
        }
        if (request.method === "POST" && pathname.endsWith("/shifts/open")) {
          serverActiveShift = ownerShift;
          return jsonResponse({ code: API_SUCCESS_CODE, message: "OK", result: ownerShift });
        }
        if (request.method === "POST" && pathname.endsWith("/shifts/owner-shift/close")) {
          serverActiveShift = null;
          return jsonResponse({
            code: API_SUCCESS_CODE,
            message: "OK",
            result: createShift("owner-shift", AUTHENTICATED_USER_ID, "CLOSED"),
          });
        }
        if (request.method === "GET" && pathname.endsWith("/shifts")) {
          return jsonResponse({ code: API_SUCCESS_CODE, message: "OK", result: [] });
        }

        return jsonResponse({ message: "Unexpected request" }, 500);
      }),
    );
    const store = createTestStore();

    await store.dispatch(shiftApi.endpoints.getActiveShift.initiate()).unwrap();
    await store
      .dispatch(shiftApi.endpoints.openShift.initiate({ openingCash: 100_000 }))
      .unwrap();

    await vi.waitFor(() => {
      expect(
        shiftApi.endpoints.getActiveShift.select()(store.getState()).data?.result?.id,
      ).toBe(ownerShift.id);
    });

    await store
      .dispatch(
        shiftApi.endpoints.closeShift.initiate({
          id: ownerShift.id,
          body: { closingCashActual: 150_000 },
        }),
      )
      .unwrap();

    await vi.waitFor(() => {
      expect(
        shiftApi.endpoints.getActiveShift.select()(store.getState()).data?.result,
      ).toBeNull();
    });
  });

  it("không ghi đè ca của chủ hộ khi mở hoặc đóng ca hộ nhân viên", async () => {
    const ownerShift = createShift("owner-shift", AUTHENTICATED_USER_ID);
    const employeeShift = createShift("employee-shift", "employee-1");
    const activeRefetchResolvers: Array<(response: Response) => void> = [];
    let activeRequestCount = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = getRequest(input, init);
        const { pathname } = new URL(request.url);

        if (request.method === "GET" && pathname.endsWith("/shifts/active")) {
          activeRequestCount += 1;
          if (activeRequestCount === 1) {
            return jsonResponse({
              code: API_SUCCESS_CODE,
              message: "OK",
              result: ownerShift,
            });
          }
          return new Promise<Response>((resolve) => {
            activeRefetchResolvers.push(resolve);
          });
        }
        if (request.method === "POST" && pathname.endsWith("/shifts/open")) {
          return jsonResponse({ code: API_SUCCESS_CODE, message: "OK", result: employeeShift });
        }
        if (request.method === "POST" && pathname.endsWith("/shifts/employee-shift/close")) {
          return jsonResponse({
            code: API_SUCCESS_CODE,
            message: "OK",
            result: createShift("employee-shift", "employee-1", "CLOSED"),
          });
        }
        if (request.method === "GET" && pathname.endsWith("/shifts")) {
          return jsonResponse({ code: API_SUCCESS_CODE, message: "OK", result: [] });
        }

        return jsonResponse({ message: "Unexpected request" }, 500);
      }),
    );
    const store = createTestStore();

    await store.dispatch(shiftApi.endpoints.getActiveShift.initiate()).unwrap();
    await store
      .dispatch(
        shiftApi.endpoints.openShift.initiate({
          openingCash: employeeShift.openingCash,
          userId: employeeShift.userId,
        }),
      )
      .unwrap();

    await vi.waitFor(() => expect(activeRefetchResolvers).toHaveLength(1));
    expect(
      shiftApi.endpoints.getActiveShift.select()(store.getState()).data?.result
        ?.id,
    ).toBe(ownerShift.id);
    activeRefetchResolvers.shift()?.(
      jsonResponse({
        code: API_SUCCESS_CODE,
        message: "OK",
        result: ownerShift,
      }),
    );
    await vi.waitFor(() =>
      expect(
        shiftApi.endpoints.getActiveShift.select()(store.getState()).status,
      ).toBe("fulfilled"),
    );

    await store
      .dispatch(
        shiftApi.endpoints.closeShift.initiate({
          id: employeeShift.id,
          body: { closingCashActual: 150_000 },
        }),
      )
      .unwrap();

    await vi.waitFor(() => expect(activeRefetchResolvers).toHaveLength(1));
    expect(
      shiftApi.endpoints.getActiveShift.select()(store.getState()).data?.result
        ?.id,
    ).toBe(ownerShift.id);
    activeRefetchResolvers.shift()?.(
      jsonResponse({
        code: API_SUCCESS_CODE,
        message: "OK",
        result: ownerShift,
      }),
    );
  });

  it("giữ nguyên cache ca hiện tại khi mutation thất bại", async () => {
    const ownerShift = createShift("owner-shift", AUTHENTICATED_USER_ID);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = getRequest(input, init);
        const { pathname } = new URL(request.url);

        if (request.method === "GET" && pathname.endsWith("/shifts/active")) {
          return jsonResponse({
            code: API_SUCCESS_CODE,
            message: "OK",
            result: ownerShift,
          });
        }
        if (request.method === "POST" && pathname.endsWith("/shifts/open")) {
          return jsonResponse({ code: 5000, message: "Mở ca thất bại" }, 500);
        }

        return jsonResponse({ message: "Unexpected request" }, 500);
      }),
    );
    const store = createTestStore();

    await store.dispatch(shiftApi.endpoints.getActiveShift.initiate()).unwrap();
    await expect(
      store.dispatch(
        shiftApi.endpoints.openShift.initiate({ openingCash: 100_000 }),
      ).unwrap(),
    ).rejects.toMatchObject({ status: 500 });

    expect(
      shiftApi.endpoints.getActiveShift.select()(store.getState()).data?.result
        ?.id,
    ).toBe(ownerShift.id);
  });
});
