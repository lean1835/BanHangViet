import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { ProductExchangeTable } from "@/modules/product_exchange/components/ProductExchangeTable";
import { ProductExchangeSidebar } from "@/modules/product_exchange/components/ProductExchangeSidebar";
import { ProductExchangeDetailModal } from "@/modules/product_exchange/components/ProductExchangeDetailModal";
import { ExchangeSummaryPanel } from "@/modules/product_exchange/components/ExchangeSummaryPanel";
import { NewItemsSection } from "@/modules/product_exchange/components/NewItemsSection";
import {
  getExchangeTypeLabel,
  getExchangeTypeBadge,
  getExchangeStatusLabel,
  getExchangeStatusBadge,
  getPaymentMethodLabel,
  getDaysSinceIssued,
} from "@/modules/product_exchange/utils/productExchangeHelpers";
import {
  EXCHANGE_TYPES,
  EXCHANGE_STATUS,
  EXTRA_PAYMENT_METHODS,
} from "@/constants/productExchange";
import type { IProductExchangeTicket } from "@/modules/product_exchange/types/IProductExchange";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithProviders = (ui: React.ReactElement) => {
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

const mockTickets: IProductExchangeTicket[] = [
  {
    id: "pe-1",
    ticketNumber: "PDH-20260917-0001",
    originalInvoiceId: "inv-1",
    originalInvoiceNumber: "1C26TAA00000001",
    customerId: "cust-1",
    customerName: "Nguyễn Văn B",
    createdById: "user-1",
    createdByName: "Thu ngân A",
    exchangeType: EXCHANGE_TYPES.EQUAL_VALUE,
    totalReturnAmount: 100000,
    totalExchangeAmount: 100000,
    differenceAmount: 0,
    status: EXCHANGE_STATUS.COMPLETED,
    reason: "Đổi màu sản phẩm",
    createdAt: "2026-09-17T10:00:00",
    items: [
      {
        id: "item-1",
        itemType: "RETURN_ITEM",
        productId: "p-1",
        productName: "Nước Mắm 500ml",
        unit: "Chai",
        quantity: 2,
        unitPrice: 50000,
        taxRatePercentage: 0,
        taxAmount: 0,
        subtotal: 100000,
      },
      {
        id: "item-2",
        itemType: "EXCHANGE_ITEM",
        productId: "p-2",
        productName: "Dầu Ăn 1L",
        unit: "Chai",
        quantity: 2,
        unitPrice: 50000,
        taxRatePercentage: 0,
        taxAmount: 0,
        subtotal: 100000,
      },
    ],
  },
  {
    id: "pe-2",
    ticketNumber: "PDH-20260917-0002",
    originalInvoiceId: "inv-2",
    originalInvoiceNumber: "1C26TAA00000002",
    customerId: "cust-2",
    customerName: "Trần Thị C",
    createdById: "user-1",
    createdByName: "Thu ngân A",
    exchangeType: EXCHANGE_TYPES.HIGHER_VALUE,
    totalReturnAmount: 100000,
    totalExchangeAmount: 150000,
    differenceAmount: 50000,
    extraPaymentMethod: EXTRA_PAYMENT_METHODS.CASH,
    additionalInvoiceId: "inv-extra-1",
    additionalInvoiceNumber: "1C26TAA00000003",
    status: EXCHANGE_STATUS.COMPLETED,
    reason: "Đổi kích cỡ lớn hơn",
    createdAt: "2026-09-17T11:00:00",
    items: [],
  },
];

describe("NCL-11-CN-005: Product Exchange Module Tests", () => {
  describe("Helper Functions", () => {
    it("returns correct label and badge for EQUAL_VALUE", () => {
      const label = getExchangeTypeLabel(EXCHANGE_TYPES.EQUAL_VALUE);
      expect(label).toContain("Đổi ngang giá");

      const badge = getExchangeTypeBadge(EXCHANGE_TYPES.EQUAL_VALUE);
      expect(badge.bg).toContain("emerald");
    });

    it("returns correct label and badge for HIGHER_VALUE and LOWER_VALUE", () => {
      expect(getExchangeTypeLabel(EXCHANGE_TYPES.HIGHER_VALUE)).toContain("Đổi giá cao hơn");
      expect(getExchangeTypeLabel(EXCHANGE_TYPES.LOWER_VALUE)).toContain("Đổi giá thấp hơn");

      expect(getExchangeTypeBadge(EXCHANGE_TYPES.HIGHER_VALUE).bg).toContain("blue");
      expect(getExchangeTypeBadge(EXCHANGE_TYPES.LOWER_VALUE).bg).toContain("amber");
    });

    it("returns correct status label and badge", () => {
      expect(getExchangeStatusLabel(EXCHANGE_STATUS.COMPLETED)).toBe("Hoàn thành");
      expect(getExchangeStatusBadge(EXCHANGE_STATUS.COMPLETED).bg).toContain("emerald");
    });

    it("returns payment method label correctly", () => {
      expect(getPaymentMethodLabel(EXTRA_PAYMENT_METHODS.CASH)).toBe("Tiền mặt");
      expect(getPaymentMethodLabel(EXTRA_PAYMENT_METHODS.QR_TRANSFER)).toBe("Quét mã QR");
      expect(getPaymentMethodLabel(null)).toBe("Không có");
    });

    it("calculates days since issued correctly", () => {
      const nowStr = new Date().toISOString();
      expect(getDaysSinceIssued(nowStr)).toBe(0);
    });
  });

  describe("ProductExchangeTable Component", () => {
    it("renders ticket list correctly with formatted amounts", () => {
      renderWithProviders(
        <ProductExchangeTable
          tickets={mockTickets}
          isLoading={false}
          currentPage={0}
          totalPages={1}
          totalElements={2}
          pageSize={10}
          onPageChange={vi.fn()}
          onViewDetail={vi.fn()}
          onPrintTicket={vi.fn()}
        />
      );

      expect(screen.getByText("PDH-20260917-0001")).toBeInTheDocument();
      expect(screen.getByText("1C26TAA00000001")).toBeInTheDocument();
      expect(screen.getByText("PDH-20260917-0002")).toBeInTheDocument();
      expect(screen.getByText("1C26TAA00000002")).toBeInTheDocument();
    });

    it("calls onViewDetail and onPrintTicket when row or print button clicked", () => {
      const onViewDetail = vi.fn();
      const onPrintTicket = vi.fn();

      renderWithProviders(
        <ProductExchangeTable
          tickets={mockTickets}
          isLoading={false}
          currentPage={0}
          totalPages={1}
          totalElements={2}
          pageSize={10}
          onPageChange={vi.fn()}
          onViewDetail={onViewDetail}
          onPrintTicket={onPrintTicket}
        />
      );

      const rows = screen.getAllByRole("button");
      fireEvent.click(rows[0]);
      expect(onViewDetail).toHaveBeenCalledWith(mockTickets[0]);

      const printButtons = screen.getAllByTitle("In phiếu đổi hàng");
      fireEvent.click(printButtons[0]);
      expect(onPrintTicket).toHaveBeenCalledWith(mockTickets[0]);
    });
  });

  describe("ProductExchangeSidebar Component", () => {
    it("renders filters and handles change", () => {
      const onExchangeTypeChange = vi.fn();
      const onResetFilters = vi.fn();

      renderWithProviders(
        <ProductExchangeSidebar
          searchQuery=""
          onSearchChange={vi.fn()}
          exchangeTypeFilter="ALL"
          onExchangeTypeChange={onExchangeTypeChange}
          statusFilter="ALL"
          onStatusChange={vi.fn()}
          fromDate=""
          toDate=""
          onFromDateChange={vi.fn()}
          onToDateChange={vi.fn()}
          onResetFilters={onResetFilters}
        />
      );

      expect(screen.getByText("Bộ lọc phiếu đổi hàng")).toBeInTheDocument();
      const select = screen.getByLabelText("Loại hình đổi hàng");
      fireEvent.change(select, { target: { value: EXCHANGE_TYPES.EQUAL_VALUE } });
      expect(onExchangeTypeChange).toHaveBeenCalledWith(EXCHANGE_TYPES.EQUAL_VALUE);

      const resetBtn = screen.getByText("Đặt lại");
      fireEvent.click(resetBtn);
      expect(onResetFilters).toHaveBeenCalled();
    });
  });

  describe("ExchangeSummaryPanel Component (NCL-11-CN-005 Logic)", () => {
    it("TC-01: diff == 0 displays green banner for EQUAL_VALUE", () => {
      const onSubmit = vi.fn();

      renderWithProviders(
        <ExchangeSummaryPanel
          totalReturnAmount={100000}
          totalExchangeAmount={100000}
          differenceAmount={0}
          isCheckingEligibility={false}
          extraPaymentMethod={EXTRA_PAYMENT_METHODS.CASH}
          onChangePaymentMethod={vi.fn()}
          reason=""
          onChangeReason={vi.fn()}
          notes=""
          onChangeNotes={vi.fn()}
          onSubmitExchange={onSubmit}
          onRedirectToReturn={vi.fn()}
          isSubmitting={false}
          hasReturnItems={true}
          hasExchangeItems={true}
        />
      );

      expect(screen.getByText(/Đổi Hàng Ngang Giá \(Chênh lệch: 0 đ\)/)).toBeInTheDocument();
      expect(screen.getByText(/Không phát sinh thêm chi phí/)).toBeInTheDocument();

      const submitBtn = screen.getByRole("button", {
        name: /Xác Nhận Đổi Hàng Ngang Giá/,
      });
      expect(submitBtn).toBeEnabled();
      fireEvent.click(submitBtn);
      expect(onSubmit).toHaveBeenCalled();
    });

    it("TC-02: diff > 0 displays blue banner for HIGHER_VALUE and payment method selector", () => {
      const onChangePayment = vi.fn();

      renderWithProviders(
        <ExchangeSummaryPanel
          totalReturnAmount={100000}
          totalExchangeAmount={150000}
          differenceAmount={50000}
          isCheckingEligibility={false}
          extraPaymentMethod={EXTRA_PAYMENT_METHODS.CASH}
          onChangePaymentMethod={onChangePayment}
          reason=""
          onChangeReason={vi.fn()}
          notes=""
          onChangeNotes={vi.fn()}
          onSubmitExchange={vi.fn()}
          onRedirectToReturn={vi.fn()}
          isSubmitting={false}
          hasReturnItems={true}
          hasExchangeItems={true}
        />
      );

      expect(screen.getByText(/Đổi Sang Món Giá Cao Hơn/)).toBeInTheDocument();
      expect(screen.getByText(/Phương thức thanh toán khoản chênh lệch/)).toBeInTheDocument();

      // Click QR transfer option
      const qrBtn = screen.getByText("Quét mã VietQR");
      fireEvent.click(qrBtn);
      expect(onChangePayment).toHaveBeenCalledWith(EXTRA_PAYMENT_METHODS.QR_TRANSFER);
    });

    it("TC-03: diff < 0 displays amber banner for LOWER_VALUE and redirect button", () => {
      const onRedirect = vi.fn();

      renderWithProviders(
        <ExchangeSummaryPanel
          totalReturnAmount={100000}
          totalExchangeAmount={80000}
          differenceAmount={-20000}
          isCheckingEligibility={false}
          extraPaymentMethod={EXTRA_PAYMENT_METHODS.CASH}
          onChangePaymentMethod={vi.fn()}
          reason=""
          onChangeReason={vi.fn()}
          notes=""
          onChangeNotes={vi.fn()}
          onSubmitExchange={vi.fn()}
          onRedirectToReturn={onRedirect}
          isSubmitting={false}
          hasReturnItems={true}
          hasExchangeItems={true}
        />
      );

      expect(screen.getByText(/Món Đổi Sang Giá Thấp Hơn/)).toBeInTheDocument();
      const redirectBtn = screen.getByText("Chuyển Sang Trả Hàng");
      fireEvent.click(redirectBtn);
      expect(onRedirect).toHaveBeenCalled();
    });
  });

  describe("ProductExchangeDetailModal Component", () => {
    it("renders ticket details correctly", () => {
      const onClose = vi.fn();
      const onPrint = vi.fn();

      renderWithProviders(
        <ProductExchangeDetailModal
          ticket={mockTickets[0]}
          onClose={onClose}
          onPrint={onPrint}
        />
      );

      expect(screen.getByText(/Phiếu Đổi Hàng: PDH-20260917-0001/)).toBeInTheDocument();
      expect(screen.getByText("Nước Mắm 500ml")).toBeInTheDocument();
      expect(screen.getByText("Dầu Ăn 1L")).toBeInTheDocument();

      const printBtn = screen.getByText("In Phiếu Đổi Hàng");
      fireEvent.click(printBtn);
      expect(onPrint).toHaveBeenCalledWith(mockTickets[0]);
    });
  });

  describe("NewItemsSection Component (Barcode & Catalog)", () => {
    it("renders search input, camera scan button, and tabs", () => {
      renderWithProviders(
        <NewItemsSection
          items={[]}
          onAddItem={vi.fn()}
          onRemoveItem={vi.fn()}
          onUpdateQuantity={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText(/Tìm theo tên, SKU hoặc quét mã vạch/)).toBeInTheDocument();
      expect(screen.getByText("Quét Mã")).toBeInTheDocument();
      expect(screen.getByText("Danh Sách Sản Phẩm")).toBeInTheDocument();
      expect(screen.getByText("Món Đã Chọn")).toBeInTheDocument();
    });

    it("displays selected items and handles quantity update and removal", () => {
      const onUpdateQuantity = vi.fn();
      const onRemoveItem = vi.fn();

      const mockSelectedItems = [
        {
          productId: "p1",
          productName: "Nước Ngọt Sting 330ml",
          unit: "Chai",
          unitPrice: 10000,
          stockQuantity: 20,
          exchangeQuantity: 2,
        },
      ];

      renderWithProviders(
        <NewItemsSection
          items={mockSelectedItems}
          onAddItem={vi.fn()}
          onRemoveItem={onRemoveItem}
          onUpdateQuantity={onUpdateQuantity}
        />
      );

      // Switch to Selected tab
      const selectedTab = screen.getByText("Món Đã Chọn");
      fireEvent.click(selectedTab);

      expect(screen.getByText("Nước Ngọt Sting 330ml")).toBeInTheDocument();

      // Click delete button
      const deleteBtn = screen.getByTitle("Xóa món này");
      fireEvent.click(deleteBtn);
      expect(onRemoveItem).toHaveBeenCalledWith("p1");
    });
  });
});
