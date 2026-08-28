import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { PosHeader } from "@/modules/pos/components/PosHeader";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { IPosTab } from "@/modules/pos/types/IPos";

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

const mockProducts: IProduct[] = [
  {
    id: "prod-001",
    sku: "SP001",
    barcode: "8934567890123",
    name: "Cà phê đen túi 500g",
    unit: "Gói",
    price: 85000,
    stockQuantity: 100, // Total household stock = 100
    minStockQuantity: 5,
    status: "ACTIVE",
    groupId: "grp-1",
    groupName: "Cà phê",
    taxRateId: "tax-8",
    taxRateName: "Thuế 8%",
    taxRatePercentage: 8,
    posStocks: [
      {
        posId: "pos-cn1",
        posCode: "POS-01",
        posName: "Chi nhánh trung tâm",
        stockQuantity: 25, // Stock at Branch 1 is 25
        minStockQuantity: 5,
      },
      {
        posId: "pos-cn2",
        posCode: "POS-02",
        posName: "Chi nhánh 2",
        stockQuantity: 0, // Stock at Branch 2 is 0
        minStockQuantity: 5,
      },
    ],
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  },
  {
    id: "prod-002",
    sku: "SP002",
    barcode: "8934567890124",
    name: "Chim cu gáy",
    unit: "Con",
    price: 85000,
    stockQuantity: 500, // Total stock = 500
    minStockQuantity: 5,
    status: "ACTIVE",
    groupId: "grp-2",
    groupName: "Gia cầm",
    taxRateId: "tax-8",
    taxRateName: "Thuế 8%",
    taxRatePercentage: 8,
    posStocks: [
      {
        posId: "pos-cn1",
        posCode: "POS-01",
        posName: "Chi nhánh trung tâm",
        stockQuantity: 584,
        minStockQuantity: 10,
      },
    ],
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  },
];

const mockTab: IPosTab = {
  id: "tab-1",
  orderNumber: "Hóa đơn 1",
  status: "PENDING",
  saleMode: "FAST",
  items: [],
  discountType: "PERCENTAGE",
  discountValue: 0,
  paymentMethod: "CASH",
  amountGiven: 0,
  isSaved: false,
};

describe("POS Product Search Branch Stock", () => {
  it("displays stock corresponding to the employee's assigned POS (pos-cn1 = 25 instead of total 100)", async () => {
    const handleSelectProduct = vi.fn();
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PosHeader
            products={mockProducts}
            tabs={[mockTab]}
            activeTabId={mockTab.id}
            onSelectTab={vi.fn()}
            onAddTab={vi.fn()}
            onCloseTab={vi.fn()}
            onSelectProduct={handleSelectProduct}
            posId="pos-cn1"
            branchName="Chi nhánh trung tâm"
            userName="Trần Thị B"
          />
        </BrowserRouter>
      </Provider>
    );

    // Verify branch name displayed at header
    expect(screen.getByText("Chi nhánh trung tâm")).toBeInTheDocument();
    expect(screen.getByText("Trần Thị B")).toBeInTheDocument();

    // Focus on search input to open dropdown
    const searchInput = screen.getByPlaceholderText("Tìm hàng hóa (/)...");
    fireEvent.focus(searchInput);

    // Check that products are listed in dropdown with POS-specific stock
    expect(screen.getByText("Cà phê đen túi 500g")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument(); // Stock at pos-cn1 is 25, NOT 100
    expect(screen.getByText("584")).toBeInTheDocument();

    // Click product to select
    const productItem = screen.getByText("Cà phê đen túi 500g");
    fireEvent.click(productItem);

    expect(handleSelectProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "prod-001",
        stockQuantity: 25,
      })
    );
  });

  it("displays 0 stock when product is not stocked in employee's assigned POS (pos-cn2)", async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PosHeader
            products={mockProducts}
            tabs={[mockTab]}
            activeTabId={mockTab.id}
            onSelectTab={vi.fn()}
            onAddTab={vi.fn()}
            onCloseTab={vi.fn()}
            onSelectProduct={vi.fn()}
            posId="pos-cn2"
            branchName="Chi nhánh 2"
            userName="Trần Thị B"
          />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText("Chi nhánh 2")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText("Tìm hàng hóa (/)...");
    fireEvent.focus(searchInput);

    // Both products have 0 stock at pos-cn2
    const zeroStocks = screen.getAllByText("0");
    expect(zeroStocks.length).toBeGreaterThanOrEqual(1);
  });
});
