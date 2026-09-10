import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { InvoiceDetailPage } from "@/modules/e_invoice/pages/InvoiceDetailPage";
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
    currentRole: "VT-01",
    addLogEntry: vi.fn(),
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
          user: { id: "u1", username: "test_user", roleId, fullName: "Nguyễn Văn A" },
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

const mockInvoiceData = {
  id: "inv-test-123",
  orderId: "order-123",
  lookupCode: "0204581307",
  invoiceNumber: null,
  invoiceSymbol: "ANLE01",
  status: "DRAFT",
  buyerName: "Khách lẻ",
  buyerTaxCode: "",
  buyerAddress: "",
  buyerPhone: "",
  buyerEmail: "",
  finalAmount: 150000,
  taxAuthorityResponse: null,
  createdAt: "2026-09-11T00:56:32",
  items: [
    {
      id: "item-1",
      productName: "Bia Saigon Special",
      unit: "Lon",
      quantity: 10,
      unitPrice: 15000,
      discountAmount: 0,
      taxRatePercentage: 10,
      amount: 150000,
    },
  ],
};

describe("Quay lại đúng tab trước đó trong phân mục hóa đơn", () => {
  const setupMocks = () => {
    vi.spyOn(eInvoiceApiModule, "useGetInvoiceQuery").mockReturnValue({
      data: { code: 1000, message: "Success", result: mockInvoiceData },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

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
          invoiceSymbol: "ANLE01",
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
          controlDate: "2026-09-11",
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

  it("Khi bấm 'Quay lại danh sách' từ tab Kiểm soát cuối ngày, điều hướng ngay về tab Kiểm soát cuối ngày", () => {
    setupMocks();
    const store = createTestStore("VT-01");

    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/e-invoices/inv-test-123",
              state: { fromTab: "DAILY_CONTROL" },
            },
          ]}
        >
          <Routes>
            <Route path="/e-invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/e-invoices" element={<InvoiceManagementPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Ở trang chi tiết hóa đơn
    expect(screen.getByText(/Chi tiết hóa đơn điện tử: 0204581307/i)).toBeInTheDocument();

    // Bấm nút Quay lại danh sách
    const backBtn = screen.getByRole("button", { name: /Quay lại danh sách/i });
    fireEvent.click(backBtn);

    // Phải quay lại ngay tab Kiểm soát cuối ngày, hiển thị Bộ lọc Kiểm soát
    expect(screen.getByText("Kiểm soát hóa đơn cuối ngày (NCL-04-CN-008)")).toBeInTheDocument();
    expect(screen.getByText("Bộ lọc Kiểm soát")).toBeInTheDocument();
  });

  it("Khi bấm 'Quay lại danh sách' từ tab Hàng đợi thử lại, điều hướng ngay về tab Hàng đợi lỗi & Gửi lại", () => {
    setupMocks();
    const store = createTestStore("VT-01");

    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/e-invoices/inv-test-123",
              state: { fromTab: "AUTO_RETRY" },
            },
          ]}
        >
          <Routes>
            <Route path="/e-invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/e-invoices" element={<InvoiceManagementPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    const backBtn = screen.getByRole("button", { name: /Quay lại danh sách/i });
    fireEvent.click(backBtn);

    // Phải quay lại ngay tab Hàng đợi thử lại
    expect(screen.getByText("Bộ lọc Hàng đợi lỗi")).toBeInTheDocument();
  });

  it("Khi truy cập /e-invoices?tab=DAILY_CONTROL, trang tự động mở tab Kiểm soát cuối ngày", () => {
    setupMocks();
    const store = createTestStore("VT-01");

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/e-invoices?tab=DAILY_CONTROL"]}>
          <Routes>
            <Route path="/e-invoices" element={<InvoiceManagementPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText("Kiểm soát hóa đơn cuối ngày (NCL-04-CN-008)")).toBeInTheDocument();
    expect(screen.getByText("Bộ lọc Kiểm soát")).toBeInTheDocument();
  });
});
