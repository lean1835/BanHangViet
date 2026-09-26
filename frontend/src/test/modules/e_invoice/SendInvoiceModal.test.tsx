import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { SendInvoiceModal } from "@/modules/e_invoice/components/SendInvoiceModal";
import { PrintInvoiceModal } from "@/modules/e_invoice/components/PrintInvoiceModal";
import * as invoiceDeliveryApiModule from "@/modules/e_invoice/services/invoiceDeliveryApi";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const mockShowWarning = vi.fn();

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: mockShowWarning,
    showInfo: vi.fn(),
  }),
}));

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: "u1", username: "owner", roleId: "VT-01" }, isAuthenticated: true }) => state,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(baseApi.middleware),
  });

const mockInvoice: IInvoice = {
  id: "inv-test-01",
  invoiceNumber: "00000123",
  invoicePattern: "1",
  invoiceSymbol: "1C26TAA",
  symbol: "1C26TAA",
  lookupCode: "LK998877",
  customer: "Nguyễn Văn Khách",
  buyerName: "Nguyễn Văn Khách",
  buyerEmail: "khachhang@gmail.com",
  buyerPhone: "0901234567",
  buyerTaxCode: "0109988776",
  buyerAddress: "123 Đường Nguyễn Huệ, Q1, TP.HCM",
  finalAmount: 250000,
  amount: 250000,
  taxAmount: 20000,
  totalAmountBeforeTax: 230000,
  discountAmount: 0,
  status: "ISSUED",
  time: "2026-09-20T10:00:00Z",
  createdAt: "2026-09-20T10:00:00Z",
  taxAuthorityCode: "CQT-2026-9999",
  isErrorNotified: false,
  items: [
    {
      id: "item-01",
      productId: "prod-01",
      productName: "Cà phê Robusta Đặc Sản",
      unit: "Gói 500g",
      quantity: 2,
      unitPrice: 115000,
      subtotal: 230000,
      taxRatePercentage: 10,
      taxAmount: 20000,
      discountAmount: 0,
    },
  ],
};

describe("NCL-06: Gửi và In hóa đơn cho khách hàng", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("NCL-06-CN-001: Gửi hóa đơn điện tử qua Email (SendInvoiceModal)", () => {
    it("Render modal gửi hóa đơn với đầy đủ thông tin mã tra cứu và các phương thức gửi", () => {
      render(
        <Provider store={createTestStore()}>
          <SendInvoiceModal isOpen={true} onClose={vi.fn()} invoice={mockInvoice} />
        </Provider>
      );

      expect(screen.getByText("Gửi Hóa Đơn Cho Khách Hàng")).toBeInTheDocument();
      expect(screen.getByText("LK998877")).toBeInTheDocument();
      expect(screen.getByText(/Mã QR/i)).toBeInTheDocument();
      expect(screen.getByText(/Thư Điện Tử/i)).toBeInTheDocument();
    });

    it("Chuyển sang tab Email, nhập địa chỉ email hợp lệ và gửi thành công (Happy Path)", async () => {
      const mockSendMutation = vi.fn().mockReturnValue({
        unwrap: () => Promise.resolve({ code: 1000, message: "Email sent" }),
      });
      vi.spyOn(invoiceDeliveryApiModule, "useSendInvoiceViaEmailMutation").mockReturnValue([
        mockSendMutation,
        { isLoading: false },
      ] as any);

      const onDeliverySuccess = vi.fn();

      render(
        <Provider store={createTestStore()}>
          <SendInvoiceModal
            isOpen={true}
            onClose={vi.fn()}
            invoice={mockInvoice}
            onDeliverySuccess={onDeliverySuccess}
          />
        </Provider>
      );

      // Click tab Email
      const emailTab = screen.getByText(/Thư Điện Tử/i);
      fireEvent.click(emailTab);

      // Check input prefilled or enter email
      const emailInput = screen.getByPlaceholderText(/khachhang@domain.com/i);
      expect(emailInput).toBeInTheDocument();
      fireEvent.change(emailInput, { target: { value: "test.customer@gmail.com" } });

      // Click GỬI THƯ ĐIỆN TỬ
      const sendBtn = screen.getByRole("button", { name: /GỬI THƯ ĐIỆN TỬ/i });
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(mockSendMutation).toHaveBeenCalledWith({
          invoiceId: "inv-test-01",
          email: "test.customer@gmail.com",
        });
        expect(mockShowSuccess).toHaveBeenCalledWith(
          expect.stringContaining("Đã gửi hóa đơn điện tử thành công")
        );
      });
    });

    it("Cảnh báo khi để trống địa chỉ email khách hàng (Unhappy Path - Validation)", async () => {
      render(
        <Provider store={createTestStore()}>
          <SendInvoiceModal isOpen={true} onClose={vi.fn()} invoice={{ ...mockInvoice, buyerEmail: "" }} />
        </Provider>
      );

      const emailTab = screen.getByText(/Thư Điện Tử/i);
      fireEvent.click(emailTab);

      const emailInput = screen.getByPlaceholderText(/khachhang@domain.com/i);
      fireEvent.change(emailInput, { target: { value: "   " } });

      const form = emailInput.closest("form");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockShowWarning).toHaveBeenCalledWith(
          expect.stringContaining("Vui lòng nhập địa chỉ email")
        );
      });
    });
  });

  describe("NCL-06-CN-002: Tra cứu qua liên kết và sao chép mã (Link / QR)", () => {
    it("Cho phép sao chép liên kết tra cứu hóa đơn vào clipboard", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <Provider store={createTestStore()}>
          <SendInvoiceModal isOpen={true} onClose={vi.fn()} invoice={mockInvoice} />
        </Provider>
      );

      const copyBtn = screen.getByRole("button", { name: /Sao chép/i });
      fireEvent.click(copyBtn);

      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining("LK998877"));
    });
  });

  describe("NCL-06-CN-003: In hóa đơn tại quầy (PrintInvoiceModal)", () => {
    it("Render modal in hóa đơn với định dạng K80 nhiệt, thông tin hàng hóa và mã tra cứu", () => {
      render(
        <Provider store={createTestStore()}>
          <PrintInvoiceModal isOpen={true} onClose={vi.fn()} invoice={mockInvoice} />
        </Provider>
      );

      expect(screen.getByText("In Phiếu / Hóa Đơn Cho Khách Hàng")).toBeInTheDocument();
      expect(screen.getAllByText("LK998877").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Cà phê Robusta Đặc Sản")).toBeInTheDocument();
      expect(screen.getByText("K80 (80mm)")).toBeInTheDocument();
    });

    it("Kích hoạt lệnh in window.print khi nhấn nút IN PHIẾU THANH TOÁN", () => {
      const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

      render(
        <Provider store={createTestStore()}>
          <PrintInvoiceModal isOpen={true} onClose={vi.fn()} invoice={mockInvoice} />
        </Provider>
      );

      const printBtn = screen.getByRole("button", { name: /IN PHIẾU THANH TOÁN/i });
      fireEvent.click(printBtn);

      expect(printSpy).toHaveBeenCalledTimes(1);
      printSpy.mockRestore();
    });
  });
});
