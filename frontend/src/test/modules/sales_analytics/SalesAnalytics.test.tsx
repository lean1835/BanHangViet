import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { PeakHoursHeatmap } from "@/modules/sales_analytics/components/PeakHoursHeatmap";
import { HourlyDistributionBar } from "@/modules/sales_analytics/components/HourlyDistributionBar";
import { DayOfWeekDistribution } from "@/modules/sales_analytics/components/DayOfWeekDistribution";
import { PeakInsightsCard } from "@/modules/sales_analytics/components/PeakInsightsCard";
import { SlowMovingProductTable } from "@/modules/sales_analytics/components/SlowMovingProductTable";
import { PurchaseSuggestionTable } from "@/modules/product/components/PurchaseSuggestionTable";
import type {
  ISalesHeatmapCell,
  IPeakHourlySalesData,
  IPeakDayOfWeekSalesData,
  IPeakSalesInsight,
  ISlowMovingProduct,
  ISlowMovingSummary,
} from "@/modules/sales_analytics/types/ISalesAnalytics";
import type { IPurchaseSuggestion } from "@/modules/product/types/IInventoryWarning";

afterEach(() => {
  cleanup();
});

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

// =========================================================================
// NCL-18-CN-001: Phân tích giờ cao điểm & ngày bán chạy
// =========================================================================

