import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LockPeriodConfirmModal } from "../components/LockPeriodConfirmModal";
import { UnlockPeriodModal } from "../components/UnlockPeriodModal";
import { RolloverAdjustmentNotice } from "../components/RolloverAdjustmentNotice";
import { PeriodLockAuditTimeline } from "../components/PeriodLockAuditTimeline";
import { unlockPeriodSchema } from "../schemas/periodLockSchemas";
import type { ITaxDeclarationSummary } from "../types/ITaxDeclaration";
import type {
  IRolloverAdjustment,
  IPeriodLockAudit,
} from "../types/ITaxPeriodLock";

const mockSummary: ITaxDeclarationSummary = {
  periodCode: "Q3-2026",
  periodLabel: "Quý 3 / 2026",
  year: 2026,
  startDate: "2026-07-01",
  endDate: "2026-09-30",
  status: "OPEN",
  householdName: "Tạp Hóa & Siêu Thị Mini Bán Hàng Việt",
  taxCode: "8123456789",
  representativeName: "Nguyễn Văn A",
  address: "123 Trần Phú, Hải Châu, Đà Nẵng",
  phoneNumber: "0905123456",
  taxAuthorityName: "CHI CỤC THUẾ QUẬN HẢI CHÂU",
  totalRevenue: 184000000,
  totalVatAmount: 7440000,
  totalPitAmount: 4960000,
  totalPayableTaxAmount: 12400000,
  taxGroups: [],
  validInvoicesCount: 24,
  adjustedInvoicesCount: 2,
  cancelledInvoicesCount: 1,
};

const mockRolloverAdjustments: IRolloverAdjustment[] = [
  {
    id: "ROLLOVER-01",
    originalInvoiceNumber: "00000123",
    originalInvoiceSeries: "1C26TAA",
    returnTicketNumber: "PTH-0009",
    originalPeriod: "Q3-2026",
    rolloverPeriod: "Q4-2026",
    adjustmentAmount: -5000000,
    adjustmentTaxAmount: -400000,
    approvedDate: "2026-10-08",
    reason: "Khách trả hàng sau khi Quý 3 đã chốt sổ",
  },
];

const mockAuditHistory: IPeriodLockAudit[] = [
  {
    id: "AUDIT-01",
    periodCode: "Q2-2026",
    periodLabel: "Quý 2 / 2026",
    action: "LOCK",
    performedBy: "VT-01 (Chủ hộ - Nguyễn Văn A)",
    performedAt: "2026-07-05T09:00:00Z",
    notes: "Đã nộp tờ khai quý 2 qua hệ thống eTax",
    totalRevenueAtAction: 175000000,
    totalTaxAtAction: 11800000,
    validInvoicesCount: 22,
  },
];

describe("NCL-12-CN-004: Chốt kỳ kê khai và khóa số liệu", () => {
  // Test Case TC-01: Modal xác nhận chốt kỳ hiển thị đúng số liệu tóm tắt và cảnh báo QTN-21
  it("NCL-12-CN-004-TC-01: Render Modal chốt kỳ với bảng tóm tắt số liệu bị khóa và nút xác nhận", async () => {
    const onConfirmLock = vi.fn();
    render(
      <LockPeriodConfirmModal
        isOpen={true}
        onClose={() => {}}
        summary={mockSummary}
        onConfirmLock={onConfirmLock}
        isLoading={false}
      />
    );

    // Kiểm tra tiêu đề và cảnh báo QTN-21
    expect(screen.getByText("Khóa số liệu & Chốt kỳ kê khai thuế")).toBeDefined();
    expect(screen.getByText(/Quy tắc toàn vẹn dữ liệu thuế QTN-21/i)).toBeDefined();

    // Kiểm tra số liệu bị khóa
    expect(screen.getByText("24 hóa đơn hợp lệ")).toBeDefined();

    // Checkbox cam đoan
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDefined();

    // Tích checkbox và submit
    fireEvent.click(checkbox);
    const submitBtn = screen.getByRole("button", {
      name: /Xác nhận chốt & khóa số liệu/i,
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
    render(
      <PeriodLockAuditTimeline
        history={mockAuditHistory}
        periodLabel="Quý 2 / 2026"
      />
    );

    expect(
      screen.getByText(/Nhật ký kiểm toán Chốt & Mở lại kỳ/i)
    ).toBeDefined();
    expect(screen.getByText("CHỐT KHÓA SỐ LIỆU")).toBeDefined();
    expect(screen.getByText(/VT-01 \(Chủ hộ - Nguyễn Văn A\)/i)).toBeDefined();
  });
});

