import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "@/stores";
import { LockPeriodConfirmModal } from "../components/LockPeriodConfirmModal";
import { UnlockPeriodModal } from "../components/UnlockPeriodModal";
import { RolloverAdjustmentNotice } from "../components/RolloverAdjustmentNotice";
import { PeriodLockAuditTimeline } from "../components/PeriodLockAuditTimeline";
import { unlockPeriodSchema } from "../schemas/periodLockSchemas";
import type { ITaxDeclarationPeriodResponse } from "../types/ITaxDeclaration";
import type { IRolloverAdjustment } from "../types/ITaxPeriodLock";

const mockPeriod: ITaxDeclarationPeriodResponse = {
  id: "period-123",
  householdId: "hh-001",
  periodName: "Quý 3 / 2026",
  periodType: "QUARTERLY",
  year: 2026,
  periodNumber: 3,
  startDate: "2026-07-01",
  endDate: "2026-09-30",
  status: "GENERATED",
  totalValidInvoices: 24,
  totalRevenue: 184000000,
  totalTaxAmount: 12400000,
  createdByName: "Nguyễn Văn A",
  createdAt: "2026-08-15T08:00:00Z",
};

const mockRolloverAdjustments: IRolloverAdjustment[] = [
  {
    id: "ROLLOVER-01",
    originalInvoiceSeries: "1C26TAA",
    originalInvoiceNumber: "00000123",
    returnTicketNumber: "PTH-0009",
    originalPeriod: "Q3-2026",
    rolloverPeriod: "Q4-2026",
    adjustmentAmount: -2500000,
    adjustmentTaxAmount: -250000,
    approvedDate: "2026-10-02",
    reason: "Khách trả hàng sau khi kỳ Q3 đã chốt sổ",
  },
];

describe("NCL-12-CN-004: Chốt kỳ kê khai và khóa số liệu", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  // Test Case TC-01: Render Modal chốt kỳ kê khai với số liệu tóm tắt và nút xác nhận
  it("NCL-12-CN-004-TC-01: Render Modal chốt kỳ với bảng tóm tắt số liệu bị khóa và nút xác nhận", async () => {
    const onConfirmLock = vi.fn();

    render(
      <LockPeriodConfirmModal
        isOpen={true}
        onClose={() => {}}
        period={mockPeriod}
        onConfirmLock={onConfirmLock}
        isLoading={false}
      />
    );

    // Kiểm tra các nhãn thông tin cơ bản
    expect(screen.getByText("Khóa số liệu & Chốt kỳ kê khai thuế")).toBeDefined();
    expect(screen.getByText(/24 hóa đơn hợp lệ/i)).toBeDefined();
    expect(screen.getByText(/184.000.000/i)).toBeDefined();
    expect(screen.getByText(/12.400.000/i)).toBeDefined();

    // Nút xác nhận bị disable khi chưa tích chọn checkbox
    const confirmCheckbox = screen.getByRole("checkbox");
    expect(confirmCheckbox).toBeDefined();

    fireEvent.click(confirmCheckbox);

    const submitBtn = screen.getByRole("button", {
      name: /Xác nhận Chốt sổ/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onConfirmLock).toHaveBeenCalledTimes(1);
    });
  });

  // Test Case TC-02: Hiển thị banner chuyển tiếp điều chỉnh giảm sang kỳ sau khi kỳ đã chốt (QTN-21)
  it("NCL-12-CN-004-TC-02: Hiển thị Banner chuyển tiếp khoản điều chỉnh giảm sang kỳ mở tiếp theo", () => {
    render(
      <RolloverAdjustmentNotice
        adjustments={mockRolloverAdjustments}
        currentPeriodLabel="Quý 3 / 2026"
      />
    );

    expect(
      screen.getByText(/Xử lý giao dịch điều chỉnh phát sinh sau khi chốt kỳ/i)
    ).toBeDefined();
    expect(screen.getByText(/PTH-0009/i)).toBeDefined();
    expect(screen.getByText(/1C26TAA-00000123/i)).toBeDefined();
    expect(screen.getByText("Q3-2026")).toBeDefined();
    expect(screen.getByText("Q4-2026")).toBeDefined();
  });

  // Test Case TC-04: Render Modal mở lại kỳ kê khai
  it("NCL-12-CN-004-TC-04-Modal: Render Modal mở lại kỳ với trường nhập lý do bắt buộc", () => {
    render(
      <UnlockPeriodModal
        isOpen={true}
        onClose={() => {}}
        periodLabel="Quý 3 / 2026"
        onConfirmUnlock={async () => {}}
        isLoading={false}
      />
    );

    expect(screen.getByText("Mở lại kỳ kê khai thuế")).toBeDefined();
    expect(screen.getByPlaceholderText(/Cần lập hóa đơn điều chỉnh bổ sung/i)).toBeDefined();
  });

  // Test Case TC-04: Validate bắt buộc nhập lý do mở lại kỳ >= 10 ký tự
  it("NCL-12-CN-004-TC-04-Schema: Zod schema kiểm tra lý do mở lại kỳ bắt buộc tối thiểu 10 ký tự", () => {
    const validResult = unlockPeriodSchema.safeParse({
      reason: "Cần lập hóa đơn điều chỉnh bổ sung cho đơn hàng tháng 9",
    });
    expect(validResult.success).toBe(true);

    const invalidShortResult = unlockPeriodSchema.safeParse({
      reason: "Lý do",
    });
    expect(invalidShortResult.success).toBe(false);

    const emptyResult = unlockPeriodSchema.safeParse({
      reason: "",
    });
    expect(emptyResult.success).toBe(false);
  });

  // Test Case TC-04: Hiển thị dòng thời gian kiểm toán các lần chốt / mở lại kỳ
  it("NCL-12-CN-004-TC-04-Timeline: Hiển thị lịch sử nhật ký kiểm toán với người thực hiện và số liệu khóa", () => {
    const lockedPeriod: ITaxDeclarationPeriodResponse = {
      ...mockPeriod,
      status: "LOCKED",
      lockedAt: "2026-07-05T09:00:00Z",
      lockedByName: "VT-01 (Chủ hộ - Nguyễn Văn A)",
    };

    render(
      <Provider store={store}>
        <PeriodLockAuditTimeline period={lockedPeriod} />
      </Provider>
    );

    expect(
      screen.getByText(/Nhật ký kiểm toán & Thao tác kỳ/i)
    ).toBeDefined();
    expect(screen.getByText("CHỐT KHÓA SỐ LIỆU KỲ")).toBeDefined();
    expect(screen.getByText(/VT-01 \(Chủ hộ - Nguyễn Văn A\)/i)).toBeDefined();
  });
});
