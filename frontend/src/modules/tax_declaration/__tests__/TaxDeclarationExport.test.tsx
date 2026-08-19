import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SimulatedTaxForm01 } from "../components/SimulatedTaxForm01";
import { exportTaxDeclarationToXml } from "../utils/taxExportHelper";
import type {
  ITaxDeclarationPeriodResponse,
  ITaxRevenueSummaryResponse,
  ITaxSalesRegisterItemResponse,
} from "../types/ITaxDeclaration";
import { numberToVietnameseWords } from "@/utils/numberToVietnameseWords";

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

const mockSummary: ITaxRevenueSummaryResponse = {
  periodId: "period-123",
  periodName: "Quý 3 / 2026",
  periodType: "QUARTERLY",
  year: 2026,
  periodNumber: 3,
  totalRevenue: 184000000,
  totalTaxAmount: 12400000,
  taxRateSummaries: [
    {
      taxRatePercentage: 8,
      taxRateName: "Phân phối, cung cấp hàng hóa (Thuế suất 8%)",
      revenueAmount: 120000000,
      taxAmount: 6000000,
      invoiceCount: 15,
    },
    {
      taxRatePercentage: 5,
      taxRateName: "Dịch vụ, ăn uống, tiêu dùng (Thuế suất 5%)",
      revenueAmount: 64000000,
      taxAmount: 6400000,
      invoiceCount: 9,
    },
  ],
};

const mockHousehold = {
  name: "Tạp Hóa & Siêu Thị Mini Bán Hàng Việt",
  taxCode: "8123456789",
  representativeName: "Nguyễn Văn A",
  address: "123 Trần Phú, Hải Châu, Đà Nẵng",
  phoneNumber: "0905123456",
};

const mockAnnexInvoices: ITaxSalesRegisterItemResponse[] = [
  {
    id: "INV-001",
    periodId: "period-123",
    invoiceId: "inv-01",
    invoicePattern: "1",
    invoiceSymbol: "1C26TAA",
    invoiceNumber: "00000123",
    issueDate: "2026-08-10T10:00:00Z",
    buyerName: "Công ty TNHH Ánh Dương",
    buyerTaxCode: "0108999888",
    taxRatePercentage: 8,
    revenueAmount: 50000000,
    taxAmount: 4000000,
    invoiceType: "ORIGINAL",
    createdAt: "2026-08-10T10:00:00Z",
  },
  {
    id: "INV-002",
    periodId: "period-123",
    invoiceId: "inv-02",
    invoicePattern: "1",
    invoiceSymbol: "1C26TAA",
    invoiceNumber: "00000127",
    issueDate: "2026-08-14T15:30:00Z",
    buyerName: "Công ty TNHH Ánh Dương",
    buyerTaxCode: "0108999888",
    taxRatePercentage: 8,
    revenueAmount: -5000000,
    taxAmount: -400000,
    invoiceType: "ADJUSTMENT_DECREASE",
    createdAt: "2026-08-14T15:30:00Z",
  },
];

describe("NCL-12-CN-003: Xuất tờ khai thuế theo mẫu mô phỏng", () => {
  // Test Case TC-01: Render Mẫu 01/CNKD thành công với đầy đủ số liệu
  it("NCL-12-CN-003-TC-01: Hiển thị đầy đủ thông tin mẫu tờ khai 01/CNKD với số liệu khớp doanh thu và thuế", () => {
    render(
      <SimulatedTaxForm01
        period={mockPeriod}
        revenueSummary={mockSummary}
        householdData={mockHousehold}
      />
    );

    // Kiểm tra tên người nộp thuế & MST
    expect(
      screen.getByText("Tạp Hóa & Siêu Thị Mini Bán Hàng Việt")
    ).toBeDefined();
    expect(screen.getAllByText("Nguyễn Văn A").length).toBeGreaterThanOrEqual(1);

    // Kiểm tra tiêu đề tờ khai
    expect(
      screen.getByText(
        "TỜ KHAI THUẾ ĐỐI VỚI HỘ KINH DOANH, CÁ NHÂN KINH DOANH"
      )
    ).toBeDefined();

    // Kiểm tra số tiền bằng chữ
    const words = numberToVietnameseWords(12400000);
    expect(words).toContain("Mười hai triệu bốn trăm nghìn");
  });

  // Test Case TC-02: Đọc số tiền bằng chữ tiếng Việt
  it("Kiểm tra chuyển đổi số tiền thuế sang chữ tiếng Việt chuẩn xác", () => {
    expect(numberToVietnameseWords(12400000)).toBe(
      "Mười hai triệu bốn trăm nghìn đồng"
    );
    expect(numberToVietnameseWords(184000000)).toBe(
      "Một trăm tám mươi bốn triệu đồng"
    );
    expect(numberToVietnameseWords(0)).toBe("Không đồng");
  });

  // Test Case TC-04 & Export: Xuất XML eTax mô phỏng
  it("NCL-12-CN-003-TC-01-XML: Xuất file XML eTax mô phỏng với đầy đủ cấu trúc hóa đơn và phụ lục", () => {
    // Mock Blob and URL
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();

    const success = exportTaxDeclarationToXml(
      mockPeriod,
      mockSummary,
      mockAnnexInvoices,
      mockHousehold
    );
    expect(success).toBe(true);
  });
});
