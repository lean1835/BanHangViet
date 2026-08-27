import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { DashboardDemoContext } from "@/providers/DashboardDemoProvider";
import { PosRevenueTable } from "@/modules/report/components/PosRevenueTable";
import { PosRevenueKpis } from "@/modules/report/components/PosRevenueKpis";
import { PosRevenueChart } from "@/modules/report/components/PosRevenueChart";
import { PosRevenueReportPage } from "@/modules/report/pages/PosRevenueReportPage";
import type { IPosRevenueSummary } from "@/modules/report/types/IPosRevenue";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockSummary: IPosRevenueSummary = {
  fromDate: "2026-08-01",
  toDate: "2026-08-31",
  totalRevenue: 72500000,
  totalOrders: 210,
  totalInvoices: 203,
  topPerformingPosName: "Quầy chính - 12 Lê Lợi",
  items: [
    {
      posId: "pos-1",
      posCode: "POS-01",
      posName: "Quầy chính - 12 Lê Lợi",
      address: "12 Lê Lợi, P. Bến Nghé, Q.1",
      orderCount: 142,
      invoiceCount: 138,
      totalAmount: 48500000,
      discountAmount: 1200000,
      netRevenue: 47300000,
      revenueProportion: 65.2,
      isDefault: true,
      isActive: true,
    },
    {
      posId: "pos-2",
      posCode: "POS-02",
      posName: "Chi nhánh 2 - Bến Thành",
      address: "Cửa Tây Chợ Bến Thành",
      orderCount: 68,
      invoiceCount: 65,
      totalAmount: 25800000,
      discountAmount: 600000,
      netRevenue: 25200000,
      revenueProportion: 34.8,
      isDefault: false,
      isActive: true,
    },
    // POS with 0 revenue (NCL-17-CN-004-TC-02)
    {
      posId: "pos-3",
      posCode: "POS-03",
      posName: "Chi nhánh 3 - Kho Thủ Đức",
      address: "45 Võ Văn Ngân, Thủ Đức",
      orderCount: 0,
      invoiceCount: 0,
      totalAmount: 0,
      discountAmount: 0,
      netRevenue: 0,
      revenueProportion: 0,
      isDefault: false,
      isActive: true,
    },
  ],
};

const renderWithReduxAndDemo = (
  ui: React.ReactElement,
  role: string = "VT-01"
) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <NotificationProvider>
        <DashboardDemoContext.Provider
          value={
            {
              currentRole: role,
              setCurrentRole: vi.fn(),
            } as any
          }
        >
          {ui}
        </DashboardDemoContext.Provider>
      </NotificationProvider>
    </Provider>
  );
};

describe("PosRevenueReport Module (NCL-17-CN-004)", () => {
  // Test 1: PosRevenueTable renders all POS items including 0-revenue POS (TC-02)
  it("renders PosRevenueTable with all points of sale, including 0-revenue POS", () => {
    render(
      <PosRevenueTable
        items={mockSummary.items}
        totalRevenue={mockSummary.totalRevenue}
        totalOrders={mockSummary.totalOrders}
        isLoading={false}
      />
    );

    expect(screen.getByText("Quầy chính - 12 Lê Lợi")).toBeInTheDocument();
    expect(screen.getByText("Chi nhánh 2 - Bến Thành")).toBeInTheDocument();
    expect(screen.getByText("Chi nhánh 3 - Kho Thủ Đức")).toBeInTheDocument();

    // Verify 0-revenue POS has 0% proportion displayed
    expect(screen.getByText("0.0%")).toBeInTheDocument();
    expect(screen.getByText("Tổng cộng toàn hộ")).toBeInTheDocument();
  });

  // Test 2: PosRevenueKpis renders summary numbers
  it("renders KPI cards accurately", () => {
    render(<PosRevenueKpis summary={mockSummary} isLoading={false} />);

    expect(screen.getByText("Tổng doanh thu thuần")).toBeInTheDocument();
    expect(screen.getByText("210 đơn")).toBeInTheDocument();
    expect(screen.getByText("203 HĐ")).toBeInTheDocument();
    expect(screen.getByText("Quầy chính - 12 Lê Lợi")).toBeInTheDocument();
  });

  // Test 3: PosRevenueChart renders chart sections
  it("renders comparison bar chart and proportion bar", () => {
    render(
      <PosRevenueChart
        items={mockSummary.items}
        totalRevenue={mockSummary.totalRevenue}
        isLoading={false}
      />
    );

    expect(
      screen.getByText("So sánh doanh thu thuần giữa các điểm bán")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tỷ trọng đóng góp doanh thu")
    ).toBeInTheDocument();
  });

  // Test 4: Role Guard renders for Owner / Accountant
  it("renders full PosRevenueReportPage for authorized users", () => {
    renderWithReduxAndDemo(<PosRevenueReportPage />, "VT-01");

    expect(
      screen.getByText("Báo cáo Doanh thu theo Điểm bán")
    ).toBeInTheDocument();
    expect(screen.getByText("Hôm nay")).toBeInTheDocument();
    expect(screen.getByText("Tháng này")).toBeInTheDocument();
  });

  // Test 5: Role Guard blocks Salesperson VT-02 (NCL-17-CN-004-TC-03)
  it("blocks Salesperson VT-02 from viewing POS revenue report", () => {
    renderWithReduxAndDemo(<PosRevenueReportPage />, "VT-02");

    expect(
      screen.getByText("Không có quyền truy cập báo cáo")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Thu ngân \(VT-02\)/)
    ).toBeInTheDocument();
  });
});
