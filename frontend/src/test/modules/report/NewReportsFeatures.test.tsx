import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { MemoryRouter } from "react-router-dom";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { DashboardDemoContext } from "@/providers/DashboardDemoProvider";
import { GrossProfitKpis } from "@/modules/report/components/GrossProfitKpis";
import { GrossProfitTable } from "@/modules/report/components/GrossProfitTable";
import { MissingCostItemsModal } from "@/modules/report/components/MissingCostItemsModal";
import { GrossProfitReportPage } from "@/modules/report/pages/GrossProfitReportPage";
import { EmployeeShiftKpis } from "@/modules/report/components/EmployeeShiftKpis";
import { ShiftDetailTable } from "@/modules/report/components/ShiftDetailTable";
import { EmployeeShiftSummaryTable } from "@/modules/report/components/EmployeeShiftSummaryTable";
import { EmployeeShiftReportPage } from "@/modules/report/pages/EmployeeShiftReportPage";
import { PaymentMethodKpis } from "@/modules/report/components/PaymentMethodKpis";
import { PaymentMethodCharts } from "@/modules/report/components/PaymentMethodCharts";
import { PaymentMethodTable } from "@/modules/report/components/PaymentMethodTable";
import { PaymentMethodReportPage } from "@/modules/report/pages/PaymentMethodReportPage";
import { ProductGroupTable } from "@/modules/report/components/ProductGroupTable";
import { ProductGroupReportPage } from "@/modules/report/pages/ProductGroupReportPage";
import { ReportExportButton } from "@/modules/report/components/ReportExportButton";
import type {
  IGrossProfitSummary,
  IProductGrossProfit,
  IMissingCostProduct,
  IEmployeeShiftReportResponse,
  IShiftRevenueReportItem,
  IEmployeeRevenueSummary,
  IPaymentMethodReportResponse,
  IProductGroupRevenue,
} from "@/modules/report/types/IReport";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithContext = (ui: React.ReactElement, role: string = "VT-01") => {
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
          <MemoryRouter>
            {ui}
          </MemoryRouter>
        </DashboardDemoContext.Provider>
      </NotificationProvider>
    </Provider>
  );
};

describe("NCL-07-CN-008: Báo cáo lãi gộp theo ngày và theo mặt hàng", () => {
  it("renders GrossProfitKpis with correct formatted financial values", () => {
    const summary: IGrossProfitSummary = {
      totalNetRevenue: 50000000,
      totalCogs: 35000000,
      totalGrossProfit: 15000000,
      grossProfitMarginPercentage: 30.0,
    };

    renderWithContext(<GrossProfitKpis summary={summary} />);

    expect(screen.getByText("Doanh thu thuần")).toBeInTheDocument();
    expect(screen.getByText("50.000.000 đ")).toBeInTheDocument();
    expect(screen.getByText("Tiền vốn nhập hàng")).toBeInTheDocument();
    expect(screen.getByText("35.000.000 đ")).toBeInTheDocument();
    expect(screen.getByText("+15.000.000 đ")).toBeInTheDocument();
    expect(screen.getByText("30.0%")).toBeInTheDocument();
  });

  it("renders GrossProfitTable and highlights items with negative margins", () => {
    const items: IProductGrossProfit[] = [
      {
        productId: "p-1",
        productSku: "SKU-001",
        productName: "Bánh bông lan trứng muối",
        unit: "Hộp",
        quantitySold: 20,
        netRevenue: 1000000,
        cogs: 600000,
        grossProfit: 400000,
        grossProfitMarginPercentage: 40.0,
        isNegativeMargin: false,
      },
      {
        productId: "p-2",
        productSku: "SKU-002",
        productName: "Nước ngọt khuyến mãi xả kho",
        unit: "Lon",
        quantitySold: 50,
        netRevenue: 400000,
        cogs: 500000,
        grossProfit: -100000,
        grossProfitMarginPercentage: -25.0,
        isNegativeMargin: true,
      },
    ];

    renderWithContext(<GrossProfitTable items={items} />);

    expect(screen.getByText("Bánh bông lan trứng muối")).toBeInTheDocument();
    expect(screen.getByText("Nước ngọt khuyến mãi xả kho")).toBeInTheDocument();
    expect(screen.getByText("Có lãi")).toBeInTheDocument();
    expect(screen.getByText("Bán lỗ")).toBeInTheDocument();

    // Toggle filter to only negative items
    const negativeButton = screen.getByText(/Bán lỗ \(1\)/);
    fireEvent.click(negativeButton);

    expect(screen.queryByText("Bánh bông lan trứng muối")).not.toBeInTheDocument();
    expect(screen.getByText("Nước ngọt khuyến mãi xả kho")).toBeInTheDocument();
  });

  it("renders MissingCostItemsModal when opened with missing cost items", () => {
    const missingItems: IMissingCostProduct[] = [
      {
        productId: "p-99",
        productSku: "SKU-999",
        productName: "Sữa tươi nhập khẩu chưa nhập giá vốn",
        unit: "Thùng",
        quantitySold: 5,
        netRevenue: 1500000,
        warningMessage: "Chưa có giá vốn",
      },
    ];

    renderWithContext(
      <MissingCostItemsModal
        isOpen={true}
        onClose={vi.fn()}
        items={missingItems}
      />
    );

    expect(screen.getByText(/Mặt hàng chưa thiết lập giá vốn/)).toBeInTheDocument();
    expect(screen.getByText("Sữa tươi nhập khẩu chưa nhập giá vốn")).toBeInTheDocument();
    expect(screen.getByText("SKU-999")).toBeInTheDocument();
  });

  it("blocks cashier VT-02 from accessing GrossProfitReportPage", () => {
    renderWithContext(<GrossProfitReportPage />, "VT-02");
    expect(screen.getByText("Không có quyền truy cập báo cáo")).toBeInTheDocument();
  });
});

