import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import {
  DashboardDemoContext,
  type IDashboardDemoContext,
} from "@/providers/DashboardDemoProvider";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";
import { PriceAdjustmentPage } from "@/modules/product/pages/PriceAdjustmentPage";
import {
  ADJUSTMENT_TYPE,
  BATCH_STATUS,
  PRICE_ROUNDING_METHOD,
} from "@/constants/priceAdjustment";
import type {
  IPriceAdjustmentPreviewResponse,
  IPriceAdjustmentBatch,
} from "@/modules/product/types/IPriceAdjustment";

// Mock mutations and queries
const mockPreviewMutation = vi.fn();
const mockApplyMutation = vi.fn();
const mockRevertMutation = vi.fn();
const mockRefetchBatches = vi.fn();

const mockSampleBatches: IPriceAdjustmentBatch[] = [
  {
    id: "batch-1",
    batchCode: "PADJ-20260909-001",
    name: "Đợt tăng giá nước ngọt 5%",
    adjustmentType: ADJUSTMENT_TYPE.PERCENTAGE,
    adjustmentValue: 5,
    targetGroupId: "group-1",
    targetGroupName: "Nước giải khát",
    roundingMethod: PRICE_ROUNDING_METHOD.ROUND_TO_1000,
    status: BATCH_STATUS.APPLIED,
    totalItems: 2,
    belowCostItems: 0,
    appliedBy: "user-1",
    appliedByName: "Chủ hộ Nguyễn",
    appliedAt: "2026-09-09T10:00:00",
    canRevert: true,
  },
  {
    id: "batch-2",
    batchCode: "PADJ-20260908-001",
    name: "Đợt đổi giá cũ đã hoàn tác",
    adjustmentType: ADJUSTMENT_TYPE.FIXED_AMOUNT,
    adjustmentValue: 1000,
    targetGroupId: "group-1",
    targetGroupName: "Nước giải khát",
    roundingMethod: PRICE_ROUNDING_METHOD.NONE,
    status: BATCH_STATUS.REVERTED,
    totalItems: 5,
    belowCostItems: 0,
    appliedBy: "user-1",
    appliedByName: "Chủ hộ Nguyễn",
    appliedAt: "2026-09-08T08:00:00",
    revertedBy: "user-1",
    revertedByName: "Chủ hộ Nguyễn",
    revertedAt: "2026-09-08T09:00:00",
    revertReason: "Áp nhầm số tiền",
    canRevert: false,
  },
];

