import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { USER_ROLES } from "@/constants/roles";
import { RoleRoute } from "@/routers/guards/RoleRoute";
import { InventoryValuationSummaryCards } from "@/modules/inventory_valuation/components/InventoryValuationSummaryCards";
import { InventoryValuationGroupTable } from "@/modules/inventory_valuation/components/InventoryValuationGroupTable";
import { InventoryValuationItemTable } from "@/modules/inventory_valuation/components/InventoryValuationItemTable";
import { MissingCostItemsTable } from "@/modules/inventory_valuation/components/MissingCostItemsTable";
import { InventoryValuationSidebar } from "@/modules/inventory_valuation/components/InventoryValuationSidebar";
import type {
  IInventoryValuationSummary,
  IProductGroupValuation,
  IInventoryValuationItem,
  IMissingCostProduct,
} from "@/modules/inventory_valuation/types/IInventoryValuation";

const mockUseDashboardDemo = vi.fn();
vi.mock("@/providers/DashboardDemoProvider", () => ({
  useDashboardDemo: () => mockUseDashboardDemo(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockSummary: IInventoryValuationSummary = {
  asOfDate: "2026-09-16",
  isHistorical: false,
  totalProducts: 10,
  valuedProductsCount: 8,
  missingCostProductsCount: 2,
  totalStockQuantity: 350,
  missingCostStockQuantity: 25,
  totalInventoryValue: 15400000,
  totalRetailValue: 22000000,
  potentialGrossProfit: 6600000,
  potentialProfitMargin: 30,
  averageDaysInStock: 24,
};

const mockGroups: IProductGroupValuation[] = [
  {
    groupId: "grp-1",
    groupName: "Bia & Nước giải khát",
    productCount: 5,
    totalStockQuantity: 200,
    totalInventoryValue: 10000000,
    totalRetailValue: 14000000,
    valuePercentage: 64.9,
    averageDaysInStock: 15,
  },
  {
    groupId: "grp-2",
    groupName: "Bánh kẹo",
    productCount: 3,
    totalStockQuantity: 150,
    totalInventoryValue: 5400000,
    totalRetailValue: 8000000,
    valuePercentage: 35.1,
    averageDaysInStock: 35,
  },
];

const mockItems: IInventoryValuationItem[] = [
  {
    productId: "p-1",
    sku: "SKU-BEER-01",
    productName: "Bia Heineken Sleek 330ml",
    unit: "Thùng",
    groupId: "grp-1",
    groupName: "Bia & Nước giải khát",
    stockQuantity: 25,
    costPrice: 410000,
    inventoryValue: 10250000,
    retailPrice: 460000,
    retailValue: 11500000,
    lastImportDate: "2026-09-10",
    daysInStock: 6,
  },
  {
    productId: "p-2",
    sku: "SKU-CAKE-01",
    productName: "Bánh Chocopie Hộp 12 cái",
    unit: "Hộp",
    groupId: "grp-2",
    groupName: "Bánh kẹo",
    stockQuantity: 100,
    costPrice: 51500,
    inventoryValue: 5150000,
    retailPrice: 65000,
    retailValue: 6500000,
    lastImportDate: "2026-08-15",
    daysInStock: 32,
  },
];

const mockMissingCostItems: IMissingCostProduct[] = [
  {
    productId: "p-missing-1",
    sku: "SKU-GIFT-01",
    productName: "Bộ Ly Thủy Tinh Quà Tặng",
    unit: "Bộ",
    groupId: null,
    groupName: "Chưa phân nhóm",
    stockQuantity: 15,
    retailPrice: 80000,
    warningMessage:
      "Chưa có giá vốn từ phiếu nhập (loại trừ khỏi tổng giá trị tồn kho)",
  },
  {
    productId: "p-missing-2",
    sku: "SKU-SNACK-01",
    productName: "Kẹo Dẻo Thỏ Trắng Nhập Lẻ",
    unit: "Gói",
    groupId: "grp-2",
    groupName: "Bánh kẹo",
    stockQuantity: 10,
    retailPrice: 25000,
    warningMessage:
      "Chưa có giá vốn từ phiếu nhập (loại trừ khỏi tổng giá trị tồn kho)",
  },
];

const renderWithRedux = (ui: React.ReactElement) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <NotificationProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </NotificationProvider>
    </Provider>
  );
};

describe("NCL-13-CN-007: Báo cáo giá trị tồn kho theo giá vốn (Frontend Tests)", () => {
  describe("NCL-13-CN-007-TC-01: Luồng thành công - Tính và hiển thị đầy đủ định giá tồn kho", () => {
    it("renders KPI summary cards with inventory valuation, potential profit, and days in stock", () => {
      renderWithRedux(
        <InventoryValuationSummaryCards summary={mockSummary} />
      );

      // Check Vốn đọng trong kho
      expect(screen.getByText("Vốn Đọng Trong Kho")).toBeInTheDocument();
      expect(screen.getByText(/15\.400\.000/)).toBeInTheDocument();

      // Check Giá trị bán lẻ
      expect(screen.getByText("Giá Trị Theo Giá Bán Lẻ")).toBeInTheDocument();
      expect(screen.getByText(/22\.000\.000/)).toBeInTheDocument();

      // Check Lãi gộp tiềm năng
      expect(screen.getByText("Lãi Gộp Tiềm Năng")).toBeInTheDocument();
      expect(screen.getByText(/6\.600\.000/)).toBeInTheDocument();
      expect(screen.getByText(/30/)).toBeInTheDocument();

      // Check Số ngày tồn trung bình
      expect(screen.getByText("24")).toBeInTheDocument();
      expect(screen.getByText(/ngày tồn trung bình/)).toBeInTheDocument();
    });

    it("renders Product Group valuation table accurately with value percentage", () => {
      const onSelectGroup = vi.fn();
      renderWithRedux(
        <InventoryValuationGroupTable
          groups={mockGroups}
          onSelectGroup={onSelectGroup}
        />
      );

      expect(screen.getByText("Bia & Nước giải khát")).toBeInTheDocument();
      expect(screen.getByText("Bánh kẹo")).toBeInTheDocument();
      expect(screen.getByText(/64,9%/)).toBeInTheDocument();
      expect(screen.getByText(/35,1%/)).toBeInTheDocument();

      // Click group filter
      const groupRows = screen.getAllByRole("row");
      fireEvent.click(groupRows[1]); // Click first group row
      expect(onSelectGroup).toHaveBeenCalledWith("grp-1");
    });

    it("renders detailed items table sorted with SKU, cost price (QTN-23), inventory value and days in stock", () => {
      const onSortChange = vi.fn();
      renderWithRedux(
        <InventoryValuationItemTable
          items={mockItems}
          onSortChange={onSortChange}
        />
      );

      expect(
        screen.getByText("Bia Heineken Sleek 330ml")
      ).toBeInTheDocument();
      expect(screen.getByText("SKU: SKU-BEER-01")).toBeInTheDocument();
      expect(screen.getByText(/10\.250\.000/)).toBeInTheDocument();
      expect(screen.getByText("6 ngày")).toBeInTheDocument();

      expect(
        screen.getByText("Bánh Chocopie Hộp 12 cái")
      ).toBeInTheDocument();
      expect(screen.getByText("32 ngày")).toBeInTheDocument();

      // Sort click
      const costHeader = screen.getByText("Giá vốn (QTN-23)");
      fireEvent.click(costHeader);
      expect(onSortChange).toHaveBeenCalledWith("costPrice");
    });
  });

  describe("NCL-13-CN-007-TC-02: Ngoại lệ - Tách riêng mặt hàng thiếu giá vốn và cảnh báo", () => {
    it("displays warning count in summary cards when missingCostProductsCount > 0", () => {
      const onViewMissingCost = vi.fn();
      renderWithRedux(
        <InventoryValuationSummaryCards
          summary={mockSummary}
          onViewMissingCost={onViewMissingCost}
        />
      );

      expect(
        screen.getByText(/2 mặt hàng thiếu giá vốn/)
      ).toBeInTheDocument();

      const viewButton = screen.getByRole("button", { name: "Xem ngay" });
      fireEvent.click(viewButton);
      expect(onViewMissingCost).toHaveBeenCalledTimes(1);
    });

    it("renders MissingCostItemsTable with warning banner and items list", () => {
      renderWithRedux(
        <MissingCostItemsTable items={mockMissingCostItems} />
      );

      // Warning banner
      expect(
        screen.getByText(
          "Mặt hàng chưa có giá vốn từ phiếu nhập (QTN-23)"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/KHÔNG tính vào tổng giá trị tồn kho/)
      ).toBeInTheDocument();

      // Items list
      expect(
        screen.getByText("Bộ Ly Thủy Tinh Quà Tặng")
      ).toBeInTheDocument();
      expect(screen.getByText("SKU: SKU-GIFT-01")).toBeInTheDocument();
      expect(
        screen.getByText("Kẹo Dẻo Thỏ Trắng Nhập Lẻ")
      ).toBeInTheDocument();
      expect(screen.getAllByText("Nhập hàng")).toHaveLength(2);
    });
  });

  describe("NCL-13-CN-007-TC-03: Phân quyền - Chặn vai trò Nhân viên bán hàng (QTN-10)", () => {
    it("permits OWNER (VT-01) and ACCOUNTANT (VT-03) to access report route", () => {
      mockUseDashboardDemo.mockReturnValue({ currentRole: USER_ROLES.OWNER });

      const { unmount } = render(
        <MemoryRouter initialEntries={["/reports/inventory-valuation"]}>
          <Routes>
            <Route
              path="/reports/inventory-valuation"
              element={
                <RoleRoute allowedRoles={[USER_ROLES.OWNER, USER_ROLES.ACCOUNTANT]}>
                  <div>Allowed Content</div>
                </RoleRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Allowed Content")).toBeInTheDocument();
      unmount();

      // Test Accountant
      mockUseDashboardDemo.mockReturnValue({ currentRole: USER_ROLES.ACCOUNTANT });

      render(
        <MemoryRouter initialEntries={["/reports/inventory-valuation"]}>
          <Routes>
            <Route
              path="/reports/inventory-valuation"
              element={
                <RoleRoute allowedRoles={[USER_ROLES.OWNER, USER_ROLES.ACCOUNTANT]}>
                  <div>Accountant Allowed Content</div>
                </RoleRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(
        screen.getByText("Accountant Allowed Content")
      ).toBeInTheDocument();
    });

    it("blocks SALES / CASHIER (VT-02) role and redirects away from report", () => {
      mockUseDashboardDemo.mockReturnValue({ currentRole: USER_ROLES.CASHIER });

      render(
        <MemoryRouter initialEntries={["/reports/inventory-valuation"]}>
          <Routes>
            <Route
              path="/reports/inventory-valuation"
              element={
                <RoleRoute allowedRoles={[USER_ROLES.OWNER, USER_ROLES.ACCOUNTANT]}>
                  <div>Confidential Content</div>
                </RoleRoute>
              }
            />
            <Route path="/dashboard" element={<div>Redirected to Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText("Confidential Content")).not.toBeInTheDocument();
      expect(screen.getByText("Redirected to Dashboard")).toBeInTheDocument();
    });
  });

  describe("InventoryValuationSidebar: Bộ lọc thời điểm chốt và tiêu chí", () => {
    it("renders date presets and handles date change", () => {
      const onFilterChange = vi.fn();
      renderWithRedux(
        <InventoryValuationSidebar
          filter={{
            asOfDate: "",
            groupId: "",
            sortBy: "inventoryValue",
            sortDir: "desc",
          }}
          onFilterChange={onFilterChange}
        />
      );

      expect(screen.getByText("Bộ Lọc Báo Cáo")).toBeInTheDocument();
      expect(screen.getByText("Hiện tại (Real-time)")).toBeInTheDocument();
      expect(screen.getByText("Hôm qua")).toBeInTheDocument();
      expect(screen.getByText("Cuối tháng trước")).toBeInTheDocument();
      expect(screen.getByText("Cuối quý trước")).toBeInTheDocument();

      // Click "Hôm qua"
      fireEvent.click(screen.getByText("Hôm qua"));
      expect(onFilterChange).toHaveBeenCalled();
    });
  });
});
