import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { CreateErrorNoticeModal } from "@/modules/e_invoice/components/CreateErrorNoticeModal";
import { ErrorNoticeDetailModal } from "@/modules/e_invoice/components/ErrorNoticeDetailModal";
import { InvoiceRepresentationModal } from "@/modules/e_invoice/components/InvoiceRepresentationModal";
import { InvoiceList } from "@/modules/e_invoice/components/InvoiceList";
import * as invoiceErrorNoticeApiModule from "@/modules/e_invoice/services/invoiceErrorNoticeApi";
import * as eInvoiceApiModule from "@/modules/e_invoice/services/eInvoiceApi";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";
import type { IInvoiceErrorNotice } from "@/modules/e_invoice/types/IInvoiceErrorNotice";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: "u1", username: "owner", roleId: "VT-01" }, isAuthenticated: true }) => state,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(baseApi.middleware),
  });

const mockInvoice1: IInvoice = {
  id: "inv-001",
  invoiceNumber: "00000001",
  invoicePattern: "1",
  invoiceSymbol: "1C26TAA",
  symbol: "1C26TAA",
  lookupCode: "LK001",
  customer: "Công ty ABC",
  buyerName: "Công ty ABC",
  buyerTaxCode: "0101234567",
  buyerAddress: "123 Đường Lê Lợi, Q1, TP.HCM",
  finalAmount: 110000,
  amount: 110000,
  taxAmount: 10000,
  status: "CANCELED",
  time: "2026-09-10T10:00:00Z",
  createdAt: "2026-09-10T10:00:00Z",
  taxAuthorityCode: "CQT-123456",
  isErrorNotified: false,
  cancelReason: "Khách hàng đổi ý hủy đơn",
  items: [
    {
      id: "item-1",
      productId: "prod-1",
      productName: "Cà phê sữa đá",
      unit: "Ly",
      quantity: 2,
      unitPrice: 50000,
      taxRatePercentage: 10,
      taxAmount: 10000,
      discountAmount: 0,
      subtotal: 100000,
    },
  ],
};

describe("NCL-05-CN-005: Lập và gửi thông báo hóa đơn sai sót tới cơ quan thuế mô phỏng", () => {
  it("Hiển thị danh sách hóa đơn đủ điều kiện và cho phép tạo thông báo sai sót", async () => {
    vi.spyOn(invoiceErrorNoticeApiModule, "useGetEligibleInvoicesQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: [mockInvoice1],
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const mockCreate = vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ result: { id: "notice-01", noticeCode: "04SS-2026-001" } }),
    });
    vi.spyOn(invoiceErrorNoticeApiModule, "useCreateErrorNoticeMutation").mockReturnValue([
      mockCreate,
      { isLoading: false },
    ] as any);

    const mockSend = vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ result: { id: "notice-01", status: "ACCEPTED" } }),
    });
    vi.spyOn(invoiceErrorNoticeApiModule, "useSendErrorNoticeToTaxMutation").mockReturnValue([
      mockSend,
      { isLoading: false },
    ] as any);

    render(
      <Provider store={createTestStore()}>
        <CreateErrorNoticeModal isOpen={true} onClose={vi.fn()} preSelectedInvoiceId="inv-001" />
      </Provider>
    );

    expect(screen.getByText("Lập thông báo hóa đơn điện tử có sai sót")).toBeInTheDocument();
    expect(screen.getByText(/Số HĐ: 00000001/)).toBeInTheDocument();

    // Input reason
    const reasonInput = screen.getByPlaceholderText(/Nhập lý do sai sót theo quy định/i);
    fireEvent.change(reasonInput, { target: { value: "Hóa đơn sai sót thông tin người mua và hủy đơn hàng" } });

    // Submit save draft
    const saveBtn = screen.getByText("Lưu bản nháp");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          noticePlace: "TP. Hồ Chí Minh",
          items: expect.arrayContaining([
            expect.objectContaining({
              invoiceId: "inv-001",
              handlingType: "CANCEL",
              reason: "Hóa đơn sai sót thông tin người mua và hủy đơn hàng",
            }),
          ]),
        })
      );
    });
  });

  it("Xem chi tiết thông báo sai sót theo Mẫu 04/SS-HĐĐT và kết quả tiếp nhận của CQT", () => {
    const mockNotice: IInvoiceErrorNotice = {
      id: "notice-01",
      householdId: "hh-01",
      noticeCode: "04SS-2026-001",
      noticePlace: "TP. Hồ Chí Minh",
      status: "ACCEPTED",
      taxAuthorityCode: "CQT-SS-99999",
      taxAuthorityName: "Chi cục Thuế Quận 1",
      taxResponseAt: "2026-09-10T11:00:00Z",
      createdAt: "2026-09-10T10:30:00Z",
      createdByUserName: "Nguyễn Văn Chủ Hộ",
      items: [
        {
          id: "item-01",
          invoiceId: "inv-001",
          invoiceNumber: "00000001",
          invoicePattern: "1",
          invoiceSymbol: "1C26TAA",
          taxAuthorityCode: "CQT-123456",
          handlingType: "CANCEL",
          reason: "Sai sót thông tin hàng hóa đã hủy",
        },
      ],
    };

    vi.spyOn(invoiceErrorNoticeApiModule, "useGetErrorNoticeQuery").mockReturnValue({
      data: { code: 1000, message: "Success", result: mockNotice },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <Provider store={createTestStore()}>
        <ErrorNoticeDetailModal isOpen={true} onClose={vi.fn()} noticeId="notice-01" />
      </Provider>
    );

    expect(screen.getByText("THÔNG BÁO HÓA ĐƠN ĐIỆN TỬ CÓ SAI SÓT")).toBeInTheDocument();
    expect(screen.getAllByText("04SS-2026-001").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("CQT-SS-99999")).toBeInTheDocument();
    expect(screen.getByText("Sai sót thông tin hàng hóa đã hủy")).toBeInTheDocument();
    expect(screen.getByText("Đã tiếp nhận")).toBeInTheDocument();
  });
});

