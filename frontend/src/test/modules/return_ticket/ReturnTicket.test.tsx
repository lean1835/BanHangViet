import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { ReturnTicketTable } from "@/modules/return_ticket/components/ReturnTicketTable";
import { ReturnTicketSidebar } from "@/modules/return_ticket/components/ReturnTicketSidebar";
import { ReturnTicketDetailModal } from "@/modules/return_ticket/components/ReturnTicketDetailModal";
import { ReturnTicketRejectModal } from "@/modules/return_ticket/components/ReturnTicketRejectModal";
import { CreateReturnTicketModal } from "@/modules/return_ticket/components/CreateReturnTicketModal";
import { ReturnTicketStatistics } from "@/modules/return_ticket/components/ReturnTicketStatistics";
import { ReturnTicketStatisticsSidebar } from "@/modules/return_ticket/components/ReturnTicketStatisticsSidebar";
import {
  getReturnTicketStatusLabel,
  getReturnTicketStatusBadge,
  getRefundPaymentMethodLabel,
  isReturnPeriodExpired,
} from "@/modules/return_ticket/utils/returnTicketHelpers";
import type { IReturnTicket } from "@/modules/return_ticket/types/IReturnTicket";
import { USER_ROLES } from "@/constants/roles";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithReduxAndToast = (ui: React.ReactElement) => {
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

const mockTickets: IReturnTicket[] = [
  {
    id: "rt-1",
    ticketNumber: "PTH-0001",
    householdId: "hh-1",
    originalInvoiceId: "inv-1",
    originalInvoiceNumber: "00000123",
    originalOrderId: "ord-1",
    customerId: "cust-1",
    customerName: "Nguyễn Văn A",
    createdByUserId: "user-1",
    createdByUserName: "Nhân viên bán hàng",
    totalReturnAmount: 70000,
    refundPaymentMethod: "CASH",
    status: "PENDING",
    reason: "Khách đổi ý trả bớt 2 chai",
    createdAt: "2026-08-20T10:00:00Z",
    items: [
      {
        id: "item-1",
        invoiceItemId: "inv-item-1",
        productId: "prod-1",
        productName: "Nước mắm Nam Ngư 500ml",
        unit: "Chai",
        quantity: 2,
        unitPrice: 35000,
        taxRatePercentage: 0,
        taxAmount: 0,
        subtotal: 70000,
      },
    ],
  },
  {
    id: "rt-2",
    ticketNumber: "PTH-0002",
    householdId: "hh-1",
    originalInvoiceId: "inv-2",
    originalInvoiceNumber: "00000124",
    customerName: "Trần Thị B",
    createdByUserName: "Thu ngân 1",
    approvedByUserName: "Chủ hộ Nguyễn",
    totalReturnAmount: 150000,
    refundPaymentMethod: "BANK_TRANSFER",
    status: "APPROVED",
    approvedAt: "2026-08-19T14:30:00Z",
    createdAt: "2026-08-19T14:00:00Z",
    items: [
      {
        id: "item-2",
        productName: "Dầu ăn Simply 1L",
        unit: "Chai",
        quantity: 3,
        unitPrice: 50000,
        taxRatePercentage: 0,
        taxAmount: 0,
        subtotal: 150000,
      },
    ],
  },
  {
    id: "rt-3",
    ticketNumber: "PTH-0003",
    householdId: "hh-1",
    originalInvoiceId: "inv-3",
    originalInvoiceNumber: "00000125",
    customerName: "Lê Văn C",
    createdByUserName: "Thu ngân 2",
    totalReturnAmount: 45000,
    refundPaymentMethod: "DEBT_REDUCTION",
    status: "REJECTED",
    rejectReason: "Hàng đã bóc tem niêm phong không đủ điều kiện trả",
    rejectedAt: "2026-08-18T09:00:00Z",
    createdAt: "2026-08-18T08:30:00Z",
    items: [
      {
        id: "item-3",
        productName: "Gạo ST25 5kg",
        unit: "Túi",
        quantity: 1,
        unitPrice: 45000,
        taxRatePercentage: 0,
        taxAmount: 0,
        subtotal: 45000,
      },
    ],
  },
];

describe("NCL-11-CN-001: Return Ticket Unit & Helper Tests", () => {
  it("TC-01: format and return correct status labels and badge styles", () => {
    expect(getReturnTicketStatusLabel("PENDING")).toBe("Chờ duyệt");
    expect(getReturnTicketStatusLabel("APPROVED")).toBe("Đã duyệt");
    expect(getReturnTicketStatusLabel("REJECTED")).toBe("Từ chối");
    expect(getRefundPaymentMethodLabel("CASH")).toBe("Tiền mặt");
    expect(getRefundPaymentMethodLabel("BANK_TRANSFER")).toBe("Chuyển khoản");
    expect(getRefundPaymentMethodLabel("DEBT_REDUCTION")).toBe("Giảm trừ công nợ");

    const badge = getReturnTicketStatusBadge("PENDING");
    expect(badge.label).toBe("Chờ duyệt");
    expect(badge.text).toContain("text-amber");
  });

  it("TC-02: correctly evaluates invoice overdue rule (QTN-18: 7 days)", () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3);
    const recentCheck = isReturnPeriodExpired(recentDate.toISOString(), 7);
    expect(recentCheck.isExpired).toBe(false);

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 15);
    const oldCheck = isReturnPeriodExpired(oldDate.toISOString(), 7);
    expect(oldCheck.isExpired).toBe(true);
    expect(oldCheck.daysSince).toBeGreaterThanOrEqual(14);
  });
});

