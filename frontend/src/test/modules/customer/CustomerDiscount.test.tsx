import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { DashboardDemoContext, type IDashboardDemoContext } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { CustomerFormModal } from "@/modules/customer/components/CustomerFormModal";
import { CustomerDetailModal } from "@/modules/customer/components/CustomerDetailModal";
import { CustomerList } from "@/modules/customer/components/CustomerList";
import { PosPaymentSidebar } from "@/modules/pos/components/PosPaymentSidebar";
import type { ICustomer } from "@/modules/customer/types/ICustomer";
import type { IPosTab, IPosCartItem } from "@/modules/pos/types/IPos";
import { calculatePosTotals } from "@/modules/pos/utils/posCalculations";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithProviders = (
  ui: React.ReactElement,
  role: string = USER_ROLES.OWNER
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
    currentHouseholdId: "hh-1",
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

const mockVipCustomer: ICustomer = {
  id: "cust-vip-1",
  name: "Nguyễn Văn VIP",
  phone: "0988888888",
  phoneNumber: "0988888888",
  email: "vip@example.com",
  address: "123 Đường VIP, Hà Nội",
  creditLimit: 20000000,
  debt: 0,
  currentDebt: 0,
  discountRate: 5,
  discountType: "PERCENTAGE",
  isVip: true,
  totalSpent: 15000000,
  reminderDaysBefore: 3,
  reminderDaysAfter: 3,
};

const mockRegularCustomer: ICustomer = {
  id: "cust-reg-1",
  name: "Trần Thị Thường",
  phone: "0912345678",
  phoneNumber: "0912345678",
  email: "thuong@example.com",
  address: "456 Đường Thường, Hà Nội",
  creditLimit: 5000000,
  debt: 1000000,
  currentDebt: 1000000,
  discountRate: 0,
  discountType: "PERCENTAGE",
  isVip: false,
  totalSpent: 500000,
  reminderDaysBefore: 3,
  reminderDaysAfter: 3,
};

const mockCartItems: IPosCartItem[] = [
  {
    id: "item-1",
    product: {
      id: "prod-1",
      sku: "SP001",
      name: "Sữa tươi Vinamilk 1L",
      price: 35000,
      stockQuantity: 50,
      minStockQuantity: 10,
      unit: "Hộp",
      status: "ACTIVE",
      groupId: null,
      groupName: null,
      taxRateId: "tax-0",
      taxRateName: "VAT 0%",
      taxRatePercentage: 0,
      createdAt: "2026-08-26",
      updatedAt: "2026-08-26",
    },
    quantity: 2,
    price: 35000,
    lineDiscount: 5000, // Khuyến mại tự động mặt hàng: 5,000 đ
    lineTotal: 65000,   // (2 * 35000) - 5000 = 65,000 đ
  },
];

const mockPosTab: IPosTab = {
  id: "tab-1",
  orderNumber: "Đơn 1",
  status: "PENDING",
  items: mockCartItems,
  customer: mockVipCustomer,
  customerId: mockVipCustomer.id,
  saleMode: "NORMAL",
  paymentMethod: "CASH",
  amountGiven: 0,
  discountType: "PERCENTAGE",
  discountValue: 0,
  isSaved: false,
};

describe("NCL-15-CN-003: Chiết khấu riêng cho khách hàng thân thiết", () => {
  it("NCL-15-CN-003-TC-01: Gán khách VIP có mức chiết khấu riêng (5%) áp dụng tự động và hiển thị rõ ràng trên đơn POS", () => {
    renderWithProviders(
      <PosPaymentSidebar
        tab={mockPosTab}
        customers={[mockVipCustomer, mockRegularCustomer]}
        onUpdateTab={vi.fn()}
        onOpenAddCustomerModal={vi.fn()}
        onSaveDraft={vi.fn()}
        onCompleteOrder={vi.fn()}
        isSavingDraft={false}
        isCompletingOrder={false}
      />
    );

    // 1. Customer VIP Badge must be displayed
    expect(screen.getByText("Nguyễn Văn VIP")).toBeInTheDocument();
    expect(screen.getByText(/VIP -5%/i)).toBeInTheDocument();

    // 2. Subtotal (gốc) = 2 * 35,000 = 70,000 đ
    expect(screen.getByText(/Tổng tiền hàng \(gốc\):/i)).toBeInTheDocument();
    expect(screen.getByText(/70\.000/)).toBeInTheDocument();

    // 3. Customer VIP discount 5% of 65,000 (after promo) = 3,250 đ
    expect(screen.getByText(/Chiết khấu khách VIP \(5%\):/i)).toBeInTheDocument();
    expect(screen.getByText(/-3\.250/)).toBeInTheDocument();
  });

  it("NCL-15-CN-003-TC-02: Đơn vừa có khuyến mại sản phẩm vừa có chiết khấu khách VIP hiển thị tách bạch từng dòng", () => {
    renderWithProviders(
      <PosPaymentSidebar
        tab={mockPosTab}
        customers={[mockVipCustomer]}
        onUpdateTab={vi.fn()}
        onOpenAddCustomerModal={vi.fn()}
        onSaveDraft={vi.fn()}
        onCompleteOrder={vi.fn()}
        isSavingDraft={false}
        isCompletingOrder={false}
      />
    );

    // Dòng 1: Khuyến mại tự động SP (-5.000 đ)
    expect(screen.getByText(/Khuyến mại tự động SP:/i)).toBeInTheDocument();
    expect(screen.getByText(/-5\.000/)).toBeInTheDocument();

    // Dòng 2: Chiết khấu khách VIP (-3.250 đ)
    expect(screen.getByText(/Chiết khấu khách VIP \(5%\):/i)).toBeInTheDocument();
    expect(screen.getByText(/-3\.250/)).toBeInTheDocument();

    // Khách cần trả: 70,000 - 5,000 (KM SP) - 3,250 (VIP) = 61,750 đ
    expect(screen.getByText(/61\.750/)).toBeInTheDocument();
  });

  it("NCL-15-CN-003-TC-03: Nhân viên bán hàng (VT-02) không có quyền sửa mức chiết khấu riêng (RBAC / Disabled inputs)", () => {
    renderWithProviders(
      <CustomerFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        customer={mockVipCustomer}
      />,
      USER_ROLES.CASHIER // Role VT-02
    );

    // Must show lock warning message for Cashier
    expect(screen.getByText(/Chỉ Chủ hộ được sửa/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Mức chiết khấu riêng thuộc thẩm quyền phê duyệt của Chủ hộ kinh doanh/i)
    ).toBeInTheDocument();

    // VIP checkbox and discount inputs must be disabled
    const vipCheckbox = screen.getByRole("checkbox", { name: /Gán nhãn Khách hàng thân thiết/i });
    expect(vipCheckbox).toBeDisabled();

    const discountInput = screen.getByPlaceholderText(/Ví dụ: 5/i);
    expect(discountInput).toBeDisabled();
  });

  it("NCL-15-CN-003-TC-04: Chủ hộ (VT-01) có toàn quyền thiết lập mức chiết khấu và kích hoạt VIP", async () => {
    const handleSave = vi.fn();

    renderWithProviders(
      <CustomerFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        customer={null}
      />,
      USER_ROLES.OWNER // Role VT-01
    );

    // Inputs must be enabled
    const vipCheckbox = screen.getByRole("checkbox", { name: /Gán nhãn Khách hàng thân thiết/i });
    expect(vipCheckbox).not.toBeDisabled();

    const discountInput = screen.getByPlaceholderText(/Ví dụ: 5/i);
    expect(discountInput).not.toBeDisabled();
  });

  it("NCL-15-CN-003-TC-05: Hiển thị thông tin VIP, tỷ lệ chiết khấu và tổng chi tiêu tích lũy trên CustomerDetailModal và CustomerList", () => {
    // 1. Test CustomerDetailModal
    const { unmount } = renderWithProviders(
      <CustomerDetailModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockVipCustomer}
        onOpenEditModal={vi.fn()}
        onOpenPayDebtModal={vi.fn()}
        onOpenRemindModal={vi.fn()}
      />
    );

    expect(screen.getByText("Nguyễn Văn VIP")).toBeInTheDocument();
    expect(screen.getByText(/Khách VIP/i)).toBeInTheDocument();
    expect(screen.getByText(/5% trên đơn/i)).toBeInTheDocument();
    expect(screen.getByText(/15\.000\.000/)).toBeInTheDocument(); // totalSpent

    unmount();

    // 2. Test CustomerList badge
    renderWithProviders(
      <CustomerList
        customers={[mockVipCustomer, mockRegularCustomer]}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenCreateModal={vi.fn()}
        onOpenEditModal={vi.fn()}
        onDeleteCustomer={vi.fn()}
        onConfirmReminder={vi.fn()}
        onConfirmPayDebt={vi.fn()}
      />
    );

    expect(screen.getByText(/VIP -5%/i)).toBeInTheDocument();
    expect(screen.getByText(/Tích lũy: 15\.000\.000/i)).toBeInTheDocument();
  });

  it("NCL-15-CN-003-TC-06: calculatePosTotals tính đúng số tiền khách cần trả khi áp dụng chiết khấu VIP 30%, không bị lỗi chặn thanh toán khi trả đủ", () => {
    const tabWithVip: IPosTab = {
      ...mockPosTab,
      items: [
        {
          id: "item-cf",
          product: {
            id: "prod-cf",
            sku: "CF001",
            name: "Cà phê đen túi 800g",
            price: 85000,
            stockQuantity: 20,
            unit: "Gói",
            status: "ACTIVE",
            groupId: null,
            groupName: null,
            taxRateId: "tax-5",
            taxRateName: "VAT 5%",
            taxRatePercentage: 5,
            createdAt: "2026-08-26",
            updatedAt: "2026-08-26",
          },
          quantity: 7,
          price: 85000,
          lineDiscount: 0,
          lineTotal: 595000,
        },
      ],
      customer: {
        ...mockVipCustomer,
        discountRate: 30,
        discountType: "PERCENTAGE",
      },
      amountGiven: 437325,
      paymentMethod: "CASH",
    };

    const totals = calculatePosTotals(tabWithVip);

    // 1. Tổng tiền hàng gốc = 7 * 85,000 = 595,000 đ
    expect(totals.totalOriginalAmount).toBe(595000);
    // 2. Chiết khấu khách VIP 30% = 178,500 đ
    expect(totals.customerDiscountCash).toBe(178500);
    // 3. Thuế GTGT 5% tính trên giá sau chiết khấu (416,500 đ) = 20,825 đ
    expect(totals.totalTaxAmount).toBe(20825);
    // 4. Khách cần trả = 595,000 - 178,500 + 20,825 = 437,325 đ
    expect(totals.finalTotal).toBe(437325);
    // 5. Khách đưa đủ 437,325 đ -> không kích hoạt validation lỗi (effectiveAmountGiven < finalTotal)
    expect(totals.effectiveAmountGiven).toBe(437325);
    expect(totals.effectiveAmountGiven < totals.finalTotal).toBe(false);
    expect(totals.changeAmount).toBe(0);
  });

  it("NCL-15-CN-003-TC-07: Tiền khách thanh toán tự động cập nhật nhảy theo Khách cần trả khi áp giảm giá / chiết khấu", () => {
    const onUpdateTab = vi.fn();
    const cleanCartItems: IPosCartItem[] = [
      {
        id: "item-clean",
        product: {
          id: "prod-clean",
          sku: "SP002",
          name: "Sản phẩm test",
          price: 35000,
          stockQuantity: 50,
          minStockQuantity: 10,
          unit: "Hộp",
          status: "ACTIVE",
          groupId: null,
          groupName: null,
          taxRateId: "tax-0",
          taxRateName: "VAT 0%",
          taxRatePercentage: 0,
          createdAt: "2026-08-26",
          updatedAt: "2026-08-26",
        },
        quantity: 2,
        price: 35000,
        lineDiscount: 0,
        lineTotal: 70000,
      },
    ];

    const baseTab: IPosTab = {
      ...mockPosTab,
      items: cleanCartItems,
      customer: null,
      customerId: undefined,
      discountValue: 0,
      amountGiven: 70000,
    };

    const { rerender } = renderWithProviders(
      <PosPaymentSidebar
        tab={baseTab}
        customers={[mockVipCustomer]}
        onUpdateTab={onUpdateTab}
        onOpenAddCustomerModal={vi.fn()}
        onSaveDraft={vi.fn()}
        onCompleteOrder={vi.fn()}
        isSavingDraft={false}
        isCompletingOrder={false}
      />
    );

    // Ban đầu chưa có giảm giá: tổng 70,000 đ
    expect(screen.getByText(/KHÁCH CẦN TRẢ:/i)).toBeInTheDocument();

    // Áp giảm giá chiết khấu thêm 10%
    rerender(
      <PosPaymentSidebar
        tab={{
          ...baseTab,
          discountValue: 10,
          discountType: "PERCENTAGE",
        }}
        customers={[mockVipCustomer]}
        onUpdateTab={onUpdateTab}
        onOpenAddCustomerModal={vi.fn()}
        onSaveDraft={vi.fn()}
        onCompleteOrder={vi.fn()}
        isSavingDraft={false}
        isCompletingOrder={false}
      />
    );

    // onUpdateTab phải được gọi để tự động nhảy amountGiven theo Khách cần trả (63,000 đ)
    expect(onUpdateTab).toHaveBeenCalledWith(
      expect.objectContaining({ amountGiven: 63000 })
    );
  });
});
