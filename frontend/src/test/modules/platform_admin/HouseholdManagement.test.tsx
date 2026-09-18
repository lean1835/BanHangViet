import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import authReducer from "@/stores/authSlice";
import { HouseholdManagementPage } from "@/modules/platform_admin/pages/HouseholdManagementPage";
import * as platformApiModule from "@/modules/platform_admin/services/platformAdminApi";
import {
  PLATFORM_HOUSEHOLD_STATUS,
  SUBSCRIPTION_PLAN_CODE,
  type IHouseholdAdminItem,
  type ISubscriptionPlan,
} from "@/modules/platform_admin/types/platformAdminTypes";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

describe("Quản lý hộ kinh doanh, khóa/mở khóa & Gói dịch vụ", () => {
  const mockLockMutation = vi.fn();
  const mockUnlockMutation = vi.fn();
  const mockChangePlanMutation = vi.fn();
  const mockRefetch = vi.fn();

  const mockPlans: ISubscriptionPlan[] = [
    {
      id: "pkg-001",
      code: SUBSCRIPTION_PLAN_CODE.STARTER,
      name: "Gói Khởi Tạo (Starter)",
      maxUsers: 2,
      maxPos: 1,
      maxMonthlyInvoices: 200,
      dataRetentionMonths: 12,
      pricePerMonth: 99000,
      description: "Phù hợp tiệm nhỏ",
    },
    {
      id: "pkg-002",
      code: SUBSCRIPTION_PLAN_CODE.STANDARD,
      name: "Gói Tiêu Chuẩn (Standard)",
      maxUsers: 5,
      maxPos: 2,
      maxMonthlyInvoices: 1000,
      dataRetentionMonths: 36,
      pricePerMonth: 199000,
      description: "Phù hợp cửa hàng vừa",
      isPopular: true,
    },
    {
      id: "pkg-003",
      code: SUBSCRIPTION_PLAN_CODE.PREMIUM,
      name: "Gói Nâng Cao (Premium)",
      maxUsers: 15,
      maxPos: 5,
      maxMonthlyInvoices: 5000,
      dataRetentionMonths: 60,
      pricePerMonth: 399000,
      description: "Phù hợp chuỗi bán lẻ",
    },
  ];

  const mockHouseholds: IHouseholdAdminItem[] = [
    {
      id: "hh-01",
      name: "Hộ kinh doanh Tạp Hóa Việt",
      taxCode: "0123456789",
      representative: "Nguyễn Văn A",
      phoneNumber: "0901234567",
      address: "123 Đường Lê Lợi, Quận 1",
      status: PLATFORM_HOUSEHOLD_STATUS.ACTIVE,
      planCode: SUBSCRIPTION_PLAN_CODE.STANDARD,
      planName: "Tiêu Chuẩn (Standard)",
      planExpiry: "15/12/2026",
      isExpired: false,
      userCount: 3,
      maxUsers: 5,
      invoiceCountMonth: 842,
      maxInvoicesMonth: 1000,
      lastActiveAt: "10 phút trước",
    },
    {
      id: "hh-02",
      name: "Quán Ăn Hương Quê",
      taxCode: "0412356789",
      representative: "Lê Văn C",
      phoneNumber: "0987654321",
      address: "78 Nguyễn Trãi, Hà Nội",
      status: PLATFORM_HOUSEHOLD_STATUS.LOCKED,
      lockReason: "Tạm dừng kinh doanh sửa chữa mặt bằng",
      lockedAt: "2026-07-01 09:00:00",
      planCode: SUBSCRIPTION_PLAN_CODE.STARTER,
      planName: "Khởi Tạo (Starter)",
      planExpiry: "01/07/2026",
      isExpired: true,
      userCount: 2,
      maxUsers: 2,
      invoiceCountMonth: 195,
      maxInvoicesMonth: 200,
      lastActiveAt: "2 tháng trước",
    },
    {
      id: "hh-03",
      name: "Siêu Thị Mini 247",
      taxCode: "0891234567",
      representative: "Trần Đình Trọng",
      phoneNumber: "0976543210",
      address: "210 Cầu Giấy, Hà Nội",
      status: PLATFORM_HOUSEHOLD_STATUS.ACTIVE,
      planCode: SUBSCRIPTION_PLAN_CODE.STANDARD,
      planName: "Tiêu Chuẩn (Standard)",
      planExpiry: "20/11/2026",
      isExpired: false,
      userCount: 5,
      maxUsers: 5,
      invoiceCountMonth: 1045, // Over quota!
      maxInvoicesMonth: 1000,
      lastActiveAt: "5 phút trước",
    },
  ];

  const createTestStore = () => {
    return configureStore({
      reducer: {
        auth: authReducer,
        [baseApi.reducerPath]: baseApi.reducer,
      } as any,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }).concat(baseApi.middleware),
      preloadedState: {
        auth: {
          user: {
            id: "admin-01",
            username: "quantri_nen_tang",
            fullName: "Quản Trị Viên Nền Tảng",
            roleId: "VT-04",
          },
          token: "mock-jwt-token-admin",
          isAuthenticated: true,
        },
      } as any,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(platformApiModule, "useGetAdminHouseholdsQuery").mockReturnValue({
      data: mockHouseholds,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    } as any);

    vi.spyOn(platformApiModule, "useGetSubscriptionPlansQuery").mockReturnValue({
      data: mockPlans,
      isLoading: false,
      isFetching: false,
    } as any);

    vi.spyOn(platformApiModule, "useLockHouseholdMutation").mockReturnValue([
      mockLockMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(platformApiModule, "useUnlockHouseholdMutation").mockReturnValue([
      mockUnlockMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(platformApiModule, "useChangeHouseholdSubscriptionMutation").mockReturnValue([
      mockChangePlanMutation,
      { isLoading: false } as any,
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () => {
    return render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <HouseholdManagementPage />
        </MemoryRouter>
      </Provider>
    );
  };

  it("Hiển thị danh sách hộ kinh doanh, trạng thái hoạt động và bị khóa", () => {
    renderComponent();

    expect(
      screen.getByText("Quản Lý Hộ Kinh Doanh & Hạn Mức Gói")
    ).toBeInTheDocument();
    expect(screen.getByText("Hộ kinh doanh Tạp Hóa Việt")).toBeInTheDocument();
    expect(screen.getByText("Quán Ăn Hương Quê")).toBeInTheDocument();
    expect(screen.getByText("Siêu Thị Mini 247")).toBeInTheDocument();

    // Verify badges
    expect(screen.getAllByText("Hoạt động").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bị khóa").length).toBeGreaterThanOrEqual(1);
  });

  it("GAP 48: Cảnh báo khi hộ kinh doanh vượt hạn mức hóa đơn tháng nhưng vẫn cho phép hoạt động", () => {
    renderComponent();

    // Siêu Thị Mini 247 has 1045 / 1000 invoices (+45)
    expect(screen.getByText("+45")).toBeInTheDocument();
    expect(
      screen.getByText("Vượt hạn mức (GAP 48 cho phép xuất)")
    ).toBeInTheDocument();
  });

  it("Quản trị viên khóa tài khoản hộ kinh doanh kèm lý do bắt buộc", async () => {
    const user = userEvent.setup();
    mockLockMutation.mockReturnValue({
      unwrap: () => Promise.resolve({ id: "hh-01" }),
    });

    renderComponent();

    // Click "Khóa" on first household (Tạp Hóa Việt)
    const lockButtons = screen.getAllByRole("button", { name: /Khóa/i });
    const firstLockBtn = lockButtons.find((btn) => btn.textContent?.trim() === "Khóa");
    expect(firstLockBtn).toBeDefined();

    await user.click(firstLockBtn!);

    // Modal Khóa hiển thị
    expect(screen.getByText("Khóa Tài Khoản Hộ Kinh Doanh")).toBeInTheDocument();

    // Bấm chip lý do nhanh
    const reasonChip = screen.getByRole("button", {
      name: /\+ Hộ tạm ngừng kinh doanh theo yêu cầu/i,
    });
    await user.click(reasonChip);

    // Xác nhận khóa
    const confirmBtn = screen.getByRole("button", { name: "Xác nhận khóa hộ" });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockLockMutation).toHaveBeenCalledWith({
        id: "hh-01",
        reason: "Hộ tạm ngừng kinh doanh theo yêu cầu",
      });
    });
  });

  it("Quản trị viên mở khóa tài khoản hộ kinh doanh", async () => {
    const user = userEvent.setup();
    mockUnlockMutation.mockReturnValue({
      unwrap: () => Promise.resolve({ id: "hh-02" }),
    });

    renderComponent();

    // Click "Mở khóa" on locked household (Quán Ăn Hương Quê)
    const unlockBtn = screen.getByRole("button", { name: /Mở khóa/i });
    await user.click(unlockBtn);

    // Modal Mở khóa hiển thị
    expect(screen.getByText("Mở Khóa Tài Khoản Hộ")).toBeInTheDocument();

    // Xác nhận mở khóa
    const confirmBtn = screen.getByRole("button", { name: "Xác nhận mở khóa" });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockUnlockMutation).toHaveBeenCalledWith("hh-02");
    });
  });

  it("Quản trị viên đổi gói dịch vụ cho hộ kinh doanh thành công", async () => {
    const user = userEvent.setup();
    mockChangePlanMutation.mockReturnValue({
      unwrap: () => Promise.resolve({ id: "sub-new" }),
    });

    renderComponent();

    // Click "Đổi gói" button on first household
    const changePlanBtns = screen.getAllByRole("button", { name: /Đổi gói/i });
    await user.click(changePlanBtns[0]);

    // Modal Đổi gói hiển thị
    expect(screen.getByText("Quản Lý Gói Dịch Vụ & Hạn Mức Hộ")).toBeInTheDocument();

    // Bấm chọn gói Nâng Cao (Premium)
    const premiumPlanCard = screen.getByText("Gói Nâng Cao (Premium)");
    await user.click(premiumPlanCard);

    // Bấm chọn hạn +1 năm
    const plusYearBtn = screen.getByRole("button", { name: "+1 năm" });
    await user.click(plusYearBtn);

    // Xác nhận đổi gói
    const confirmBtn = screen.getByRole("button", { name: "Xác nhận đổi gói" });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockChangePlanMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          householdId: "hh-01",
          packageId: "pkg-003",
          planCode: SUBSCRIPTION_PLAN_CODE.PREMIUM,
        })
      );
    });
  });
});
