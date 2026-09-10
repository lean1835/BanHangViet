import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { DailyInvoiceControlPanel } from "@/modules/e_invoice/components/DailyInvoiceControlPanel";
import * as eInvoiceApiModule from "@/modules/e_invoice/services/eInvoiceApi";

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderComponent = (userRole: string = "VT-01") => {
  const store = configureStore({
    reducer: {
      auth: (
        state = {
          user: { id: "u1", username: "test_user", roleId: userRole },
          token: "fake-token",
          isAuthenticated: true,
        }
      ) => state,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <DailyInvoiceControlPanel userRole={userRole} />
      </MemoryRouter>
    </Provider>
  );
};

describe("NCL-04-CN-008: Kiểm soát cuối ngày đơn chưa có hóa đơn và hóa đơn treo", () => {
  it("NCL-04-CN-008-TC-01: Chủ hộ đối chiếu có đơn chưa lập hóa đơn -> Liệt kê 3 nhóm bất thường", async () => {
    vi.spyOn(eInvoiceApiModule, "useGetDailyInvoiceControlQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          controlDate: "2026-09-09",
          isCleanDay: false,
          totalUninvoicedOrders: 1,
          totalPendingInvoices: 1,
          totalFailedInvoices: 1,
          uninvoicedOrders: [
            {
              orderId: "order-1",
              orderNumber: "ORD-00123",
              createdAt: "2026-09-09T10:00:00",
              createdByUsername: "cashier1",
              createdByFullName: "Nguyễn Văn Thu Ngân",
              finalAmount: 250000,
              pendingDurationHours: 4,
              pendingDurationDays: 0,
            },
          ],
          pendingInvoices: [
            {
              invoiceId: "inv-pending-1",
              invoiceNumber: "",
              orderNumber: "ORD-00124",
              createdAt: "2026-09-09T11:00:00",
              createdByUsername: "cashier1",
              createdByFullName: "Nguyễn Văn Thu Ngân",
              finalAmount: 150000,
              status: "WAITING_TAX_CODE",
              pendingDurationHours: 3,
              pendingDurationDays: 0,
            },
          ],
          failedInvoices: [
            {
              invoiceId: "inv-failed-1",
              invoiceNumber: "HD-000456",
              orderNumber: "ORD-00125",
              createdAt: "2026-09-08T15:00:00",
              createdByUsername: "cashier1",
              createdByFullName: "Nguyễn Văn Thu Ngân",
              finalAmount: 500000,
              status: "SEND_ERROR",
              taxAuthorityResponse: "Mã số thuế người mua không tồn tại trên hệ thống",
              errorCategory: "INVALID_TAX_CODE",
              retryCount: 3,
              pendingDurationHours: 26,
              pendingDurationDays: 1,
            },
          ],
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    renderComponent("VT-01");

    // Tiêu đề màn hình
    expect(screen.getByText(/Kiểm soát hóa đơn cuối ngày/i)).toBeInTheDocument();

    // 4 thẻ KPI Doanh thu & Thuế
    expect(screen.getByText("Tổng doanh thu chịu thuế")).toBeInTheDocument();
    expect(screen.getByText("Thuế GTGT phát sinh")).toBeInTheDocument();
    expect(screen.getByText("Thuế TNCN phát sinh")).toBeInTheDocument();
    expect(screen.getByText("Tổng số thuế phải nộp")).toBeInTheDocument();

    // Dữ liệu dòng đơn hàng chưa xuất HĐ
    expect(screen.getByText("ORD-00123")).toBeInTheDocument();
    expect(screen.getByText("250.000 đ")).toBeInTheDocument();
    expect(screen.getByText("Lập hóa đơn")).toBeInTheDocument();

    // Dữ liệu dòng HĐ gửi lỗi
    expect(screen.getByText("HD-000456")).toBeInTheDocument();
    expect(
      screen.getByText("Mã số thuế người mua không tồn tại trên hệ thống")
    ).toBeInTheDocument();
    expect(screen.getByText("3 lần")).toBeInTheDocument();
  });

  it("NCL-04-CN-008-TC-02: Mọi đơn trong ngày đều đã có hóa đơn được cấp mã -> Trả về isCleanDay = true", async () => {
    vi.spyOn(eInvoiceApiModule, "useGetDailyInvoiceControlQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          controlDate: "2026-09-09",
          isCleanDay: true,
          totalUninvoicedOrders: 0,
          totalPendingInvoices: 0,
          totalFailedInvoices: 0,
          uninvoicedOrders: [],
          pendingInvoices: [],
          failedInvoices: [],
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    renderComponent("VT-01");

    // Banner xác nhận ngày đã sạch
    expect(screen.getByText(/hoàn tất sạch sẽ/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Mọi đơn hàng đã thanh toán đều có hóa đơn điện tử hợp lệ/i)
    ).toBeInTheDocument();
  });

  it("NCL-04-CN-008-TC-03: Nhân viên bán hàng (VT-02) truy cập -> Bị chặn theo phân quyền QTN-10", async () => {
    renderComponent("VT-02");

    // Thông báo từ chối truy cập cho VT-02
    expect(screen.getByText("Truy cập bị từ chối")).toBeInTheDocument();
    expect(screen.getByText("Chủ hộ kinh doanh (VT-01)")).toBeInTheDocument();
    expect(screen.getByText("Kế toán (VT-03)")).toBeInTheDocument();
    expect(
      screen.getByText(/Nhân viên bán hàng không được phép truy cập theo quy định QTN-10/i)
    ).toBeInTheDocument();
  });

  it("NCL-04-CN-008-TC-04: Phân trang 8 bản ghi mỗi trang cho danh sách kiểm soát cuối ngày", async () => {
    const orders = Array.from({ length: 12 }, (_, i) => ({
      orderId: `order-${i + 1}`,
      orderNumber: `ORD-${String(i + 1).padStart(5, "0")}`,
      createdAt: "2026-09-09T10:00:00",
      createdByUsername: "cashier1",
      createdByFullName: "Thu Ngân",
      finalAmount: 100000 * (i + 1),
      pendingDurationHours: 2,
      pendingDurationDays: 0,
    }));

    vi.spyOn(eInvoiceApiModule, "useGetDailyInvoiceControlQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          controlDate: "2026-09-09",
          isCleanDay: false,
          totalUninvoicedOrders: 12,
          totalPendingInvoices: 0,
          totalFailedInvoices: 0,
          uninvoicedOrders: orders,
          pendingInvoices: [],
          failedInvoices: [],
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    renderComponent("VT-01");

    // Header hiển thị đúng tổng 12 đơn
    expect(
      screen.getByText(/1\. Đơn đã thu tiền nhưng chưa phát hành hóa đơn \(12 đơn\)/i)
    ).toBeInTheDocument();

    // Trang 1 hiển thị 8 bản ghi đầu tiên (ORD-00001 -> ORD-00008)
    expect(screen.getByText("ORD-00001")).toBeInTheDocument();
    expect(screen.getByText("ORD-00008")).toBeInTheDocument();
    expect(screen.queryByText("ORD-00009")).not.toBeInTheDocument();

    // Thanh phân trang hiển thị đúng 8 bản ghi và trang 1 / 2
    expect(screen.getByText("Trang 1 / 2")).toBeInTheDocument();
    expect(screen.getByText(/Hiển thị bản ghi từ/i)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("NCL-04-CN-008-TC-05: Sắp xếp các bản ghi theo thứ tự từ mới nhất đến cũ nhất", async () => {
    const orders = [
      {
        orderId: "order-old",
        orderNumber: "ORD-OLD-01",
        createdAt: "2026-07-22T09:19:07",
        createdByUsername: "cashier1",
        createdByFullName: "Nguyễn Văn A",
        finalAmount: 100000,
        pendingDurationHours: 1200,
        pendingDurationDays: 50,
      },
      {
        orderId: "order-new",
        orderNumber: "ORD-NEW-02",
        createdAt: "2026-09-10T14:30:00",
        createdByUsername: "cashier1",
        createdByFullName: "Nguyễn Văn A",
        finalAmount: 200000,
        pendingDurationHours: 6,
        pendingDurationDays: 0,
      },
      {
        orderId: "order-mid",
        orderNumber: "ORD-MID-03",
        createdAt: "2026-08-15T11:00:00",
        createdByUsername: "cashier1",
        createdByFullName: "Nguyễn Văn A",
        finalAmount: 150000,
        pendingDurationHours: 600,
        pendingDurationDays: 25,
      },
    ];

    vi.spyOn(eInvoiceApiModule, "useGetDailyInvoiceControlQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          controlDate: "2026-09-10",
          isCleanDay: false,
          totalUninvoicedOrders: 3,
          totalPendingInvoices: 0,
          totalFailedInvoices: 0,
          uninvoicedOrders: orders,
          pendingInvoices: [],
          failedInvoices: [],
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    renderComponent("VT-01");

    const rows = screen.getAllByRole("row");
    // Row 0 is the table header row
    // Row 1 should be the newest order: ORD-NEW-02
    // Row 2 should be the middle order: ORD-MID-03
    // Row 3 should be the oldest order: ORD-OLD-01
    expect(rows[1]).toHaveTextContent("ORD-NEW-02");
    expect(rows[2]).toHaveTextContent("ORD-MID-03");
    expect(rows[3]).toHaveTextContent("ORD-OLD-01");
  });
});

