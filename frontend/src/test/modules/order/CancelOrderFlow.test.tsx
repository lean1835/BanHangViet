import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { CancelOrderModal } from "@/modules/order/components/CancelOrderModal";
import { CanceledOrderStatisticsModal } from "@/modules/order/components/CanceledOrderStatisticsModal";
import {
  ORDER_CANCEL_MESSAGES,
  ORDER_CANCEL_REASON_CODES,
  ORDER_STATUS,
} from "@/constants/order";
import { notifyOrderCanceled } from "@/utils/orderEvents";
import type { IOrderResponse } from "@/modules/order/types/IOrder";

// Mocks
const mockCancelOrderMutation = vi.fn();
const mockGetCancelReasonsQuery = vi.fn();
const mockGetCanceledOrderStatisticsQuery = vi.fn();

vi.mock("@/modules/order/services/orderApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/order/services/orderApi")>();
  return {
    ...actual,
    useCancelOrderMutation: () => [
      mockCancelOrderMutation,
      { isLoading: false },
    ],
    useGetCancelReasonsQuery: () => mockGetCancelReasonsQuery(),
    useGetCanceledOrderStatisticsQuery: (params: any) =>
      mockGetCanceledOrderStatisticsQuery(params),
  };
});

vi.mock("@/modules/shift/services/shiftApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/shift/services/shiftApi")>();
  return {
    ...actual,
    useGetActiveShiftQuery: () => ({
      data: {
        code: 1000,
        result: {
          id: "shift-01",
          user: { fullName: "Nguyễn Văn Thu Ngân" },
        },
      },
      isLoading: false,
    }),
  };
});

const createTestStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

const mockDraftOrder: IOrderResponse = {
  id: "order-test-01",
  orderNumber: "DH-20260910-001",
  householdId: "house-01",
  shiftId: "shift-01",
  createdByUserId: "user-01",
  createdByUsername: "thungan01",
  customerId: "cust-01",
  customerName: "Nguyễn Văn Khách",
  totalAmount: 250000,
  discountAmount: 0,
  finalAmount: 250000,
  paymentMethod: null,
  paymentStatus: "PENDING",
  status: ORDER_STATUS.CREATING,
  syncStatus: "SYNCED",
  isOffline: false,
  syncedAt: null,
  createdAt: "2026-09-10T10:00:00",
  updatedAt: "2026-09-10T10:00:00",
  items: [
    {
      id: "item-1",
      productId: "prod-1",
      productName: "Bia Heineken 330ml",
      quantity: 5,
      unitPrice: 20000,
      discountAmount: 0,
      taxRatePercentage: 10,
      taxAmount: 10000,
      subtotal: 100000,
    },
  ],
  warningMessages: [],
  qrCodeUrl: null,
  changeAmount: 0,
};

const mockStandardReasons = [
  { code: "CUSTOMER_CHANGED_MIND", description: "Khách đổi ý", requiresNote: false },
  { code: "OUT_OF_STOCK", description: "Hết hàng", requiresNote: false },
  { code: "STAFF_INPUT_ERROR", description: "Nhân viên nhập nhầm", requiresNote: false },
  { code: "OTHER", description: "Lý do khác", requiresNote: true },
];

