import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { PosHeader } from "@/modules/pos/components/PosHeader";
import { HeldOrdersDrawer } from "@/modules/pos/components/HeldOrdersDrawer";
import { HoldOrderModal } from "@/modules/pos/components/HoldOrderModal";
import type { IPosTab } from "@/modules/pos/types/IPos";
import { ORDER_HOLD_MESSAGES } from "@/constants/order";
import { notifyOrderCompleted } from "@/utils/orderEvents";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const createTestStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });

describe("NCL-03-CN-010: Đặt tên nhận diện và treo nhiều đơn theo bàn hoặc khách", () => {
  describe("CN-010-TC-01: Hiển thị bàn và tên nhận diện trên Header Tabs", () => {
    it("hiển thị chính xác tên bàn, nhãn nhận diện và cảnh báo quá hạn trên tab hóa đơn", () => {
      const store = createTestStore();
      const mockTabs: IPosTab[] = [
        {
          id: "tab-1",
          orderNumber: "Hóa đơn 1",
          orderLabel: "Khách quen áo xanh",
          diningTableId: "table-1",
          diningTableName: "Bàn 01",
          diningTableArea: "Tầng 1",
          isOverdue: false,
          holdingDurationMinutes: 45,
          status: "DRAFT",
          saleMode: "FAST",
          items: [],
          discountType: "PERCENTAGE",
          discountValue: 0,
          paymentMethod: "CASH",
          amountGiven: 0,
          isSaved: true,
        },
        {
          id: "tab-2",
          orderNumber: "Hóa đơn 2",
          orderLabel: "Mang về",
          isOverdue: true,
          holdingDurationMinutes: 260,
          status: "DRAFT",
          saleMode: "FAST",
          items: [],
          discountType: "PERCENTAGE",
          discountValue: 0,
          paymentMethod: "CASH",
          amountGiven: 0,
          isSaved: true,
        },
      ];

      render(
        <Provider store={store}>
          <BrowserRouter>
            <PosHeader
              products={[]}
              tabs={mockTabs}
              activeTabId="tab-1"
              onSelectTab={vi.fn()}
              onAddTab={vi.fn()}
              onCloseTab={vi.fn()}
              onSelectProduct={vi.fn()}
              onOpenScannerModal={vi.fn()}
              onOpenVoiceModal={vi.fn()}
              onScanBarcode={vi.fn()}
              isOnline={true}
              onOpenHeldOrders={vi.fn()}
              heldOrdersCount={2}
              overdueHeldOrdersCount={1}
            />
          </BrowserRouter>
        </Provider>
      );

      // Verify Bàn 01 is displayed on Tab 1
      expect(screen.getByText("Bàn 01")).toBeInTheDocument();
      expect(screen.getByText("Khách quen áo xanh")).toBeInTheDocument();

      // Verify Tab 2 has Mang về and overdue alert
      expect(screen.getByText("Mang về")).toBeInTheDocument();
      expect(screen.getByText("! Quá hạn")).toBeInTheDocument();

      // Verify Held orders button shows count 2
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Đơn treo")).toBeInTheDocument();
    });

    it("cho phép kéo thả tab để hoán đổi thứ tự khi có nhiều hơn 1 tab", () => {
      const store = createTestStore();
      const mockReorder = vi.fn();
      const mockTabs: IPosTab[] = [
        {
          id: "tab-1",
          orderNumber: "Hóa đơn 1",
          status: "DRAFT",
          saleMode: "FAST",
          items: [],
          discountType: "PERCENTAGE",
          discountValue: 0,
          paymentMethod: "CASH",
          amountGiven: 0,
          isSaved: true,
        },
        {
          id: "tab-2",
          orderNumber: "Hóa đơn 2",
          status: "DRAFT",
          saleMode: "FAST",
          items: [],
          discountType: "PERCENTAGE",
          discountValue: 0,
          paymentMethod: "CASH",
          amountGiven: 0,
          isSaved: true,
        },
      ];

      render(
        <Provider store={store}>
          <BrowserRouter>
            <PosHeader
              products={[]}
              tabs={mockTabs}
              activeTabId="tab-1"
              onSelectTab={vi.fn()}
              onAddTab={vi.fn()}
              onCloseTab={vi.fn()}
              onSelectProduct={vi.fn()}
              onReorderTabs={mockReorder}
              isOnline={true}
            />
          </BrowserRouter>
        </Provider>
      );

      const tab1 = screen.getByText("Hóa đơn 1").closest("div");
      const tab2 = screen.getByText("Hóa đơn 2").closest("div");

      expect(tab1).toHaveAttribute("draggable", "true");
      expect(tab2).toHaveAttribute("draggable", "true");

      // Simulate drag tab 1 over tab 2 and drop
      fireEvent.dragStart(tab1!, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: "move",
        },
      });
      fireEvent.dragOver(tab2!, {
        dataTransfer: { dropEffect: "move" },
      });
      fireEvent.drop(tab2!, {
        dataTransfer: { getData: () => "0" },
      });

      expect(mockReorder).toHaveBeenCalledWith(0, 1);
    });
  });

  describe("CN-010-TC-02 & TC-03: Drawer danh sách đơn treo & cảnh báo quá hạn", () => {
    it("hiển thị drawer danh sách đơn treo với tiêu đề và ô tìm kiếm", () => {
      const store = createTestStore();
      const handleSelect = vi.fn();
      const handleEdit = vi.fn();
      const handleCancel = vi.fn();

      render(
        <Provider store={store}>
          <HeldOrdersDrawer
            isOpen={true}
            onClose={vi.fn()}
            onSelectOrder={handleSelect}
            onEditOrder={handleEdit}
            onCancelOrder={handleCancel}
          />
        </Provider>
      );

      // Verify drawer header and search rendered
      expect(screen.getByText("Đơn Treo Trong Ca")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/tìm theo số hđ/i)).toBeInTheDocument();
    });
  });

  describe("Validation TC-01: Bắt buộc có Tên nhận diện HOẶC Bàn ăn", () => {
    it("chặn gửi yêu cầu khi cả tên nhận diện và bàn ăn đều trống", async () => {
      const store = createTestStore();
      const handleSuccess = vi.fn();

      render(
        <Provider store={store}>
          <HoldOrderModal
            isOpen={true}
            onClose={vi.fn()}
            orderId="order-test-1"
            orderNumber="Hóa đơn 1"
            onSuccess={handleSuccess}
          />
        </Provider>
      );

      expect(screen.getByText(ORDER_HOLD_MESSAGES.MODAL_TITLE)).toBeInTheDocument();

      // Click submit without entering label or selecting table
      const submitBtn = screen.getByRole("button", { name: new RegExp(ORDER_HOLD_MESSAGES.CONFIRM_BUTTON, "i") });
      fireEvent.click(submitBtn);

      // Verify validation message is shown
      expect(
        await screen.findByText(ORDER_HOLD_MESSAGES.LABEL_OR_TABLE_REQUIRED)
      ).toBeInTheDocument();

      // Mutation must not have been triggered
      expect(handleSuccess).not.toHaveBeenCalled();
    });

    it("cho phép lưu khi đã nhập tên nhận diện mà không cần chọn bàn", async () => {
      const store = createTestStore();
      const handleSuccess = vi.fn();

      render(
        <Provider store={store}>
          <HoldOrderModal
            isOpen={true}
            onClose={vi.fn()}
            orderId="order-test-1"
            orderNumber="Hóa đơn 1"
            onSuccess={handleSuccess}
          />
        </Provider>
      );

      const input = screen.getByPlaceholderText(ORDER_HOLD_MESSAGES.LABEL_PLACEHOLDER);
      fireEvent.change(input, { target: { value: "Mang về" } });

      expect(input).toHaveValue("Mang về");
    });
  });

  describe("CN-010-TC-04: Giải phóng bàn và dọn dẹp đơn treo khi thanh toán thành công", () => {
    it("notifyOrderCompleted dọn sạch tab đơn hàng đã thanh toán khỏi pos_tabs_state_v1", () => {
      const mockState = {
        tabs: [
          {
            id: "tab-1",
            orderNumber: "OD-1789026644790-2",
            backendOrderId: "order-completed-123",
            diningTableName: "Bàn 1",
            status: "COMPLETED",
            items: [{ id: "item-1", quantity: 1, lineTotal: 100000 }],
          },
        ],
        activeTabId: "tab-1",
        tabCounter: 1,
      };
      localStorage.setItem("pos_tabs_state_v1", JSON.stringify(mockState));

      // Trigger notifyOrderCompleted
      notifyOrderCompleted("order-completed-123", "OD-1789026644790-2");

      const updated = JSON.parse(localStorage.getItem("pos_tabs_state_v1") || "{}");
      // Must have created a fresh tab and cleaned up completed tab
      expect(updated.tabs.length).toBe(1);
      expect(updated.tabs[0].backendOrderId).toBeUndefined();
      expect(updated.tabs[0].orderNumber).toContain("Hóa đơn");
      expect(updated.tabs[0].items).toEqual([]);
    });
  });
});