describe("NCL-18-CN-001: Peak Hours and Days Analytics Components", () => {
  const mockHeatmap: ISalesHeatmapCell[] = [
    {
      dayOfWeek: 1,
      dayName: "Thứ Hai",
      hourOfDay: 9,
      hourLabel: "09:00 - 10:00",
      orderCount: 15,
      totalRevenue: 2500000,
      intensity: 0.75,
    },
    {
      dayOfWeek: 6,
      dayName: "Thứ Bảy",
      hourOfDay: 19,
      hourLabel: "19:00 - 20:00",
      orderCount: 30,
      totalRevenue: 5000000,
      intensity: 1.0,
    },
  ];

  const mockHourlyStats: IPeakHourlySalesData[] = Array.from({ length: 24 }).map((_, hour) => ({
    hour,
    label: `${hour < 10 ? "0" + hour : hour}:00 - ${(hour + 1) % 24 < 10 ? "0" + (hour + 1) % 24 : (hour + 1) % 24}:00`,
    orderCount: hour === 19 ? 30 : hour === 9 ? 15 : 0,
    totalRevenue: hour === 19 ? 5000000 : hour === 9 ? 2500000 : 0,
    averageOrderValue: hour === 19 ? 166666.67 : hour === 9 ? 166666.67 : 0,
    revenuePercentage: hour === 19 ? 66.67 : hour === 9 ? 33.33 : 0,
  }));

  const mockDayOfWeekStats: IPeakDayOfWeekSalesData[] = [
    { dayOfWeek: 1, dayName: "Thứ Hai", orderCount: 15, totalRevenue: 2500000, averageOrderValue: 166666.67, revenuePercentage: 33.33 },
    { dayOfWeek: 2, dayName: "Thứ Ba", orderCount: 0, totalRevenue: 0, averageOrderValue: 0, revenuePercentage: 0 },
    { dayOfWeek: 3, dayName: "Thứ Tư", orderCount: 0, totalRevenue: 0, averageOrderValue: 0, revenuePercentage: 0 },
    { dayOfWeek: 4, dayName: "Thứ Năm", orderCount: 0, totalRevenue: 0, averageOrderValue: 0, revenuePercentage: 0 },
    { dayOfWeek: 5, dayName: "Thứ Sáu", orderCount: 0, totalRevenue: 0, averageOrderValue: 0, revenuePercentage: 0 },
    { dayOfWeek: 6, dayName: "Thứ Bảy", orderCount: 30, totalRevenue: 5000000, averageOrderValue: 166666.67, revenuePercentage: 66.67 },
    { dayOfWeek: 7, dayName: "Chủ Nhật", orderCount: 0, totalRevenue: 0, averageOrderValue: 0, revenuePercentage: 0 },
  ];

  const mockInsights: IPeakSalesInsight = {
    peakHour: 19,
    peakHourLabel: "19:00 - 20:00",
    peakHourRevenue: 5000000,
    peakHourOrderCount: 30,
    lowestHour: 2,
    lowestHourLabel: "02:00 - 03:00",
    lowestHourRevenue: 0,
    lowestHourOrderCount: 0,
    busiestDayOfWeek: 6,
    busiestDayName: "Thứ Bảy",
    busiestDayRevenue: 5000000,
    busiestDayOrderCount: 30,
    quietestDayOfWeek: 2,
    quietestDayName: "Thứ Ba",
    quietestDayRevenue: 0,
    quietestDayOrderCount: 0,
    topPeakSlots: [
      {
        dayName: "Thứ Bảy",
        hourLabel: "19:00 - 20:00",
        orderCount: 30,
        totalRevenue: 5000000,
      },
    ],
    recommendations: [
      "Khung giờ cao điểm nhất là 19:00 - 20:00 với doanh thu 5,000,000 đ. Khuyến nghị bố trí thêm nhân viên.",
    ],
  };

  it("NCL-18-CN-001-TC-01: PeakHoursHeatmap renders 7 days x 24 hours grid correctly", () => {
    render(<PeakHoursHeatmap heatmap={mockHeatmap} maxRevenue={5000000} />);

    expect(screen.getByText("Biểu đồ nhiệt phân bố bán hàng (Heatmap 7 ngày x 24 giờ)")).toBeInTheDocument();
    expect(screen.getByText("Thứ 2")).toBeInTheDocument();
    expect(screen.getByText("Thứ 7")).toBeInTheDocument();
    expect(screen.getByText("Chủ Nhật")).toBeInTheDocument();
  });

  it("NCL-18-CN-001-TC-01: HourlyDistributionBar renders 24 bars and peak hour highlight", () => {
    render(
      <HourlyDistributionBar
        hourlyStats={mockHourlyStats}
        peakHour={19}
        lowestHour={2}
      />
    );

    expect(screen.getByText("Phân tích doanh thu 24 khung giờ")).toBeInTheDocument();
    expect(screen.getByText("19h")).toBeInTheDocument();
  });

  it("NCL-18-CN-001-TC-01: DayOfWeekDistribution renders all 7 days with revenue & order count", () => {
    render(
      <DayOfWeekDistribution
        dayOfWeekStats={mockDayOfWeekStats}
        busiestDayOfWeek={6}
      />
    );

    expect(screen.getByText("Phân tích doanh thu các ngày trong tuần")).toBeInTheDocument();
    expect(screen.getByText("Thứ Bảy")).toBeInTheDocument();
    expect(screen.getByText("Bán chạy nhất")).toBeInTheDocument();
  });

  it("NCL-18-CN-001-TC-01: PeakInsightsCard renders top peak slots and recommendations", () => {
    render(<PeakInsightsCard insights={mockInsights} totalOrders={45} />);

    expect(screen.getByText("Thông tin thông minh & Khuyến nghị quản trị")).toBeInTheDocument();
    expect(screen.getAllByText("19:00 - 20:00").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText("Khung giờ cao điểm nhất là 19:00 - 20:00 với doanh thu 5,000,000 đ. Khuyến nghị bố trí thêm nhân viên.")
    ).toBeInTheDocument();
  });

  it("NCL-18-CN-001-TC-02: PeakInsightsCard renders insufficient data notice when totalOrders = 0", () => {
    render(<PeakInsightsCard insights={mockInsights} totalOrders={0} />);

    expect(screen.getByText("Chưa đủ số liệu để sinh khuyến nghị")).toBeInTheDocument();
    expect(
      screen.getByText(/Khoảng thời gian đã chọn chưa ghi nhận đơn hàng hoàn thành/i)
    ).toBeInTheDocument();
  });
});

// =========================================================================
// NCL-18-CN-002: Dự báo lượng hàng cần nhập cho kỳ tới
// =========================================================================