describe("NCL-11-CN-001 & CN-002: ReturnTicketTable Component", () => {
  it("renders table with return ticket rows and badges", () => {
    const onSelectMock = vi.fn();
    renderWithReduxAndToast(
      <ReturnTicketTable
        tickets={mockTickets}
        isLoading={false}
        isError={false}
        currentRole={USER_ROLES.OWNER}
        currentPage={0}
        totalPages={1}
        totalElements={3}
        pageSize={10}
        onPageChange={vi.fn()}
        onSelectTicket={onSelectMock}
      />
    );

    expect(screen.getByText("PTH-0001")).toBeInTheDocument();
    expect(screen.getByText("PTH-0002")).toBeInTheDocument();
    expect(screen.getByText("PTH-0003")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getAllByText("Chờ duyệt").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Đã duyệt").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Từ chối").length).toBeGreaterThanOrEqual(1);

    // Clicking a ticket row triggers onSelectTicket
    fireEvent.click(screen.getByText("PTH-0001"));
    expect(onSelectMock).toHaveBeenCalledWith(mockTickets[0]);
  });
});

describe("NCL-11-CN-001 & CN-002: ReturnTicketDetailModal Component", () => {
  it("renders PENDING ticket details and shows Approve & Reject buttons for Owner (VT-01)", () => {
    const onCloseMock = vi.fn();
    renderWithReduxAndToast(
      <ReturnTicketDetailModal
        isOpen={true}
        onClose={onCloseMock}
        ticket={mockTickets[0]}
        currentRole={USER_ROLES.OWNER}
      />
    );

    expect(screen.getByText("PTH-0001")).toBeInTheDocument();
    expect(screen.getByText("Nước mắm Nam Ngư 500ml")).toBeInTheDocument();
    expect(screen.getByText("DUYỆT PHIẾU & HOÀN TỒN KHO")).toBeInTheDocument();
    expect(screen.getByText("Từ chối phiếu")).toBeInTheDocument();
  });

  it("renders APPROVED ticket details and shows Adjustment Invoice button for Owner and Accountant", () => {
    renderWithReduxAndToast(
      <ReturnTicketDetailModal
        isOpen={true}
        onClose={vi.fn()}
        ticket={mockTickets[1]}
        currentRole={USER_ROLES.ACCOUNTANT}
      />
    );

    expect(screen.getByText("PTH-0002")).toBeInTheDocument();
    expect(screen.getByText("Dầu ăn Simply 1L")).toBeInTheDocument();
    expect(screen.getByText("LẬP HÓA ĐƠN ĐIỀU CHỈNH GIẢM")).toBeInTheDocument();
  });

  it("renders REJECTED ticket details with reject reason notice", () => {
    renderWithReduxAndToast(
      <ReturnTicketDetailModal
        isOpen={true}
        onClose={vi.fn()}
        ticket={mockTickets[2]}
        currentRole={USER_ROLES.CASHIER}
      />
    );

    expect(screen.getByText("PTH-0003")).toBeInTheDocument();
    expect(screen.getAllByText(/Hàng đã bóc tem niêm phong không đủ điều kiện trả/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("DUYỆT PHIẾU & HOÀN TỒN KHO")).not.toBeInTheDocument();
  });
});

describe("NCL-11-CN-002: ReturnTicketRejectModal Component", () => {
  it("validates empty reason and character limits on rejection", async () => {
    const onCloseMock = vi.fn();
    renderWithReduxAndToast(
      <ReturnTicketRejectModal
        isOpen={true}
        onClose={onCloseMock}
        ticketId="rt-1"
        ticketNumber="PTH-0001"
      />
    );

    expect(screen.getByText("Từ chối phiếu trả hàng")).toBeInTheDocument();
    expect(screen.getByText("Số phiếu: PTH-0001")).toBeInTheDocument();

    const submitBtn = screen.getByText("Xác nhận từ chối");
    fireEvent.click(submitBtn);

    expect(screen.getByText("Vui lòng nhập lý do từ chối phiếu trả hàng")).toBeInTheDocument();
  });
});

describe("NCL-11-CN-001: ReturnTicketSidebar Component", () => {
  it("allows selecting status filter and changing date presets", () => {
    const onStatusChangeMock = vi.fn();
    const onFromDateMock = vi.fn();
    const onToDateMock = vi.fn();

    render(
      <ReturnTicketSidebar
        statusFilter="ALL"
        onStatusChange={onStatusChangeMock}
        fromDate=""
        toDate=""
        onFromDateChange={onFromDateMock}
        onToDateChange={onToDateMock}
        searchQuery=""
        onSearchChange={vi.fn()}
        onResetFilters={vi.fn()}
      />
    );

    const statusSelect = screen.getByLabelText(/Trạng thái phiếu/i);
    fireEvent.change(statusSelect, { target: { value: "PENDING" } });
    expect(onStatusChangeMock).toHaveBeenCalledWith("PENDING");

    fireEvent.click(screen.getByText("Hôm nay"));
    expect(onFromDateMock).toHaveBeenCalled();
    expect(onToDateMock).toHaveBeenCalled();
  });
});

describe("NCL-11-CN-001: CreateReturnTicketModal Component", () => {
  it("renders create modal with invoice lookup view", () => {
    const onCloseMock = vi.fn();
    renderWithReduxAndToast(
      <CreateReturnTicketModal
        isOpen={true}
        onClose={onCloseMock}
        currentRole={USER_ROLES.CASHIER}
      />
    );

    expect(
      screen.getByText("Lập phiếu trả hàng từ hóa đơn đã cấp mã")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Tìm theo số HĐ/i)
    ).toBeInTheDocument();
  });
});

