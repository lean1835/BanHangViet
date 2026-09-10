import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
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
import { UnitConversionTable } from "@/modules/product/components/UnitConversionTable";
import { UnitConversionFormModal } from "@/modules/product/components/UnitConversionFormModal";
import { UnitConversionManagerModal } from "@/modules/product/components/UnitConversionManagerModal";
import { PosCartTable } from "@/modules/pos/components/PosCartTable";
import type { IProductUnitConversion } from "@/modules/product/types/IProductUnitConversion";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { IPosCartItem } from "@/modules/pos/types/IPos";
import { UNIT_CONVERSION_MESSAGES } from "@/constants/product";

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

const mockProduct: IProduct = {
  id: "prod-1",
  sku: "BEER-01",
  barcode: "89300000001",
  name: "Bia Heineken",
  unit: "Lon",
  price: 20000,
  costPrice: 15000,
  stockQuantity: 100,
  minStockQuantity: 20,
  status: "ACTIVE",
  groupId: "g-1",
  groupName: "Bia & Đồ uống",
  taxRateId: "tax-1",
  taxRateName: "VAT 10%",
  taxRatePercentage: 10,
  createdAt: "2026-08-01T10:00:00",
  updatedAt: "2026-08-01T10:00:00",
};

const mockConversions: IProductUnitConversion[] = [
  {
    id: "conv-1",
    productId: "prod-1",
    productName: "Bia Heineken",
    baseUnit: "Lon",
    unitName: "Thùng",
    conversionFactor: 24,
    price: 450000,
    barcode: "89399990001",
    isDefaultImport: true,
    isDefaultSale: false,
    hasStockMovement: true,
    createdAt: "2026-08-01T10:00:00",
    updatedAt: "2026-08-01T10:00:00",
  },
  {
    id: "conv-2",
    productId: "prod-1",
    productName: "Bia Heineken",
    baseUnit: "Lon",
    unitName: "Lốc",
    conversionFactor: 6,
    price: 115000,
    barcode: "89399990002",
    isDefaultImport: false,
    isDefaultSale: true,
    hasStockMovement: false,
    createdAt: "2026-08-01T10:00:00",
    updatedAt: "2026-08-01T10:00:00",
  },
];

