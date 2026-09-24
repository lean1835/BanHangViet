import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { baseApi } from "@/stores/baseApi";
import { DashboardDemoContext } from "@/providers/DashboardDemoProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { FirstTimeSetupWizardModal } from "@/modules/settings/components/FirstTimeSetupWizardModal";
import { SetupGuideBanner } from "@/modules/dashboard/components/SetupGuideBanner";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";
import * as settingsApiModule from "@/modules/settings/services/settingsApi";
import * as productApiModule from "@/modules/product/services/productApi";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();

  vi.spyOn(settingsApiModule, "useGetOnboardingStatusQuery").mockReturnValue({
    data: undefined,
    isLoading: false,
  } as any);

  vi.spyOn(settingsApiModule, "useSkipOnboardingMutation").mockReturnValue([
    vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ code: 1000, message: "OK", result: {} }),
    }),
    { isLoading: false } as any,
  ]);

  vi.spyOn(settingsApiModule, "useGetMyHouseholdQuery").mockReturnValue({
    data: undefined,
    isLoading: false,
  } as any);

  vi.spyOn(productApiModule, "useGetProductsQuery").mockReturnValue({
    data: undefined,
    isLoading: false,
  } as any);

  vi.spyOn(settingsApiModule, "useCompleteOnboardingMutation").mockReturnValue([
    vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ code: 1000, message: "OK", result: {} }),
    }),
    { isLoading: false } as any,
  ]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

