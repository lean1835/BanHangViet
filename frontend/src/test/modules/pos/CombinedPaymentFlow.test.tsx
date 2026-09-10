import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { CombinedPaymentModal } from "@/modules/pos/components/CombinedPaymentModal";
import { BankTransferModal } from "@/modules/pos/components/BankTransferModal";
import { PosPaymentSidebar } from "@/modules/pos/components/PosPaymentSidebar";
import { OrderSuccessModal } from "@/modules/pos/components/OrderSuccessModal";
import type { IPosTab } from "@/modules/pos/types/IPos";
import type { ICustomer } from "@/modules/customer/types/ICustomer";

// Mock antd QRCode to prevent canvas issues in jsdom
vi.mock("antd", async (importOriginal) => {
  const actual = await importOriginal<typeof import("antd")>();
  return {
    ...actual,
    QRCode: () => <div data-testid="mock-qrcode">QR Code</div>,
  };
});

// Mock mutations
const mockConfirmBankTransferMutation = vi.fn();
const mockConfirmPaymentBankTransferMutation = vi.fn();
const mockSwitchPaymentMethodMutation = vi.fn();

vi.mock("@/modules/order/services/orderApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/order/services/orderApi")>();
  return {
    ...actual,
    useConfirmBankTransferMutation: () => [
      mockConfirmBankTransferMutation,
      { isLoading: false },
    ],
    useConfirmPaymentBankTransferMutation: () => [
      mockConfirmPaymentBankTransferMutation,
      { isLoading: false },
    ],
    useSwitchPaymentMethodMutation: () => [
      mockSwitchPaymentMethodMutation,
      { isLoading: false },
    ],
    useGetOrderPaymentsQuery: () => ({
      data: { code: 1000, result: [] },
      isLoading: false,
    }),
  };
});

const createTestStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });

const mockCustomer: ICustomer = {
  id: "cust-01",
  name: "Công ty Hoàng Mai",
  email: "hoangmai@gmail.com",
  phone: "0912345678",
  debt: 1000000,
  creditLimit: 5000000,
};

const baseTab: IPosTab = {
  id: "tab-1",
  orderNumber: "HĐ-001",
  status: "DRAFT",
  saleMode: "FAST",
  items: [
    {
      id: "item-1",
      product: {
        id: "prod-1",
        name: "Sản phẩm A",
        price: 100000,
        unit: "Hộp",
        barcodes: [],
      } as any,
      quantity: 1,
      price: 100000,
      lineDiscount: 0,
      lineTotal: 100000,
    },
  ],
  discountType: "PERCENTAGE",
  discountValue: 0,
  paymentMethod: "COMBINED",
  amountGiven: 100000,
  isSaved: true,
  combinedPayments: [
    { paymentMethod: "CASH", amount: 60000, amountGiven: 70000 },
    { paymentMethod: "BANK_TRANSFER", amount: 40000, isConfirmed: true, transactionCode: "VNPAY12345" },
  ],
};

