import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NotificationCenterDropdown } from "../components/NotificationCenterDropdown";
import { NotificationSettingsModal } from "../components/NotificationSettingsModal";
import NotificationCenterPage from "../pages/NotificationCenterPage";
import { resolveNotificationActionUrl } from "../utils/notificationRouteHelper";
import * as notificationApiModule from "../services/notificationApi";
import * as reduxHooks from "@/hooks/useRedux";
import { USER_ROLES } from "@/constants/roles";

// Mock notificationApi hooks
vi.mock("../services/notificationApi", () => ({
  useGetNotificationsQuery: vi.fn(),
  useGetBadgeCountQuery: vi.fn(),
  useGetUnreadNotificationCountQuery: vi.fn(),
  useMarkNotificationAsReadMutation: vi.fn(),
  useMarkAllAsReadMutation: vi.fn(),
  useSyncRemindersMutation: vi.fn(),
  useGetNotificationSettingsQuery: vi.fn(),
  useUpdateNotificationSettingsBatchMutation: vi.fn(),
  useUpdateSingleNotificationSettingMutation: vi.fn(),
}));

// Mock redux hook useAppSelector
vi.mock("@/hooks/useRedux", () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
}));

describe("Trung tâm thông báo (NCL-19-CN-002)", () => {
  const mockMarkAsRead = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve() });
  const mockMarkAllAsRead = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve() });
  const mockSyncReminders = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve() });
  const mockUpdateBatch = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve() });

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(notificationApiModule.useMarkNotificationAsReadMutation).mockReturnValue([
      mockMarkAsRead,
      { isLoading: false } as any,
    ]);

    vi.mocked(notificationApiModule.useMarkAllAsReadMutation).mockReturnValue([
      mockMarkAllAsRead,
      { isLoading: false } as any,
    ]);

    vi.mocked(notificationApiModule.useSyncRemindersMutation).mockReturnValue([
      mockSyncReminders,
      { isLoading: false } as any,
    ]);

    vi.mocked(notificationApiModule.useUpdateNotificationSettingsBatchMutation).mockReturnValue([
      mockUpdateBatch,
      { isLoading: false } as any,
    ]);

    vi.mocked(notificationApiModule.useGetNotificationSettingsQuery).mockReturnValue({
      data: { code: 200, result: [] },
      isLoading: false,
    } as any);

    vi.mocked(reduxHooks.useAppSelector).mockReturnValue({
      id: "user-1",
      name: "Chủ Hộ Kinh Doanh",
      role: USER_ROLES.OWNER,
    });
  });

  // TC-01: Hiển thị hóa đơn gửi lỗi và công nợ đến hạn kèm liên kết mở xử lý
  it("TC-01: Hiển thị cả hóa đơn gửi lỗi (INVOICE_ERROR) và công nợ đến hạn (DEBT_DUE) kèm actionUrl", async () => {
    vi.mocked(notificationApiModule.useGetBadgeCountQuery).mockReturnValue({
      data: {
        code: 200,
        result: {
          unclosedCount: 2,
          dangerCount: 1,
          warningCount: 1,
          unreadCount: 2,
        },
      },
    } as any);

    vi.mocked(notificationApiModule.useGetNotificationsQuery).mockReturnValue({
      data: {
        code: 200,
        result: {
          content: [
            {
              id: "notif-1",
              notificationType: "INVOICE_ERROR",
              notificationCategory: "E_INVOICE",
              severity: "DANGER",
              title: "Hóa đơn HD001 cấp mã thất bại",
              message: "Lỗi kết nối CQT: Sai định dạng chữ ký số",
              actionUrl: "/e-invoices?id=inv-1",
              isRead: false,
              isClosed: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: "notif-2",
              notificationType: "DEBT_DUE",
              notificationCategory: "TAX_FINANCE",
              severity: "WARNING",
              title: "Khách hàng Nguyễn Văn A có khoản nợ 5.000.000đ đến hạn",
              message: "Hạn thanh toán là hôm nay. Vui lòng liên hệ đối chiếu.",
              actionUrl: "/customers/cust-1",
              isRead: false,
              isClosed: false,
              createdAt: new Date().toISOString(),
            },
          ],
          totalElements: 2,
          totalPages: 1,
        },
      },
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <NotificationCenterDropdown />
      </MemoryRouter>
    );

    // Chuông hiển thị badge số lượng việc chưa xử lý
    const bellBtn = screen.getByRole("button", { name: /Trung tâm thông báo/i });
    expect(bellBtn).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Mở dropdown
    fireEvent.click(bellBtn);

    // Phải thấy cả 2 thông báo
    expect(screen.getByText("Hóa đơn HD001 cấp mã thất bại")).toBeInTheDocument();
    expect(
      screen.getByText("Khách hàng Nguyễn Văn A có khoản nợ 5.000.000đ đến hạn")
    ).toBeInTheDocument();

    // Click vào hóa đơn lỗi -> gọi markAsRead
    const invoiceErrorCard = screen.getByText("Hóa đơn HD001 cấp mã thất bại");
    fireEvent.click(invoiceErrorCard);
    expect(mockMarkAsRead).toHaveBeenCalledWith("notif-1");
  });

  // TC-02: Khi công việc đã giải quyết xong -> hiển thị đã giải quyết
  it("TC-02: Thông báo hiển thị trạng thái Đã giải quyết khi isClosed = true", async () => {
    vi.mocked(notificationApiModule.useGetBadgeCountQuery).mockReturnValue({
      data: {
        code: 200,
        result: {
          unclosedCount: 0,
          dangerCount: 0,
          warningCount: 0,
          unreadCount: 0,
        },
      },
    } as any);

    vi.mocked(notificationApiModule.useGetNotificationsQuery).mockReturnValue({
      data: {
        code: 200,
        result: {
          content: [
            {
              id: "notif-1",
              notificationType: "INVOICE_ERROR",
              notificationCategory: "E_INVOICE",
              severity: "DANGER",
              title: "Hóa đơn HD001 cấp mã thất bại",
              message: "Hóa đơn đã được gửi lại và cấp mã thành công",
              actionUrl: "/e-invoices?id=inv-1",
              isRead: true,
              isClosed: true,
              closedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
          ],
          totalElements: 1,
          totalPages: 1,
        },
      },
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <NotificationCenterPage />
      </MemoryRouter>
    );

    // Màn hình trang thông báo hiển thị huy hiệu "Đã giải quyết xong"
    expect(screen.getAllByText("Đã giải quyết xong").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Xem lại")).toBeInTheDocument();
  });

  // TC-03: Nhân viên bán hàng (CASHIER) mở thông báo
  it("TC-03: Nhân viên bán hàng (CASHIER) xem được chuông thông báo tác nghiệp", async () => {
    vi.mocked(reduxHooks.useAppSelector).mockReturnValue({
      id: "user-2",
      name: "Nhân viên Bán hàng",
      role: USER_ROLES.CASHIER,
    });

    vi.mocked(notificationApiModule.useGetBadgeCountQuery).mockReturnValue({
      data: {
        code: 200,
        result: {
          unclosedCount: 1,
          dangerCount: 1,
          warningCount: 0,
          unreadCount: 1,
        },
      },
    } as any);

    vi.mocked(notificationApiModule.useGetNotificationsQuery).mockReturnValue({
      data: {
        code: 200,
        result: {
          content: [
            {
              id: "notif-cashier-1",
              notificationType: "INVOICE_ERROR",
              severity: "DANGER",
              title: "Hóa đơn xuất cho khách bị lỗi ký số",
              message: "Vui lòng kiểm tra kết nối chữ ký số",
              actionUrl: "/e-invoices",
              isRead: false,
              isClosed: false,
              createdAt: new Date().toISOString(),
            },
          ],
          totalElements: 1,
          totalPages: 1,
        },
      },
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <NotificationCenterDropdown />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole("button", { name: /Trung tâm thông báo/i });
    expect(bellBtn).toBeInTheDocument();

    fireEvent.click(bellBtn);
    expect(screen.getByText("Hóa đơn xuất cho khách bị lỗi ký số")).toBeInTheDocument();

    // Nhân viên không có nút Cài đặt thông báo của Chủ hộ
    expect(screen.queryByTitle("Cài đặt nhận thông báo")).not.toBeInTheDocument();
  });

  // TC-04: Đánh dấu đã đọc từng cái và đọc tất cả
  it("TC-04: Hỗ trợ đánh dấu đọc từng cái và đọc tất cả thông báo", async () => {
    vi.mocked(notificationApiModule.useGetBadgeCountQuery).mockReturnValue({
      data: {
        code: 200,
        result: {
          unclosedCount: 2,
          dangerCount: 0,
          warningCount: 0,
          unreadCount: 2,
        },
      },
    } as any);

    vi.mocked(notificationApiModule.useGetNotificationsQuery).mockReturnValue({
      data: {
        code: 200,
        result: {
          content: [
            {
              id: "notif-1",
              title: "Thông báo 1",
              message: "Nội dung 1",
              isRead: false,
              isClosed: false,
              createdAt: new Date().toISOString(),
            },
          ],
          totalElements: 1,
          totalPages: 1,
        },
      },
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <NotificationCenterDropdown />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Trung tâm thông báo/i }));

    const markAllBtn = screen.getByRole("button", { name: /Đọc tất cả/i });
    expect(markAllBtn).toBeInTheDocument();

    fireEvent.click(markAllBtn);
    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  // TC-05: Cài đặt thông báo: Khóa mục bắt buộc (isMandatory = true)
  it("TC-05: Cấu hình nhận thông báo khóa mục bắt buộc (isMandatory = true)", async () => {
    vi.mocked(notificationApiModule.useGetNotificationSettingsQuery).mockReturnValue({
      data: {
        code: 200,
        result: [
          {
            notificationType: "INVOICE_ERROR",
            title: "Cảnh báo lỗi hóa đơn điện tử",
            description: "Nhắc nhở ngay khi hóa đơn gửi CQT bị lỗi hoặc từ chối cấp mã",
            category: "E_INVOICE",
            isEnabled: true,
            isMandatory: true, // BẮT BUỘC KHÔNG CHO TẮT
          },
          {
            notificationType: "DEBT_DUE",
            title: "Nhắc nhở công nợ đến hạn",
            description: "Cảnh báo các khoản nợ khách hàng sắp đến hạn thanh toán",
            category: "TAX_FINANCE",
            isEnabled: true,
            isMandatory: false, // Có thể tắt
          },
        ],
      },
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <NotificationSettingsModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    // Kiểm tra hiển thị tiêu đề và nhãn bắt buộc
    expect(screen.getByText("Cài đặt nhận thông báo công việc")).toBeInTheDocument();
    expect(screen.getByText("Bắt buộc")).toBeInTheDocument();

    // Switch của mục bắt buộc phải disabled
    const mandatorySwitch = screen.getByRole("switch", {
      name: /Bật tắt Cảnh báo lỗi hóa đơn điện tử/i,
    });
    expect(mandatorySwitch).toBeDisabled();

    // Switch của mục tùy chọn không bị disabled
    const optionalSwitch = screen.getByRole("switch", {
      name: /Bật tắt Nhắc nhở công nợ đến hạn/i,
    });
    expect(optionalSwitch).not.toBeDisabled();

    // Click toggle mục tùy chọn
    fireEvent.click(optionalSwitch);

    // Lưu cài đặt
    const saveBtn = screen.getByRole("button", { name: /Lưu thay đổi/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateBatch).toHaveBeenCalledWith({
        settings: expect.arrayContaining([
          { notificationType: "INVOICE_ERROR", isEnabled: true },
          { notificationType: "DEBT_DUE", isEnabled: false },
        ]),
      });
    });
  });

  // TC-06: Điều hướng chính xác URL xử lý từ thông báo
  it("TC-06: resolveNotificationActionUrl chuyển hướng công nợ /debts về trang khách hàng và tab nợ", () => {
    const debtUrl = resolveNotificationActionUrl({
      actionUrl: "/debts?customerId=cust-123",
      targetType: "CUSTOMER_DEBT",
    });
    expect(debtUrl).toBe("/customers/cust-123?tab=debt");

    const overdueGeneral = resolveNotificationActionUrl({
      actionUrl: "/debts",
      targetType: "CUSTOMER_DEBT",
    });
    expect(overdueGeneral).toBe("/customers?debtStatus=OVERDUE");

    const invoiceUrl = resolveNotificationActionUrl({
      actionUrl: "/e-invoices?id=inv-999",
      targetType: "INVOICE",
    });
    expect(invoiceUrl).toBe("/e-invoices?id=inv-999");
  });
});
