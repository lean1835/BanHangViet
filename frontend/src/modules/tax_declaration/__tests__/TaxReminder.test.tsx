import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "@/stores";
import { TaxPeriodProgressChecklistBanner } from "../components/TaxPeriodProgressChecklistBanner";
import { TaxReminderSettingsModal } from "../components/TaxReminderSettingsModal";
import type { ITaxPeriodReminderResponse } from "../types/ITaxReminder";

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

const mockApproachingReminder: ITaxPeriodReminderResponse = {
  periodId: "period-q3-2026",
  periodName: "Bảng kê Quý 3 năm 2026",
  periodType: "QUARTERLY",
  year: 2026,
  periodNumber: 3,
  startDate: "2026-07-01",
  endDate: "2026-09-30",
  filingDeadline: "2026-10-31",
  daysRemaining: 5,
  isOverdue: false,
  severity: "WARNING",
  status: "GENERATED",
  isClosed: false,
  checklist: {
    salesRegisterGenerated: true,
    salesRegisterUrl: "/reports/tax-sales-invoices?periodId=period-q3-2026",
    purchaseRegisterGenerated: true,
    purchaseRegisterUrl: "/reports/tax-declaration?tab=purchase-register&periodId=period-q3-2026",
    declarationExported: false,
    declarationExportUrl: "/reports/tax-declaration?tab=declaration&periodId=period-q3-2026",
    periodLocked: false,
    periodLockUrl: "/reports/tax-declaration",
  },
  title: "Nhắc lịch nộp tờ khai Bảng kê Quý 3 năm 2026 (Còn 5 ngày)",
  message: "Hạn nộp tờ khai thuế là ngày 31/10/2026. Vui lòng hoàn thành các bước lập bảng kê, xuất tờ khai và chốt kỳ đúng hạn.",
  actionUrl: "/reports/tax-declaration?periodId=period-q3-2026",
  createdAt: "2026-10-26T08:00:00",
};

const mockOverdueReminder: ITaxPeriodReminderResponse = {
  periodId: "period-q2-2026",
  periodName: "Bảng kê Quý 2 năm 2026",
  periodType: "QUARTERLY",
  year: 2026,
  periodNumber: 2,
  startDate: "2026-04-01",
  endDate: "2026-06-30",
  filingDeadline: "2026-07-31",
  daysRemaining: -4,
  isOverdue: true,
  severity: "DANGER",
  status: "GENERATED",
  isClosed: false,
  checklist: {
    salesRegisterGenerated: true,
    salesRegisterUrl: "/reports/tax-sales-invoices?periodId=period-q2-2026",
    purchaseRegisterGenerated: false,
    purchaseRegisterUrl: "/reports/tax-declaration?tab=purchase-register&periodId=period-q2-2026",
    declarationExported: false,
    declarationExportUrl: "/reports/tax-declaration?tab=declaration&periodId=period-q2-2026",
    periodLocked: false,
    periodLockUrl: "/reports/tax-declaration",
  },
  title: "CẢNH BÁO: Quá hạn nộp tờ khai Bảng kê Quý 2 năm 2026 (4 ngày)",
  message: "Kỳ thuế đã quá hạn nộp từ ngày 31/07/2026. Hộ kinh doanh cần khẩn trương kiểm tra bảng kê, xuất tờ khai và chốt kỳ để nộp thuế tránh bị phạt vi phạm hành chính.",
  actionUrl: "/reports/tax-declaration?periodId=period-q2-2026",
  createdAt: "2026-08-04T08:00:00",
};

