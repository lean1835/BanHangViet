import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { ForgotPasswordForm } from "@/modules/auth/components/ForgotPasswordForm";
import * as authApiModule from "@/modules/auth/services/authApi";

describe("NCL-01-CN-005: Đặt lại mật khẩu khi quên qua Gmail (ForgotPasswordForm)", () => {
  const mockForgotPasswordMutation = vi.fn();
  const mockResetPasswordMutation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(authApiModule, "useForgotPasswordMutation").mockReturnValue([
      mockForgotPasswordMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(authApiModule, "useResetPasswordMutation").mockReturnValue([
      mockResetPasswordMutation,
      { isLoading: false } as any,
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    const store = configureStore({
      reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }).concat(baseApi.middleware),
    });

    return render(
      <Provider store={store}>
        <MemoryRouter>
          <ForgotPasswordForm />
        </MemoryRouter>
      </Provider>
    );
  };

  describe("NCL-01-CN-005-CV-02: Thiết kế giao diện & Bước 1 (Nhập địa chỉ Gmail)", () => {
    it("renders Step 1 with Gmail input, submit button, and back-to-login link", () => {
      renderComponent();

      expect(screen.getByRole("heading", { name: "Đặt lại mật khẩu" })).toBeInTheDocument();
      expect(
        screen.getByText("Nhập địa chỉ Gmail đã đăng ký để nhận mã xác thực OTP")
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Ví dụ: taikhoan@gmail.com")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Gửi mã xác thực về Gmail" })
      ).toBeInTheDocument();
      expect(screen.getByText("Quay lại đăng nhập")).toBeInTheDocument();
    });

    it("validates invalid Gmail format", async () => {
      renderComponent();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText("Ví dụ: taikhoan@gmail.com");
      await user.type(emailInput, "invalid-email@yahoo.com");

      const submitBtn = screen.getByRole("button", { name: "Gửi mã xác thực về Gmail" });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Địa chỉ Gmail không đúng định dạng (ví dụ: user@gmail.com)!")
        ).toBeInTheDocument();
      });
      expect(mockForgotPasswordMutation).not.toHaveBeenCalled();
    });
  });

  describe("NCL-01-CN-005-TC-03: Tài khoản bị khóa (Không có quyền)", () => {
    it("displays error message when account is blocked and directs to contact store owner", async () => {
      mockForgotPasswordMutation.mockReturnValue({
        unwrap: vi.fn().mockRejectedValue({
          data: {
            code: 2008,
            message: "Tài khoản đã bị khóa. Vui lòng liên hệ chủ hộ kinh doanh để được hỗ trợ",
          },
        }),
      });

      renderComponent();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText("Ví dụ: taikhoan@gmail.com");
      await user.type(emailInput, "blocked@gmail.com");

      const submitBtn = screen.getByRole("button", { name: "Gửi mã xác thực về Gmail" });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Tài khoản đã bị khóa. Vui lòng liên hệ chủ hộ kinh doanh để được hỗ trợ"
          )
        ).toBeInTheDocument();
      });

      // Still in Step 1
      expect(
        screen.getByRole("button", { name: "Gửi mã xác thực về Gmail" })
      ).toBeInTheDocument();
    });
  });

  describe("NCL-01-CN-005-TC-01: Luồng thành công qua Gmail", () => {
    it("transitions from Step 1 to Step 2, validates matching passwords, resets password, and displays success step", async () => {
      mockForgotPasswordMutation.mockReturnValue({
        unwrap: vi.fn().mockResolvedValue({
          email: "test@gmail.com",
          expiresInSeconds: 300,
          message: "Mã xác thực đã được gửi tới Gmail của bạn.",
        }),
      });

      mockResetPasswordMutation.mockReturnValue({
        unwrap: vi.fn().mockResolvedValue({
          message: "Đặt lại mật khẩu thành công.",
        }),
      });

      renderComponent();
      const user = userEvent.setup();

      // 1. Submit valid Gmail
      const emailInput = screen.getByPlaceholderText("Ví dụ: taikhoan@gmail.com");
      await user.type(emailInput, "test@gmail.com");
      await user.click(screen.getByRole("button", { name: "Gửi mã xác thực về Gmail" }));

      // 2. Transition to Step 2
      await waitFor(() => {
        expect(screen.getByText("test@gmail.com")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("123456")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Tối thiểu 6 ký tự")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Nhập lại mật khẩu mới")).toBeInTheDocument();
      });

      // 3. Fill in OTP and passwords
      const otpInput = screen.getByPlaceholderText("123456");
      const newPasswordInput = screen.getByPlaceholderText("Tối thiểu 6 ký tự");
      const confirmPasswordInput = screen.getByPlaceholderText("Nhập lại mật khẩu mới");

      await user.type(otpInput, "654321");
      await user.type(newPasswordInput, "newPassword123");
      await user.type(confirmPasswordInput, "newPassword123");

      // 4. Submit reset
      const resetBtn = screen.getByRole("button", { name: "Xác nhận đổi mật khẩu" });
      await user.click(resetBtn);

      // 5. Verify resetPassword API called with correct payload
      await waitFor(() => {
        expect(mockResetPasswordMutation).toHaveBeenCalledWith({
          email: "test@gmail.com",
          otpCode: "654321",
          newPassword: "newPassword123",
          confirmPassword: "newPassword123",
        });
      });

      // 6. Transition to Step 3 (Success)
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Đổi mật khẩu thành công!" })
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            /Tất cả các phiên đăng nhập cũ đã được kết thúc an toàn/
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe("NCL-01-CN-005-TC-02: Quá hạn hoặc sai mã xác thực", () => {
    it("displays error when OTP is expired or invalid in Step 2", async () => {
      mockForgotPasswordMutation.mockReturnValue({
        unwrap: vi.fn().mockResolvedValue({
          email: "test@gmail.com",
          expiresInSeconds: 300,
          message: "Mã xác thực đã được gửi tới Gmail của bạn.",
        }),
      });

      mockResetPasswordMutation.mockReturnValue({
        unwrap: vi.fn().mockRejectedValue({
          data: {
            code: 2036,
            message: "Mã xác thực đã hết hiệu lực. Vui lòng yêu cầu gửi lại mã mới",
          },
        }),
      });

      renderComponent();
      const user = userEvent.setup();

      // Go to Step 2
      await user.type(screen.getByPlaceholderText("Ví dụ: taikhoan@gmail.com"), "test@gmail.com");
      await user.click(screen.getByRole("button", { name: "Gửi mã xác thực về Gmail" }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("123456")).toBeInTheDocument();
      });

      // Fill form with expired OTP
      await user.type(screen.getByPlaceholderText("123456"), "111111");
      await user.type(screen.getByPlaceholderText("Tối thiểu 6 ký tự"), "newPass123");
      await user.type(screen.getByPlaceholderText("Nhập lại mật khẩu mới"), "newPass123");

      await user.click(screen.getByRole("button", { name: "Xác nhận đổi mật khẩu" }));

      await waitFor(() => {
        expect(
          screen.getByText(
            "Mã xác thực đã hết hiệu lực. Vui lòng yêu cầu gửi lại mã mới"
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe("Ràng buộc mật khẩu và xác nhận mật khẩu (Client Validation)", () => {
    it("shows error when new password and confirm password do not match", async () => {
      mockForgotPasswordMutation.mockReturnValue({
        unwrap: vi.fn().mockResolvedValue({
          email: "test@gmail.com",
          expiresInSeconds: 300,
          message: "Mã xác thực đã được gửi tới Gmail của bạn.",
        }),
      });

      renderComponent();
      const user = userEvent.setup();

      // Go to Step 2
      await user.type(screen.getByPlaceholderText("Ví dụ: taikhoan@gmail.com"), "test@gmail.com");
      await user.click(screen.getByRole("button", { name: "Gửi mã xác thực về Gmail" }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("123456")).toBeInTheDocument();
      });

      // Fill mismatched passwords
      await user.type(screen.getByPlaceholderText("123456"), "123456");
      await user.type(screen.getByPlaceholderText("Tối thiểu 6 ký tự"), "password123");
      await user.type(screen.getByPlaceholderText("Nhập lại mật khẩu mới"), "mismatched123");

      await user.click(screen.getByRole("button", { name: "Xác nhận đổi mật khẩu" }));

      await waitFor(() => {
        expect(
          screen.getByText("Mật khẩu xác nhận không khớp với mật khẩu mới!")
        ).toBeInTheDocument();
      });
      expect(mockResetPasswordMutation).not.toHaveBeenCalled();
    });

    it("allows user to change email by clicking 'Đổi Gmail khác'", async () => {
      mockForgotPasswordMutation.mockReturnValue({
        unwrap: vi.fn().mockResolvedValue({
          email: "test@gmail.com",
          expiresInSeconds: 300,
          message: "Mã xác thực đã được gửi tới Gmail của bạn.",
        }),
      });

      renderComponent();
      const user = userEvent.setup();

      // Go to Step 2
      await user.type(screen.getByPlaceholderText("Ví dụ: taikhoan@gmail.com"), "test@gmail.com");
      await user.click(screen.getByRole("button", { name: "Gửi mã xác thực về Gmail" }));

      await waitFor(() => {
        expect(screen.getByText("Đổi Gmail khác")).toBeInTheDocument();
      });

      // Click "Đổi Gmail khác"
      await user.click(screen.getByText("Đổi Gmail khác"));

      // Returns to Step 1
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Gửi mã xác thực về Gmail" })
        ).toBeInTheDocument();
      });
    });
  });
});

