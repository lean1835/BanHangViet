import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import authReducer from "@/stores/authSlice";
import { UserProfilePanel } from "@/modules/settings/components/UserProfilePanel";
import { EditProfileModal } from "@/modules/settings/components/EditProfileModal";
import { ChangePasswordModal } from "@/modules/settings/components/ChangePasswordModal";
import { UpdatePhoneModal } from "@/modules/settings/components/UpdatePhoneModal";
import * as profileApiModule from "@/modules/settings/services/profileApi";

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

describe("NCL-01-CN-006: Đổi mật khẩu và cập nhật hồ sơ cá nhân", () => {
  const mockUpdateProfileMutation = vi.fn();
  const mockChangePasswordMutation = vi.fn();
  const mockSendOtpMutation = vi.fn();
  const mockVerifyOtpMutation = vi.fn();

  const mockUserProfile = {
    id: "usr-001",
    username: "chuho_viet",
    fullName: "Nguyễn Văn Việt",
    phoneNumber: "0912345678",
    email: "viet.nguyen@gmail.com",
    roleCode: "OWNER",
    roleName: "Chủ hộ kinh doanh",
    householdId: "hh-001",
    householdName: "Hộ Kinh Doanh Việt An",
    pointOfSaleId: "pos-001",
    pointOfSaleName: "Chi nhánh Quận 1",
    posCode: "POS-01",
    isActive: true,
    mustChangePassword: false,
    passwordChangedAt: "2026-03-01T10:00:00",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(profileApiModule, "useGetProfileQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Thành công",
        result: mockUserProfile,
      },
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(profileApiModule, "useUpdateProfileMutation").mockReturnValue([
      mockUpdateProfileMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(profileApiModule, "useChangePasswordMutation").mockReturnValue([
      mockChangePasswordMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(profileApiModule, "useSendUpdatePhoneOtpMutation").mockReturnValue([
      mockSendOtpMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(profileApiModule, "useVerifyAndUpdatePhoneMutation").mockReturnValue([
      mockVerifyOtpMutation,
      { isLoading: false } as any,
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createTestStore = (initialAuthState?: any) => {
    return configureStore({
      reducer: {
        auth: authReducer,
        [baseApi.reducerPath]: baseApi.reducer,
      },
      preloadedState: {
        auth: initialAuthState || {
          user: {
            id: mockUserProfile.id,
            username: mockUserProfile.username,
            fullName: mockUserProfile.fullName,
            phoneNumber: mockUserProfile.phoneNumber,
            email: mockUserProfile.email,
            roleId: mockUserProfile.roleCode,
            household: null,
          },
          token: "valid-initial-token",
          isAuthenticated: true,
        },
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }).concat(baseApi.middleware),
    });
  };

  const renderWithProviders = (ui: React.ReactElement, store = createTestStore()) => {
    return {
      store,
      ...render(
        <Provider store={store}>
          <MemoryRouter>{ui}</MemoryRouter>
        </Provider>
      ),
    };
  };

  describe("NCL-01-CN-006-CV-01/02: Hiển thị hồ sơ cá nhân (UserProfilePanel)", () => {
    it("renders user information correctly from backend profile query", () => {
      renderWithProviders(<UserProfilePanel />);

      expect(screen.getByText("Thông tin tài khoản")).toBeInTheDocument();
      expect(screen.getByText("Nguyễn Văn Việt")).toBeInTheDocument();
      expect(screen.getByText("@chuho_viet")).toBeInTheDocument();
      expect(screen.getByText("Chủ hộ kinh doanh")).toBeInTheDocument();
      expect(screen.getByText("Chi nhánh Quận 1")).toBeInTheDocument();
      expect(screen.getByText("viet.nguyen@gmail.com")).toBeInTheDocument();
      expect(screen.getByText("0912345678")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Đổi mật khẩu/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Đăng xuất tài khoản/i })).toBeInTheDocument();
    });

    it("opens EditProfileModal when clicking 'Sửa' on Full Name card", async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfilePanel />);

      const editBtn = screen.getByTitle("Chỉnh sửa họ tên");
      await user.click(editBtn);

      expect(screen.getByRole("heading", { name: "Chỉnh sửa họ tên" })).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Nhập họ và tên đầy đủ...")).toHaveValue("Nguyễn Văn Việt");
    });

    it("opens ChangePasswordModal when clicking 'Đổi mật khẩu' button", async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfilePanel />);

      const changePwBtn = screen.getByRole("button", { name: /Đổi mật khẩu/i });
      await user.click(changePwBtn);

      expect(screen.getByRole("heading", { name: "Đổi mật khẩu tài khoản" })).toBeInTheDocument();
    });

    it("opens UpdatePhoneModal when clicking 'Đổi số' on Phone card", async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfilePanel />);

      const updatePhoneBtn = screen.getByTitle("Cập nhật số điện thoại qua OTP");
      await user.click(updatePhoneBtn);

      expect(screen.getByRole("heading", { name: "Cập nhật số điện thoại" })).toBeInTheDocument();
    });
  });

  describe("Cập nhật họ tên (EditProfileModal)", () => {
    it("validates empty name input", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(<EditProfileModal isOpen={true} onClose={onClose} currentFullName="Nguyễn Văn Việt" />);

      const input = screen.getByPlaceholderText("Nhập họ và tên đầy đủ...");
      await user.clear(input);

      const saveBtn = screen.getByRole("button", { name: /Lưu thay đổi/i });
      await user.click(saveBtn);

      expect(screen.getByText("Họ tên không được để trống")).toBeInTheDocument();
      expect(mockUpdateProfileMutation).not.toHaveBeenCalled();
    });

    it("successfully submits updated full name and dispatches updateUser", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockUpdateProfileMutation.mockReturnValue({
        unwrap: vi.fn().mockResolvedValue({
          code: 1000,
          result: { ...mockUserProfile, fullName: "Nguyễn Văn Nam" },
        }),
      });

      const { store } = renderWithProviders(
        <EditProfileModal isOpen={true} onClose={onClose} currentFullName="Nguyễn Văn Việt" />
      );

      const input = screen.getByPlaceholderText("Nhập họ và tên đầy đủ...");
      await user.clear(input);
      await user.type(input, "Nguyễn Văn Nam");

      const saveBtn = screen.getByRole("button", { name: /Lưu thay đổi/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(mockUpdateProfileMutation).toHaveBeenCalledWith({ fullName: "Nguyễn Văn Nam" });
        expect(store.getState().auth.user?.fullName).toBe("Nguyễn Văn Nam");
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("NCL-01-CN-006-TC-01: Luồng đổi mật khẩu thành công", () => {
    it("validates and submits new password, receiving new token and updating state", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockChangePasswordMutation.mockReturnValue({
        unwrap: vi.fn().mockResolvedValue({
          code: 1000,
          message: "Đổi mật khẩu thành công. Các phiên làm việc khác đã được đăng xuất.",
          result: { token: "new-super-secure-token-12345" },
        }),
      });

      const { store } = renderWithProviders(
        <ChangePasswordModal isOpen={true} onClose={onClose} />
      );

      const currentPwInput = screen.getByPlaceholderText("Nhập mật khẩu hiện tại...");
      const newPwInput = screen.getByPlaceholderText("Nhập mật khẩu mới (tối thiểu 6 ký tự)...");
      const confirmPwInput = screen.getByPlaceholderText("Nhập lại mật khẩu mới...");

      await user.type(currentPwInput, "OldPassword123");
      await user.type(newPwInput, "NewPassword456");
      await user.type(confirmPwInput, "NewPassword456");

      const submitBtn = screen.getByRole("button", { name: /Xác nhận đổi mật khẩu/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockChangePasswordMutation).toHaveBeenCalledWith({
          currentPassword: "OldPassword123",
          newPassword: "NewPassword456",
          confirmPassword: "NewPassword456",
        });
        expect(store.getState().auth.token).toBe("new-super-secure-token-12345");
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("NCL-01-CN-006-TC-02: Dữ liệu đổi mật khẩu không hợp lệ", () => {
    it("shows validation error when new password is same as current password", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(<ChangePasswordModal isOpen={true} onClose={onClose} />);

      await user.type(screen.getByPlaceholderText("Nhập mật khẩu hiện tại..."), "SamePassword123");
      await user.type(screen.getByPlaceholderText("Nhập mật khẩu mới (tối thiểu 6 ký tự)..."), "SamePassword123");
      await user.type(screen.getByPlaceholderText("Nhập lại mật khẩu mới..."), "SamePassword123");

      await user.click(screen.getByRole("button", { name: /Xác nhận đổi mật khẩu/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Mật khẩu mới không được trùng với mật khẩu hiện tại")
        ).toBeInTheDocument();
      });
      expect(mockChangePasswordMutation).not.toHaveBeenCalled();
    });

    it("shows validation error when confirmation password does not match", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(<ChangePasswordModal isOpen={true} onClose={onClose} />);

      await user.type(screen.getByPlaceholderText("Nhập mật khẩu hiện tại..."), "OldPassword123");
      await user.type(screen.getByPlaceholderText("Nhập mật khẩu mới (tối thiểu 6 ký tự)..."), "NewPassword456");
      await user.type(screen.getByPlaceholderText("Nhập lại mật khẩu mới..."), "DifferentPassword789");

      await user.click(screen.getByRole("button", { name: /Xác nhận đổi mật khẩu/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Mật khẩu xác nhận không khớp với mật khẩu mới")
        ).toBeInTheDocument();
      });
      expect(mockChangePasswordMutation).not.toHaveBeenCalled();
    });

    it("shows validation error when new password is less than 6 characters", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(<ChangePasswordModal isOpen={true} onClose={onClose} />);

      await user.type(screen.getByPlaceholderText("Nhập mật khẩu hiện tại..."), "OldPassword123");
      await user.type(screen.getByPlaceholderText("Nhập mật khẩu mới (tối thiểu 6 ký tự)..."), "12345");
      await user.type(screen.getByPlaceholderText("Nhập lại mật khẩu mới..."), "12345");

      await user.click(screen.getByRole("button", { name: /Xác nhận đổi mật khẩu/i }));

      await waitFor(() => {
        expect(screen.getByText("Mật khẩu mới phải từ 6 đến 100 ký tự")).toBeInTheDocument();
      });
      expect(mockChangePasswordMutation).not.toHaveBeenCalled();
    });

    it("displays error when server rejects with WRONG_PASSWORD", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockChangePasswordMutation.mockReturnValue({
        unwrap: vi.fn().mockRejectedValue({
          data: {
            code: 2007,
            message: "Mật khẩu không chính xác",
          },
        }),
      });

      renderWithProviders(<ChangePasswordModal isOpen={true} onClose={onClose} />);

      await user.type(screen.getByPlaceholderText("Nhập mật khẩu hiện tại..."), "WrongPassword123");
      await user.type(screen.getByPlaceholderText("Nhập mật khẩu mới (tối thiểu 6 ký tự)..."), "NewValidPassword456");
      await user.type(screen.getByPlaceholderText("Nhập lại mật khẩu mới..."), "NewValidPassword456");

      await user.click(screen.getByRole("button", { name: /Xác nhận đổi mật khẩu/i }));

      await waitFor(() => {
        expect(screen.getByText("Mật khẩu hiện tại không chính xác")).toBeInTheDocument();
      });
    });
  });

  describe("NCL-01-CN-006-TC-03: Cập nhật SĐT qua mã OTP 2 bước", () => {
    it("validates new phone number format and checks against current phone", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(
        <UpdatePhoneModal isOpen={true} onClose={onClose} currentPhoneNumber="0912345678" />
      );

      const phoneInput = screen.getByPlaceholderText("Ví dụ: 0912345678");

      // Test invalid format
      await user.type(phoneInput, "12345");
      await user.click(screen.getByRole("button", { name: /Gửi mã OTP/i }));
      await waitFor(() => {
        expect(
          screen.getByText("Số điện thoại không đúng định dạng (10 số, bắt đầu bằng 03, 05, 07, 08, 09)")
        ).toBeInTheDocument();
      });

      // Test same phone number as current
      await user.clear(phoneInput);
      await user.type(phoneInput, "0912345678");
      await user.click(screen.getByRole("button", { name: /Gửi mã OTP/i }));
      await waitFor(() => {
        expect(
          screen.getByText("Số điện thoại mới trùng với số điện thoại hiện tại")
        ).toBeInTheDocument();
      });

      expect(mockSendOtpMutation).not.toHaveBeenCalled();
    });

    it("completes full 2-step OTP flow: send OTP -> verify OTP -> update phone", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      mockSendOtpMutation.mockReturnValue({
        unwrap: vi.fn().mockResolvedValue({
          code: 1000,
          message: "Mã OTP đã được gửi đến số điện thoại mới",
          result: {
            phoneNumber: "0987654321",
            expiresInSeconds: 300,
            message: "Mã OTP đã được gửi đến số điện thoại mới",
          },
        }),
      });

      mockVerifyOtpMutation.mockReturnValue({
        unwrap: vi.fn().mockResolvedValue({
          code: 1000,
          result: {
            ...mockUserProfile,
            phoneNumber: "0987654321",
          },
        }),
      });

      const { store } = renderWithProviders(
        <UpdatePhoneModal isOpen={true} onClose={onClose} currentPhoneNumber="0912345678" />
      );

      // Step 1: Input new phone and submit
      const phoneInput = screen.getByPlaceholderText("Ví dụ: 0912345678");
      await user.type(phoneInput, "0987654321");
      await user.click(screen.getByRole("button", { name: /Gửi mã OTP/i }));

      await waitFor(() => {
        expect(mockSendOtpMutation).toHaveBeenCalledWith({ newPhoneNumber: "0987654321" });
        expect(screen.getByText("Xác thực mã OTP")).toBeInTheDocument();
        expect(screen.getByText("0987654321")).toBeInTheDocument();
      });

      // Step 2: Input 6-digit OTP and submit
      const otpInput = screen.getByPlaceholderText("------");
      await user.type(otpInput, "654321");
      await user.click(screen.getByRole("button", { name: /Xác thực & Lưu/i }));

      await waitFor(() => {
        expect(mockVerifyOtpMutation).toHaveBeenCalledWith({
          newPhoneNumber: "0987654321",
          otpCode: "654321",
        });
        expect(store.getState().auth.user?.phoneNumber).toBe("0987654321");
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});