describe("NCL-18-CN-002: PurchaseSuggestionTable Component", () => {
  const mockSuggestions: IPurchaseSuggestion[] = [
    {
      productId: "prod-1",
      sku: "SP001",
      productName: "Nước Mắm Nam Ngư 500ml",
      unit: "Chai",
      costPrice: 28000,
      stockQuantity: 5,
      minStockQuantity: 10,
      averageWeeklySales: 20,
      totalSoldInPeriod: 80,
      suggestedQuantity: 15,
      calculationRationale: "Bán trung bình 20 Chai/tuần, tồn hiện có 5 Chai -> Gợi ý nhập 15 Chai",
      hasPromotion: false,
      promotionWarning: null,
      groupId: "grp-1",
      groupName: "Gia vị",
      lastSupplierId: "sup-1",
      lastSupplierName: "Công Ty Cổ Phần Masan",
      lastSupplierPhone: "0901234567",
    },
    {
      productId: "prod-2",
      sku: "SP002",
      productName: "Sữa tắm dê White Care 1200ml",
      unit: "Chai",
      costPrice: 70000,
      stockQuantity: 2,
      minStockQuantity: 5,
      averageWeeklySales: 10,
      totalSoldInPeriod: 40,
      suggestedQuantity: 8,
      calculationRationale: "Bán trung bình 10 Chai/tuần, tồn hiện có 2 Chai -> Gợi ý nhập 8 Chai",
      hasPromotion: true,
      promotionWarning: "Dữ liệu có đợt khuyến mại trong kỳ, số lượng gợi ý có thể cao hơn nhu cầu thực tế",
      groupId: "grp-2",
      groupName: "Hóa mỹ phẩm",
      lastSupplierId: null,
      lastSupplierName: null,
      lastSupplierPhone: null,
    },
  ];

  it("NCL-18-CN-002-TC-01 & TC-02: Renders suggestion details, weekly sales and promotion warning badge", () => {
    const onQuickReorder = vi.fn();

    render(
      <PurchaseSuggestionTable
        suggestions={mockSuggestions}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={2}
        isOwner={true}
        onPageChange={vi.fn()}
        onQuickReorder={onQuickReorder}
      />
    );

    // Assert weekly average sales and suggested quantity
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("+15")).toBeInTheDocument();
    expect(screen.getByText("+8")).toBeInTheDocument();
    expect(
      screen.getByText("Bán trung bình 20 Chai/tuần, tồn hiện có 5 Chai -> Gợi ý nhập 15 Chai")
    ).toBeInTheDocument();

    // Assert Promotion Alert badge
    expect(screen.getByText("Có đợt khuyến mại")).toBeInTheDocument();

    // Trigger reorder action
    const reorderButtons = screen.getAllByRole("button", { name: /Nhập/i });
    fireEvent.click(reorderButtons[0]);
    expect(onQuickReorder).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it("NCL-18-CN-002-TC-04: Blocks employee access and shows permission warning (isOwner = false)", () => {
    render(
      <PurchaseSuggestionTable
        suggestions={mockSuggestions}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={2}
        isOwner={false}
        onPageChange={vi.fn()}
        onQuickReorder={vi.fn()}
      />
    );

    expect(screen.getByText("Quyền truy cập bị giới hạn")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Chức năng phân tích bán hàng và gợi ý nhập hàng chỉ dành cho Chủ hộ kinh doanh (VT-01) để phục vụ việc ra quyết định nhập hàng."
      )
    ).toBeInTheDocument();
  });
});

// =========================================================================
// NCL-18-CN-003: Cảnh báo mặt hàng bán chậm và tồn lâu
// =========================================================================

