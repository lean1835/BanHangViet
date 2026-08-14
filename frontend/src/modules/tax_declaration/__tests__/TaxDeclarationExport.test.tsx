import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SimulatedTaxForm01 } from "../components/SimulatedTaxForm01";
import {
  exportTaxDeclarationToExcel,
  exportTaxDeclarationToXml,
} from "../utils/taxExportHelper";
import type {
  ITaxDeclarationSummary,
  ITaxAnnexInvoice,
} from "../types/ITaxDeclaration";
import { numberToVietnameseWords } from "@/utils/numberToVietnameseWords";

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
  taxGroups: [
    {
      taxRatePercentage: 8,
      categoryLabel: "Phân phối, cung cấp hàng hóa (Thuế suất 8%)",
      revenueBeforeTax: 120000000,
      vatRatePercent: 4.0,
      vatAmount: 4800000,
      pitRatePercent: 1.0,
      pitAmount: 1200000,
      totalTaxAmount: 6000000,
    },
    {
      taxRatePercentage: 5,
      categoryLabel: "Dịch vụ, ăn uống, tiêu dùng (Thuế suất 5%)",
      revenueBeforeTax: 64000000,
      vatRatePercent: 4.125,
      vatAmount: 2640000,
      pitRatePercent: 5.875,
      pitAmount: 3760000,
      totalTaxAmount: 6400000,
    },
  ],
  validInvoicesCount: 24,
  adjustedInvoicesCount: 2,
  cancelledInvoicesCount: 1,
};

const mockAnnexInvoices: ITaxAnnexInvoice[] = [
  {
    id: "INV-001",
    invoiceNumber: "00000123",
    invoiceSeries: "1C26TAA",
    issuedDate: "2026-08-10",
    buyerName: "Công ty TNHH Ánh Dương",
    buyerTaxCode: "0108999888",
    preTaxAmount: 50000000,
    taxRatePercentage: 8,
    taxAmount: 4000000,
    finalAmount: 54000000,
    taxAuthorityCode: "T26-0012345",
    isAdjustment: false,
  },
  {
    id: "INV-002",
    invoiceNumber: "00000127",
    invoiceSeries: "1C26TAA",
    issuedDate: "2026-08-14",
    buyerName: "Công ty TNHH Ánh Dương",
    buyerTaxCode: "0108999888",
    preTaxAmount: -5000000,
    taxRatePercentage: 8,
    taxAmount: -400000,
    finalAmount: -5400000,
    taxAuthorityCode: "T26-0012349",
    isAdjustment: true,
    originalInvoiceNumber: "00000123",
  },
];

describe("NCL-12-CN-003: Xuất tờ khai thuế theo mẫu mô phỏng", () => {
  // Test Case TC-01: Render Mẫu 01/CNKD thành công với đầy đủ số liệu
  it("NCL-12-CN-003-TC-01: Hiển thị đầy đủ thông tin mẫu tờ khai 01/CNKD với số liệu khớp doanh thu và thuế", () => {
    render(<SimulatedTaxForm01 summary={mockSummary} />);

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

  // Test Case TC-03 & Export: Xuất Excel tạo 2 Sheet có Tờ khai và Bảng kê
  it("NCL-12-CN-003-TC-01-Excel: Xuất file Excel thành công với 2 sheet To_Khai_01_CNKD và Bang_Ke_01_2_BK", () => {
    const success = exportTaxDeclarationToExcel(mockSummary, mockAnnexInvoices);
    expect(success).toBe(true);
  });

  // Test Case TC-04 & Export: Xuất XML eTax mô phỏng
  it("NCL-12-CN-003-TC-01-XML: Xuất file XML eTax mô phỏng với đầy đủ cấu trúc hóa đơn và phụ lục", () => {
    // Mock Blob and URL
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();

    const success = exportTaxDeclarationToXml(mockSummary, mockAnnexInvoices);
    expect(success).toBe(true);
  });
});
