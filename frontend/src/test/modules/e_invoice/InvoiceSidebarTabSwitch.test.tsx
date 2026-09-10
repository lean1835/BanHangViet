import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { InvoiceManagementPage } from "@/modules/e_invoice/pages/InvoiceManagementPage";
import * as eInvoiceApiModule from "@/modules/e_invoice/services/eInvoiceApi";
import * as invoiceRangeApiModule from "@/modules/settings/services/invoiceRangeApi";
import * as settingsApiModule from "@/modules/settings/services/settingsApi";

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  }),
}));

vi.mock("@/providers/DashboardDemoProvider", () => ({
  useDashboardDemo: () => ({
    isOnline: true,
    invoices: [],
    setInvoices: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const createTestStore = (roleId = "VT-01") =>
  configureStore({
    reducer: {
      auth: (
        state = {
          user: { id: "u1", username: "test_user", roleId },
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

describe("Chuyển đổi bộ lọc bên trái theo từng tab Hóa đơn điện tử", () => {
  const setupMocks = () => {
    vi.spyOn(settingsApiModule, "useGetInvoiceTemplateQuery").mockReturnValue({
      data: { code: 1000, message: "Success", result: { updatedAt: "2026-09-01T00:00:00" } },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(eInvoiceApiModule, "useGetInvoicesQuery").mockReturnValue({
      data: { code: 1000, message: "Success", result: { content: [], totalElements: 0 } },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(eInvoiceApiModule, "useGetTaxConnectionStatusQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          status: "ONLINE",
          responseTimeMs: 90,
          lastSuccessfulResponseAt: "2026-09-09T12:00:00",
          pendingQueueCount: 0,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(invoiceRangeApiModule, "useGetActiveInvoiceRangeQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          id: "r1",
          invoicePattern: "1",
          invoiceSymbol: "1C26TAA",
          startNumber: 1,
          endNumber: 10000,
          currentNumber: 15,
          remainingCount: 9985,
          warningThreshold: 50,
          status: "ACTIVE",
          dailyConsumptionRate: 10,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(invoiceRangeApiModule, "useGetAllInvoiceRangesQuery").mockReturnValue({
      data: { code: 1000, message: "Success", result: { content: [], totalElements: 0 } },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

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
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(eInvoiceApiModule, "useGetManualProcessingInvoicesQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: { content: [], totalElements: 0 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
  };

  it("TC-01: Mặc định ở tab Danh sách hóa đơn hiển thị Bộ lọc Hóa đơn", () => {
    setupMocks();
    const store = createTestStore("VT-01");

    render(
      <Provider store={store}>
        <MemoryRouter>
          <InvoiceManagementPage />
        </MemoryRouter>
      </Provider>
    );

    // Sidebar tiêu đề của Danh sách hóa đơn
    expect(screen.getByText("Bộ lọc Hóa đơn")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mã tra cứu, khách hàng...")).toBeInTheDocument();
  });

  it("TC-02: Khi chuyển sang tab Kiểm soát cuối ngày, bộ lọc đổi sang Bộ lọc Kiểm soát", () => {
    setupMocks();
    const store = createTestStore("VT-01");

    render(
      <Provider store={store}>
        <MemoryRouter>
          <InvoiceManagementPage />
        </MemoryRouter>
      </Provider>
    );

    // Chuyển tab Kiểm soát cuối ngày
    const dailyTabButton = screen.getByRole("button", { name: /Kiểm soát cuối ngày/i });
    fireEvent.click(dailyTabButton);

    // Sidebar tiêu đề đổi sang Bộ lọc Kiểm soát
    expect(screen.getByText("Bộ lọc Kiểm soát")).toBeInTheDocument();
    expect(screen.getByText("Ngày kiểm soát")).toBeInTheDocument();
    expect(screen.getByText("Phân loại vấn đề")).toBeInTheDocument();
  });

  it("TC-03: Khi chuyển sang tab Hàng đợi lỗi, bộ lọc đổi sang Bộ lọc Hàng đợi lỗi", () => {
    setupMocks();
    const store = createTestStore("VT-01");

    render(
      <Provider store={store}>
        <MemoryRouter>
          <InvoiceManagementPage />
        </MemoryRouter>
      </Provider>
    );

    // Chuyển tab Hàng đợi lỗi & Gửi lại
    const retryTabButton = screen.getByRole("button", { name: /Hàng đợi lỗi & Gửi lại/i });
    fireEvent.click(retryTabButton);

    // Sidebar tiêu đề đổi sang Bộ lọc Hàng đợi lỗi
    expect(screen.getByText("Bộ lọc Hàng đợi lỗi")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mã HĐ, mã tra cứu, MST...")).toBeInTheDocument();
    expect(screen.getByText("Phân loại nhóm lỗi")).toBeInTheDocument();
    expect(screen.getAllByText("Quét & Gửi lại ngay").length).toBeGreaterThanOrEqual(1);
  });

  it("TC-04: Khi chuyển sang tab Dải số hóa đơn, bộ lọc đổi sang Bộ lọc Dải số", () => {
    setupMocks();
    const store = createTestStore("VT-01");

    render(
      <Provider store={store}>
        <MemoryRouter>
          <InvoiceManagementPage />
        </MemoryRouter>
      </Provider>
    );

    // Chuyển tab Dải số hóa đơn
    const rangeTabButton = screen.getByRole("button", { name: /Dải số hóa đơn/i });
    fireEvent.click(rangeTabButton);

    // Sidebar tiêu đề đổi sang Bộ lọc Dải số
    expect(screen.getByText("Bộ lọc Dải số")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ký hiệu (vd: 1C26TAA)...")).toBeInTheDocument();
    expect(screen.getByText("Trạng thái dải số")).toBeInTheDocument();
    // Nút khai báo dải số mới đã được xóa khỏi trang /e-invoices theo yêu cầu người dùng
    expect(screen.queryByRole("button", { name: /Khai báo dải số mới/i })).not.toBeInTheDocument();
  });

  it("TC-05: Vai trò Thu ngân VT-02 không có quyền xem tab và bộ lọc Kiểm soát cuối ngày", () => {
    setupMocks();
    const store = createTestStore("VT-02"); // Cashier

    render(
      <Provider store={store}>
        <MemoryRouter>
          <InvoiceManagementPage />
        </MemoryRouter>
      </Provider>
    );

    // Không tồn tại tab Kiểm soát cuối ngày
    expect(screen.queryByText(/Kiểm soát cuối ngày/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Bộ lọc Kiểm soát")).not.toBeInTheDocument();
  });
});
