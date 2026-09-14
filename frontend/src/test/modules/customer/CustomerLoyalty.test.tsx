import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { CustomerLoyaltyTab } from "@/modules/customer/components/CustomerLoyaltyTab";
import { PointAdjustmentModal } from "@/modules/customer/components/PointAdjustmentModal";
import * as loyaltyApiModule from "@/modules/customer/services/loyaltyApi";
import type { ICustomerLoyaltySummary, IPointTransactionPageResponse } from "@/modules/customer/types/ILoyalty";

const mockSummary: ICustomerLoyaltySummary = {
  customerId: "cust-123",
  customerName: "Trần Văn A",
  phoneNumber: "0901234567",
  availablePoints: 250,
  monetaryEquivalent: 250000,
  isEligibleToRedeem: true,
  minPointsToRedeem: 50,
  totalPointsEarned: 500,
  totalPointsRedeemed: 200,
  totalPointsDeductedOnReturn: 50,
  nearestExpiringDate: "2026-12-31",
  pointsExpiringSoon: 30,
};

const mockTransactions: IPointTransactionPageResponse = {
  content: [
    {
      id: "tx-1",
      customerId: "cust-123",
      customerName: "Trần Văn A",
      orderId: "ord-1",
      orderNumber: "HD-0001",
      type: "EARN",
      pointsChange: 100,
      balanceAfter: 250,
      monetaryEquivalent: 100000,
      description: "Tích điểm từ đơn hàng HD-0001",
      createdAt: "2026-09-14T09:00:00",
      createdByUsername: "thu_ngan_1",
    },
    {
      id: "tx-2",
      customerId: "cust-123",
      customerName: "Trần Văn A",
      orderId: "ord-2",
      orderNumber: "HD-0002",
      type: "REDEEM",
      pointsChange: -50,
      balanceAfter: 150,
      monetaryEquivalent: 50000,
      description: "Đổi điểm đơn hàng HD-0002",
      createdAt: "2026-09-10T14:30:00",
      createdByUsername: "thu_ngan_1",
    },
  ],
  pageNumber: 0,
  pageSize: 15,
  totalElements: 2,
  totalPages: 1,
  last: true,
};

const createTestStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

describe("Customer Loyalty - Subtask CV-04 & CV-05 Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("TC-01: Hiển thị đầy đủ KPI tóm tắt điểm thưởng và sổ cái biến động điểm", async () => {
    vi.spyOn(loyaltyApiModule, "useGetCustomerLoyaltySummaryQuery").mockReturnValue({
      data: mockSummary,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(loyaltyApiModule, "useGetCustomerPointTransactionsQuery").mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const store = createTestStore();
    render(
      <Provider store={store}>
        <NotificationProvider>
          <CustomerLoyaltyTab
            customerId="cust-123"
            customerName="Trần Văn A"
            isOwner={true}
          />
        </NotificationProvider>
      </Provider>
    );

    // Kiểm tra các KPI
    expect(screen.getByText("Điểm khả dụng")).toBeInTheDocument();
    expect(screen.getAllByText("250").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/250\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Đủ điều kiện đổi điểm/)).toBeInTheDocument();
    expect(screen.getByText("Sắp hết hạn (30 ngày)")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Tổng tích lũy")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();

    // Kiểm tra danh sách giao dịch
    expect(screen.getByText("Sổ cái lịch sử biến động điểm thưởng")).toBeInTheDocument();
    expect(screen.getByText("HD-0001")).toBeInTheDocument();
    expect(screen.getByText("+100")).toBeInTheDocument();
    expect(screen.getByText("-50")).toBeInTheDocument();
  });

  it("TC-02: Phân quyền VT-01 (Chủ hộ) hiển thị nút Điều chỉnh điểm, mở modal điều chỉnh", async () => {
    vi.spyOn(loyaltyApiModule, "useGetCustomerLoyaltySummaryQuery").mockReturnValue({
      data: mockSummary,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(loyaltyApiModule, "useGetCustomerPointTransactionsQuery").mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const store = createTestStore();
    render(
      <Provider store={store}>
        <NotificationProvider>
          <CustomerLoyaltyTab
            customerId="cust-123"
            customerName="Trần Văn A"
            isOwner={true}
          />
        </NotificationProvider>
      </Provider>
    );

    const adjustBtn = screen.getByText("Điều chỉnh điểm thủ công");
    expect(adjustBtn).toBeInTheDocument();
    fireEvent.click(adjustBtn);

    // Modal điều chỉnh mở ra
    expect(screen.getByText(/Điểm khả dụng hiện tại:/)).toBeInTheDocument();
    expect(screen.getByText("Hình thức điều chỉnh")).toBeInTheDocument();
    expect(screen.getByText(/Cộng thêm điểm/)).toBeInTheDocument();
    expect(screen.getByText(/Khấu trừ điểm/)).toBeInTheDocument();
  });

  it("TC-03: Thực hiện điều chỉnh điểm thủ công thành công qua PointAdjustmentModal", async () => {
    const mockAdjustMutation = vi.fn().mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ id: "tx-new", pointsChange: 20 }),
    });

    vi.spyOn(loyaltyApiModule, "useAdjustCustomerPointsMutation").mockReturnValue([
      mockAdjustMutation,
      { isLoading: false },
    ] as any);

    const onClose = vi.fn();
    render(
      <NotificationProvider>
        <PointAdjustmentModal
          isOpen={true}
          onClose={onClose}
          customerId="cust-123"
          customerName="Trần Văn A"
          currentPoints={250}
        />
      </NotificationProvider>
    );

    const pointsInput = screen.getByPlaceholderText("Nhập số điểm (ví dụ: 50)");
    fireEvent.change(pointsInput, { target: { value: "30" } });

    const reasonInput = screen.getByPlaceholderText(
      "Nhập lý do chi tiết (ví dụ: Bù điểm khuyến mãi sự kiện, điều chỉnh sai sót ca trực...)"
    );
    fireEvent.change(reasonInput, { target: { value: "Thưởng sự kiện tri ân" } });

    const submitBtn = screen.getByText("Xác nhận điều chỉnh");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAdjustMutation).toHaveBeenCalledWith({
        customerId: "cust-123",
        body: {
          pointsChange: 30,
          reason: "Thưởng sự kiện tri ân",
        },
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