describe("NCL-05-CN-006: Xuất danh sách hóa đơn tra cứu ra tệp", () => {
  it("Hiển thị nút Xuất Excel trong danh sách hóa đơn và gọi callback khi nhấn", () => {
    const onExportExcel = vi.fn();

    render(
      <Provider store={createTestStore()}>
        <InvoiceList
          invoices={[mockInvoice1]}
          onSelectInvoice={vi.fn()}
          onExportExcel={onExportExcel}
          canExport={true}
        />
      </Provider>
    );

    const exportBtn = screen.getByTitle(/Xuất danh sách hóa đơn theo bộ lọc ra Excel/i);
    expect(exportBtn).toBeInTheDocument();
    fireEvent.click(exportBtn);

    expect(onExportExcel).toHaveBeenCalledTimes(1);
  });
});

describe("NCL-05-CN-007: Xem và tải bản thể hiện hóa đơn", () => {
  it("Xem bản thể hiện hóa đơn đầy đủ thông tin pháp lý, đóng dấu Watermark khi hủy", () => {
    vi.spyOn(eInvoiceApiModule, "useGetInvoiceRepresentationQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          invoiceId: "inv-001",
          invoiceNumber: "00000001",
          invoicePattern: "1",
          invoiceSymbol: "1C26TAA",
          title: "HÓA ĐƠN GIÁ TRỊ GIA TĂNG",
          status: "CANCELED",
          watermarkText: "HÓA ĐƠN ĐÃ HỦY",
          isDraft: false,
          isCanceled: true,
          isAdjusted: false,
          householdName: "HỘ KINH DOANH BÁN HÀNG VIỆT",
          householdTaxCode: "0312345678",
          householdAddress: "456 Đường CMT8, Q3, TP.HCM",
          buyerName: "Công ty ABC",
          buyerTaxCode: "0101234567",
          totalAmountBeforeTax: 100000,
          taxAmount: 10000,
          discountAmount: 0,
          finalAmount: 110000,
          amountInWords: "Một trăm mười nghìn đồng",
          lookupCode: "LK001",
          taxAuthorityCode: "CQT-123456",
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(eInvoiceApiModule, "useGetInvoiceQuery").mockReturnValue({
      data: { code: 1000, message: "Success", result: mockInvoice1 },
      isLoading: false,
    } as any);

    render(
      <Provider store={createTestStore()}>
        <InvoiceRepresentationModal isOpen={true} onClose={vi.fn()} invoiceId="inv-001" />
      </Provider>
    );

    expect(screen.getByText("Bản thể hiện hóa đơn điện tử")).toBeInTheDocument();
    expect(screen.getByText("HÓA ĐƠN ĐÃ HỦY")).toBeInTheDocument();
    expect(screen.getByText("(HÓA ĐƠN ĐÃ BỊ HỦY BỎ)")).toBeInTheDocument();
    expect(screen.getByText("00000001")).toBeInTheDocument();
    expect(screen.getByText("Cà phê sữa đá")).toBeInTheDocument();
    expect(screen.getByText("Một trăm mười nghìn đồng")).toBeInTheDocument();
  });
});
