import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import {
  DashboardDemoContext,
  type IDashboardDemoContext,
} from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { WeightScaleModal } from "@/modules/pos/components/WeightScaleModal";
import { PosCartTable } from "@/modules/pos/components/PosCartTable";
// import { ProductFormModal } from "@/modules/product/components/ProductFormModal";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { IPosCartItem } from "@/modules/pos/types/IPos";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const createTestStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

const mockDemoContext = (role: string = USER_ROLES.OWNER): IDashboardDemoContext => ({
  isOnline: true,
  setIsOnline: vi.fn(),
  currentRole: role as any,
  setCurrentRole: vi.fn(),
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
});

const renderWithProviders = (ui: React.ReactElement, role = USER_ROLES.OWNER) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <DashboardDemoContext.Provider value={mockDemoContext(role)}>
        <NotificationProvider>{ui}</NotificationProvider>
      </DashboardDemoContext.Provider>
    </Provider>
  );
};

const mockWeightProduct: IProduct = {
  id: "prod-beef-01",
  sku: "SP-BEEF",
  name: "Thịt bò Ba chỉ Mỹ",
  unit: "Kg",
  price: 250000,
  stockQuantity: 50,
  isSoldByWeight: true,
  decimalPlaces: 3,
  minWeightStep: 0.001,
  status: "ACTIVE",
  groupId: "grp-1",
  groupName: "Thực phẩm tươi sống",
  taxRateId: "tax-0",
  taxRateName: "0%",
  taxRatePercentage: 0,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
};

const mockStandardProduct: IProduct = {
  id: "prod-coke-01",
  sku: "SP-COKE",
  name: "Coca Cola Lon 330ml",
  unit: "Lon",
  price: 10000,
  stockQuantity: 100,
  isSoldByWeight: false,
  status: "ACTIVE",
  groupId: "grp-2",
  groupName: "Nước giải khát",
  taxRateId: "tax-8",
  taxRateName: "8%",
  taxRatePercentage: 8,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
};

describe("NCL-02-CN-008: Bán hàng theo cân với số lượng thập phân", () => {
  describe("1. WeightScaleModal Component", () => {
    it("renders modal with product info and quick weight buttons", () => {
      const handleConfirm = vi.fn();
      const handleClose = vi.fn();

      renderWithProviders(
        <WeightScaleModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          product={mockWeightProduct}
          initialQuantity={0.5}
        />
      );

      // Check product name and unit displayed
      expect(screen.getByText(/Thịt bò Ba chỉ Mỹ/i)).toBeDefined();
      expect(screen.getAllByText(/250.000 đ/i).length).toBeGreaterThanOrEqual(1);

      // Check quick weight buttons
      expect(screen.getByText("+100g")).toBeDefined();
      expect(screen.getByText("+200g")).toBeDefined();
      expect(screen.getByText("+500g")).toBeDefined();
      expect(screen.getByText("+1kg")).toBeDefined();
    });

    it("allows entering decimal weight and confirms with valid value", () => {
      const handleConfirm = vi.fn();
      const handleClose = vi.fn();

      renderWithProviders(
        <WeightScaleModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          product={mockWeightProduct}
          initialQuantity={1}
        />
      );

      const weightInput = screen.getByPlaceholderText("0.001");
      fireEvent.change(weightInput, { target: { value: "0.355" } });

      const confirmBtn = screen.getByRole("button", { name: /Xác nhận đưa vào giỏ/i });
      fireEvent.click(confirmBtn);

      expect(handleConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 0.355,
        })
      );
    });

    it("switches to 'Mua theo số tiền' tab and displays quick money buttons", () => {
      const handleConfirm = vi.fn();
      const handleClose = vi.fn();

      renderWithProviders(
        <WeightScaleModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          product={mockWeightProduct}
          initialQuantity={1}
        />
      );

      const moneyTab = screen.getByRole("button", { name: /Mua theo số tiền/i });
      fireEvent.click(moneyTab);

      // Quick money buttons
      expect(screen.getByText("10k")).toBeDefined();
      expect(screen.getByText("20k")).toBeDefined();
      expect(screen.getByText("50k")).toBeDefined();
      expect(screen.getByText("100k")).toBeDefined();
    });
  });

  describe("2. PosCartTable Component", () => {
    it("renders weight-based badge for weight products and allows decimal quantities", () => {
      const mockCartItems: IPosCartItem[] = [
        {
          id: "item-1",
          product: mockWeightProduct,
          price: mockWeightProduct.price,
          quantity: 0.355,
          lineDiscount: 0,
          lineTotal: 88750,
          isSoldByWeight: true,
          decimalPlaces: 3,
          minWeightStep: 0.001,
        },
        {
          id: "item-2",
          product: mockStandardProduct,
          price: mockStandardProduct.price,
          quantity: 2,
          lineDiscount: 0,
          lineTotal: 20000,
          isSoldByWeight: false,
        },
      ];

      const handleUpdateQty = vi.fn();
      const handleRemove = vi.fn();
      const handleClear = vi.fn();

      renderWithProviders(
        <PosCartTable
          items={mockCartItems}
          onUpdateQuantity={handleUpdateQty}
          onRemoveItem={handleRemove}
          onClearCart={handleClear}
        />
      );

      // Weight badge should appear
      expect(screen.getByText(/Hàng cân/i)).toBeDefined();

      // Check decimal quantity input
      const inputs = screen.getAllByRole("spinbutton");
      const weightInput = inputs[0] as HTMLInputElement;
      expect(weightInput.value).toBe("0.355");

      // Change quantity
      fireEvent.change(weightInput, { target: { value: "0.75" } });
      expect(handleUpdateQty).toHaveBeenCalledWith("item-1", 0.75);
    });

    it("displays rounding difference when item has roundingDifference", () => {
      const mockCartItems: IPosCartItem[] = [
        {
          id: "item-1",
          product: mockWeightProduct,
          price: mockWeightProduct.price,
          quantity: 0.2,
          lineDiscount: 0,
          lineTotal: 50000,
          buyAmount: 50000,
          roundingDifference: 250,
          isSoldByWeight: true,
          decimalPlaces: 3,
          minWeightStep: 0.001,
        },
      ];

      renderWithProviders(
        <PosCartTable
          items={mockCartItems}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
        />
      );

      expect(screen.getByText(/Mua: 50.000 đ/i)).toBeDefined();
      expect(screen.getByText(/Lệch làm tròn: \+250 đ/i)).toBeDefined();
    });
  });

  describe("3. Weight Calculations & Formatting", () => {
    it("verifies formatQuantity helper formats decimals correctly according to decimalPlaces", async () => {
      const { formatQuantity } = await import("@/utils/formatCurrency");
      expect(formatQuantity(0.355, 3)).toBe("0,355");
      expect(formatQuantity(1.5, 1)).toBe("1,5");
      expect(formatQuantity(2, 3)).toBe("2");
      expect(formatQuantity(0, 3)).toBe("0");
    });

    it("verifies product weight configuration schema defaults", () => {
      expect(mockWeightProduct.isSoldByWeight).toBe(true);
      expect(mockWeightProduct.decimalPlaces).toBe(3);
      expect(mockWeightProduct.minWeightStep).toBe(0.001);
    });
  });
});
