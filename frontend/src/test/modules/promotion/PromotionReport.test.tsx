import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { DashboardDemoContext, type IDashboardDemoContext } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { PromotionReportModal } from "@/modules/promotion/components/PromotionReportModal";
import { PromotionTable } from "@/modules/promotion/components/PromotionTable";
import { PromotionDetailModal } from "@/modules/promotion/components/PromotionDetailModal";
import type { IPromotion, IPromotionReport } from "@/modules/promotion/types/IPromotion";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockPromoWithData: IPromotionReport = {
  promotionId: "promo-1",
  promotionName: "Khuyến mại Lễ 2/9 - Giảm 10%",
  description: "Áp dụng giảm 10% các mặt hàng nước giải khát",
  discountType: "PERCENTAGE",
  discountValue: 10,
  applyScope: "PRODUCT",
  startDate: "2026-08-01T00:00:00",
  endDate: "2026-08-15T23:59:59",
  status: "ACTIVE",
  hasData: true,
  message: "Lấy báo cáo thành công",
  totalOrdersCount: 25,
  totalQuantitySold: 120,
  promotionRevenue: 15000000,
  totalDiscountAmount: 1500000,
  baselineStartDate: "2026-07-17T00:00:00",
  baselineEndDate: "2026-08-01T00:00:00",
  baselineRevenue: 10000000,
  incrementalRevenue: 5000000,
  netResult: 3500000,
  productStats: [
    {
      productId: "prod-1",
      productName: "Nước ngọt Coca Cola 330ml",
      quantitySold: 80,
      revenue: 8000000,
      discountAmount: 800000,
    },
    {
      productId: "prod-2",
      productName: "Nước tăng lực Redbull 250ml",
      quantitySold: 40,
      revenue: 7000000,
      discountAmount: 700000,
    },
  ],
};

const mockPromoEmpty: IPromotionReport = {
  promotionId: "promo-2",
  promotionName: "Khuyến mại Khai xuân 2027",
  description: "Chưa có đơn hàng nào",
  discountType: "PERCENTAGE",
  discountValue: 5,
  applyScope: "ALL",
  startDate: "2026-09-01T00:00:00",
  endDate: "2026-09-15T23:59:59",
  status: "ACTIVE",
  hasData: false,
  message: "Chưa có giao dịch trong đợt khuyến mại này",
  totalOrdersCount: 0,
  totalQuantitySold: 0,
  promotionRevenue: 0,
  totalDiscountAmount: 0,
  baselineRevenue: 0,
  incrementalRevenue: 0,
  netResult: 0,
  productStats: [],
};

const mockPromoList: IPromotion[] = [
  {
    id: "promo-1",
    name: "Khuyến mại Lễ 2/9 - Giảm 10%",
    description: "Áp dụng giảm 10% các mặt hàng nước giải khát",
    discountType: "PERCENTAGE",
    discountValue: 10,
    applyScope: "PRODUCT",
    startDate: "2026-08-01T00:00:00",
    endDate: "2026-08-15T23:59:59",
    status: "ACTIVE",
    calculatedState: "ACTIVE",
    createdAt: "2026-08-01T00:00:00",
    totalProductsCount: 2,
  },
];

const renderWithProviders = (
  ui: React.ReactElement,
  role: string = USER_ROLES.OWNER
) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  const mockContextValue = {
    currentRole: role,
    setCurrentRole: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
    currentHouseholdId: "hh-1",
    setCurrentHouseholdId: vi.fn(),
    recentLogs: [],
    addLogEntry: vi.fn(),
    clearLogs: vi.fn(),
  } as unknown as IDashboardDemoContext;

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <DashboardDemoContext.Provider value={mockContextValue}>
          <NotificationProvider>{ui}</NotificationProvider>
        </DashboardDemoContext.Provider>
      </BrowserRouter>
    </Provider>
  );
};

// Mock RTK Query hook for promotion report
vi.mock("@/modules/promotion/services/promotionApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/promotion/services/promotionApi")>();
  return {
    ...actual,
    useGetPromotionReportQuery: vi.fn((id: string, options?: { skip?: boolean }) => {
      if (options?.skip || !id) {
        return { data: undefined, isLoading: false, isError: false };
      }
      if (id === "promo-1") {
        return { data: mockPromoWithData, isLoading: false, isError: false };
      }
      if (id === "promo-2") {
        return { data: mockPromoEmpty, isLoading: false, isError: false };
      }
      return { data: undefined, isLoading: false, isError: true, error: { message: "Not found" } };
    }),
    useGetPromotionByIdQuery: vi.fn((id: string) => ({
      data: {
        id,
        name: "Khuyến mại test",
        discountType: "PERCENTAGE",
        discountValue: 10,
        applyScope: "ALL",
        startDate: "2026-08-01T00:00:00",
        endDate: "2026-08-15T23:59:59",
        status: "ACTIVE",
        calculatedState: "ACTIVE",
        createdAt: "2026-08-01T00:00:00",
        products: [],
        productGroups: [],
      },
      isLoading: false,
    })),
  };
});

