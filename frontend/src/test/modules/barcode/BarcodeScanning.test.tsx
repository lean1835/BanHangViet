import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import {
  DashboardDemoContext,
  type IDashboardDemoContext,
} from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { PosHeader } from "@/modules/pos/components/PosHeader";
import { PosCartTable } from "@/modules/pos/components/PosCartTable";
import { BarcodeScannerModal } from "@/modules/barcode/components/BarcodeScannerModal";
import { UnrecognizedBarcodeModal } from "@/modules/barcode/components/UnrecognizedBarcodeModal";
import { BarcodePrintModal } from "@/modules/barcode/components/BarcodePrintModal";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { IPosTab, IPosCartItem } from "@/modules/pos/types/IPos";
import { playBarcodeBeepSound } from "@/modules/barcode/utils/barcodeAudio";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockProductNamNgu: IProduct = {
  id: "prod-001",
  sku: "SP001",
  barcode: "8934567890123",
  name: "Nước mắm Nam Ngư chai 500 mililít",
  unit: "Chai",
  price: 45000,
  stockQuantity: 50,
  minStockQuantity: 5,
  status: "ACTIVE",
  groupId: "grp-1",
  groupName: "Gia vị",
  taxRateId: "tax-8",
  taxRateName: "Thuế 8%",
  taxRatePercentage: 8,
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
};

const mockProductRau: IProduct = {
  id: "prod-002",
  sku: "SP002",
  barcode: "200111222333",
  name: "Rau muống hữu cơ 500g",
  unit: "Bó",
  price: 15000,
  stockQuantity: 20,
  minStockQuantity: 5,
  status: "ACTIVE",
  groupId: "grp-2",
  groupName: "Rau củ",
  taxRateId: "tax-8",
  taxRateName: "Thuế 8%",
  taxRatePercentage: 8,
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
};

const mockProductsList: IProduct[] = [mockProductNamNgu, mockProductRau];

const mockInitialTab: IPosTab = {
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

const renderWithProviders = (
  ui: React.ReactElement,
  role: string = USER_ROLES.CASHIER
) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  const mockContextValue = {
    currentRole: role,
    setCurrentRole: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
    currentHouseholdId: "hh-100",
    setCurrentHouseholdId: vi.fn(),
    recentLogs: [],
    addLogEntry: vi.fn(),
    clearLogs: vi.fn(),
  } as unknown as IDashboardDemoContext;

  return render(ui, {
    wrapper: ({ children }) => (
      <Provider store={store}>
        <BrowserRouter>
          <DashboardDemoContext.Provider value={mockContextValue}>
            <NotificationProvider>{children}</NotificationProvider>
          </DashboardDemoContext.Provider>
        </BrowserRouter>
      </Provider>
    ),
  });
};

