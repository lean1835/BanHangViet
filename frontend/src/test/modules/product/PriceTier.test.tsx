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
import { PriceTierTable } from "@/modules/product/components/PriceTierTable";
import { PriceTierFormModal } from "@/modules/product/components/PriceTierFormModal";
import { PosCartTable } from "@/modules/pos/components/PosCartTable";
import type { IProductPriceTier } from "@/modules/product/types/IProductPriceTier";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { IPosCartItem } from "@/modules/pos/types/IPos";
import { PRICE_TIER_COPY } from "@/constants/product";

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

const renderWithProviders = (
  ui: React.ReactElement,
  role: string = USER_ROLES.OWNER
) => {
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
  sku: "COCA-01",
  barcode: "89350000001",
  name: "Nước ngọt Coca Cola 330ml",
  unit: "Lon",
  price: 12000,
  costPrice: 9500,
  stockQuantity: 200,
  minStockQuantity: 20,
  status: "ACTIVE",
  groupId: "g-1",
  groupName: "Nước giải khát",
  taxRateId: "tax-1",
  taxRateName: "VAT 10%",
  taxRatePercentage: 10,
  createdAt: "2026-08-01T10:00:00",
  updatedAt: "2026-08-01T10:00:00",
};

const mockTiers: IProductPriceTier[] = [
  {
    id: "tier-1",
    productId: "prod-1",
    productName: "Nước ngọt Coca Cola 330ml",
    unitConversionId: null,
    unitName: "Lon",
    tierName: "Giá sỉ (≥ 10)",
    minQuantity: 10,
    maxQuantity: null,
    price: 10500,
    isActive: true,
    costPrice: 9500,
    isBelowCost: false,
    createdAt: "2026-08-01T10:00:00",
    updatedAt: "2026-08-01T10:00:00",
  },
  {
    id: "tier-2",
    productId: "prod-1",
    productName: "Nước ngọt Coca Cola 330ml",
    unitConversionId: null,
    unitName: "Lon",
    tierName: "Giá buôn lớn (≥ 50)",
    minQuantity: 50,
    maxQuantity: null,
    price: 9800,
    isActive: true,
    costPrice: 9500,
    isBelowCost: false,
    createdAt: "2026-08-01T10:00:00",
    updatedAt: "2026-08-01T10:00:00",
  },
];

