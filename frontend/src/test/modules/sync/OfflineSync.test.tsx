import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { OfflineSyncBanner } from "@/modules/sync/components/OfflineSyncBanner";
import { ConflictResolutionModal } from "@/modules/sync/components/ConflictResolutionModal";
import {
  saveOfflineOrder,
  getPendingOfflineOrders,
  updateOfflineOrderStatus,
  removeOfflineOrder,
} from "@/modules/sync/utils/offlineSyncStorage";
import type { ILocalOfflineOrder, IOfflineOrderRequest } from "@/modules/sync/types/ISync";

const createTestStore = (roleId = "VT-01") =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: "u1", username: "test_user", roleId }, isAuthenticated: true }) => state,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(baseApi.middleware),
  });

const mockOfflineOrder: IOfflineOrderRequest = {
  orderNumber: "OFF-2026-001",
  totalAmount: 150000,
  finalAmount: 150000,
  paymentMethod: "CASH",
  createdAt: "2026-09-21T08:30:00Z",
  items: [
    {
      productId: "prod-01",
      quantity: 3,
      unitPrice: 50000,
      subtotal: 150000,
    },
  ],
};

describe("NCL-08: Chế độ hoạt động khi mất mạng và đồng bộ dữ liệu (Offline Mode & Sync)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe("NCL-08-CN-001 & CN-004: Quản lý kho lưu trữ đơn hàng ngoại tuyến (offlineSyncStorage)", () => {
    it("Lưu đơn hàng ngoại tuyến mới vào LocalStorage và cấp mã localId với trạng thái PENDING", () => {
      const saved = saveOfflineOrder(mockOfflineOrder);

      expect(saved.orderNumber).toBe("OFF-2026-001");
      expect(saved.syncStatus).toBe("PENDING");
      expect(saved.localId).toBeDefined();

      const pendingList = getPendingOfflineOrders();
      expect(pendingList.length).toBe(1);
      expect(pendingList[0].finalAmount).toBe(150000);
    });

    it("Cập nhật trạng thái đơn hàng ngoại tuyến sau khi đồng bộ thành công hoặc gặp lỗi", () => {
      saveOfflineOrder(mockOfflineOrder);

      // Update to FAILED with reason
      updateOfflineOrderStatus("OFF-2026-001", "FAILED", "Trùng mã đơn hàng trên server");
      let list = getPendingOfflineOrders();
      expect(list[0].syncStatus).toBe("FAILED");
      expect(list[0].errorMessage).toBe("Trùng mã đơn hàng trên server");

      // Update to SYNCED
      updateOfflineOrderStatus("OFF-2026-001", "SYNCED");
      list = getPendingOfflineOrders();
      expect(list[0].syncStatus).toBe("SYNCED");
    });

    it("Xóa đơn hàng ngoại tuyến khỏi kho lưu trữ cục bộ khi đã đồng bộ hoàn tất", () => {
      saveOfflineOrder(mockOfflineOrder);
      expect(getPendingOfflineOrders().length).toBe(1);

      removeOfflineOrder("OFF-2026-001");
      expect(getPendingOfflineOrders().length).toBe(0);
    });
  });

  describe("NCL-08-CN-002: Hiển thị trạng thái ngoại tuyến và điều khiển đồng bộ (OfflineSyncBanner)", () => {
    it("Hiển thị thanh cảnh báo khi mất kết nối mạng và báo số đơn hàng đang chờ đồng bộ", () => {
      render(
        <Provider store={createTestStore("VT-02")}>
          <OfflineSyncBanner
            isOnline={false}
            pendingCount={3}
            onSync={vi.fn()}
          />
        </Provider>
      );

      expect(screen.getByText(/Chế độ ngoại tuyến/i)).toBeInTheDocument();
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });

    it("Khi có mạng trở lại, hiển thị nút 'Đồng bộ ngay' và kích hoạt callback khi nhấn", () => {
      const onSyncMock = vi.fn();

      render(
        <Provider store={createTestStore("VT-01")}>
          <OfflineSyncBanner
            isOnline={true}
            pendingCount={2}
            isSyncing={false}
            onSync={onSyncMock}
          />
        </Provider>
      );

      const syncBtn = screen.getByRole("button", { name: /Đồng bộ ngay/i });
      expect(syncBtn).toBeInTheDocument();
      fireEvent.click(syncBtn);

      expect(onSyncMock).toHaveBeenCalledTimes(1);
    });

    it("Hiển thị nút 'Giải quyết xung đột ngay' khi phát hiện có đơn hàng bị xung đột dữ liệu", () => {
      const onOpenConflictModalMock = vi.fn();

      render(
        <Provider store={createTestStore("VT-01")}>
          <OfflineSyncBanner
            isOnline={true}
            pendingCount={1}
            conflictingOrdersCount={1}
            onSync={vi.fn()}
            onOpenConflictModal={onOpenConflictModalMock}
          />
        </Provider>
      );

      const conflictBtn = screen.getByRole("button", { name: /Giải quyết xung đột ngay/i });
      expect(conflictBtn).toBeInTheDocument();
      fireEvent.click(conflictBtn);

      expect(onOpenConflictModalMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("NCL-08-CN-003: Xử lý xung đột dữ liệu ngoại tuyến (ConflictResolutionModal)", () => {
    const conflictingList: ILocalOfflineOrder[] = [
      {
        ...mockOfflineOrder,
        localId: "local-01",
        syncStatus: "CONFLICT",
        errorMessage: "Đơn hàng đã tồn tại trên máy chủ với số tiền khác",
      },
    ];

    it("Chủ hộ (VT-01) có quyền chọn phương án Giữ Server hoặc Ghi đè Client", async () => {
      const onResolveMock = vi.fn().mockResolvedValue(undefined);
      const onCloseMock = vi.fn();

      render(
        <ConflictResolutionModal
          isOpen={true}
          conflictingOrders={conflictingList}
          currentRole="VT-01"
          onResolve={onResolveMock}
          onClose={onCloseMock}
        />
      );

      expect(screen.getByText(/Xung đột dữ liệu đơn hàng ngoại tuyến/i)).toBeInTheDocument();
      expect(screen.getByText(/OFF-2026-001/)).toBeInTheDocument();

      // Find KEEP_SERVER button
      const keepServerBtn = screen.getByRole("button", { name: /Giữ đơn trên máy chủ/i });
      expect(keepServerBtn).toBeInTheDocument();
      fireEvent.click(keepServerBtn);

      await waitFor(() => {
        expect(onResolveMock).toHaveBeenCalledWith("OFF-2026-001", "KEEP_SERVER");
        expect(onCloseMock).toHaveBeenCalledTimes(1);
      });
    });

    it("Nhân viên bán hàng (VT-02) bị chặn quyền giải quyết xung đột và hiển thị thông báo yêu cầu chủ hộ", () => {
      render(
        <ConflictResolutionModal
          isOpen={true}
          conflictingOrders={conflictingList}
          currentRole="VT-02"
          onResolve={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(
        screen.getByText(/Yêu cầu quyền Chủ hộ kinh doanh:/i)
      ).toBeInTheDocument();
    });
  });
});