describe("NCL-07-CN-010: Báo cáo doanh thu theo nhân viên và theo ca", () => {
  it("renders EmployeeShiftSummaryTable with cashier performances", () => {
    const summaries: IEmployeeRevenueSummary[] = [
      {
        userId: "user-1",
        username: "thu_ngan_1",
        employeeName: "Nguyễn Thu Ngân",
        totalShifts: 10,
        totalCashRevenue: 12000000,
        totalBankTransferRevenue: 8000000,
        totalRevenue: 20000000,
        totalOrders: 85,
        totalCanceledOrders: 1,
        averageOrdersPerShift: 8.5,
        averageRevenuePerShift: 2000000,
        totalDifferenceAmount: -50000,
        exceededShiftsCount: 1,
      },
    ];

    renderWithContext(<EmployeeShiftSummaryTable summaries={summaries} />);

    expect(screen.getByText("Nguyễn Thu Ngân")).toBeInTheDocument();
    expect(screen.getByText("@thu_ngan_1")).toBeInTheDocument();
    expect(screen.getByText("20.000.000 đ")).toBeInTheDocument();
  });
  it("renders EmployeeShiftKpis with cash and transfer revenues", () => {
    const reportData: IEmployeeShiftReportResponse = {
      fromDate: "2026-09-01",
      toDate: "2026-09-15",
      appliedThreshold: 50000,
      totalShiftsCount: 10,
      totalExceededShiftsCount: 1,
      totalCashRevenue: 12000000,
      totalBankTransferRevenue: 8000000,
      totalRevenue: 20000000,
      totalOrdersCount: 85,
      totalCanceledOrdersCount: 2,
      totalDifferenceAmount: -60000,
      shifts: [],
      employeeSummaries: [],
    };

    renderWithContext(<EmployeeShiftKpis reportData={reportData} />);

    expect(screen.getByText("20.000.000 đ")).toBeInTheDocument();
    expect(screen.getByText("12.000.000 đ")).toBeInTheDocument();
    expect(screen.getByText("8.000.000 đ")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // 1 exceeded shift
  });

  it("renders ShiftDetailTable and marks shifts exceeding discrepancy threshold", () => {
    const shifts: IShiftRevenueReportItem[] = [
      {
        shiftId: "shift-001",
        userId: "user-1",
        username: "thu_ngan_1",
        employeeName: "Nguyễn Thu Ngân",
        pointOfSaleName: "Quầy 1",
        openedAt: "2026-09-15T08:00:00",
        closedAt: "2026-09-15T16:00:00",
        openingCash: 1000000,
        closingCashExpected: 3000000,
        closingCashActual: 2900000,
        cashRevenue: 2000000,
        bankTransferRevenue: 1000000,
        totalRevenue: 3000000,
        totalOrders: 20,
        canceledOrders: 0,
        cashIncome: 0,
        cashExpense: 0,
        differenceAmount: -100000,
        differenceReason: "Thối nhầm tiền cho khách",
        isDifferenceExceeded: true,
        handoversCount: 0,
        status: "CLOSED",
      },
    ];

    renderWithContext(<ShiftDetailTable shifts={shifts} />);

    expect(screen.getByText("Nguyễn Thu Ngân")).toBeInTheDocument();
    expect(screen.getByText("-100.000 đ")).toBeInTheDocument();
    expect(screen.getByText("Xem lý do")).toBeInTheDocument();

    // Click to view reason modal
    fireEvent.click(screen.getByText("Xem lý do"));
    expect(screen.getByText(/Thối nhầm tiền cho khách/)).toBeInTheDocument();
  });

  it("blocks cashier VT-02 from accessing EmployeeShiftReportPage", () => {
    renderWithContext(<EmployeeShiftReportPage />, "VT-02");
    expect(screen.getByText("Không có quyền truy cập báo cáo")).toBeInTheDocument();
  });
});

describe("NCL-07-CN-011: Báo cáo doanh thu theo hình thức thanh toán", () => {
  it("renders PaymentMethodKpis with breakdown", () => {
    const reportData: IPaymentMethodReportResponse = {
      totalRevenue: 30000000,
      methods: [
        { method: "CASH", methodName: "Tiền mặt", totalAmount: 18000000, percentage: 60.0, transactionCount: 90 },
        { method: "BANK_TRANSFER", methodName: "Chuyển khoản", totalAmount: 12000000, percentage: 40.0, transactionCount: 45 },
      ],
      debtDetails: {
        totalDebtCreated: 2000000,
        totalDebtPaid: 1500000,
        totalDebtRemaining: 500000,
      },
      dailyTrends: [],
    };

    renderWithContext(<PaymentMethodKpis reportData={reportData} />);

    expect(screen.getByText("30.000.000 đ")).toBeInTheDocument();
    expect(screen.getByText("18.000.000 đ")).toBeInTheDocument();
    expect(screen.getByText("12.000.000 đ")).toBeInTheDocument();
    expect(screen.getByText("2.000.000 đ")).toBeInTheDocument();
  });

  it("renders PaymentMethodTable with methods and debt reconciliation", () => {
    const methods = [
      { method: "CASH", methodName: "Tiền mặt", totalAmount: 10000000, percentage: 100.0, transactionCount: 50 },
    ];
    const debtDetails = {
      totalDebtCreated: 1000000,
      totalDebtPaid: 800000,
      totalDebtRemaining: 200000,
    };

    renderWithContext(<PaymentMethodTable methods={methods} debtDetails={debtDetails} />);

    expect(screen.getByText("Chi tiết các hình thức thanh toán")).toBeInTheDocument();
    expect(screen.getByText("Đối soát công nợ trong kỳ")).toBeInTheDocument();
    expect(screen.getByText("80.0%")).toBeInTheDocument(); // Recovery rate
  });

  it("renders PaymentMethodCharts with daily trends and displays detailed tooltip on column hover", async () => {
    const dailyTrends = [
      {
        date: "2026-09-09",
        cashAmount: 137481490,
        bankTransferAmount: 1000000,
        debtAmount: 500000,
        totalAmount: 138481490,
      },
    ];

    renderWithContext(
      <PaymentMethodCharts
        methods={[]}
        dailyTrends={dailyTrends}
        totalRevenue={138481490}
      />
    );

    expect(screen.getByText("Xu hướng thanh toán theo ngày")).toBeInTheDocument();
    expect(screen.getByText("09/09")).toBeInTheDocument();

    // Hover over column
    const dateLabel = screen.getByText("09/09");
    const columnContainer = dateLabel.closest(".group");
    expect(columnContainer).toBeTruthy();
    if (columnContainer) {
      fireEvent.mouseEnter(columnContainer);
    }

    // Tooltip should display full column info
    expect(await screen.findByText(/Ngày 09\/09\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/137\.481\.490\s*đ/)).toBeInTheDocument();
    expect(screen.getByText(/1\.000\.000\s*đ/)).toBeInTheDocument();
  });

  it("blocks cashier VT-02 from accessing PaymentMethodReportPage", () => {
    renderWithContext(<PaymentMethodReportPage />, "VT-02");
    expect(screen.getByText("Không có quyền truy cập báo cáo")).toBeInTheDocument();
  });
});

describe("NCL-07-CN-012: Báo cáo doanh thu theo nhóm hàng", () => {
  it("renders ProductGroupTable and responds to group selection", () => {
    const onSelectMock = vi.fn();
    const groups: IProductGroupRevenue[] = [
      {
        groupId: "grp-1",
        groupName: "Đồ uống giải khát",
        totalQuantitySold: 150,
        revenue: 2500000,
        percentage: 50.0,
        previousPeriodRevenue: 2000000,
        growthRatePercentage: 25.0,
      },
    ];

    renderWithContext(
      <ProductGroupTable
        groups={groups}
        onSelectGroup={onSelectMock}
      />
    );

    expect(screen.getByText("Đồ uống giải khát")).toBeInTheDocument();
    expect(screen.getByText("+25.0%")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Đồ uống giải khát"));
    expect(onSelectMock).toHaveBeenCalledWith("grp-1");
  });

  it("blocks cashier VT-02 from accessing ProductGroupReportPage", () => {
    renderWithContext(<ProductGroupReportPage />, "VT-02");
    expect(screen.getByText("Không có quyền truy cập báo cáo")).toBeInTheDocument();
  });
});

describe("NCL-07-CN-009: Xuất báo cáo ra tệp bảng tính Excel", () => {
  it("renders ReportExportButton with default label", () => {
    renderWithContext(<ReportExportButton reportType="GROSS_PROFIT" />);
    expect(screen.getByText("Xuất Excel")).toBeInTheDocument();
  });
});
