import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { baseApi } from "@/stores/baseApi";
import { DashboardDemoContext } from "@/providers/DashboardDemoProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { BusinessDeadlinesPanel } from "@/modules/settings/components/BusinessDeadlinesPanel";
import { BusinessDeadlinesPage } from "@/modules/settings/pages/BusinessDeadlinesPage";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";
import { DEFAULT_BUSINESS_DEADLINES } from "@/modules/settings/types/IBusinessDeadlines";
import * as settingsApiModule from "@/modules/settings/services/settingsApi";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const mockShowWarning = vi.fn();
const mockShowInfo = vi.fn();

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: mockShowWarning,
    showInfo: mockShowInfo,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();

  vi.spyOn(settingsApiModule, "useUpdateHouseholdSettingsMutation").mockReturnValue([
    vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ code: 1000, message: "Cập nhật thành công", result: {} }),
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
  role: TDemoRole = USER_ROLES.OWNER
) => {
  const store = configureStore({
    reducer: {
      auth: (state = {
        user: {
          id: "1",
          username: "testowner",
          fullName: "Chủ hộ Nguyễn Văn A",
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

describe("Cấu hình các mốc thời hạn nghiệp vụ của hộ", () => {
  it("TC-01: Hiển thị đầy đủ các nhóm cấu hình mốc thời hạn nghiệp vụ và nhật ký kiểm toán, đã lược bỏ trường đồng bộ ngoại tuyến trùng lặp", () => {
    renderWithProviders(<BusinessDeadlinesPanel />, USER_ROLES.OWNER);

    // Header title (đã sạch mã NCL)
    expect(screen.getByText("Cấu hình mốc thời hạn nghiệp vụ của hộ")).toBeInTheDocument();
    expect(screen.queryByText(/NCL-09-CN-008/i)).not.toBeInTheDocument();

    // Section 1: Hóa đơn điện tử & gửi thuế
    expect(screen.getByText(/1\. Hóa đơn điện tử & Quy tắc gửi lại Cơ quan Thuế/i)).toBeInTheDocument();
    expect(screen.getByText(/Tự động thử lại khi gửi hóa đơn thất bại/i)).toBeInTheDocument();
    expect(screen.getByText(/Số lần tự động gửi lại tối đa:/i)).toBeInTheDocument();
    expect(screen.getByText(/Khoảng cách giữa các lần thử lại:/i)).toBeInTheDocument();
    expect(screen.getByText(/Thời hạn tối đa cho phép gửi lại hóa đơn lỗi:/i)).toBeInTheDocument();

    // Section 2: Bán hàng & Treo đơn (đã lược bỏ hạn đồng bộ ngoại tuyến trùng lặp)
    expect(screen.getByText(/2\. Mốc thời hạn Bán hàng & Treo đơn/i)).toBeInTheDocument();
    expect(screen.getByText(/Thời gian giữ đơn hàng treo tối đa:/i)).toBeInTheDocument();
    expect(screen.getByText(/Thời gian chờ chuyển khoản QR:/i)).toBeInTheDocument();
    expect(screen.queryByText(/Hạn đồng bộ đơn ngoại tuyến \(Offline\):/i)).not.toBeInTheDocument();

    // Section 3: Đổi trả hàng & Nhắc nhở Công nợ
    expect(screen.getByText(/3\. Mốc thời hạn Đổi trả hàng & Nhắc nhở Công nợ/i)).toBeInTheDocument();
    expect(screen.getByText(/Thời hạn cho phép đổi \/ trả hàng:/i)).toBeInTheDocument();
    expect(screen.getByText(/Số ngày gửi nhắc nhở công nợ trước hạn:/i)).toBeInTheDocument();

    // Section 4 (Ngưỡng kiểm soát chi phí & ca làm việc) đã được lược bỏ khỏi giao diện
    expect(screen.queryByText(/4\. Ngưỡng kiểm soát Chi phí & Chênh lệch tiền mặt ca làm việc/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hạn mức yêu cầu Chủ hộ phê duyệt chi phí:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ngưỡng cảnh báo chênh lệch tiền mặt kiểm kê ca:/i)).not.toBeInTheDocument();

    // Lịch sử thay đổi (Audit Log Table) hiển thị trong khung cuộn
    expect(screen.getByText(/Nhật ký thay đổi mốc thời hạn \(Lưu vết kiểm toán\)/i)).toBeInTheDocument();
    expect(screen.getByText("Hạn tối đa gửi lại hóa đơn lỗi")).toBeInTheDocument();
    expect(screen.getByText("Thời hạn đổi trả hàng")).toBeInTheDocument();

    const scrollContainer = screen.getByTestId("deadlines-audit-log-scroll");
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer.className).toContain("overflow-y-auto");
    expect(scrollContainer.className).toContain("max-h-[290px]");
  });

  it("TC-02: Kiểm tra chặn giá trị ngoài khoảng hợp lệ (Validation Bounds checking)", async () => {
    renderWithProviders(<BusinessDeadlinesPanel />, USER_ROLES.OWNER);

    const saveButton = screen.getByRole("button", { name: /Lưu cấu hình/i });
    await waitFor(() => expect(saveButton).not.toBeDisabled());

    // 1. Max retry attempts out of bounds (min 1, max 10)
    const retryAttemptsInput = screen.getByLabelText("Số lần tự động gửi lại tối đa");
    fireEvent.change(retryAttemptsInput, { target: { value: "15" } });

    // 2. Retry interval out of bounds (min 5, max 1440)
    const retryIntervalInput = screen.getByLabelText("Khoảng cách giữa các lần thử lại");
    fireEvent.change(retryIntervalInput, { target: { value: "2" } });

    // 3. Return policy days out of bounds (min 1, max 90)
    const returnPolicyInput = screen.getByLabelText("Thời hạn cho phép đổi / trả hàng");
    fireEvent.change(returnPolicyInput, { target: { value: "120" } });

    // Click Save
    fireEvent.click(saveButton);

    // Should display validation errors
    await waitFor(() => {
      expect(screen.getByText(/Số lần thử phải từ 1 đến 10 lần/i)).toBeInTheDocument();
      expect(screen.getByText(/Khoảng cách giữa các lần thử từ 5 đến 1440 phút/i)).toBeInTheDocument();
      expect(screen.getByText(/Thời hạn đổi trả hàng từ 1 đến 90 ngày/i)).toBeInTheDocument();
    });

    expect(mockShowError).toHaveBeenCalledWith(
      expect.stringContaining("Vui lòng kiểm tra lại các trường cấu hình thời hạn")
    );
  });

  it("TC-03: Hiển thị cảnh báo màu vàng khi các mốc thời hạn được nới lỏng quá ngưỡng khuyến nghị", async () => {
    renderWithProviders(<BusinessDeadlinesPanel />, USER_ROLES.OWNER);

    // Nới lỏng: maxRetryHoursDeadline > 24
    const deadlineInput = screen.getByLabelText("Thời hạn tối đa cho phép gửi lại hóa đơn lỗi");
    fireEvent.change(deadlineInput, { target: { value: "48" } });

    // Nới lỏng: returnPolicyDays > 30
    const returnPolicyInput = screen.getByLabelText("Thời hạn cho phép đổi / trả hàng");
    fireEvent.change(returnPolicyInput, { target: { value: "45" } });

    // Should display relaxed warning messages
    await waitFor(() => {
      expect(screen.getByText(/Lưu ý về mốc thời hạn nới lỏng:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Hạn tối đa gửi lại hóa đơn lỗi > 24 giờ có thể dẫn đến việc báo cáo hóa đơn chậm trễ/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Thời hạn đổi trả hàng > 30 ngày có thể gây khó khăn trong việc đối chiếu kỳ kế toán/i)
      ).toBeInTheDocument();
    });
  });

  it("TC-04: Tương tác bật/tắt các thiết lập chuyển mạch (Toggle Switches)", async () => {
    renderWithProviders(<BusinessDeadlinesPanel />, USER_ROLES.OWNER);

    // Toggle auto retry switch
    const autoRetryCheckbox = screen.getByLabelText("Bật tự động thử lại khi gửi hóa đơn thất bại");
    expect(autoRetryCheckbox).toBeChecked();

    const retryAttemptsInput = screen.getByLabelText("Số lần tự động gửi lại tối đa");
    expect(retryAttemptsInput).not.toBeDisabled();

    // Turn off auto retry -> should disable retry attempts and retry interval inputs
    fireEvent.click(autoRetryCheckbox);
    expect(autoRetryCheckbox).not.toBeChecked();
    expect(retryAttemptsInput).toBeDisabled();

    // Turn back on -> re-enables inputs
    fireEvent.click(autoRetryCheckbox);
    expect(autoRetryCheckbox).toBeChecked();
    expect(retryAttemptsInput).not.toBeDisabled();
  });

  it("TC-05: Phân quyền vai trò: Kế toán (VT-03) chỉ ở chế độ xem, các trường bị khóa và ẩn nút Lưu", () => {
    renderWithProviders(<BusinessDeadlinesPanel />, USER_ROLES.ACCOUNTANT);

    expect(screen.getByText(/Chế độ chỉ xem \(Dành cho Kế toán VT-03\)/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Lưu cấu hình/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Khôi phục mặc định/i })).not.toBeInTheDocument();

    // Inputs should be disabled
    const retryAttemptsInput = screen.getByLabelText("Số lần tự động gửi lại tối đa");
    expect(retryAttemptsInput).toBeDisabled();

    const returnPolicyInput = screen.getByLabelText("Thời hạn cho phép đổi / trả hàng");
    expect(returnPolicyInput).toBeDisabled();
  });

  it("TC-06: Luồng Lưu cấu hình hợp lệ thành công và ghi nhận dòng nhật ký kiểm toán mới", async () => {
    renderWithProviders(<BusinessDeadlinesPanel />, USER_ROLES.OWNER);

    const saveButton = screen.getByRole("button", { name: /Lưu cấu hình/i });
    await waitFor(() => expect(saveButton).not.toBeDisabled());

    // Modify a valid field (e.g. returnPolicyDays = 14)
    const returnPolicyInput = screen.getByLabelText("Thời hạn cho phép đổi / trả hàng");
    fireEvent.change(returnPolicyInput, { target: { value: "14" } });

    // Click Save
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        "Đã lưu và áp dụng thành công các mốc thời hạn nghiệp vụ của hộ!"
      );
    });

    // Verify localStorage has been updated
    const savedConfig = JSON.parse(localStorage.getItem("household_business_deadlines") || "{}");
    expect(savedConfig.returnPolicyDays).toBe(14);

    // Verify audit log has the new entry
    const savedLogs = JSON.parse(localStorage.getItem("bhv_deadlines_audit_logs") || "[]");
    expect(savedLogs.length).toBeGreaterThanOrEqual(4);
    expect(savedLogs[0].reason).toContain("Chủ hộ lưu cấu hình thời hạn mới");
  });

  it("TC-07: Khôi phục cấu hình về mặc định khuyến nghị có hộp thoại xác nhận", async () => {
    renderWithProviders(<BusinessDeadlinesPanel />, USER_ROLES.OWNER);

    // Change a field first
    const returnPolicyInput = screen.getByLabelText("Thời hạn cho phép đổi / trả hàng");
    fireEvent.change(returnPolicyInput, { target: { value: "21" } });

    const resetButton = screen.getByRole("button", { name: /Khôi phục mặc định/i });
    fireEvent.click(resetButton);

    // Confirmation modal opens
    expect(screen.getByText("Xác nhận khôi phục mặc định?")).toBeInTheDocument();
    expect(
      screen.getByText(/Hành động này sẽ thiết lập lại toàn bộ các mốc thời hạn/i)
    ).toBeInTheDocument();

    // Cancel first
    const cancelModalButton = screen.getByRole("button", { name: "Hủy bỏ" });
    fireEvent.click(cancelModalButton);
    expect(screen.queryByText("Xác nhận khôi phục mặc định?")).not.toBeInTheDocument();
    expect(returnPolicyInput).toHaveValue(21);

    // Open again and confirm
    fireEvent.click(resetButton);
    const confirmButton = screen.getByRole("button", { name: "Đồng ý khôi phục" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText("Xác nhận khôi phục mặc định?")).not.toBeInTheDocument();
      expect(mockShowWarning).toHaveBeenCalledWith(
        "Đã tải lại bộ thông số mặc định khuyến nghị. Nhấn 'Lưu cấu hình' để xác nhận áp dụng."
      );
    });

    expect(returnPolicyInput).toHaveValue(DEFAULT_BUSINESS_DEADLINES.returnPolicyDays);
  });

  it("TC-08: Tích hợp trang BusinessDeadlinesPage hiển thị trọn vẹn tiêu đề và panel nghiệp vụ", () => {
    renderWithProviders(<BusinessDeadlinesPage />, USER_ROLES.OWNER);

    // Page mounts BusinessDeadlinesPanel correctly
    expect(screen.getByText("Cấu hình mốc thời hạn nghiệp vụ của hộ")).toBeInTheDocument();
    expect(
      screen.getByText(/Quản lý các mốc thời hạn gửi lại hóa đơn, treo đơn và chính sách đổi trả/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lưu cấu hình/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Khôi phục mặc định/i })).toBeInTheDocument();
  });
});