describe("NCL-18-CN-003: SlowMovingProductTable Component", () => {
  const mockSummary: ISlowMovingSummary = {
    thresholdDays: 60,
    totalStagnantProducts: 2,
    totalStagnantStockQuantity: 24,
    totalStagnantCapital: 480000,
    totalRetailValue: 600000,
  };

  const mockSlowProducts: ISlowMovingProduct[] = [
    {
      productId: "prod-slow-1",
      sku: "SKU-SLOW-01",
      productName: "Bánh quy bơ Danisa 454g",
      unit: "Hộp",
      groupId: "grp-1",
      groupName: "Bánh kẹo",
      stockQuantity: 12,
      costPrice: 20000,
      price: 25000,
      stagnantCapital: 240000,
      retailInventoryValue: 300000,
      lastSaleDate: "2026-06-01T10:00:00",
      daysWithoutSale: 87,
    },
    {
      productId: "prod-slow-2",
      sku: "SKU-SLOW-02",
      productName: "Rượu vang Đà Lạt Classic 750ml",
      unit: "Chai",
      groupId: "grp-2",
      groupName: "Đồ uống",
      stockQuantity: 12,
      costPrice: 20000,
      price: 25000,
      stagnantCapital: 240000,
      retailInventoryValue: 300000,
      lastSaleDate: null,
      daysWithoutSale: 120,
    },
  ];

  it("NCL-18-CN-003-TC-01: Renders 4 KPI cards and slow moving product rows with stagnant capital", () => {
    const onThresholdChange = vi.fn();
    const onPageChange = vi.fn();

    renderWithRouter(
      <SlowMovingProductTable
        summary={mockSummary}
        products={mockSlowProducts}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={2}
        thresholdDays={60}
        isAllowed={true}
        onPageChange={onPageChange}
        onThresholdChange={onThresholdChange}
      />
    );

    // KPI Summary Assertions
    expect(screen.getByText("Mặt hàng đọng vốn")).toBeInTheDocument();
    expect(screen.getByText("Tổng vốn đọng (Giá vốn)")).toBeInTheDocument();
    expect(screen.getByText("480.000 đ")).toBeInTheDocument();

    expect(screen.getByText("SKU-SLOW-01")).toBeInTheDocument();
    expect(screen.getByText("Bánh quy bơ Danisa 454g")).toBeInTheDocument();
    expect(screen.getByText("87 ngày")).toBeInTheDocument();
    expect(screen.getByText("120 ngày")).toBeInTheDocument();
    expect(screen.getByText("2 mặt hàng")).toBeInTheDocument();
  });

  it("hides inner KPI cards when hideSummaryCards is true", () => {
    const onThresholdChange = vi.fn();
    const onPageChange = vi.fn();

    renderWithRouter(
      <SlowMovingProductTable
        summary={mockSummary}
        products={mockSlowProducts}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={2}
        thresholdDays={60}
        isAllowed={true}
        hideSummaryCards={true}
        onPageChange={onPageChange}
        onThresholdChange={onThresholdChange}
      />
    );

    expect(screen.queryByText("Tổng vốn đọng (Giá vốn)")).not.toBeInTheDocument();
    expect(screen.getByText("Bánh quy bơ Danisa 454g")).toBeInTheDocument();
  });

  it("calls onPromoteProduct when clicking the promotion action button", () => {
    const onPromoteProduct = vi.fn();

    renderWithRouter(
      <SlowMovingProductTable
        summary={mockSummary}
        products={mockSlowProducts}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={2}
        thresholdDays={60}
        isAllowed={true}
        onPageChange={vi.fn()}
        onPromoteProduct={onPromoteProduct}
      />
    );

    const promoButtons = screen.getAllByTitle("Tạo chương trình khuyến mại xả hàng");
    fireEvent.click(promoButtons[0]);

    expect(onPromoteProduct).toHaveBeenCalledWith(mockSlowProducts[0]);
  });

  it("NCL-18-CN-003-TC-02: Renders safe state message when products array is empty", () => {
    renderWithRouter(
      <SlowMovingProductTable
        summary={{
          thresholdDays: 60,
          totalStagnantProducts: 0,
          totalStagnantStockQuantity: 0,
          totalStagnantCapital: 0,
          totalRetailValue: 0,
        }}
        products={[]}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={0}
        thresholdDays={60}
        isAllowed={true}
        onPageChange={vi.fn()}
        onThresholdChange={vi.fn()}
      />
    );

    expect(screen.getByText("Không có hàng tồn đọng quá hạn")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tất cả mặt hàng trong kho đều phát sinh giao dịch bán hàng trong vòng số ngày đã chọn. Tồn kho đang được luân chuyển tốt."
      )
    ).toBeInTheDocument();
  });

  it("NCL-18-CN-003-TC-03: Blocks employee access and shows permission warning (isAllowed = false)", () => {
    renderWithRouter(
      <SlowMovingProductTable
        products={mockSlowProducts}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={2}
        thresholdDays={60}
        isAllowed={false}
        onPageChange={vi.fn()}
        onThresholdChange={vi.fn()}
      />
    );

    expect(screen.getByText("Quyền truy cập bị giới hạn")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Thông tin giá vốn và hàng tồn đọng lâu chỉ dành cho Chủ hộ kinh doanh (VT-01) và Kế toán (VT-03) theo dõi."
      )
    ).toBeInTheDocument();
  });
});