describe("NCL-02-CN-010: Quản lý giá bán lẻ và giá bán sỉ theo mức số lượng", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("NCL-02-CN-010-TC-01: Luồng thành công - Tự động áp giá sỉ và hiện tên bậc giá khi mua số lượng lớn", () => {
    it("Hiển thị badge tên bậc giá và đơn giá sỉ trên dòng hàng PosCartTable khi số lượng = 12 (>= 10)", () => {
      const cartItemWithWholesaleTier: IPosCartItem = {
        id: "prod-1",
        product: mockProduct,
        quantity: 12,
        price: 10500, // Đã áp giá sỉ 10.500đ
        baseRetailPrice: 12000, // Giá lẻ gốc
        priceTierId: "tier-1",
        priceTierName: "Giá sỉ (≥ 10)",
        lineDiscount: 0,
        lineTotal: 12 * 10500,
      };

      renderWithProviders(
        <PosCartTable
          items={[cartItemWithWholesaleTier]}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
        />
      );

      // 1. Kiểm tra tên mặt hàng hiển thị
      expect(screen.getByText("Nước ngọt Coca Cola 330ml")).toBeInTheDocument();

      // 2. Kiểm tra badge bậc giá hiển thị rõ ràng trên dòng hàng (TC-01)
      expect(screen.getByText(/Bậc: Giá sỉ \(≥ 10\)/i)).toBeInTheDocument();

      // 3. Kiểm tra đơn giá sỉ 10.500đ hiển thị và giá lẻ gốc 12.000đ hiển thị dạng gạch ngang
      expect(screen.getByText("10.500 đ")).toBeInTheDocument();
      expect(screen.getByText("12.000 đ")).toBeInTheDocument();

      // 4. Kiểm tra mức tiết kiệm cho khách: (12.000 - 10.500) * 12 = 18.000đ
      expect(screen.getByText("(-18.000 đ)")).toBeInTheDocument();
    });
  });

  describe("NCL-02-CN-010-TC-02: Luồng thành công - Tính lại theo bậc giá bán lẻ khi giảm số lượng xuống dưới ngưỡng", () => {
    it("Khi số lượng giảm còn 5 (< 10), dòng hàng không còn badge giá sỉ và áp dụng giá lẻ gốc 12.000đ", () => {
      const cartItemRetailTier: IPosCartItem = {
        id: "prod-1",
        product: mockProduct,
        quantity: 5,
        price: 12000, // Giá bán lẻ bình thường
        baseRetailPrice: 12000,
        priceTierId: null,
        priceTierName: null,
        lineDiscount: 0,
        lineTotal: 5 * 12000,
      };

      renderWithProviders(
        <PosCartTable
          items={[cartItemRetailTier]}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
        />
      );

      // 1. Kiểm tra không còn badge giá sỉ trên dòng hàng (TC-02)
      expect(screen.queryByText(/Bậc: Giá sỉ/i)).not.toBeInTheDocument();

      // 2. Kiểm tra giá bán áp dụng là giá bán lẻ 12.000đ
      expect(screen.getByText("12.000 đ")).toBeInTheDocument();
    });
  });

  describe("NCL-02-CN-010-TC-03: Dữ liệu không hợp lệ & Cảnh báo bán lỗ", () => {
    it("Hiển thị cảnh báo bán lỗ nổi bật khi khai giá bậc thấp hơn giá vốn và bắt buộc xác nhận", async () => {
      const onSaveMock = vi.fn();

      renderWithProviders(
        <PriceTierFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSaveMock}
          baseUnit="Lon"
          basePrice={12000}
          costPrice={9500} // Giá vốn 9.500đ
          productName="Nước ngọt Coca Cola 330ml"
        />
      );

      // Nhập đơn giá bậc 8.000đ (< 9.500đ giá vốn)
      const priceInput = screen.getByLabelText(/Đơn giá bậc/i);
      fireEvent.change(priceInput, { target: { value: "8000" } });

      // Kiểm tra hộp cảnh báo bán lỗ hiển thị
      await waitFor(() => {
        expect(
          screen.getByText(PRICE_TIER_COPY.BELOW_COST_WARNING_TITLE)
        ).toBeInTheDocument();
      });

      // Nhấn Lưu khi CHƯA tích xác nhận bán lỗ -> Bị chặn, không gọi onSave
      const submitBtn = screen.getByRole("button", { name: /Tạo bậc giá/i });
      fireEvent.click(submitBtn);

      expect(onSaveMock).not.toHaveBeenCalled();

      // Tích chọn checkbox xác nhận bán dưới giá vốn
      const confirmCheckbox = screen.getByLabelText(
        PRICE_TIER_COPY.CONFIRM_BELOW_COST_CHECKBOX
      );
      fireEvent.click(confirmCheckbox);
      expect((confirmCheckbox as HTMLInputElement).checked).toBe(true);

      // Nhấn Lưu lại -> onSave được gọi với confirmBelowCost = true
      const activeSubmitBtn = screen.getByRole("button", { name: /Tạo bậc giá/i });
      fireEvent.click(activeSubmitBtn);

      await waitFor(() => {
        expect(onSaveMock).toHaveBeenCalledWith(
          expect.objectContaining({
            price: 8000,
            confirmBelowCost: true,
          })
        );
      });
    });
  });

  describe("NCL-02-CN-010-CV-02 & CV-04: Giao diện bảng danh sách PriceTierTable và phân quyền", () => {
    it("Hiển thị đầy đủ danh sách bậc giá, mức số lượng, đơn giá và giá vốn đối chiếu", () => {
      renderWithProviders(
        <PriceTierTable
          tiers={mockTiers}
          baseUnit="Lon"
          baseRetailPrice={12000}
          costPrice={9500}
          isOwner={true}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Kiểm tra danh sách bậc giá
      expect(screen.getByText("Giá sỉ (≥ 10)")).toBeInTheDocument();
      expect(screen.getByText("Giá buôn lớn (≥ 50)")).toBeInTheDocument();

      // Kiểm tra mức số lượng
      expect(screen.getByText(/Từ 10 Lon trở lên/i)).toBeInTheDocument();
      expect(screen.getByText(/Từ 50 Lon trở lên/i)).toBeInTheDocument();

      // Kiểm tra đơn giá bậc
      expect(screen.getByText("10.500 đ")).toBeInTheDocument();
      expect(screen.getByText("9.800 đ")).toBeInTheDocument();

      // Kiểm tra nút thao tác của Owner
      expect(
        screen.getByRole("button", { name: /Chỉnh sửa bậc giá Giá sỉ \(≥ 10\)/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Xóa bậc giá Giá sỉ \(≥ 10\)/i })
      ).toBeInTheDocument();
    });

    it("Ẩn nút thao tác sửa/xóa khi người dùng là nhân viên bán hàng (isOwner = false)", () => {
      renderWithProviders(
        <PriceTierTable
          tiers={mockTiers}
          baseUnit="Lon"
          baseRetailPrice={12000}
          costPrice={9500}
          isOwner={false}
        />,
        USER_ROLES.CASHIER
      );

      expect(
        screen.queryByRole("button", { name: /Chỉnh sửa bậc giá/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Xóa bậc giá/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Validation ràng buộc dữ liệu đầu vào", () => {
    it("Báo lỗi khi số lượng tối đa nhỏ hơn số lượng tối thiểu", async () => {
      const onSaveMock = vi.fn();

      renderWithProviders(
        <PriceTierFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSaveMock}
          baseUnit="Lon"
          basePrice={12000}
          costPrice={9500}
        />
      );

      // minQuantity = 10, maxQuantity = 5 (< 10)
      const minQtyInput = screen.getByLabelText(/Số lượng tối thiểu/i);
      const maxQtyInput = screen.getByLabelText(/Số lượng tối đa/i);

      fireEvent.change(minQtyInput, { target: { value: "10" } });
      fireEvent.change(maxQtyInput, { target: { value: "5" } });

      const submitBtn = screen.getByRole("button", { name: /Tạo bậc giá/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu/i)
        ).toBeInTheDocument();
      });

      expect(onSaveMock).not.toHaveBeenCalled();
    });

    it("Tự động tính đơn giá khi nhập % giảm giá hoặc bấm nút chọn nhanh %", async () => {
      const onSaveMock = vi.fn();

      renderWithProviders(
        <PriceTierFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSaveMock}
          baseUnit="Lon"
          basePrice={12000}
          costPrice={9500}
        />
      );

      const discountInput = screen.getByLabelText(/% Giảm so với giá lẻ/i);
      const priceInput = screen.getByLabelText(/Đơn giá bậc/i) as HTMLInputElement;

      // 1. Nhập giảm 10% -> Đơn giá tự động thành 12.000 * 0.9 = 10.800 đ
      fireEvent.change(discountInput, { target: { value: "10" } });
      expect(priceInput.value).toBe("10800");

      // 2. Bấm nút chọn nhanh -20% -> Đơn giá tự động thành 12.000 * 0.8 = 9.600 đ
      const btn20 = screen.getByRole("button", { name: /-20%/i });
      fireEvent.click(btn20);
      expect(priceInput.value).toBe("9600");
      expect((discountInput as HTMLInputElement).value).toBe("20");
    });

    it("Hiển thị badge bậc giá và đơn giá sỉ đối với mặt hàng bán theo cân (thập phân)", () => {
      const mockWeightProduct: IProduct = {
        ...mockProduct,
        id: "prod-weight-1",
        name: "Thịt heo ba chỉ",
        unit: "cân",
        price: 30000,
        isSoldByWeight: true,
      };

      const mockCartWithTierWeight: IPosCartItem[] = [
        {
          id: "item-w-1",
          product: mockWeightProduct,
          quantity: 15,
          price: 27000,
          baseRetailPrice: 30000,
          priceTierId: "tier-1",
          priceTierName: "Giá buôn lớn (≥ 10)",
          lineDiscount: 0,
          lineTotal: 405000,
        },
      ];

      renderWithProviders(
        <PosCartTable
          items={mockCartWithTierWeight}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
        />
      );

      // Badge bậc giá
      expect(screen.getByText(/Giá buôn lớn \(≥ 10\)/i)).toBeInTheDocument();
      // Đơn giá bán sỉ
      expect(screen.getByText("27.000 đ")).toBeInTheDocument();
      // Giá gốc bị gạch
      expect(screen.getByText("30.000 đ")).toBeInTheDocument();
      // Tổng tiền
      expect(screen.getByText("405.000 đ")).toBeInTheDocument();
      // Badge Hàng cân
      expect(screen.getByText(/Hàng cân/i)).toBeInTheDocument();
    });
  });
});
