import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import authReducer from "@/stores/authSlice";
import { UserSessionPanel } from "@/modules/settings/components/UserSessionPanel";
import { SessionTimeoutSettingsCard } from "@/modules/settings/components/SessionTimeoutSettingsCard";
import * as sessionApiModule from "@/modules/settings/services/sessionApi";
import type { IUserSession } from "@/modules/settings/types/IUserSession";

describe("NCL-01-CN-007: Quản lý phiên đăng nhập và đăng xuất từ xa", () => {
  const mockRevokeSessionMutation = vi.fn();
  const mockRevokeAllSessionsMutation = vi.fn();
  const mockUpdateSettingsMutation = vi.fn();

  const mockSessions: IUserSession[] = [
    {
      id: "sess-01",
      userId: "usr-01",
      username: "chuho_viet",
      fullName: "Nguyễn Văn Việt",
      roleCode: "VT-01",
      roleName: "Chủ hộ kinh doanh",
      deviceType: "DESKTOP",
      deviceName: "Microsoft Edge trên Windows",
      ipAddress: "192.168.1.10",
      loginAt: "2026-03-07T08:00:00",
      lastActiveAt: "2026-03-07T10:30:00",
      expiresAt: "2026-03-08T08:00:00",
      isRevoked: false,
      isCurrentSession: true,
    },
    {
      id: "sess-02",
      userId: "usr-02",
      username: "nhanvien_viet",
      fullName: "Trần Thị Bích",
      roleCode: "VT-02",
      roleName: "Nhân viên bán hàng",
      deviceType: "MOBILE",
      deviceName: "Safari trên iPhone",
      ipAddress: "192.168.1.25",
      loginAt: "2026-03-07T09:15:00",
      lastActiveAt: "2026-03-07T10:25:00",
      expiresAt: "2026-03-08T09:15:00",
      isRevoked: false,
      isCurrentSession: false,
    },
    {
      id: "sess-03",
      userId: "usr-01",
      username: "chuho_viet",
      fullName: "Nguyễn Văn Việt",
      roleCode: "VT-01",
      roleName: "Chủ hộ kinh doanh",
      deviceType: "TABLET",
      deviceName: "Chrome trên iPad",
      ipAddress: "192.168.1.50",
      loginAt: "2026-03-06T14:00:00",
      lastActiveAt: "2026-03-06T18:00:00",
      expiresAt: "2026-03-07T14:00:00",
      isRevoked: false,
      isCurrentSession: false,
    },
  ];

  const createTestStore = (roleCode = "VT-01", userId = "usr-01") => {
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
            id: userId,
            username: roleCode === "VT-01" ? "chuho_viet" : "nhanvien_viet",
            fullName: roleCode === "VT-01" ? "Nguyễn Văn Việt" : "Trần Thị Bích",
            roleId: roleCode,
          },
          token: "fake-jwt-token",
          isAuthenticated: true,
        },
      } as any,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(sessionApiModule, "useGetSessionsQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Thành công",
        result: mockSessions,
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(sessionApiModule, "useRevokeSessionMutation").mockReturnValue([
      mockRevokeSessionMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(sessionApiModule, "useRevokeAllSessionsForUserMutation").mockReturnValue([
      mockRevokeAllSessionsMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(sessionApiModule, "useGetSessionSettingsQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Thành công",
        result: {
          householdId: "hh-01",
          sessionTimeoutMinutes: 60,
        },
      },
      isLoading: false,
      isFetching: false,
    } as any);

    vi.spyOn(sessionApiModule, "useUpdateSessionSettingsMutation").mockReturnValue([
      mockUpdateSettingsMutation,
      { isLoading: false } as any,
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (store = createTestStore()) => {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <UserSessionPanel />
        </MemoryRouter>
      </Provider>
    );
  };

  it("NCL-01-CN-007-CV-02: renders session list, statistics cards, and identifies current session", () => {
    renderComponent();

    // Verify Title & Subtasks
    expect(
      screen.getByText("Quản lý phiên đăng nhập & Đăng xuất từ xa")
    ).toBeInTheDocument();

    // Verify KPI Statistics
    expect(screen.getByText("Tổng phiên hoạt động")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // total = 3
    expect(screen.getByText("Máy tính / Laptop")).toBeInTheDocument();
    expect(screen.getByText("Di động / Tablet")).toBeInTheDocument();

    // Verify Session Rows
    expect(screen.getAllByText("Nguyễn Văn Việt").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Trần Thị Bích")).toBeInTheDocument();
    expect(screen.getByText("192.168.1.10")).toBeInTheDocument();
    expect(screen.getByText("192.168.1.25")).toBeInTheDocument();

    // Verify Current Session badge
    expect(screen.getByText("Phiên hiện tại")).toBeInTheDocument();
    expect(screen.getByText("(Thiết bị này)")).toBeInTheDocument();
  });

  it("NCL-01-CN-007-TC-01: Owner revokes a single remote session with a reason", async () => {
    const user = userEvent.setup();
    mockRevokeSessionMutation.mockReturnValue({
      unwrap: () => Promise.resolve({ code: 1000, message: "Đăng xuất thành công" }),
    });

    renderComponent();

    // Click "Đăng xuất" on the second session (nhanvien_viet on mobile)
    const revokeButtons = screen.getAllByRole("button", { name: /Đăng xuất/i });
    const singleRevokeBtn = revokeButtons.find((btn) => btn.textContent?.trim() === "Đăng xuất");
    expect(singleRevokeBtn).toBeDefined();

    await user.click(singleRevokeBtn!);

    // Verify Revoke Modal is open
    expect(screen.getByText("Đăng xuất phiên làm việc từ xa")).toBeInTheDocument();
    expect(screen.getAllByText("Safari trên iPhone").length).toBeGreaterThanOrEqual(1);

    // Click a quick chip reason
    const chip = screen.getByRole("button", { name: "Thiết bị lạ nghi ngờ" });
    await user.click(chip);

    // Confirm revoke
    const confirmBtn = screen.getByRole("button", { name: "Đăng xuất phiên này" });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockRevokeSessionMutation).toHaveBeenCalledWith({
        sessionId: "sess-02",
        reason: "Thiết bị lạ nghi ngờ",
      });
    });
  });

  it("NCL-01-CN-007-TC-01: Owner revokes all sessions of an employee", async () => {
    const user = userEvent.setup();
    mockRevokeAllSessionsMutation.mockReturnValue({
      unwrap: () => Promise.resolve({ code: 1000, message: "Thành công" }),
    });

    renderComponent();

    // Find the button with title "Đăng xuất toàn bộ phiên của Trần Thị Bích"
    const revokeAllEmployeeBtn = screen.getByTitle("Đăng xuất toàn bộ phiên của Trần Thị Bích");
    await user.click(revokeAllEmployeeBtn);

    // Verify Modal open
    expect(
      screen.getByText("Đăng xuất toàn bộ phiên của Trần Thị Bích")
    ).toBeInTheDocument();

    // Type a custom reason
    const input = screen.getByPlaceholderText("Nhập lý do thu hồi các phiên...");
    await user.type(input, "Nhân viên nghỉ việc");

    // Click Confirm
    const confirmBtn = screen.getByRole("button", { name: "Xác nhận đăng xuất tất cả" });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockRevokeAllSessionsMutation).toHaveBeenCalledWith({
        userId: "usr-02",
        reason: "Nhân viên nghỉ việc",
      });
    });
  });

  it("NCL-01-CN-007-TC-01: User revokes all other sessions from action bar", async () => {
    const user = userEvent.setup();
    mockRevokeAllSessionsMutation.mockReturnValue({
      unwrap: () => Promise.resolve({ code: 1000, message: "Thành công" }),
    });

    renderComponent();

    const revokeOtherBtn = screen.getByRole("button", {
      name: /Đăng xuất các thiết bị khác/i,
    });
    await user.click(revokeOtherBtn);

    expect(
      screen.getByText("Đăng xuất khỏi tất cả các thiết bị khác")
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: "Xác nhận đăng xuất tất cả" });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockRevokeAllSessionsMutation).toHaveBeenCalledWith({
        userId: "usr-01",
        reason: undefined,
      });
    });
  });

  it("NCL-01-CN-007-TC-02: Role-based permissions: Cashier (VT-02) does not see Owner settings or other users controls", () => {
    const cashierStore = createTestStore("VT-02", "usr-02");
    renderComponent(cashierStore);

    // Cashier must NOT see Session Timeout Settings Card
    expect(
      screen.queryByText("Thời gian tự động hết hạn phiên không hoạt động")
    ).not.toBeInTheDocument();

    // Cashier must NOT see employee filter dropdown
    expect(screen.queryByText("Nhân viên:")).not.toBeInTheDocument();

    // Cashier must NOT see button to revoke all sessions of another employee
    expect(
      screen.queryByTitle("Đăng xuất toàn bộ phiên của Nguyễn Văn Việt")
    ).not.toBeInTheDocument();
  });

  it("NCL-01-CN-007-CV-04: Owner configures session timeout and verifies validation", async () => {
    const user = userEvent.setup();
    mockUpdateSettingsMutation.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          code: 1000,
          message: "Cập nhật thành công",
          result: { householdId: "hh-01", sessionTimeoutMinutes: 120 },
        }),
    });

    render(
      <Provider store={createTestStore()}>
        <SessionTimeoutSettingsCard />
      </Provider>
    );

    expect(
      screen.getByText("Thời gian tự động hết hạn phiên không hoạt động")
    ).toBeInTheDocument();

    // Click quick preset: 4 giờ (240 phút)
    const preset4h = screen.getByRole("button", { name: "4 giờ" });
    await user.click(preset4h);

    // Save
    const saveBtn = screen.getByRole("button", { name: /Lưu cấu hình/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateSettingsMutation).toHaveBeenCalledWith({
        sessionTimeoutMinutes: 240,
      });
    });
  });

  it("filters sessions by search query and device type", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Initial: 3 rows
    expect(screen.getByText("192.168.1.10")).toBeInTheDocument();
    expect(screen.getByText("192.168.1.25")).toBeInTheDocument();
    expect(screen.getByText("192.168.1.50")).toBeInTheDocument();

    // Search for "192.168.1.25"
    const searchInput = screen.getByPlaceholderText(/Tìm theo tên người dùng/i);
    await user.type(searchInput, "192.168.1.25");

    // Only nhanvien_viet row should remain
    expect(screen.getByText("192.168.1.25")).toBeInTheDocument();
    expect(screen.queryByText("192.168.1.10")).not.toBeInTheDocument();
    expect(screen.queryByText("192.168.1.50")).not.toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // Filter by Device: MOBILE
    const deviceSelect = screen.getByDisplayValue("Tất cả thiết bị");
    await user.selectOptions(deviceSelect, "MOBILE");

    expect(screen.getByText("192.168.1.25")).toBeInTheDocument();
    expect(screen.queryByText("192.168.1.10")).not.toBeInTheDocument();
  });
});
