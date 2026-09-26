import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TaxInvoiceApprovalPage } from "@/modules/tax_authority/pages/TaxInvoiceApprovalPage";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";
import type { IInvoiceErrorNotice } from "@/modules/e_invoice/types/IInvoiceErrorNotice";

const mockWaitingInvoices: IInvoice[] = [
  {
    id: "inv-wait-01",
    invoiceNumber: "HD-0001",
    invoicePattern: "1",
    invoiceSymbol: "1C26TAA",
    symbol: "1C26TAA",
    lookupCode: "LK111222",
    buyerName: "Công ty ABC",
    customer: "Công ty ABC",
    amount: 1500000,
    finalAmount: 1500000,
    taxAmount: 150000,
    taxAuthorityCode: "",
    status: "WAITING_TAX_CODE",
    time: "2026-09-21T08:00:00Z",
    createdAt: "2026-09-21T08:00:00Z",
    items: [],
  },
];

const mockHistoryInvoices: IInvoice[] = [
  {
    id: "inv-hist-01",
    invoiceNumber: "HD-0002",
    invoicePattern: "1",
    invoiceSymbol: "1C26TAA",
    symbol: "1C26TAA",
    lookupCode: "LK333444",
    buyerName: "Khách lẻ DEF",
    customer: "Khách lẻ DEF",
    amount: 500000,
    finalAmount: 500000,
    taxAmount: 50000,
    status: "ISSUED",
    taxAuthorityCode: "CQT-8888-9999",
    time: "2026-09-20T10:00:00Z",
    createdAt: "2026-09-20T10:00:00Z",
    items: [],
  },
];

const mockErrorNotices: IInvoiceErrorNotice[] = [
  {
    id: "notice-01",
    noticeCode: "TB-001",
    status: "WAITING_TAX_RESPONSE",
    createdAt: "2026-09-21T09:00:00Z",
    items: [
      {
        id: "item-01",
        invoiceId: "inv-hist-01",
        invoiceNumber: "HD-0002",
        handlingType: "ADJUST",
        reason: "Điều chỉnh sai sót thông tin địa chỉ người mua",
      },
    ],
  },
];

describe("Tax Authority Portal - Phê duyệt cấp mã hóa đơn CQT (TaxInvoiceApprovalPage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("Render danh sách hóa đơn chờ cấp mã CQT và hiển thị thông tin hóa đơn", () => {
    render(
      <TaxInvoiceApprovalPage
        waitingInvoices={mockWaitingInvoices}
        historyInvoices={mockHistoryInvoices}
        errorNotices={mockErrorNotices}
        activeTab="waiting"
        onTabChange={vi.fn()}
        isLoading={false}
        isError={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText("Công ty ABC")).toBeInTheDocument();
    expect(screen.getByText("LK111222")).toBeInTheDocument();
  });

  it("Gọi callback onApprove khi cán bộ Thuế duyệt cấp mã hóa đơn", async () => {
    const onApproveMock = vi.fn().mockResolvedValue(undefined);

    render(
      <TaxInvoiceApprovalPage
        waitingInvoices={mockWaitingInvoices}
        historyInvoices={mockHistoryInvoices}
        errorNotices={mockErrorNotices}
        activeTab="waiting"
        onTabChange={vi.fn()}
        isLoading={false}
        isError={false}
        onApprove={onApproveMock}
        onReject={vi.fn()}
      />
    );

    const approveBtn = screen.getByRole("button", { name: /Cấp mã thuế/i });
    fireEvent.click(approveBtn);

    expect(onApproveMock).toHaveBeenCalledWith("inv-wait-01");
  });

  it("Chuyển tab sang Lịch sử duyệt và hiển thị mã cơ quan thuế đã cấp", () => {
    render(
      <TaxInvoiceApprovalPage
        waitingInvoices={mockWaitingInvoices}
        historyInvoices={mockHistoryInvoices}
        errorNotices={mockErrorNotices}
        activeTab="history"
        onTabChange={vi.fn()}
        isLoading={false}
        isError={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText("Khách lẻ DEF")).toBeInTheDocument();
    expect(screen.getByText("CQT-8888-9999")).toBeInTheDocument();
  });

  it("Hiển thị danh sách thông báo sai sót gửi tới CQT ở tab error_notices", () => {
    render(
      <TaxInvoiceApprovalPage
        waitingInvoices={mockWaitingInvoices}
        historyInvoices={mockHistoryInvoices}
        errorNotices={mockErrorNotices}
        activeTab="error_notices"
        onTabChange={vi.fn()}
        isLoading={false}
        isError={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText("TB-001")).toBeInTheDocument();
    expect(screen.getByText(/Điều chỉnh sai sót thông tin địa chỉ/i)).toBeInTheDocument();
  });
});
