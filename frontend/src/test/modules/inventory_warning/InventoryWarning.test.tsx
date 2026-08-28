import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { LowStockWarningTable } from "@/modules/product/components/LowStockWarningTable";
import { PurchaseSuggestionTable } from "@/modules/product/components/PurchaseSuggestionTable";
import { UpdateMinStockModal } from "@/modules/product/components/UpdateMinStockModal";
import { InventoryWarningSidebar } from "@/modules/product/components/InventoryWarningSidebar";
import type {
  ILowStockWarning,
  IPurchaseSuggestion,
  IInventoryWarningFilterState,
} from "@/modules/product/types/IInventoryWarning";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";

afterEach(() => {
  cleanup();
});

// Helper to wrap with redux provider and toast provider
const renderWithReduxAndToast = (ui: React.ReactElement) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <NotificationProvider>{ui}</NotificationProvider>
    </Provider>
  );
};

describe("NCL-13-CN-005: LowStockWarningTable Component", () => {
  const mockWarnings: ILowStockWarning[] = [
    {
      productId: "prod-1",
      sku: "SP001",
      productName: "Nước Mắm Nam Ngư 500ml",
      unit: "Chai",
      price: 35000,
      costPrice: 28000,
      stockQuantity: 12,
      minStockQuantity: 20,
      shortageQuantity: 8,
      groupId: "grp-1",
      groupName: "Gia vị",
      lastSupplierId: "sup-1",
      lastSupplierName: "Công Ty Cổ Phần Masan",
      lastSupplierPhone: "0901234567",
    },
    {
      productId: "prod-2",
      sku: "SP002",
      productName: "Mì Hảo Hảo Tôm Chua Cay",
      unit: "Gói",
      price: 4500,
      costPrice: 3800,
      stockQuantity: 0,
      minStockQuantity: 50,
      shortageQuantity: 50,
      groupId: "grp-1",
      groupName: "Thực phẩm",
      lastSupplierId: null,
      lastSupplierName: null,
      lastSupplierPhone: null,
    },
  ];

  it("NCL-13-CN-005-TC-01: Renders warning rows correctly with SKU, stock, minStock, shortage and supplier", () => {
    const onEditMinStock = vi.fn();
    const onQuickReorder = vi.fn();

    render(
      <LowStockWarningTable
        warnings={mockWarnings}
        isStockAdequate={false}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={2}
        isOwner={true}
        onPageChange={vi.fn()}
        onEditMinStock={onEditMinStock}
        onQuickReorder={onQuickReorder}
      />
    );

    // Assert SKU and Names
    expect(screen.getByText("SP001")).toBeInTheDocument();
    expect(screen.getByText("Nước Mắm Nam Ngư 500ml")).toBeInTheDocument();
    expect(screen.getByText("SP002")).toBeInTheDocument();
    expect(screen.getByText("Mì Hảo Hảo Tôm Chua Cay")).toBeInTheDocument();

    // Assert Stock & Shortage
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("+8")).toBeInTheDocument();
    expect(screen.getByText("+50")).toBeInTheDocument();

    // Assert Supplier
    expect(screen.getByText("Công Ty Cổ Phần Masan")).toBeInTheDocument();
    expect(screen.getByText("0901234567")).toBeInTheDocument();
    expect(screen.getByText("Chưa có NCC")).toBeInTheDocument();

    // Action: click quick reorder
    const orderButtons = screen.getAllByRole("button", { name: /Nhập/i });
    fireEvent.click(orderButtons[0]);
    expect(onQuickReorder).toHaveBeenCalledWith(mockWarnings[0]);
  });

  it("NCL-13-CN-005-TC-02: Renders safe state message when stock is adequate (isStockAdequate = true)", () => {
    render(
      <LowStockWarningTable
        warnings={[]}
        isStockAdequate={true}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={0}
        isOwner={true}
        onPageChange={vi.fn()}
        onEditMinStock={vi.fn()}
        onQuickReorder={vi.fn()}
      />
    );

    expect(screen.getByText("Tồn kho đang an toàn và đầy đủ")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Không có mặt hàng nào có lượng tồn thấp hơn ngưỡng tối thiểu đã thiết lập."
      )
    ).toBeInTheDocument();
  });

  it("NCL-13-CN-005-TC-03: Disables / hides min stock edit for employee role (isOwner = false)", () => {
    const onEditMinStock = vi.fn();

    render(
      <LowStockWarningTable
        warnings={mockWarnings}
        isStockAdequate={false}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={2}
        isOwner={false}
        onPageChange={vi.fn()}
        onEditMinStock={onEditMinStock}
        onQuickReorder={vi.fn()}
      />
    );

    // Edit button with title "Sửa ngưỡng tồn tối thiểu" should NOT be clickable
    expect(screen.queryByTitle("Sửa ngưỡng tồn tối thiểu")).not.toBeInTheDocument();
    // Instead, lock indicator is rendered
    expect(
      screen.getAllByTitle("Chỉ Chủ hộ kinh doanh mới được phép sửa ngưỡng tồn").length
    ).toBe(2);
  });
});