describe("NCL-02-CN-007: Quản lý đơn vị tính và quy đổi đơn vị mua bán", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("NCL-02-CN-007-TC-01: Hiển thị danh sách và công thức quy đổi", () => {
    it("Hiển thị đầy đủ danh sách các đơn vị quy đổi kèm công thức quy đổi trực quan", () => {
      renderWithProviders(
        <UnitConversionTable
          conversions={mockConversions}
          baseUnit="Lon"
          isOwner={true}
        />
      );

      // Kiểm tra tên đơn vị
      expect(screen.getByText("Thùng")).toBeInTheDocument();
      expect(screen.getByText("Lốc")).toBeInTheDocument();

      // Kiểm tra công thức quy đổi sang đơn vị cơ sở
      expect(screen.getByText(/1 Thùng/)).toBeInTheDocument();
      expect(screen.getByText(/24 Lon/)).toBeInTheDocument();
      expect(screen.getByText(/1 Lốc/)).toBeInTheDocument();
      expect(screen.getByText(/6 Lon/)).toBeInTheDocument();

      // Kiểm tra nhãn mặc định nhập / bán
      expect(screen.getByText("Mặc định nhập")).toBeInTheDocument();
      expect(screen.getByText("Mặc định bán")).toBeInTheDocument();

      // Kiểm tra mã vạch
      expect(screen.getByText("89399990001")).toBeInTheDocument();
      expect(screen.getByText("89399990002")).toBeInTheDocument();
    });

    it("Hiển thị thông báo khi chưa có đơn vị quy đổi nào", () => {
      renderWithProviders(
        <UnitConversionTable
          conversions={[]}
          baseUnit="Lon"
          isOwner={true}
        />
      );

      expect(screen.getByText(/Chưa có đơn vị quy đổi nào/i)).toBeInTheDocument();
      expect(screen.getByText(/Lon/)).toBeInTheDocument();
    });
  });

  describe("NCL-02-CN-007-TC-02: Bán hàng theo đơn vị quy đổi trên POS (QTN-08)", () => {
    it("Cho phép chọn đơn vị tính (Thùng / Lon) trên bảng giỏ hàng POS và hiển thị số lượng quy đổi tồn cơ sở", () => {
      const productWithConversions: IProduct = {
        ...mockProduct,
        unitConversions: mockConversions,
      };

      const cartItems: IPosCartItem[] = [
        {
          id: "item-1",
          product: productWithConversions,
          quantity: 2,
          price: 450000,
          unitConversionId: "conv-1",
          unitName: "Thùng",
          conversionFactor: 24,
          lineDiscount: 0,
          lineTotal: 900000,
        },
      ];

      const onChangeUnitMock = vi.fn();
      renderWithProviders(
        <PosCartTable
          items={cartItems}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          onChangeUnit={onChangeUnitMock}
        />
      );

      // Kiểm tra hiển thị selector đơn vị quy đổi
      const unitSelect = screen.getByLabelText(/Chọn đơn vị tính cho Bia Heineken/i);
      expect(unitSelect).toBeInTheDocument();
      expect(unitSelect).toHaveValue("conv-1");

      // Kiểm tra hiển thị số lượng quy đổi sang đơn vị cơ sở (2 Thùng * 24 = 48 Lon)
      expect(screen.getByText(/Quy đổi tồn: 48 Lon/i)).toBeInTheDocument();

      // Thay đổi đơn vị tính sang Lon (BASE)
      fireEvent.change(unitSelect, { target: { value: "BASE" } });
      expect(onChangeUnitMock).toHaveBeenCalledWith("item-1", "BASE");
    });
  });

  describe("NCL-02-CN-007-TC-03: Khóa sửa hệ số quy đổi khi sản phẩm đã phát sinh giao dịch tồn kho", () => {
    it("Khi đơn vị quy đổi đã có biến động tồn (hasStockMovement = true), trường tỷ lệ quy đổi bị khóa (disabled)", () => {
      renderWithProviders(
        <UnitConversionFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          conversion={mockConversions[0]} // hasStockMovement = true
          baseUnit="Lon"
          basePrice={20000}
          productName="Bia Heineken"
        />
      );

      // Kiểm tra tiêu đề modal
      expect(screen.getByText("Chỉnh sửa đơn vị quy đổi")).toBeInTheDocument();

      // Kiểm tra trường tỷ lệ quy đổi bị disabled
      const factorInput = screen.getByLabelText(/Tỷ lệ quy đổi/i);
      expect(factorInput).toBeDisabled();

      // Kiểm tra hiển thị banner cảnh báo theo chuẩn TC-03
      expect(
        screen.getByText(UNIT_CONVERSION_MESSAGES.LOCKED_FACTOR_SHORT)
      ).toBeInTheDocument();
      expect(
        screen.getByText(UNIT_CONVERSION_MESSAGES.LOCKED_FACTOR_WARNING)
      ).toBeInTheDocument();

      // Các trường khác như giá bán, mã vạch vẫn cho phép chỉnh sửa bình thường
      const priceInput = screen.getByLabelText(/Giá bán theo đơn vị quy đổi/i);
      expect(priceInput).not.toBeDisabled();
      const barcodeInput = screen.getByLabelText(/Mã vạch riêng/i);
      expect(barcodeInput).not.toBeDisabled();
    });

    it("Khi đơn vị quy đổi chưa phát sinh biến động tồn (hasStockMovement = false), trường tỷ lệ quy đổi mở cho phép sửa", () => {
      renderWithProviders(
        <UnitConversionFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          conversion={mockConversions[1]} // hasStockMovement = false
          baseUnit="Lon"
          basePrice={20000}
          productName="Bia Heineken"
        />
      );

      const factorInput = screen.getByLabelText(/Tỷ lệ quy đổi/i);
      expect(factorInput).not.toBeDisabled();
      expect(
        screen.queryByText(UNIT_CONVERSION_MESSAGES.LOCKED_FACTOR_SHORT)
      ).not.toBeInTheDocument();
    });

    it("Validation chặn nếu nhập tên đơn vị quy đổi trùng với đơn vị cơ sở", async () => {
      const onSaveMock = vi.fn();
      renderWithProviders(
        <UnitConversionFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSaveMock}
          conversion={null}
          baseUnit="Lon"
          basePrice={20000}
          productName="Bia Heineken"
        />
      );

      const nameInput = screen.getByLabelText(/Tên đơn vị quy đổi/i);
      fireEvent.change(nameInput, { target: { value: "Lon" } });

      const submitBtn = screen.getByRole("button", { name: /Thêm đơn vị/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Tên đơn vị quy đổi không được trùng với đơn vị cơ sở/i)
        ).toBeInTheDocument();
      });
      expect(onSaveMock).not.toHaveBeenCalled();
    });
  });

  describe("NCL-02-CN-007: Thao tác quản lý qua UnitConversionManagerModal", () => {
    it("Mở modal quản lý đơn vị quy đổi và hiển thị đúng thông tin sản phẩm", () => {
      renderWithProviders(
        <UnitConversionManagerModal
          isOpen={true}
          onClose={vi.fn()}
          productId="prod-1"
          productName="Bia Heineken"
          productSku="BEER-01"
          baseUnit="Lon"
          basePrice={20000}
        />
      );

      expect(screen.getByText(/Quản lý đơn vị tính & Quy đổi mua bán/i)).toBeInTheDocument();
      expect(screen.getByText(/BEER-01/i)).toBeInTheDocument();
      expect(screen.getByText(/Thêm đơn vị quy đổi/i)).toBeInTheDocument();
    });
  });
});