describe("NCL-15-CN-004: Báo cáo hiệu quả chương trình khuyến mại", () => {
  it("NCL-15-CN-004-TC-01: Đợt khuyến mại đã có giao dịch -> Hiển thị đầy đủ 4 KPI, so sánh kỳ cơ sở và thống kê mặt hàng", () => {
    renderWithProviders(
      <PromotionReportModal
        isOpen={true}
        onClose={vi.fn()}
        promotionId="promo-1"
      />,
      USER_ROLES.OWNER
    );

    // 1. Header and Promotion Info
    expect(screen.getAllByText(/Báo Cáo Hiệu Quả Khuyến Mại/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText("Khuyến mại Lễ 2/9 - Giảm 10%")[0]).toBeInTheDocument();

    // 2. Main KPI 1: Doanh thu trong đợt (15,000,000 đ) & Kỳ cơ sở (10,000,000 đ)
    expect(screen.getAllByText(/Doanh thu trong đợt/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/15\.000\.000/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Kỳ cơ sở: 10\.000\.000/i)).toBeInTheDocument();

    // 3. Main KPI 2: Doanh thu tăng thêm (+5,000,000 đ)
    expect(screen.getAllByText("Doanh thu tăng thêm")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/\+5\.000\.000/)[0]).toBeInTheDocument();

    // 4. Main KPI 3: Tổng tiền giảm giá (1,500,000 đ)
    expect(screen.getAllByText(/Tổng tiền giảm giá|Tổng chi phí giảm giá/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/1\.500\.000/)[0]).toBeInTheDocument();

    // 5. Main KPI 4: Hiệu quả ròng (Net: +3,500,000 đ)
    expect(screen.getAllByText(/Hiệu quả ròng|HIỆU QUẢ TÀI CHÍNH RÒNG/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/\+3\.500\.000/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Đợt KM đạt lợi nhuận ròng dương/i)[0]).toBeInTheDocument();

    // 6. Secondary metrics
    expect(screen.getAllByText(/25 đơn hàng/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText("120")[0]).toBeInTheDocument();

    // 7. Product Stats table
    expect(screen.getAllByText("Nước ngọt Coca Cola 330ml")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Nước tăng lực Redbull 250ml")[0]).toBeInTheDocument();
  });

  it("NCL-15-CN-004-TC-02: Đợt khuyến mại chưa có giao dịch (hasData = false) -> Hiển thị thông báo trạng thái rỗng rõ ràng thay vì số 0", () => {
    renderWithProviders(
      <PromotionReportModal
        isOpen={true}
        onClose={vi.fn()}
        promotionId="promo-2"
      />,
      USER_ROLES.OWNER
    );

    // Must show friendly empty state
    expect(
      screen.getAllByText("Chưa có giao dịch trong đợt khuyến mại này")[0]
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Hệ thống không hiển thị số 0 nhằm tránh hiểu lầm chiến dịch đang chịu thua lỗ/i)
    ).toBeInTheDocument();
  });

  it("NCL-15-CN-004-TC-03: Nhân viên bán hàng (VT-02) bị chặn quyền xem báo cáo (RBAC 403)", () => {
    renderWithProviders(
      <PromotionReportModal
        isOpen={true}
        onClose={vi.fn()}
        promotionId="promo-1"
      />,
      USER_ROLES.CASHIER // Role VT-02
    );

    // Must show 403 Forbidden Access Guard
    expect(
      screen.getByText(/Truy cập bị từ chối \(403 Forbidden\)/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/chức năng này chỉ được phép truy cập bởi/i)
    ).toBeInTheDocument();
  });

  it("NCL-15-CN-004-TC-04: Nút Báo cáo hiệu quả hiển thị và hoạt động trên PromotionTable và PromotionDetailModal", () => {
    const handleViewReport = vi.fn();

    // 1. Test PromotionTable button
    const { unmount } = renderWithProviders(
      <PromotionTable
        promotions={mockPromoList}
        isLoading={false}
        canManage={true}
        canViewReport={true}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={1}
        onPageChange={vi.fn()}
        onViewDetail={vi.fn()}
        onViewReport={handleViewReport}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
      USER_ROLES.OWNER
    );

    const reportButton = screen.getByRole("button", { name: /Báo cáo hiệu quả/i });
    expect(reportButton).toBeInTheDocument();
    fireEvent.click(reportButton);
    expect(handleViewReport).toHaveBeenCalledWith(mockPromoList[0]);

    unmount();

    // 2. Test PromotionDetailModal button
    const handleOpenReport = vi.fn();
    renderWithProviders(
      <PromotionDetailModal
        isOpen={true}
        onClose={vi.fn()}
        promotionId="promo-1"
        onOpenReport={handleOpenReport}
        canManage={true}
      />,
      USER_ROLES.OWNER
    );

    const detailReportButton = screen.getByRole("button", { name: /Báo cáo hiệu quả/i });
    expect(detailReportButton).toBeInTheDocument();
    fireEvent.click(detailReportButton);
    expect(handleOpenReport).toHaveBeenCalledWith("promo-1");
  });
});
