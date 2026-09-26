import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { USER_ROLES } from "@/constants/roles";
import { formatCurrency } from "@/utils/formatCurrency";
import { DashboardOverviewPage } from "@/modules/dashboard/pages/DashboardOverviewPage";
import * as reportApiModule from "@/modules/report/services/reportApi";
import * as eInvoiceApiModule from "@/modules/e_invoice/services/eInvoiceApi";
import * as dashboardDemoModule from "@/providers/DashboardDemoProvider";

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAnimatedNumber", () => ({
  useAnimatedNumber: (target: number) => target,
}));

const mockOverviewResult = {
  totalRevenue: 25000000,
  orderCount: 120,
  dailyRevenues: [
    { salesDate: "2026-09-20", netRevenue: 10000000 },
    { salesDate: "2026-09-21", netRevenue: 15000000 },
  ],
};

const createTestStore = (role: string = USER_ROLES.OWNER) =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: "u-1", username: "admin", roleId: role }, isAuthenticated: true }) => state,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(baseApi.middleware),
  });

describe("Dashboard Module - Tổng quan kinh doanh (DashboardOverviewPage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(reportApiModule, "useGetDashboardOverviewQuery").mockReturnValue({
      data: { code: 1000, message: "OK", result: mockOverviewResult },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(reportApiModule, "useGetTopSellingProductsQuery").mockReturnValue({
      data: { code: 1000, message: "OK", result: [] },
      isLoading: false,
    } as any);

    vi.spyOn(reportApiModule, "useGetActivityLogsQuery").mockReturnValue({
      data: { code: 1000, message: "OK", result: { content: [] } },
      isLoading: false,
    } as any);

    vi.spyOn(eInvoiceApiModule, "useGetInvoicesQuery").mockReturnValue({
      data: { code: 1000, message: "OK", result: { totalElements: 2 } },
      isLoading: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it("Render màn hình Tổng quan kinh doanh cho Chủ hộ (Owner) với các KPI cards", () => {
    vi.spyOn(dashboardDemoModule, "useDashboardDemo").mockReturnValue({
      currentRole: USER_ROLES.OWNER,
    } as any);

    render(
      <Provider store={createTestStore(USER_ROLES.OWNER)}>
        <BrowserRouter>
          <DashboardOverviewPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole("heading", { name: "Tổng quan", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText(/Doanh thu/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(formatCurrency(25000000))).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("Hiển thị CashierShiftDashboard khi vai trò hiện tại là Thu ngân (Cashier)", () => {
    vi.spyOn(dashboardDemoModule, "useDashboardDemo").mockReturnValue({
      currentRole: USER_ROLES.CASHIER,
    } as any);

    render(
      <Provider store={createTestStore(USER_ROLES.CASHIER)}>
        <BrowserRouter>
          <DashboardOverviewPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.queryByRole("heading", { name: "Tổng quan", level: 1 })).not.toBeInTheDocument();
  });

  it("Hiển thị thông báo đang tải khi dữ liệu báo cáo đang được truy vấn", () => {
    vi.spyOn(dashboardDemoModule, "useDashboardDemo").mockReturnValue({
      currentRole: USER_ROLES.OWNER,
    } as any);

    vi.spyOn(reportApiModule, "useGetDashboardOverviewQuery").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <Provider store={createTestStore(USER_ROLES.OWNER)}>
        <BrowserRouter>
          <DashboardOverviewPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText("Đang tải dữ liệu doanh thu...")).toBeInTheDocument();
  });

  it("Hiển thị thông báo lỗi và nút Thử lại khi API báo cáo thất bại", () => {
    vi.spyOn(dashboardDemoModule, "useDashboardDemo").mockReturnValue({
      currentRole: USER_ROLES.OWNER,
    } as any);

    const refetchMock = vi.fn();
    vi.spyOn(reportApiModule, "useGetDashboardOverviewQuery").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { data: { message: "Máy chủ báo cáo bận" } },
      refetch: refetchMock,
    } as any);

    render(
      <Provider store={createTestStore(USER_ROLES.OWNER)}>
        <BrowserRouter>
          <DashboardOverviewPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: "Thử lại" });
    fireEvent.click(retryBtn);
    expect(refetchMock).toHaveBeenCalled();
  });
});