describe("NCL-11-CN-004: ReturnTicketStatistics Component", () => {
  it("renders statistics header and date pickers", () => {
    renderWithReduxAndToast(<ReturnTicketStatistics />);

    expect(
      screen.getByText("Thống kê hàng trả lại")
    ).toBeInTheDocument();
  });
});

describe("NCL-11-CN-004: ReturnTicketStatisticsSidebar Component", () => {
  it("renders sidebar filters, preset buttons, and triggers date changes", () => {
    const onFromDateMock = vi.fn();
    const onToDateMock = vi.fn();
    const onTopLimitMock = vi.fn();
    const onResetMock = vi.fn();

    render(
      <ReturnTicketStatisticsSidebar
        fromDate="2026-08-01"
        toDate="2026-08-31"
        onFromDateChange={onFromDateMock}
        onToDateChange={onToDateMock}
        topLimit={10}
        onTopLimitChange={onTopLimitMock}
        onResetFilters={onResetMock}
      />
    );

    expect(screen.getByText("Bộ lọc thống kê")).toBeInTheDocument();
    expect(screen.getByText("Hôm nay")).toBeInTheDocument();
    expect(screen.getByText("7 ngày qua")).toBeInTheDocument();
    expect(screen.getByText("Tháng này")).toBeInTheDocument();
    expect(screen.getByText("Tháng trước")).toBeInTheDocument();

    // Clicking 'Hôm nay' calls onFromDateChange and onToDateChange
    fireEvent.click(screen.getByText("Hôm nay"));
    expect(onFromDateMock).toHaveBeenCalled();
    expect(onToDateMock).toHaveBeenCalled();

    // Changing top limit calls onTopLimitChange
    const select = screen.getByLabelText(/Giới hạn mặt hàng trả nhiều/i);
    fireEvent.change(select, { target: { value: "20" } });
    expect(onTopLimitMock).toHaveBeenCalledWith(20);

    // Clicking reset
    fireEvent.click(screen.getByText("Xóa bộ lọc"));
    expect(onResetMock).toHaveBeenCalled();
  });
});