const renderWithProviders = (
  ui: React.ReactElement,
  role: TDemoRole = USER_ROLES.OWNER,
  userId = "1",
  username = "new_owner"
) => {
  const store = configureStore({
    reducer: {
      auth: (state = {
        user: {
          id: userId,
          username,
          fullName: "Chủ hộ Mới",
          roleId: role,
          household: null,
        },
        token: "fake-token",
        isAuthenticated: true,
      }) => state,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(baseApi.middleware),
  });

  const mockContextValue: any = {
    currentRole: role,
    setCurrentRole: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
    simConflict: false,
    setSimConflict: vi.fn(),
    invoices: [],
    setInvoices: vi.fn(),
    customers: [],
    logs: [],
    addActivityLog: vi.fn(),
    refetchOrders: vi.fn(),
  };

  return render(
    <Provider store={store}>
      <DashboardDemoContext.Provider value={mockContextValue}>
        <NotificationProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </NotificationProvider>
      </DashboardDemoContext.Provider>
    </Provider>
  );
};

describe("NCL-09-CN-007: Trình hướng dẫn thiết lập lần đầu", () => {
  it("TC-01: Hiển thị đầy đủ 5 bước cấu hình cơ bản kèm huy hiệu Bắt buộc / Tùy chọn", () => {
    renderWithProviders(
      <FirstTimeSetupWizardModal isOpen={true} onClose={vi.fn()} />,
      USER_ROLES.OWNER
    );

    // Title and subtitle
    expect(screen.getByText("Trình hướng dẫn thiết lập cửa hàng")).toBeInTheDocument();
    expect(screen.getByText(/Hoàn thành 4 bước cấu hình bắt buộc/i)).toBeInTheDocument();

    // 5 steps
    expect(screen.getByText(/Bước 1: Hoàn thiện thông tin hộ kinh doanh/i)).toBeInTheDocument();
    expect(screen.getByText(/Bước 2: Khai báo ký hiệu & mẫu số hóa đơn/i)).toBeInTheDocument();
    expect(screen.getByText(/Bước 3: Chọn mức thuế suất áp dụng/i)).toBeInTheDocument();
    expect(screen.getByText(/Bước 4: Thêm ít nhất một mặt hàng vào danh mục/i)).toBeInTheDocument();
    expect(screen.getByText(/Bước 5: Tạo tài khoản nhân viên bán hàng/i)).toBeInTheDocument();

    // Required and Optional badges
    const requiredBadges = screen.getAllByText(/BẮT BUỘC|ĐÃ XONG/i);
    expect(requiredBadges.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText("TÙY CHỌN")).toBeInTheDocument();
  });

  it("TC-02: Tính toán chính xác thanh tiến độ (Progress Bar) theo tỷ lệ phần trăm", () => {
    // Override 2 required steps completed -> 2/4 = 50%
    localStorage.setItem(
      "bhv_setup_guide_mock_overrides",
      JSON.stringify({
        HOUSEHOLD_INFO: true,
        INVOICE_TEMPLATE: true,
      })
    );

    renderWithProviders(
      <FirstTimeSetupWizardModal isOpen={true} onClose={vi.fn()} />,
      USER_ROLES.OWNER
    );

    expect(screen.getByText(/Tiến độ: 2\/4 bước bắt buộc/i)).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("TC-03: Tự động phát hiện trạng thái hoàn thành các bước từ dữ liệu API hệ thống", async () => {
    // Mock API queries to simulate existing household & product data
    vi.spyOn(settingsApiModule, "useGetMyHouseholdQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "OK",
        result: {
          name: "Hộ Kinh Doanh Việt An",
          taxCode: "0102030405",
          address: "123 Cầu Giấy, Hà Nội",
          phoneNumber: "0912345678",
        },
      },
      isLoading: false,
    } as any);

    vi.spyOn(productApiModule, "useGetProductsQuery").mockReturnValue({
      data: {
        content: [{ id: "prod-01", name: "Cà phê sữa" }],
        totalElements: 1,
      },
      isLoading: false,
    } as any);

    renderWithProviders(
      <FirstTimeSetupWizardModal isOpen={true} onClose={vi.fn()} />,
      USER_ROLES.OWNER
    );

    await waitFor(() => {
      // Step 1 & Step 4 should have completed badges "ĐÃ XONG"
      const completedBadges = screen.getAllByText("ĐÃ XONG");
      expect(completedBadges.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("TC-04: Bấm nút 'Thực hiện ngay' trên từng bước điều hướng chính xác đến trang cấu hình tương ứng", () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <FirstTimeSetupWizardModal isOpen={true} onClose={handleClose} />,
      USER_ROLES.OWNER
    );

    // Find action button for Step 3 (Chọn thuế suất)
    const step3Button = screen.getByRole("button", { name: /Chọn thuế suất/i });
    fireEvent.click(step3Button);

    expect(handleClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/settings/tax-rates");
  });

  it("TC-05: Bấm 'Bỏ qua để vào bán ngay' hoặc nút Đóng đóng modal và lưu trạng thái bỏ qua", () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <FirstTimeSetupWizardModal isOpen={true} onClose={handleClose} />,
      USER_ROLES.OWNER
    );

    const skipButton = screen.getByRole("button", { name: /Bỏ qua để vào bán ngay/i });
    fireEvent.click(skipButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("bhv_setup_guide_dismissed")).toBe("true");
  });

  it("TC-06: SetupGuideBanner hiển thị trên Dashboard kèm số bước còn thiếu và mở modal khi bấm Tiếp tục", () => {
    // Giả lập trạng thái đã bỏ qua auto-open để kiểm tra thanh banner tĩnh
    localStorage.setItem("bhv_setup_guide_dismissed", "true");

    renderWithProviders(<SetupGuideBanner />, USER_ROLES.OWNER);

    // Should display banner
    expect(screen.getByText("Trình hướng dẫn thiết lập cửa hàng")).toBeInTheDocument();
    expect(screen.getByText(/Còn thiếu \d+ bước bắt buộc/i)).toBeInTheDocument();

    const continueButton = screen.getByRole("button", { name: /Tiếp tục thiết lập/i });
    expect(continueButton).toBeInTheDocument();

    // Click continue opens modal
    fireEvent.click(continueButton);
    expect(screen.getByText(/Hoàn thành 4 bước cấu hình bắt buộc/i)).toBeInTheDocument();
  });

  it("TC-09 (AC NCL-09-CN-007-TC-01): Tự động hiển thị modal hướng dẫn khi Chủ hộ mới đăng nhập lần đầu", async () => {
    // Chưa từng bỏ qua (chưa có bhv_setup_guide_dismissed) và chưa sẵn sàng xuất hóa đơn
    renderWithProviders(<SetupGuideBanner />, USER_ROLES.OWNER);

    // Modal tự động hiển thị với tiêu đề và các bước cấu hình bắt buộc
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Lần đầu đăng nhập")).toBeInTheDocument();
      expect(screen.getByText(/Hoàn thành 4 bước cấu hình bắt buộc/i)).toBeInTheDocument();
    });
  });

  it("TC-10 (AC NCL-09-CN-007-TC-03): Chủ hộ bấm bỏ qua để vào bán ngay, Dashboard vẫn giữ thanh nhắc kèm số bước còn thiếu", async () => {
    renderWithProviders(<SetupGuideBanner />, USER_ROLES.OWNER);

    // Modal tự động mở lần đầu
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Bấm 'Bỏ qua để vào bán ngay'
    const skipButton = screen.getByRole("button", { name: /Bỏ qua để vào bán ngay/i });
    fireEvent.click(skipButton);

    // Modal đóng lại
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Thanh banner VẪN HIỂN THỊ trên Dashboard kèm số bước còn thiếu
    expect(screen.getByText("Trình hướng dẫn thiết lập cửa hàng")).toBeInTheDocument();
    expect(screen.getByText(/Còn thiếu \d+ bước bắt buộc/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tiếp tục thiết lập/i })).toBeInTheDocument();
  });

  it("TC-07: Hoàn thành 4 bước bắt buộc hiển thị thông điệp chúc mừng và nút vào quầy POS", async () => {
    // Set all 4 required steps to completed via mock storage
    localStorage.setItem(
      "bhv_setup_guide_mock_overrides",
      JSON.stringify({
        HOUSEHOLD_INFO: true,
        INVOICE_TEMPLATE: true,
        TAX_RATE: true,
        INITIAL_PRODUCT: true,
      })
    );

    renderWithProviders(
      <FirstTimeSetupWizardModal isOpen={true} onClose={vi.fn()} />,
      USER_ROLES.OWNER
    );

    await waitFor(() => {
      expect(
        screen.getByText(/🎉 Chúc mừng! Cửa hàng đã sẵn sàng phát hành hóa đơn!/i)
      ).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();

      const posButton = screen.getByRole("button", { name: /Vào quầy bán hàng \(POS\) ngay/i });
      expect(posButton).toBeInTheDocument();

      fireEvent.click(posButton);
      expect(mockNavigate).toHaveBeenCalledWith("/pos");
    });
  });

  it("TC-08: SetupGuideBanner sau khi hoàn thành các bước bắt buộc sẽ tự động ẩn hoàn toàn khỏi Dashboard", async () => {
    localStorage.setItem(
      "bhv_setup_guide_mock_overrides",
      JSON.stringify({
        HOUSEHOLD_INFO: true,
        INVOICE_TEMPLATE: true,
        TAX_RATE: true,
        INITIAL_PRODUCT: true,
      })
    );

    const { container } = renderWithProviders(<SetupGuideBanner />, USER_ROLES.OWNER);

    await waitFor(() => {
      expect(screen.queryByText(/Trình hướng dẫn thiết lập cửa hàng/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Cửa hàng đã sẵn sàng xuất hóa đơn điện tử/i)).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });
  });

  it("TC-11: Bỏ qua từng bước (skip individual step) và khôi phục bước", async () => {
    renderWithProviders(
      <FirstTimeSetupWizardModal isOpen={true} onClose={vi.fn()} />,
      USER_ROLES.OWNER,
      "user_tc11"
    );

    // Initial check: all 4 required steps are incomplete
    expect(screen.getByText(/Tiến độ: 0\/4 bước bắt buộc/i)).toBeInTheDocument();

    // Click "Bỏ qua bước này" on the first step
    const skipStepButtons = screen.getAllByRole("button", { name: /Bỏ qua bước này/i });
    expect(skipStepButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(skipStepButtons[0]);

    // Step should now have badge "ĐÃ BỎ QUA"
    await waitFor(() => {
      expect(screen.getByText("ĐÃ BỎ QUA")).toBeInTheDocument();
      expect(screen.getByText(/Tiến độ: 1\/4 bước bắt buộc/i)).toBeInTheDocument();
    });

    // An "Khôi phục bước" button should appear for the skipped step
    const unskipButton = screen.getByRole("button", { name: /Khôi phục bước/i });
    expect(unskipButton).toBeInTheDocument();

    // Click "Khôi phục bước"
    fireEvent.click(unskipButton);

    await waitFor(() => {
      expect(screen.queryByText("ĐÃ BỎ QUA")).not.toBeInTheDocument();
      expect(screen.getByText(/Tiến độ: 0\/4 bước bắt buộc/i)).toBeInTheDocument();
    });
  });

  it("TC-12: Bỏ qua tất cả trên thanh banner làm biến mất hoàn toàn hướng dẫn cho tài khoản đó", async () => {
    // Tài khoản 1 bấm nút "Bỏ qua hướng dẫn" trực tiếp trên Banner
    const { container } = renderWithProviders(<SetupGuideBanner />, USER_ROLES.OWNER, "user_tc12");

    // Banner hiển thị và có nút Bỏ qua hướng dẫn
    const skipAllButton = screen.getByRole("button", { name: /Bỏ qua hướng dẫn/i });
    expect(skipAllButton).toBeInTheDocument();
    fireEvent.click(skipAllButton);

    // Banner biến mất hoàn toàn khỏi Dashboard
    await waitFor(() => {
      expect(screen.queryByText(/Trình hướng dẫn thiết lập cửa hàng/i)).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });
  });

  it("TC-13: Trạng thái bỏ qua được lưu theo tài khoản - tài khoản mới tạo vẫn hiển thị hướng dẫn", async () => {
    // 1. Tài khoản A bỏ qua toàn bộ hướng dẫn
    const { unmount } = renderWithProviders(<SetupGuideBanner />, USER_ROLES.OWNER, "user_A");
    const skipAllBtn = screen.getByRole("button", { name: /Bỏ qua hướng dẫn/i });
    fireEvent.click(skipAllBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Trình hướng dẫn thiết lập cửa hàng/i)).not.toBeInTheDocument();
    });
    unmount();

    // 2. Tài khoản B (mới tạo) đăng nhập -> vẫn hiển thị banner và modal đầy đủ
    renderWithProviders(<SetupGuideBanner />, USER_ROLES.OWNER, "user_B");

    await waitFor(() => {
      expect(screen.getAllByText("Trình hướng dẫn thiết lập cửa hàng").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("TC-14: Đóng modal bằng nút Đóng không tự động bật lại khi chuyển trang hay mount lại Dashboard", async () => {
    // Lần đầu mount: modal tự động bật
    const { unmount } = renderWithProviders(<SetupGuideBanner />, USER_ROLES.OWNER, "user_tc14");

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Bấm nút Đóng
    const closeBtn = screen.getByRole("button", { name: /Đóng/i });
    fireEvent.click(closeBtn);

    // Modal đóng lại
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Giả lập người dùng chuyển sang trang khác (unmount banner) rồi quay lại Dashboard (mount lại banner)
    unmount();
    renderWithProviders(<SetupGuideBanner />, USER_ROLES.OWNER, "user_tc14");

    // Banner vẫn có, nhưng MODAL KHÔNG ĐƯỢC TỰ ĐỘNG MỞ LẠI
    expect(screen.getByText("Trình hướng dẫn thiết lập cửa hàng")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