describe("NCL-03-CN-011: Thanh toán kết hợp nhiều hình thức trên một đơn", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("PosPaymentSidebar UI & Switch Mode", () => {
    it("hiển thị 4 nút hình thức thanh toán và mở modal kết hợp khi ấn 'Kết hợp'", () => {
      const handleUpdateTab = vi.fn();
      const handleOpenCombinedModal = vi.fn();

      render(
        <Provider store={store}>
          <BrowserRouter>
            <PosPaymentSidebar
              tab={{ ...baseTab, paymentMethod: "CASH", combinedPayments: undefined }}
              customers={[mockCustomer]}
              onUpdateTab={handleUpdateTab}
              onOpenAddCustomerModal={vi.fn()}
              onSaveDraft={vi.fn()}
              onCompleteOrder={vi.fn()}
              onOpenCombinedPaymentModal={handleOpenCombinedModal}
              isSavingDraft={false}
              isCompletingOrder={false}
            />
          </BrowserRouter>
        </Provider>
      );

      // Verify all 4 segmented buttons
      expect(screen.getByText("Tiền mặt")).toBeInTheDocument();
      expect(screen.getByText("CK")).toBeInTheDocument();
      expect(screen.getByText("Ghi nợ")).toBeInTheDocument();
      expect(screen.getByText("Kết hợp")).toBeInTheDocument();

      // Click "Kết hợp"
      fireEvent.click(screen.getByText("Kết hợp"));
      expect(handleUpdateTab).toHaveBeenCalledWith({ paymentMethod: "COMBINED" });
      expect(handleOpenCombinedModal).toHaveBeenCalled();
    });

    it("hiển thị card tóm tắt chi tiết các phương thức khi tab đang là COMBINED", () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <PosPaymentSidebar
              tab={baseTab}
              customers={[mockCustomer]}
              onUpdateTab={vi.fn()}
              onOpenAddCustomerModal={vi.fn()}
              onSaveDraft={vi.fn()}
              onCompleteOrder={vi.fn()}
              onOpenCombinedPaymentModal={vi.fn()}
              isSavingDraft={false}
              isCompletingOrder={false}
            />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByText(/Thanh toán kết hợp/i)).toBeInTheDocument();
      expect(screen.getByText(/60.000/i)).toBeInTheDocument();
      expect(screen.getByText(/40.000/i)).toBeInTheDocument();
    });
  });

  describe("CombinedPaymentModal - NCL-03-CN-011-TC-01: Phân bổ hợp lệ CASH + BANK_TRANSFER", () => {
    it("cho phép phân bổ số tiền khớp 100% finalAmount và xác nhận thành công", async () => {
      mockConfirmBankTransferMutation.mockReturnValue({
        unwrap: () => Promise.resolve({ code: 1000, message: "OK" }),
      });

      const handleConfirm = vi.fn();
      const handleClose = vi.fn();

      render(
        <Provider store={store}>
          <CombinedPaymentModal
            isOpen={true}
            onClose={handleClose}
            orderId="order-123"
            finalTotal={100000}
            orderNumber="HĐ-001"
            customer={mockCustomer}
            onConfirmAndComplete={handleConfirm}
          />
        </Provider>
      );

      // Default rows are CASH (50,000) and BANK_TRANSFER (50,000)
      const numberInputs = screen.getAllByRole("spinbutton");
      const cashAmountInput = numberInputs[0];
      fireEvent.change(cashAmountInput, { target: { value: "60000" } });

      const bankAmountInput = numberInputs[1];
      fireEvent.change(bankAmountInput, { target: { value: "40000" } });

      // Input transaction code for Bank Transfer
      const txCodeInput = screen.getByPlaceholderText(/Ví dụ: VCB123456/i);
      fireEvent.change(txCodeInput, { target: { value: "FT26099988" } });

      // Click confirm bank transfer
      const confirmBankTransferBtn = screen.getByRole("button", { name: /Xác nhận nhận tiền/i });
      fireEvent.click(confirmBankTransferBtn);

      await waitFor(() => {
        expect(mockConfirmBankTransferMutation).toHaveBeenCalledWith({
          orderId: "order-123",
          data: {
            transactionCode: "FT26099988",
            notes: "Xác nhận chuyển khoản tại POS (NCL-03-CN-012)",
          },
        });
      });

      // Submit button should be enabled
      const submitButton = screen.getByRole("button", { name: /Xác nhận & Chốt đơn/i });
      expect(submitButton).not.toBeDisabled();

      fireEvent.click(submitButton);

      expect(handleConfirm).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ paymentMethod: "CASH", amount: 60000 }),
          expect.objectContaining({
            paymentMethod: "BANK_TRANSFER",
            amount: 40000,
            transactionCode: "FT26099988",
            isConfirmed: true,
          }),
        ]),
        undefined
      );
    });
  });

  describe("CombinedPaymentModal - NCL-03-CN-011-TC-02: Quy tắc QTN-07 (Khớp 100%) & QTN-03 (Đủ tiền)", () => {
    it("hiển thị cảnh báo và khóa nút xác nhận khi tổng tiền phân bổ chưa đủ hoặc thừa so với finalAmount", () => {
      render(
        <Provider store={store}>
          <CombinedPaymentModal
            isOpen={true}
            onClose={vi.fn()}
            finalTotal={100000}
            orderNumber="HĐ-001"
            customer={mockCustomer}
            onConfirmAndComplete={vi.fn()}
          />
        </Provider>
      );

      // Default is 50k Cash + 50k Bank. Change Cash to 30k -> Total is 80k (missing 20k)
      const numberInputs = screen.getAllByRole("spinbutton");
      const cashAmountInput = numberInputs[0];
      fireEvent.change(cashAmountInput, { target: { value: "30000" } });

      // Check missing alert
      expect(screen.getByText(/Còn thiếu 20\.000 đ chưa được phân bổ \(QTN-03\)/i)).toBeInTheDocument();

      // Submit button must be disabled
      const submitButton = screen.getByRole("button", { name: /Xác nhận & Chốt đơn/i });
      expect(submitButton).toBeDisabled();

      // Change Cash to 70k -> Total is 120k (exceeds 20k)
      fireEvent.change(cashAmountInput, { target: { value: "70000" } });
      expect(screen.getByText(/Đã phân bổ vượt quá 20\.000 đ so với tổng tiền phải trả \(QTN-07\)/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe("CombinedPaymentModal - NCL-03-CN-011-TC-03: Chặn chốt đơn nếu Chuyển khoản chưa xác nhận", () => {
    it("khóa nút xác nhận và hiển thị cảnh báo nếu dòng Chuyển khoản chưa tích đối soát", () => {
      render(
        <Provider store={store}>
          <CombinedPaymentModal
            isOpen={true}
            onClose={vi.fn()}
            finalTotal={100000}
            orderNumber="HĐ-001"
            customer={mockCustomer}
            onConfirmAndComplete={vi.fn()}
          />
        </Provider>
      );

      // Default has Bank Transfer unconfirmed
      const submitButton = screen.getByRole("button", { name: /Xác nhận & Chốt đơn/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/Phần chuyển khoản ngân hàng chưa được xác nhận/i)).toBeInTheDocument();
    });
  });

  describe("CombinedPaymentModal - QTN-13: Quy tắc khách nợ và hạn mức tín dụng", () => {
    it("cảnh báo khi chọn Ghi nợ mà đơn chưa có khách hàng", () => {
      render(
        <Provider store={store}>
          <CombinedPaymentModal
            isOpen={true}
            onClose={vi.fn()}
            finalTotal={100000}
            orderNumber="HĐ-001"
            customer={null}
            onConfirmAndComplete={vi.fn()}
          />
        </Provider>
      );

      // Add Debt method button
      const addDebtBtn = screen.getByRole("button", { name: /Ghi nợ/i });
      fireEvent.click(addDebtBtn);

      expect(screen.getByText(/Cần chọn khách hàng tại màn hình POS trước khi áp dụng ghi nợ \(QTN-13\)/i)).toBeInTheDocument();
      const submitButton = screen.getByRole("button", { name: /Xác nhận & Chốt đơn/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("NCL-03-CN-012: Xác nhận chuyển khoản & Đổi sang tiền mặt khi hủy", () => {
    it("CN-012-TC-01: Cho phép nhập mã giao dịch và gọi xác nhận thành công", async () => {
      mockConfirmBankTransferMutation.mockReturnValue({
        unwrap: () => Promise.resolve({ code: 1000, message: "OK" }),
      });

      const handleSuccess = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <Provider store={store}>
          <BankTransferModal
            isOpen={true}
            onClose={handleClose}
            orderId="order-123"
            orderNumber="HĐ-001"
            amount={150000}
            onConfirmSuccess={handleSuccess}
            onSwitchToCashSuccess={vi.fn()}
          />
        </Provider>
      );

      // Verify amount display
      expect(screen.getByText(/150.000 đ/i)).toBeInTheDocument();

      // Transaction code input
      const txInput = screen.getByPlaceholderText(/Ví dụ: VCB123456/i);
      fireEvent.change(txInput, { target: { value: "TXN-998877" } });

      // Confirm button
      const confirmBtn = screen.getByRole("button", { name: /Đã nhận đủ tiền • Xác nhận & Chốt đơn/i });
      expect(confirmBtn).not.toBeDisabled();

      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockConfirmBankTransferMutation).toHaveBeenCalledWith({
          orderId: "order-123",
          data: {
            transactionCode: "TXN-998877",
            notes: "Xác nhận chuyển khoản tại POS",
          },
        });
        expect(handleSuccess).toHaveBeenCalledWith("TXN-998877");
      });
    });

    it("CN-012-TC-03: Khách hủy CK -> Chuyển sang Tiền mặt gọi switchPaymentMethod", async () => {
      mockSwitchPaymentMethodMutation.mockReturnValue({
        unwrap: () => Promise.resolve({ code: 1000, message: "OK" }),
      });

      const handleSwitchToCash = vi.fn();

      render(
        <Provider store={store}>
          <BankTransferModal
            isOpen={true}
            onClose={vi.fn()}
            orderId="order-123"
            orderNumber="HĐ-001"
            amount={150000}
            onConfirmSuccess={vi.fn()}
            onSwitchToCashSuccess={handleSwitchToCash}
          />
        </Provider>
      );

      const cancelBankBtn = screen.getByRole("button", { name: /Khách đổi sang Tiền mặt/i });
      fireEvent.click(cancelBankBtn);

      await waitFor(() => {
        expect(mockSwitchPaymentMethodMutation).toHaveBeenCalledWith({
          orderId: "order-123",
          data: {
            newPaymentMethod: "CASH",
            amountGiven: 150000,
            notes: "Khách đổi ý chuyển sang Tiền mặt",
          },
        });
        expect(handleSwitchToCash).toHaveBeenCalled();
      });
    });
  });

  describe("OrderSuccessModal & In phiếu thanh toán kết hợp", () => {
    it("hiển thị chi tiết từng phương thức kết hợp trên modal và trong printable receipt", () => {
      render(
        <Provider store={store}>
          <OrderSuccessModal
            isOpen={true}
            onClose={vi.fn()}
            completedOrder={{
              tab: baseTab,
              changeAmount: 10000,
              finalTotal: 100000,
            }}
          />
        </Provider>
      );

      // Verify on-screen modal shows combined payment method and breakdown
      expect(screen.getByText("Kết hợp nhiều hình thức")).toBeInTheDocument();
      expect(screen.getByText("Phân bổ thanh toán kết hợp:")).toBeInTheDocument();
      expect(screen.getByText(/Tiền thừa trả khách \(từ tiền mặt\):/i)).toBeInTheDocument();

      // Open printable receipt
      const printReceiptBtn = screen.getByRole("button", { name: /In phiếu thanh toán/i });
      fireEvent.click(printReceiptBtn);

      // Verify thermal container renders split payments
      const thermalReceipt = document.getElementById("printable-pos-invoice-container");
      expect(thermalReceipt).toBeInTheDocument();
      expect(thermalReceipt?.textContent).toContain("Chi tiết phân bổ kết hợp:");
      expect(thermalReceipt?.textContent).toContain("60.000");
      expect(thermalReceipt?.textContent).toContain("40.000");
      expect(thermalReceipt?.textContent).toContain("VNPAY12345");
    });
  });
});