describe("NCL-12-CN-007: Nhắc lịch nộp tờ khai theo kỳ", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  // TC-01: Nhắc trước hạn kèm checklist tiến độ 4 bước
  it("NCL-12-CN-007-TC-01: Hiển thị cảnh báo nhắc trước hạn và tiến độ checklist 4 bước", () => {
    const onSelectTab = vi.fn();
    const onOpenExport = vi.fn();
    const onOpenLockModal = vi.fn();

    render(
      <TaxPeriodProgressChecklistBanner
        reminder={mockApproachingReminder}
        onSelectTab={onSelectTab}
        onOpenExport={onOpenExport}
        onOpenLockModal={onOpenLockModal}
      />
    );

    // Tiêu đề và badge số ngày còn lại
    expect(
      screen.getByText(/Nhắc lịch nộp tờ khai Bảng kê Quý 3 năm 2026/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Còn 5 ngày")).toBeInTheDocument();
    expect(screen.getByText("2/4 bước")).toBeInTheDocument();

    // 4 bước checklist
    expect(screen.getByText("1. Bảng kê bán ra")).toBeInTheDocument();
    expect(screen.getByText("Đã tổng hợp HĐ")).toBeInTheDocument();
    expect(screen.getByText("2. Bảng kê mua vào")).toBeInTheDocument();
    expect(screen.getByText("Đã tổng hợp phiếu nhập")).toBeInTheDocument();
    expect(screen.getByText("3. Xuất tờ khai thuế")).toBeInTheDocument();
    expect(screen.getByText("Chưa xuất tờ khai")).toBeInTheDocument();
    expect(screen.getByText("4. Chốt sổ kỳ thuế")).toBeInTheDocument();
    expect(screen.getByText("Chưa chốt sổ")).toBeInTheDocument();

    // Tương tác click vào bước
    fireEvent.click(screen.getByText("3. Xuất tờ khai thuế"));
    expect(onOpenExport).toHaveBeenCalled();
  });

  // TC-02: Kỳ đã chốt (isClosed: true) -> Tự động đóng nhắc việc
  it("NCL-12-CN-007-TC-02: Tự động đóng nhắc việc khi kỳ đã hoàn tất chốt sổ", () => {
    const closedReminder: ITaxPeriodReminderResponse = {
      ...mockApproachingReminder,
      isClosed: true,
      status: "LOCKED",
    };

    const { container } = render(
      <TaxPeriodProgressChecklistBanner reminder={closedReminder} />
    );

    expect(container.firstChild).toBeNull();
  });

  // TC-03: Quá hạn mà chưa chốt -> Đánh dấu mức độ cao DANGER
  it("NCL-12-CN-007-TC-03: Đánh dấu mức độ cao DANGER khi kỳ đã quá hạn mà chưa chốt", () => {
    render(<TaxPeriodProgressChecklistBanner reminder={mockOverdueReminder} />);

    expect(
      screen.getByText(/CẢNH BÁO: Quá hạn nộp tờ khai Bảng kê Quý 2 năm 2026/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Quá hạn 4 ngày")).toBeInTheDocument();
    expect(screen.getByText("1/4 bước")).toBeInTheDocument();
  });

  // TC-04: Render Modal Cài đặt nhắc lịch nộp tờ khai với các tùy chọn
  it("NCL-12-CN-007-TC-04: Render Modal cài đặt nhắc hạn với chọn Quý/Tháng và số ngày nhắc", () => {
    const mockSettings = {
      householdId: "hh-001",
      householdName: "Hộ kinh doanh Việt",
      taxPeriodType: "QUARTERLY",
      taxReminderDaysBefore: 5,
      taxReminderEnabled: true,
    };

    render(
      <Provider store={store}>
        <TaxReminderSettingsModal
          isOpen={true}
          onClose={() => {}}
          isOwner={true}
          initialSettings={mockSettings}
        />
      </Provider>
    );

    expect(
      screen.getByText(/Cài đặt nhắc lịch nộp tờ khai thuế/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tự động nhắc lịch nộp tờ khai/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Theo Quý \(3 tháng\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Theo Tháng/i)).toBeInTheDocument();
    expect(screen.getByText(/Số ngày nhắc trước thời hạn nộp/i)).toBeInTheDocument();
    expect(screen.getByText(/Quét kiểm tra ngay/i)).toBeInTheDocument();
    expect(screen.getByText(/Lưu cấu hình/i)).toBeInTheDocument();
  });

  // TC-05: Kích hoạt nút trigger quét hạn nộp tờ khai
  it("NCL-12-CN-007-TC-05: Kích hoạt nút quét kiểm tra hạn và gửi thông báo", async () => {
    const onClose = vi.fn();
    const mockSettings = {
      householdId: "hh-001",
      householdName: "Hộ kinh doanh Việt",
      taxPeriodType: "QUARTERLY",
      taxReminderDaysBefore: 5,
      taxReminderEnabled: true,
    };

    render(
      <Provider store={store}>
        <TaxReminderSettingsModal
          isOpen={true}
          onClose={onClose}
          isOwner={true}
          initialSettings={mockSettings}
        />
      </Provider>
    );

    const scanBtn = screen.getByRole("button", { name: /Quét kiểm tra ngay/i });
    expect(scanBtn).toBeInTheDocument();
    fireEvent.click(scanBtn);

    // Không throw lỗi và modal vẫn hiển thị
    expect(scanBtn).toBeInTheDocument();
  });
});