vi.mock("@/modules/product/services/priceAdjustmentApi", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/modules/product/services/priceAdjustmentApi")
  >();
  return {
    ...actual,
    usePreviewPriceAdjustmentMutation: () => [
      mockPreviewMutation,
      { isLoading: false },
    ],
    useApplyPriceAdjustmentMutation: () => [
      mockApplyMutation,
      { isLoading: false },
    ],
    useRevertPriceAdjustmentMutation: () => [
      mockRevertMutation,
      { isLoading: false },
    ],
    useGetPriceAdjustmentBatchesQuery: () => ({
      data: {
        code: 1000,
        message: "Success",
        result: {
          content: mockSampleBatches,
          totalElements: mockSampleBatches.length,
          totalPages: 1,
          last: true,
        },
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetchBatches,
    }),
    useGetPriceAdjustmentBatchByIdQuery: () => ({
      data: {
        code: 1000,
        message: "Success",
        result: {
          ...mockSampleBatches[0],
          items: [
            {
              productId: "p-1",
              productSku: "NUOC-COCA",
              productName: "Coca Cola 330ml",
              unit: "lon",
              groupName: "Nước giải khát",
              oldPrice: 10000,
              newPrice: 11000,
              priceDifference: 1000,
              percentChange: 10,
              costPrice: 8000,
              isBelowCost: false,
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
    }),
  };
});

vi.mock("@/modules/product/services/productApi", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/modules/product/services/productApi")
  >();
  return {
    ...actual,
    useGetProductGroupsQuery: () => ({
      data: [
        { id: "group-1", name: "Nước giải khát" },
        { id: "group-2", name: "Bánh kẹo" },
      ],
      isLoading: false,
    }),
    useGetProductsQuery: () => ({
      data: {
        content: [
          {
            id: "p-1",
            sku: "NUOC-COCA",
            name: "Coca Cola 330ml",
            unit: "lon",
            price: 10000,
          },
          {
            id: "p-2",
            sku: "NUOC-PEPSI",
            name: "Pepsi 330ml",
            unit: "lon",
            price: 20000,
          },
        ],
        totalElements: 2,
        totalPages: 1,
      },
      isLoading: false,
    }),
  };
});

const createMockStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

const renderWithProviders = (
  ui: React.ReactElement,
  role: string = USER_ROLES.OWNER
) => {
  const store = createMockStore();
  const mockContextValue = {
    currentRole: role as TDemoRole,
    setCurrentRole: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
    simConflict: false,
    setSimConflict: vi.fn(),
    invoices: [],
    setInvoices: vi.fn(),
    customers: [],
    setCustomers: vi.fn(),
    logs: [],
    addLogEntry: vi.fn(),
    stockEntries: [],
    setStockEntries: vi.fn(),
    orders: [],
    setOrders: vi.fn(),
    isOrdersLoading: false,
    isOrdersError: false,
    ordersError: null,
    refetchOrders: vi.fn(),
  } as unknown as IDashboardDemoContext;

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <DashboardDemoContext.Provider value={mockContextValue}>
          <NotificationProvider>{ui}</NotificationProvider>
        </DashboardDemoContext.Provider>
      </MemoryRouter>
    </Provider>
  );
};

describe("NCL-02-CN-009: PriceAdjustmentPage & Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("TC-01: Phân tích & Luồng thành công - Chủ hộ chọn nhóm hàng, tăng giá 5%, làm tròn 1000đ và áp dụng giá mới", async () => {
    const mockPreviewResult: IPriceAdjustmentPreviewResponse = {
      adjustmentType: ADJUSTMENT_TYPE.PERCENTAGE,
      adjustmentValue: 5,
      roundingMethod: PRICE_ROUNDING_METHOD.ROUND_TO_1000,
      totalItems: 2,
      increasedItems: 2,
      decreasedItems: 0,
      unchangedItems: 0,
      belowCostItems: 0,
      items: [
        {
          productId: "p-1",
          productSku: "NUOC-COCA",
          productName: "Coca Cola 330ml",
          unit: "lon",
          groupName: "Nước giải khát",
          oldPrice: 10000,
          newPrice: 11000,
          priceDifference: 1000,
          percentChange: 10,
          costPrice: 8000,
          isBelowCost: false,
        },
        {
          productId: "p-2",
          productSku: "NUOC-PEPSI",
          productName: "Pepsi 330ml",
          unit: "lon",
          groupName: "Nước giải khát",
          oldPrice: 20000,
          newPrice: 21000,
          priceDifference: 1000,
          percentChange: 5,
          costPrice: 15000,
          isBelowCost: false,
        },
      ],
    };

    mockPreviewMutation.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        code: 1000,
        message: "OK",
        result: mockPreviewResult,
      }),
    });

    mockApplyMutation.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        code: 1000,
        message: "OK",
        result: mockSampleBatches[0],
      }),
    });

    renderWithProviders(<PriceAdjustmentPage />, USER_ROLES.OWNER);

    // Kiểm tra render trang và tiêu đề
    expect(screen.getByText("Cập nhật giá bán hàng loạt")).toBeInTheDocument();

    // Chọn nhóm hàng "Nước giải khát"
    const groupSelect = screen.getByRole("combobox");
    fireEvent.change(groupSelect, { target: { value: "group-1" } });

    // Bấm nút "Xem trước thay đổi giá"
    const previewBtn = screen.getByText("Xem trước thay đổi giá");
    fireEvent.click(previewBtn);

    // Chờ bảng preview xuất hiện
    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          adjustmentType: ADJUSTMENT_TYPE.PERCENTAGE,
          targetGroupId: "group-1",
        })
      );
      expect(screen.getByText("Bước 2: Bảng xem trước kết quả thay đổi giá")).toBeInTheDocument();
    });

    // Kiểm tra hiển thị sản phẩm và giá mới
    expect(screen.getByText("Coca Cola 330ml")).toBeInTheDocument();
    expect(screen.getByText("Pepsi 330ml")).toBeInTheDocument();
    expect(screen.getByText("11.000đ")).toBeInTheDocument();
    expect(screen.getByText("21.000đ")).toBeInTheDocument();

    // Bấm nút áp dụng giá mới
    const applyBtn = screen.getByText("Xác nhận áp dụng giá mới");
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(mockApplyMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          targetGroupId: "group-1",
          adjustmentType: ADJUSTMENT_TYPE.PERCENTAGE,
        })
      );
    });
  });

  it("TC-02: Ngoại lệ - Cảnh báo bán lỗ khi giá mới thấp hơn giá vốn (isBelowCost = true)", async () => {
    const mockPreviewWithBelowCost: IPriceAdjustmentPreviewResponse = {
      adjustmentType: ADJUSTMENT_TYPE.PERCENTAGE,
      adjustmentValue: -30,
      roundingMethod: PRICE_ROUNDING_METHOD.NONE,
      totalItems: 1,
      increasedItems: 0,
      decreasedItems: 1,
      unchangedItems: 0,
      belowCostItems: 1,
      items: [
        {
          productId: "p-1",
          productSku: "NUOC-COCA",
          productName: "Coca Cola 330ml",
          unit: "lon",
          groupName: "Nước giải khát",
          oldPrice: 10000,
          newPrice: 7000,
          priceDifference: -3000,
          percentChange: -30,
          costPrice: 8000,
          isBelowCost: true,
        },
      ],
    };

    mockPreviewMutation.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        code: 1000,
        message: "OK",
        result: mockPreviewWithBelowCost,
      }),
    });

    renderWithProviders(<PriceAdjustmentPage />, USER_ROLES.OWNER);

    // Chọn nhóm hàng và xem trước
    const groupSelect = screen.getByRole("combobox");
    fireEvent.change(groupSelect, { target: { value: "group-1" } });

    const previewBtn = screen.getByText("Xem trước thay đổi giá");
    fireEvent.click(previewBtn);

    // Kiểm tra bảng cảnh báo xuất hiện
    await waitFor(() => {
      expect(
        screen.getByText(/Cảnh báo bán lỗ so với giá vốn!/)
      ).toBeInTheDocument();
      expect(screen.getByText("Bán lỗ")).toBeInTheDocument();
    });
  });

  it("TC-03: Hoàn tác trong vòng 24 giờ - Xem lịch sử và bấm hoàn tác đợt đổi giá kèm lý do", async () => {
    mockRevertMutation.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        code: 1000,
        message: "OK",
        result: {
          ...mockSampleBatches[0],
          status: BATCH_STATUS.REVERTED,
        },
      }),
    });

    renderWithProviders(<PriceAdjustmentPage />, USER_ROLES.OWNER);

    // Chuyển sang tab "Lịch sử điều chỉnh giá"
    const historyTab = screen.getByRole("button", { name: /Lịch sử điều chỉnh giá/i });
    fireEvent.click(historyTab);

    // Kiểm tra hiển thị đợt điều chỉnh
    await waitFor(() => {
      expect(screen.getByText("PADJ-20260909-001")).toBeInTheDocument();
      expect(screen.getByText("Đợt tăng giá nước ngọt 5%")).toBeInTheDocument();
    });

    // Bấm nút hoàn tác (nút có icon Undo2 cho batch-1)
    const revertButtons = screen.getAllByTitle("Được phép hoàn tác đợt đổi giá này trong vòng 24 giờ kể từ lúc áp dụng");
    expect(revertButtons.length).toBeGreaterThan(0);
    fireEvent.click(revertButtons[0]);

    // Kiểm tra modal hoàn tác mở ra
    expect(screen.getByText("Hoàn tác đợt điều chỉnh giá")).toBeInTheDocument();
    expect(screen.getByText(/Xác nhận khôi phục giá bán cũ/)).toBeInTheDocument();

    // Nhập lý do hoàn tác
    const reasonInput = screen.getByPlaceholderText(/VD: Nhập nhầm tỷ lệ tăng giá/);
    fireEvent.change(reasonInput, { target: { value: "Áp nhầm tỷ lệ chiết khấu cho nhóm nước" } });

    // Xác nhận hoàn tác
    const confirmRevertBtn = screen.getByText("Xác nhận hoàn tác");
    fireEvent.click(confirmRevertBtn);

    await waitFor(() => {
      expect(mockRevertMutation).toHaveBeenCalledWith({
        batchId: "batch-1",
        body: { revertReason: "Áp nhầm tỷ lệ chiết khấu cho nhóm nước" },
      });
    });
  });

  it("Chặn phân quyền: Nhân viên bán hàng (VT-02) không có quyền truy cập chức năng điều chỉnh giá", () => {
    renderWithProviders(<PriceAdjustmentPage />, USER_ROLES.CASHIER);

    expect(screen.getByText("Quyền truy cập bị từ chối (403 Forbidden)")).toBeInTheDocument();
    expect(screen.queryByText("Bước 1: Chọn phạm vi & Cơ chế tính giá mới")).not.toBeInTheDocument();
  });

  it("Chặn hoàn tác khi đợt điều chỉnh giá đã hoàn tác hoặc quá thời hạn 24 giờ (canRevert: false)", async () => {
    renderWithProviders(<PriceAdjustmentPage />, USER_ROLES.OWNER);

    const historyTab = screen.getByRole("button", { name: /Lịch sử điều chỉnh giá/i });
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText("PADJ-20260908-001")).toBeInTheDocument();
      expect(screen.getByText("Đợt đổi giá cũ đã hoàn tác")).toBeInTheDocument();
    });

    // Đợt 2 (batch-2) có status REVERTED, canRevert: false -> kiểm tra icon hoàn tác bị vô hiệu hóa
    expect(
      screen.getByTitle("Đợt điều chỉnh này đã được hoàn tác trước đó")
    ).toBeInTheDocument();
  });

  it("Nút quay lại danh mục hàng hóa gọi đúng hàm onBack", () => {
    const mockOnBack = vi.fn();
    renderWithProviders(<PriceAdjustmentPage onBack={mockOnBack} />, USER_ROLES.OWNER);

    const backBtn = screen.getByRole("button", { name: /Quay lại danh mục hàng hóa/i });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