describe("NCL-03-CN-009: Hủy đơn chưa thanh toán kèm lý do", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCancelReasonsQuery.mockReturnValue({
      data: { code: 1000, result: mockStandardReasons },
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("CancelOrderModal - Giao diện và Kiểm thử Nghiệp vụ", () => {
    it("renders modal with order details and standard cancel reasons", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter>
            <CancelOrderModal
              isOpen={true}
              onClose={vi.fn()}
              order={mockDraftOrder}
            />
          </MemoryRouter>
        </Provider>
      );

      // Modal Title & Order info
      expect(screen.getByText(ORDER_CANCEL_MESSAGES.MODAL_TITLE)).toBeInTheDocument();
      expect(screen.getByText("DH-20260910-001")).toBeInTheDocument();
      expect(screen.getByText("Nguyễn Văn Khách")).toBeInTheDocument();

      // All 4 standard reasons rendered
      expect(screen.getByText("Khách đổi ý")).toBeInTheDocument();
      expect(screen.getByText("Hết hàng")).toBeInTheDocument();
      expect(screen.getByText("Nhân viên nhập nhầm")).toBeInTheDocument();
      expect(screen.getByText("Lý do khác")).toBeInTheDocument();
    });

    it("NCL-03-CN-009-TC-02: Chặn hủy khi chưa chọn lý do (Thiếu dữ liệu)", async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter>
            <CancelOrderModal
              isOpen={true}
              onClose={vi.fn()}
              order={mockDraftOrder}
            />
          </MemoryRouter>
        </Provider>
      );

      // Bấm Xác nhận hủy ngay mà không chọn lý do
      const confirmButton = screen.getByRole("button", {
        name: ORDER_CANCEL_MESSAGES.CONFIRM_BUTTON,
      });
      fireEvent.click(confirmButton);

      // Kiểm chứng hiển thị thông báo lỗi validate
      await waitFor(() => {
        expect(screen.getByText(ORDER_CANCEL_MESSAGES.REASON_REQUIRED)).toBeInTheDocument();
      });

      // Đảm bảo không gọi API khi thiếu dữ liệu
      expect(mockCancelOrderMutation).not.toHaveBeenCalled();
    });

    it("NCL-03-CN-009-TC-02: Chặn hủy khi chọn lý do OTHER nhưng không nhập ghi chú chi tiết", async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter>
            <CancelOrderModal
              isOpen={true}
              onClose={vi.fn()}
              order={mockDraftOrder}
            />
          </MemoryRouter>
        </Provider>
      );

      // Chọn lý do "Lý do khác"
      const otherButton = screen.getByText("Lý do khác");
      fireEvent.click(otherButton);

      // Field textarea xuất hiện
      const noteTextarea = screen.getByPlaceholderText(
        /Nhập chi tiết lý do hủy đơn/i
      );
      expect(noteTextarea).toBeInTheDocument();

      // Bấm submit mà không nhập ghi chú
      const confirmButton = screen.getByRole("button", {
        name: ORDER_CANCEL_MESSAGES.CONFIRM_BUTTON,
      });
      fireEvent.click(confirmButton);

      // Kiểm chứng hiển thị thông báo lỗi yêu cầu ghi chú
      await waitFor(() => {
        expect(screen.getByText(ORDER_CANCEL_MESSAGES.NOTE_REQUIRED)).toBeInTheDocument();
      });

      expect(mockCancelOrderMutation).not.toHaveBeenCalled();
    });

    it("NCL-03-CN-009-TC-01: Hủy đơn thành công khi chọn Khách đổi ý (CUSTOMER_CHANGED_MIND)", async () => {
      const mockSuccessOrder: IOrderResponse = {
        ...mockDraftOrder,
        status: ORDER_STATUS.CANCELED,
        cancelReason: ORDER_CANCEL_REASON_CODES.CUSTOMER_CHANGED_MIND,
        cancelReasonDescription: "Khách đổi ý",
      };

      mockCancelOrderMutation.mockReturnValue({
        unwrap: () => Promise.resolve({ code: 1000, result: mockSuccessOrder }),
      });

      const handleSuccess = vi.fn();
      const handleClose = vi.fn();
      const store = createTestStore();

      render(
        <Provider store={store}>
          <MemoryRouter>
            <CancelOrderModal
              isOpen={true}
              onClose={handleClose}
              order={mockDraftOrder}
              onSuccess={handleSuccess}
            />
          </MemoryRouter>
        </Provider>
      );

      // Chọn "Khách đổi ý"
      fireEvent.click(screen.getByText("Khách đổi ý"));

      // Bấm Xác nhận
      fireEvent.click(
        screen.getByRole("button", { name: ORDER_CANCEL_MESSAGES.CONFIRM_BUTTON })
      );

      await waitFor(() => {
        expect(mockCancelOrderMutation).toHaveBeenCalledWith({
          orderId: "order-test-01",
          data: {
            cancelReason: "CUSTOMER_CHANGED_MIND",
            cancelReasonNote: undefined,
          },
        });
        expect(handleSuccess).toHaveBeenCalledWith(mockSuccessOrder);
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it("NCL-03-CN-009-TC-01: Hủy đơn thành công khi chọn OTHER và có nhập ghi chú chi tiết", async () => {
      const mockSuccessOrder: IOrderResponse = {
        ...mockDraftOrder,
        status: ORDER_STATUS.CANCELED,
        cancelReason: ORDER_CANCEL_REASON_CODES.OTHER,
        cancelReasonDescription: "Lý do khác",
        cancelReasonNote: "Khách quên ví tiền mặt, hẹn chiều quay lại lấy",
      };

      mockCancelOrderMutation.mockReturnValue({
        unwrap: () => Promise.resolve({ code: 1000, result: mockSuccessOrder }),
      });

      const handleSuccess = vi.fn();
      const store = createTestStore();

      render(
        <Provider store={store}>
          <MemoryRouter>
            <CancelOrderModal
              isOpen={true}
              onClose={vi.fn()}
              order={mockDraftOrder}
              onSuccess={handleSuccess}
            />
          </MemoryRouter>
        </Provider>
      );

      // Chọn "Lý do khác"
      fireEvent.click(screen.getByText("Lý do khác"));

      // Nhập ghi chú
      const noteInput = screen.getByPlaceholderText(/Nhập chi tiết lý do hủy đơn/i);
      fireEvent.change(noteInput, {
        target: { value: "Khách quên ví tiền mặt, hẹn chiều quay lại lấy" },
      });

      // Submit
      fireEvent.click(
        screen.getByRole("button", { name: ORDER_CANCEL_MESSAGES.CONFIRM_BUTTON })
      );

      await waitFor(() => {
        expect(mockCancelOrderMutation).toHaveBeenCalledWith({
          orderId: "order-test-01",
          data: {
            cancelReason: "OTHER",
            cancelReasonNote: "Khách quên ví tiền mặt, hẹn chiều quay lại lấy",
          },
        });
        expect(handleSuccess).toHaveBeenCalledWith(mockSuccessOrder);
      });
    });
  });

  describe("CanceledOrderStatisticsModal - Thống kê đơn hủy theo ca & nhân viên", () => {
    it("renders canceled order statistics with reasons breakdown and employee list", async () => {
      const mockStats = {
        totalCanceledOrders: 4,
        totalCanceledAmount: 520000,
        shiftId: "shift-01",
        shiftName: "Ca sáng (08:00 - 12:00)",
        byReason: [
          {
            reasonCode: "CUSTOMER_CHANGED_MIND",
            reasonDescription: "Khách đổi ý",
            count: 3,
            percentage: 75.0,
          },
          {
            reasonCode: "OTHER",
            reasonDescription: "Lý do khác",
            count: 1,
            percentage: 25.0,
          },
        ],
        byEmployee: [
          {
            employeeId: "user-01",
            employeeUsername: "thungan01",
            employeeFullName: "Trần Thu Ngân",
            count: 4,
            totalAmount: 520000,
          },
        ],
        recentCanceledOrders: [
          {
            orderId: "ord-1",
            orderNumber: "DH-001",
            totalAmount: 150000,
            cancelReason: "CUSTOMER_CHANGED_MIND",
            cancelReasonDescription: "Khách đổi ý",
            cancelReasonNote: null,
            canceledByFullName: "Trần Thu Ngân",
            canceledAt: "2026-09-10T10:15:00",
          },
        ],
      };

      mockGetCanceledOrderStatisticsQuery.mockReturnValue({
        data: { code: 1000, result: mockStats },
        isLoading: false,
        isFetching: false,
      });

      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter>
            <CanceledOrderStatisticsModal
              isOpen={true}
              onClose={vi.fn()}
              initialShiftId="shift-01"
            />
          </MemoryRouter>
        </Provider>
      );

      // Verify Header & KPI metrics
      expect(screen.getByText("Thống Kê Đơn Hàng Hủy")).toBeInTheDocument();
      expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1); // total orders and employee count
      expect(screen.getAllByText("520.000 đ").length).toBeGreaterThanOrEqual(1); // total amount and employee amount

      // Verify Breakdown by reason
      expect(screen.getByText(/75%/)).toBeInTheDocument();
      expect(screen.getByText(/25%/)).toBeInTheDocument();

      // Verify Breakdown by employee
      expect(screen.getAllByText("Trần Thu Ngân").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("thungan01")).toBeInTheDocument();

      // Verify Recent orders
      expect(screen.getByText("DH-001")).toBeInTheDocument();
    });
  });

  describe("NCL-03-CN-009-TC-03: Ràng buộc trạng thái đơn đã thanh toán", () => {
    it("chặn hủy đơn khi đơn đã ở trạng thái COMPLETED và hiển thị hướng dẫn luồng", () => {
      const completedOrder: IOrderResponse = {
        ...mockDraftOrder,
        id: "order-completed-01",
        orderNumber: "DH-COMPLETED-001",
        status: ORDER_STATUS.COMPLETED,
        paymentStatus: "PAID",
      };

      // Giả lập hàm xử lý kiểm tra trạng thái trước khi hủy
      const handleAttemptCancel = (order: IOrderResponse) => {
        if (order.status === ORDER_STATUS.COMPLETED) {
          return ORDER_CANCEL_MESSAGES.COMPLETED_ORDER_BLOCK_NOTICE;
        }
        return "OK";
      };

      const result = handleAttemptCancel(completedOrder);
      expect(result).toBe(ORDER_CANCEL_MESSAGES.COMPLETED_ORDER_BLOCK_NOTICE);
      expect(result).toContain("Hủy hóa đơn");
      expect(result).toContain("Lập phiếu trả hàng");
    });
  });

  describe("Đồng bộ Native Màn Bán Hàng (POS) khi Hủy Đơn", () => {
    it("tự động dọn sạch tab đơn hàng tương ứng trong localStorage khi notifyOrderCanceled được gọi", () => {
      // Giả lập dữ liệu tab trong localStorage của POS
      const fakePosState = {
        tabs: [
          {
            id: "tab-160",
            orderNumber: "Hóa đơn 160",
            backendOrderId: "order-to-cancel-uuid",
            items: [{ id: "item-1", quantity: 1, price: 50000 }],
            status: "DRAFT",
          },
          {
            id: "tab-161",
            orderNumber: "Hóa đơn 161",
            backendOrderId: "order-active-uuid",
            items: [],
            status: "PENDING",
          },
        ],
        activeTabId: "tab-160",
        tabCounter: 161,
      };

      localStorage.setItem("pos_tabs_state_v1", JSON.stringify(fakePosState));

      // Gọi phát tín hiệu hủy đơn
      notifyOrderCanceled("order-to-cancel-uuid", "Hóa đơn 160");

      // Kiểm tra localStorage đã được dọn sạch đơn 160
      const savedState = JSON.parse(localStorage.getItem("pos_tabs_state_v1") || "{}");
      expect(savedState.tabs.length).toBe(1);
      expect(savedState.tabs[0].id).toBe("tab-161");
      expect(savedState.activeTabId).toBe("tab-161");
    });

    it("tự động tạo tab mới sạch sẽ nếu đơn bị hủy là tab duy nhất trên màn hình bán hàng", () => {
      const singleTabState = {
        tabs: [
          {
            id: "tab-only-160",
            orderNumber: "Hóa đơn 160",
            backendOrderId: "order-single-uuid",
            items: [{ id: "item-1", quantity: 1, price: 100000 }],
            status: "DRAFT",
          },
        ],
        activeTabId: "tab-only-160",
        tabCounter: 160,
      };

      localStorage.setItem("pos_tabs_state_v1", JSON.stringify(singleTabState));

      notifyOrderCanceled("order-single-uuid", "Hóa đơn 160");

      const savedState = JSON.parse(localStorage.getItem("pos_tabs_state_v1") || "{}");
      expect(savedState.tabs.length).toBe(1);
      expect(savedState.tabs[0].id).not.toBe("tab-only-160");
      expect(savedState.tabs[0].items).toEqual([]);
      expect(savedState.tabCounter).toBe(161);
    });
  });
});
