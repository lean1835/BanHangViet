import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import authReducer from "@/stores/authSlice";
import { PlatformAdminLogsPage } from "@/modules/platform_admin/pages/PlatformAdminLogsPage";
import * as platformApiModule from "@/modules/platform_admin/services/platformAdminApi";
import {
  SYSTEM_LOG_CATEGORY,
  SYSTEM_LOG_SEVERITY,
  type ISystemAuditLog,
  type ISystemIncidentAlert,
} from "@/modules/platform_admin/types/platformAdminTypes";

describe("Quản trị nền tảng xem nhật ký hệ thống toàn nền tảng & Sự cố diện rộng", () => {
  const mockDismissIncidentMutation = vi.fn();
  const mockRefetch = vi.fn();

  const mockLogs: ISystemAuditLog[] = [
    {
      id: "log-001",
      timestamp: "2026-09-13 20:45:12",
      severity: SYSTEM_LOG_SEVERITY.CRITICAL,
      category: SYSTEM_LOG_CATEGORY.TAX_GATEWAY,
      householdId: "tap-hoa-viet",
      householdName: "Tạp Hóa Việt",
      taxCode: "0123456789",
      action: "Timeout khi truyền hóa đơn sang Cổng CQT mô phỏng",
      errorCode: "TAX_ERR_GATEWAY_TIMEOUT",
      latencyMs: 5820,
      ipAddress: "14.232.84.102",
      technicalDetails: "HTTP POST /tax/invoices/validate: Connection timed out sau 5000ms.",
    },
    {
      id: "log-002",
      timestamp: "2026-09-13 20:44:50",
      severity: SYSTEM_LOG_SEVERITY.ERROR,
      category: SYSTEM_LOG_CATEGORY.TAX_GATEWAY,
      householdId: "nha-thuoc-an-tam",
      householdName: "Nhà Thuốc An Tâm",
      taxCode: "0312456789",
      action: "CQT phản hồi lỗi cấu trúc dữ liệu XML hóa đơn",
      errorCode: "TAX_ERR_INVALID_XML_STRUCTURE",
      latencyMs: 1420,
      ipAddress: "118.69.182.44",
      technicalDetails: "Lỗi Schema XSD tại trường TTKhac: Cú pháp mã tra cứu không hợp lệ.",
    },
    {
      id: "log-003",
      timestamp: "2026-09-13 18:20:10",
      severity: SYSTEM_LOG_SEVERITY.INFO,
      category: SYSTEM_LOG_CATEGORY.SECURITY,
      action: "Quản trị viên nền tảng đăng nhập thành công",
      ipAddress: "192.168.1.100",
      technicalDetails: "User: quantri_viet (VT-04). Phiên làm việc được cấp token thời hạn 4 giờ.",
    },
  ];

  const mockIncident: ISystemIncidentAlert = {
    id: "inc-001",
    title: "SỰ CỐ DIỆN RỘNG: CỔNG CƠ QUAN THUẾ MÔ PHỎNG PHẢN HỒI CHẬM",
    description: "Ghi nhận độ trễ > 5.000ms trên 18 lượt gửi liên tiếp.",
    detectedAt: "2026-09-13 20:40:00",
    severity: SYSTEM_LOG_SEVERITY.CRITICAL,
    impactedHouseholdsCount: 4,
    active: true,
    suggestion: "Chuyển các hộ sang chế độ lưu trữ hàng đợi ngoại tuyến.",
  };

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
            fullName: "Quản Trị Viên",
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

    vi.spyOn(platformApiModule, "useGetPlatformSystemLogsQuery").mockReturnValue({
      data: mockLogs,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    } as any);

    vi.spyOn(platformApiModule, "useGetActiveIncidentQuery").mockReturnValue({
      data: mockIncident,
      isLoading: false,
      isFetching: false,
    } as any);

    vi.spyOn(platformApiModule, "useDismissIncidentMutation").mockReturnValue([
      mockDismissIncidentMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(platformApiModule, "useGetAdminHouseholdsQuery").mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () => {
    return render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <PlatformAdminLogsPage />
        </MemoryRouter>
      </Provider>
    );
  };

  it("Hiển thị danh sách nhật ký hệ thống toàn nền tảng kèm mã lỗi và mức độ", () => {
    renderComponent();

    expect(
      screen.getByText("Nhật Ký Vận Hành Toàn Nền Tảng")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Timeout khi truyền hóa đơn sang Cổng CQT mô phỏng")
    ).toBeInTheDocument();
    expect(screen.getByText("TAX_ERR_GATEWAY_TIMEOUT")).toBeInTheDocument();
    expect(screen.getByText("TAX_ERR_INVALID_XML_STRUCTURE")).toBeInTheDocument();
    expect(screen.getByText("14.232.84.102")).toBeInTheDocument();

    // Verify severity badges
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
    expect(screen.getByText("ERROR")).toBeInTheDocument();
    expect(screen.getByText("INFO")).toBeInTheDocument();
  });

  it("Hiển thị Banner sự cố diện rộng khi lỗi kết nối CQT vượt ngưỡng và cho phép đóng sự cố", async () => {
    const user = userEvent.setup();
    mockDismissIncidentMutation.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });

    renderComponent();

    // Banner sự cố hiển thị nổi bật
    expect(
      screen.getByText("SỰ CỐ DIỆN RỘNG: CỔNG CƠ QUAN THUẾ MÔ PHỎNG PHẢN HỒI CHẬM")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ghi nhận độ trễ > 5.000ms trên 18 lượt gửi liên tiếp.")
    ).toBeInTheDocument();

    // Bấm nút đóng/ẩn cảnh báo sự cố
    const dismissBtn = screen.getByRole("button", { name: /Đã xử lý \/ Ẩn cảnh báo/i });
    await user.click(dismissBtn);

    await waitFor(() => {
      expect(mockDismissIncidentMutation).toHaveBeenCalled();
    });
  });

  it("Mở modal xem chi tiết trace kỹ thuật và tuân thủ cách ly dữ liệu hộ kinh doanh", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Bấm nút "Xem" ở dòng log đầu tiên
    const viewButtons = screen.getAllByRole("button", { name: /Xem/i });
    await user.click(viewButtons[0]);

    // Modal chi tiết hiển thị
    expect(screen.getByText("Chi Tiết Sự Kiện Kỹ Thuật Nền Tảng")).toBeInTheDocument();
    expect(
      screen.getByText("HTTP POST /tax/invoices/validate: Connection timed out sau 5000ms.")
    ).toBeInTheDocument();

    // Kiểm tra thông điệp cách ly dữ liệu VT-04
    expect(
      screen.getByText(/Tuân thủ giới hạn quyền Quản trị nền tảng/i)
    ).toBeInTheDocument();
  });
});
