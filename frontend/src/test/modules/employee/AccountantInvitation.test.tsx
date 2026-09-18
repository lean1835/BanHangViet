import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import authReducer from "@/stores/authSlice";
import { AccountantInvitationList } from "@/modules/employee/components/AccountantInvitationList";
import * as accountantApiModule from "@/modules/employee/services/accountantInvitationApi";
import {
  ACCESS_SCOPES,
  INVITATION_STATUS,
  type IAccountantInvitation,
} from "@/modules/employee/types/IAccountantInvitation";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

describe("Mời và thu hồi quyền truy cập của kế toán thuê ngoài", () => {
  const mockInviteMutation = vi.fn();
  const mockRevokeMutation = vi.fn();
  const mockExtendMutation = vi.fn();
  const mockResendMutation = vi.fn();
  const mockRefetch = vi.fn();

  const mockInvitations: IAccountantInvitation[] = [
    {
      id: "assign-01",
      householdId: "hh-01",
      householdName: "Hộ kinh doanh Test A",
      taxCode: "0123456789",
      accountantName: "Vũ Thị Mai",
      phoneNumber: "0918765432",
      email: "mai.ketoan@gmail.com",
      scopes: [
        ACCESS_SCOPES.E_INVOICES,
        ACCESS_SCOPES.FINANCIAL_REPORTS,
        ACCESS_SCOPES.TAX_DECLARATION,
      ],
      status: INVITATION_STATUS.ACTIVE,
      inviteDate: "2026-01-10",
      expiryDate: "2026-12-31",
      createdBy: "Chủ hộ",
    },
    {
      id: "inv-02",
      householdId: "hh-01",
      householdName: "Hộ kinh doanh Test A",
      taxCode: "0123456789",
      accountantName: "Đặng Hoàng Nam",
      phoneNumber: "0987112233",
      email: "nam.dh@ketoanthue.vn",
      scopes: [ACCESS_SCOPES.E_INVOICES, ACCESS_SCOPES.TAX_DECLARATION],
      status: INVITATION_STATUS.PENDING,
      inviteDate: "2026-09-01",
      expiryDate: "2027-03-31",
      createdBy: "Chủ hộ",
    },
    {
      id: "assign-03",
      householdId: "hh-01",
      householdName: "Hộ kinh doanh Test A",
      taxCode: "0123456789",
      accountantName: "Lê Minh Tuấn",
      phoneNumber: "0903456789",
      email: "tuan.ketoan@outlook.com",
      scopes: [ACCESS_SCOPES.E_INVOICES],
      status: INVITATION_STATUS.REVOKED,
      inviteDate: "2025-06-01",
      expiryDate: "2025-12-31",
      revokedAt: "2025-11-15 14:30:00",
      revokeReason: "Thanh lý hợp đồng kế toán dịch vụ trước hạn",
      createdBy: "Chủ hộ",
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
            id: "user-01",
            username: "owner_test",
            fullName: "Chủ Hộ Kinh Doanh",
            roleId: "VT-01",
          },
          token: "mock-jwt-token",
          isAuthenticated: true,
        },
      } as any,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(accountantApiModule, "useGetAccountantInvitationsQuery").mockReturnValue({
      data: mockInvitations,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    } as any);

    vi.spyOn(accountantApiModule, "useInviteAccountantMutation").mockReturnValue([
      mockInviteMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(accountantApiModule, "useRevokeAccountantAccessMutation").mockReturnValue([
      mockRevokeMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(accountantApiModule, "useExtendAccountantAccessMutation").mockReturnValue([
      mockExtendMutation,
      { isLoading: false } as any,
    ]);

    vi.spyOn(accountantApiModule, "useResendAccountantInvitationMutation").mockReturnValue([
      mockResendMutation,
      { isLoading: false } as any,
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <AccountantInvitationList {...props} />
        </MemoryRouter>
      </Provider>
    );
  };

  it("Hiển thị danh sách kế toán thuê ngoài và trạng thái chuẩn", () => {
    renderComponent();

    expect(screen.getByText("Kế toán viên")).toBeInTheDocument();
    expect(screen.getByText("Vũ Thị Mai")).toBeInTheDocument();
    expect(screen.getByText("0918765432")).toBeInTheDocument();
    expect(screen.getByText("Đặng Hoàng Nam")).toBeInTheDocument();
    expect(screen.getByText("Lê Minh Tuấn")).toBeInTheDocument();

    // Verify status badges
    expect(screen.getAllByText("Đang hoạt động").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Chờ chấp nhận")).toBeInTheDocument();
    expect(screen.getAllByText("Đã thu hồi").length).toBeGreaterThanOrEqual(1);
  });

  it("TC-01: Mở modal mời kế toán mới và gửi thông tin thành công", async () => {
    const user = userEvent.setup();
    mockInviteMutation.mockReturnValue({
      unwrap: () => Promise.resolve({ id: "new-inv" }),
    });

    renderComponent();

    // Bấm nút "Mời kế toán mới"
    const inviteBtn = screen.getByRole("button", { name: /Mời kế toán mới/i });
    await user.click(inviteBtn);

    // Modal mời kế toán xuất hiện
    expect(screen.getByText("Mời Kế Toán Thuê Ngoài")).toBeInTheDocument();

    // Điền họ tên, số điện thoại và email bắt buộc
    const nameInput = screen.getByPlaceholderText("Ví dụ: Nguyễn Thị Hoa");
    const phoneInput = screen.getByPlaceholderText("0912 345 678");
    const emailInput = screen.getByPlaceholderText("ketoan@domain.vn");
    await user.type(nameInput, "Nguyễn Thị Hoa");
    await user.type(phoneInput, "0912345678");
    await user.type(emailInput, "hoa.ketoan@gmail.com");

    // Bấm gửi lời mời
    const submitBtn = screen.getByRole("button", { name: "Gửi lời mời" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockInviteMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          accountantName: "Nguyễn Thị Hoa",
          phoneNumber: "0912345678",
          email: "hoa.ketoan@gmail.com",
          createAccountMode: "AUTO_GENERATE",
        })
      );
    });
  });

  it("TC-02: Hiển thị thông tin tài khoản kế toán mới được khởi tạo và hỗ trợ sao chép", async () => {
    const user = userEvent.setup();
    mockInviteMutation.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          id: "new-inv-02",
          isNewAccountCreated: true,
          accountantUsername: "hoa.ketoan",
          temporaryPassword: "Kt@654321",
          accountantEmail: "hoa.ketoan@gmail.com",
          accountantName: "Nguyễn Thị Hoa",
        }),
    });

    renderComponent();

    const inviteBtn = screen.getByRole("button", { name: /Mời kế toán mới/i });
    await user.click(inviteBtn);

    const nameInput = screen.getByPlaceholderText("Ví dụ: Nguyễn Thị Hoa");
    const phoneInput = screen.getByPlaceholderText("0912 345 678");
    const emailInput = screen.getByPlaceholderText("ketoan@domain.vn");

    await user.type(nameInput, "Nguyễn Thị Hoa");
    await user.type(phoneInput, "0912345678");
    await user.type(emailInput, "hoa.ketoan@gmail.com");

    const submitBtn = screen.getByRole("button", { name: "Gửi lời mời" });
    await user.click(submitBtn);

    // Màn hình thông báo tài khoản mới xuất hiện
    await waitFor(() => {
      expect(screen.getByText(/Tài khoản kế toán mới vừa được khởi tạo:/i)).toBeInTheDocument();
      expect(screen.getByText("hoa.ketoan")).toBeInTheDocument();
      expect(screen.getByText("Kt@654321")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Sao chép thông tin/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Hoàn tất/i })).toBeInTheDocument();
    });

    // Bấm hoàn tất để đóng modal
    const finishBtn = screen.getByRole("button", { name: /Hoàn tất/i });
    await user.click(finishBtn);
  });

  it("TC-02B: Chủ hộ chọn tự đặt mật khẩu ban đầu cho kế toán", async () => {
    const user = userEvent.setup();
    mockInviteMutation.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          id: "new-inv-03",
          isNewAccountCreated: true,
          accountantUsername: "le.ketoan",
          temporaryPassword: "Secret@Pass123",
          accountantEmail: "le.ketoan@gmail.com",
        }),
    });

    renderComponent();

    const inviteBtn = screen.getByRole("button", { name: /Mời kế toán mới/i });
    await user.click(inviteBtn);

    // Chuyển sang chế độ "Chủ hộ tự đặt"
    const manualModeRadio = screen.getByText("Chủ hộ tự đặt");
    await user.click(manualModeRadio);

    // Nhập mật khẩu
    const passwordInput = screen.getByPlaceholderText("Tối thiểu 6 ký tự");
    await user.type(passwordInput, "Secret@Pass123");

    const nameInput = screen.getByPlaceholderText("Ví dụ: Nguyễn Thị Hoa");
    const phoneInput = screen.getByPlaceholderText("0912 345 678");
    const emailInput = screen.getByPlaceholderText("ketoan@domain.vn");

    await user.type(nameInput, "Lê Kế Toán");
    await user.type(phoneInput, "0933445566");
    await user.type(emailInput, "le.ketoan@gmail.com");

    const submitBtn = screen.getByRole("button", { name: "Gửi lời mời" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockInviteMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          createAccountMode: "MANUAL_PASSWORD",
          initialPassword: "Secret@Pass123",
        })
      );
    });
  });

  it("TC-03: Thu hồi quyền truy cập của kế toán viên đang hoạt động", async () => {
    const user = userEvent.setup();
    mockRevokeMutation.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });

    renderComponent();

    // Bấm nút thu hồi (title: "Thu hồi quyền truy cập")
    const revokeBtn = screen.getByTitle("Thu hồi quyền truy cập");
    await user.click(revokeBtn);

    // Modal xác nhận thu hồi hiển thị
    expect(screen.getByText("Thu Hồi Quyền Truy Cập")).toBeInTheDocument();

    // Nhập lý do thu hồi
    const reasonInput = screen.getByPlaceholderText(/Hết hạn hợp đồng dịch vụ/i);
    await user.type(reasonInput, "Hết hạn hợp đồng dịch vụ");

    // Bấm xác nhận thu hồi
    const confirmBtn = screen.getByRole("button", { name: "Xác nhận thu hồi" });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockRevokeMutation).toHaveBeenCalledWith({
        id: "assign-01",
        reason: "Hết hạn hợp đồng dịch vụ",
      });
    });
  });

  it("Gửi lại lời mời cho kế toán đang chờ xác nhận", async () => {
    const user = userEvent.setup();
    mockResendMutation.mockReturnValue({
      unwrap: () => Promise.resolve({ id: "resend-inv" }),
    });

    renderComponent();

    // Bấm nút "Gửi lại"
    const resendBtn = screen.getByRole("button", { name: /Gửi lại/i });
    await user.click(resendBtn);

    await waitFor(() => {
      expect(mockResendMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "inv-02",
          phoneNumber: "0987112233",
        })
      );
    });
  });

  it("Gia hạn thời gian truy cập cho kế toán", async () => {
    const user = userEvent.setup();
    mockExtendMutation.mockReturnValue({
      unwrap: () => Promise.resolve({ id: "extend-inv" }),
    });

    renderComponent();

    // Bấm icon gia hạn (title: "Gia hạn thời hạn truy cập")
    const extendBtn = screen.getByTitle("Gia hạn thời hạn truy cập");
    await user.click(extendBtn);

    expect(screen.getByText("Gia Hạn Quyền Truy Cập")).toBeInTheDocument();

    // Bấm chọn nhanh +6 tháng
    const quickAddBtn = screen.getByRole("button", { name: "+6 tháng" });
    await user.click(quickAddBtn);

    // Bấm xác nhận gia hạn
    const confirmBtn = screen.getByRole("button", { name: "Xác nhận gia hạn" });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockExtendMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "assign-01",
          phoneNumber: "0918765432",
        })
      );
    });
  });
});