describe("NCL-18-CN-002: PurchaseSuggestionTable Component", () => {
  const mockSuggestions: IPurchaseSuggestion[] = [
    {
      productId: "prod-1",
      sku: "SP001",
      productName: "Nước Mắm Nam Ngư 500ml",
      unit: "Chai",
      costPrice: 28000,
      stockQuantity: 5,
      minStockQuantity: 10,
      averageWeeklySales: 20,
      totalSoldInPeriod: 80,
      suggestedQuantity: 15,
      calculationRationale: "Bán trung bình 20 Chai/tuần, tồn hiện có 5 Chai -> Gợi ý nhập 15 Chai",
      hasPromotion: false,
      promotionWarning: null,
      groupId: "grp-1",
      groupName: "Gia vị",
      lastSupplierId: "sup-1",
      lastSupplierName: "Công Ty Cổ Phần Masan",
      lastSupplierPhone: "0901234567",
    },
    {
      productId: "prod-2",
      sku: "SP002",
      productName: "Bia Heineken Sleek Lon 330ml",
      unit: "Lon",
      costPrice: 19000,
      stockQuantity: 10,
      minStockQuantity: 24,
      averageWeeklySales: 50,
      totalSoldInPeriod: 200,
      suggestedQuantity: 40,
      calculationRationale: "Bán trung bình 50 Lon/tuần, tồn hiện có 10 Lon -> Gợi ý nhập 40 Lon",
      hasPromotion: true,
      promotionWarning: "Dữ liệu có đợt khuyến mại trong kỳ, số lượng gợi ý có thể cao hơn nhu cầu thực tế",
      groupId: "grp-2",
      groupName: "Đồ uống",
      lastSupplierId: null,
      lastSupplierName: null,
      lastSupplierPhone: null,
    },
  ];

  it("NCL-18-CN-002-TC-01 & TC-02: Renders weekly average sales, suggested quantity, and calculation rationale", () => {
    const onQuickReorder = vi.fn();

    render(
      <PurchaseSuggestionTable
        suggestions={mockSuggestions}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={2}
        isOwner={true}
        onPageChange={vi.fn()}
        onQuickReorder={onQuickReorder}
      />
    );

    // Weekly sales & suggestions
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("+15")).toBeInTheDocument();
    expect(screen.getByText("+40")).toBeInTheDocument();
    expect(
      screen.getByText("Bán trung bình 20 Chai/tuần, tồn hiện có 5 Chai -> Gợi ý nhập 15 Chai")
    ).toBeInTheDocument();

    // Click quick reorder button
    const reorderButtons = screen.getAllByRole("button", { name: /Nhập/i });
    fireEvent.click(reorderButtons[0]);
    expect(onQuickReorder).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it("NCL-18-CN-002-TC-04: Blocks employee access and shows permission warning (isOwner = false)", () => {
    render(
      <PurchaseSuggestionTable
        suggestions={mockSuggestions}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={2}
        isOwner={false}
        onPageChange={vi.fn()}
        onQuickReorder={vi.fn()}
      />
    );

    expect(screen.getByText("Quyền truy cập bị giới hạn")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Chức năng phân tích bán hàng và gợi ý nhập hàng chỉ dành cho Chủ hộ kinh doanh (VT-01) để phục vụ việc ra quyết định nhập hàng."
      )
    ).toBeInTheDocument();
  });
});

describe("UpdateMinStockModal Component", () => {
  const mockProduct = {
    id: "prod-1",
    name: "Nước Mắm Nam Ngư 500ml",
    sku: "SP001",
    unit: "Chai",
    stockQuantity: 12,
    minStockQuantity: 20,
  };

  it("renders modal with product details and current min stock value", () => {
    renderWithReduxAndToast(
      <UpdateMinStockModal
        isOpen={true}
        onClose={vi.fn()}
        product={mockProduct}
      />
    );

    expect(screen.getByText("Cài đặt ngưỡng tồn tối thiểu")).toBeInTheDocument();
    expect(screen.getByText("Nước Mắm Nam Ngư 500ml")).toBeInTheDocument();
    expect(screen.getByText("SP001")).toBeInTheDocument();

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.value).toBe("20");
  });
});

describe("InventoryWarningSidebar Component", () => {
  it("triggers filter callback when changing filter group and period days", () => {
    const onFilterChange = vi.fn();
    const filter: IInventoryWarningFilterState = {
      search: "",
      groupId: "ALL",
      periodDays: 28,
      activeTab: "suggestions",
    };

    renderWithReduxAndToast(
      <InventoryWarningSidebar filter={filter} onFilterChange={onFilterChange} />
    );

    // Change period
    const selects = screen.getAllByRole("combobox");
    const periodSelect = selects[1];
    fireEvent.change(periodSelect, { target: { value: "14" } });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ periodDays: 14 })
    );
  });

  it("triggers filter callback when changing thresholdDays on slow_moving tab", () => {
    const onFilterChange = vi.fn();
    const filter: IInventoryWarningFilterState = {
      search: "",
      groupId: "ALL",
      periodDays: 28,
      thresholdDays: 60,
      activeTab: "slow_moving",
    };

    renderWithReduxAndToast(
      <InventoryWarningSidebar filter={filter} onFilterChange={onFilterChange} />
    );

    const selects = screen.getAllByRole("combobox");
    const thresholdSelect = selects[1];
    fireEvent.change(thresholdSelect, { target: { value: "90" } });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ thresholdDays: 90 })
    );
  });
});