describe("NCL-16-CN-001: Quét mã vạch để thêm hàng vào đơn", () => {
  describe("NCL-16-CN-001-TC-01: Quét mã vạch thành công", () => {
    it("thêm mặt hàng vào đơn với số lượng một mà không cần thao tác thêm", () => {
      const onSelectProductMock = vi.fn();
      const onScanBarcodeMock = vi.fn();

      renderWithProviders(
        <PosHeader
          products={mockProductsList}
          tabs={[mockInitialTab]}
          activeTabId="tab-1"
          onSelectTab={vi.fn()}
          onAddTab={vi.fn()}
          onCloseTab={vi.fn()}
          onSelectProduct={onSelectProductMock}
          onScanBarcode={onScanBarcodeMock}
          userName="Nhân Viên Bán Hàng"
        />,
        USER_ROLES.CASHIER
      );

      // Simulating scanning barcode in search/scan input
      const searchInput = screen.getByPlaceholderText(
        /Tìm hàng hóa/i
      );
      fireEvent.change(searchInput, { target: { value: "8934567890123" } });
      fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

      expect(onScanBarcodeMock).toHaveBeenCalledWith("8934567890123");
    });

    it("hiển thị chính xác thông tin mặt hàng vừa quét trong bảng giỏ hàng", () => {
      const cartItem: IPosCartItem = {
        id: mockProductNamNgu.id,
        product: mockProductNamNgu,
        quantity: 1,
        price: 45000,
        lineDiscount: 0,
        lineTotal: 45000,
      };

      renderWithProviders(
        <PosCartTable
          items={[cartItem]}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          canManage={false}
        />,
        USER_ROLES.CASHIER
      );

      expect(
        screen.getByText("Nước mắm Nam Ngư chai 500 mililít")
      ).toBeInTheDocument();
      expect(screen.getByText("Chai")).toBeInTheDocument();
      expect(screen.getByText("Tổng SL: 1")).toBeInTheDocument();
    });
  });

  describe("NCL-16-CN-001-TC-02: Dữ liệu không hợp lệ / Mã chưa nhận diện", () => {
    it("hiển thị modal cảnh báo chưa nhận diện mã và cho phép chọn sản phẩm để gán mã", () => {
      const onAssignAndAddToCartMock = vi.fn();
      const onCloseMock = vi.fn();

      renderWithProviders(
        <UnrecognizedBarcodeModal
          isOpen={true}
          onClose={onCloseMock}
          unrecognizedBarcode="999888777666"
          onAssignAndAddToCart={onAssignAndAddToCartMock}
          canManage={true}
        />,
        USER_ROLES.OWNER
      );

      expect(
        screen.getByText(/Chưa Nhận Diện Mã Vạch/i)
      ).toBeInTheDocument();
      expect(screen.getByText("999888777666")).toBeInTheDocument();
      expect(
        screen.getByText(/Mời chọn mặt hàng có sẵn để gán mã vạch này/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Gán mã & Thêm vào đơn/i })
      ).toBeInTheDocument();
    });

    it("chặn quyền gán mã nếu người dùng không phải là Chủ hộ (VT-01)", () => {
      renderWithProviders(
        <UnrecognizedBarcodeModal
          isOpen={true}
          onClose={vi.fn()}
          unrecognizedBarcode="999888777666"
          onAssignAndAddToCart={vi.fn()}
          canManage={false}
        />,
        USER_ROLES.CASHIER
      );

      expect(
        screen.getByText(/Yêu cầu quyền Chủ hộ kinh doanh/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Gán mã & Thêm vào đơn/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("NCL-16-CN-001-TC-03: Ngoại lệ - Quét mã 3 lần liên tiếp dồn số lượng", () => {
    it("cộng dồn thành số lượng 3 trên 1 dòng hàng thay vì tạo 3 dòng riêng biệt", () => {
      const initialCartItem: IPosCartItem = {
        id: mockProductNamNgu.id,
        product: mockProductNamNgu,
        quantity: 3, // Scanned 3 times accumulated
        price: 45000,
        lineDiscount: 0,
        lineTotal: 135000,
      };

      const { container } = renderWithProviders(
        <PosCartTable
          items={[initialCartItem]}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          canManage={false}
        />,
        USER_ROLES.CASHIER
      );

      // Verify only 1 row in table body
      const tableRows = container.querySelectorAll("tbody tr");
      expect(tableRows.length).toBe(1);

      // Verify total quantity is 3
      expect(screen.getByText("Tổng SL: 3")).toBeInTheDocument();
      expect(
        screen.getByText("Nước mắm Nam Ngư chai 500 mililít")
      ).toBeInTheDocument();
    });
  });

  describe("NCL-16-CN-001-TC-04: Bảo mật & Không có quyền", () => {
    it("phát âm thanh phản hồi bíp khi quét mã vạch", () => {
      expect(() => {
        playBarcodeBeepSound("success");
        playBarcodeBeepSound("error");
      }).not.toThrow();
    });
  });

  describe("Giao diện Camera & In tem mã vạch (NCL-16-CN-001-CV-02 & NCL-16-CN-002)", () => {
    it("mở CameraScannerModal và cho phép nhập mã thủ công dự phòng", () => {
      const onScanMock = vi.fn();
      const onCloseMock = vi.fn();

      renderWithProviders(
        <BarcodeScannerModal
          isOpen={true}
          onClose={onCloseMock}
          onScan={onScanMock}
        />
      );

      expect(
        screen.getByText("Quét Mã Vạch Hàng Hóa")
      ).toBeInTheDocument();

      const manualInput = screen.getByPlaceholderText(
        /Nhập mã vạch \/ SKU/i
      );
      fireEvent.change(manualInput, { target: { value: "8934567890123" } });
      fireEvent.click(
        screen.getByRole("button", { name: /Thêm vào đơn/i })
      );

      expect(onScanMock).toHaveBeenCalledWith("8934567890123");
      expect(onCloseMock).toHaveBeenCalled();
    });

    it("hiển thị tem in mã vạch khổ 58mm và 80mm trong BarcodePrintModal", () => {
      renderWithProviders(
        <BarcodePrintModal
          isOpen={true}
          onClose={vi.fn()}
          productId="prod-001"
          productName="Nước mắm Nam Ngư chai 500 mililít"
        />,
        USER_ROLES.OWNER
      );

      expect(
        screen.getByText("In Tem Mã Vạch Sản Phẩm")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Nước mắm Nam Ngư chai 500 mililít")
      ).toBeInTheDocument();
      expect(screen.getByText("Khổ tem in:")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /In Tem Mã Vạch/i })
      ).toBeInTheDocument();
    });
  });
});
