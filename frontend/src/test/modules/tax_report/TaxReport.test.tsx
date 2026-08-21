import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { SalesInvoiceListingTable } from "@/modules/tax_report/components/SalesInvoiceListingTable";
import { SalesInvoiceSummaryCards } from "@/modules/tax_report/components/SalesInvoiceSummaryCards";
import { TaxRevenueKPICards } from "@/modules/tax_report/components/TaxRevenueKPICards";
import { TaxRevenueByRateTable } from "@/modules/tax_report/components/TaxRevenueByRateTable";
import { InvalidTaxRateWarningBanner } from "@/modules/tax_report/components/InvalidTaxRateWarningBanner";
import { ForbiddenTaxReportAccess } from "@/modules/tax_report/components/ForbiddenTaxReportAccess";
import { ExportSalesInvoiceModal } from "@/modules/tax_report/components/ExportSalesInvoiceModal";
import type { ITaxSalesRegisterItem, ITaxPeriodResponse } from "@/modules/tax_report/types/salesInvoiceListing.types";
import type { ITaxRateRevenueSummaryItem, IInvalidTaxRateItem } from "@/modules/tax_report/types/taxRevenueSummary.types";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithProviders = (ui: React.ReactElement) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <NotificationProvider>{ui}</NotificationProvider>
      </BrowserRouter>
    </Provider>
  );
};

const mockListingItems: ITaxSalesRegisterItem[] = [
  {
    id: "item-1",
    periodId: "period-1",
    invoiceId: "inv-1",
    invoicePattern: "1",
    invoiceSymbol: "1C26TBB",
    invoiceNumber: "00000123",
    issueDate: "2026-08-15T09:30:00",
    buyerName: "Công ty TNHH ABC",
    buyerTaxCode: "0101234567",
    taxRatePercentage: 8,
    revenueAmount: 10000000,
    taxAmount: 800000,
    invoiceType: "ORIGINAL",
    notes: "Bán hàng đợt 1",
  },
  {
    id: "item-2",
    periodId: "period-1",
    invoiceId: "inv-2",
    invoicePattern: "1",
    invoiceSymbol: "1C26TBB",
    invoiceNumber: "00000124",
    issueDate: "2026-08-16T14:00:00",
    buyerName: "Nguyễn Văn B",
    buyerTaxCode: null,
    taxRatePercentage: 5,
    revenueAmount: -2000000,
    taxAmount: -100000,
    invoiceType: "ADJUSTMENT_DECREASE",
    notes: "Điều chỉnh giảm theo PTH-0001",
  },
];

const mockPeriod: ITaxPeriodResponse = {
  id: "period-1",
  householdId: "hh-1",
  periodName: "Kỳ kê khai Tháng 8/2026",
  periodType: "MONTHLY",
  year: 2026,
  periodNumber: 8,
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  status: "GENERATED",
  totalValidInvoices: 320,
  totalRevenue: 184000000,
  totalTaxAmount: 14720000,
  createdByName: "Kế toán trưởng",
};

describe("NCL-12: Module Sổ sách & Kê khai thuế theo kỳ (Tax Report)", () => {
  describe("NCL-12-CN-001: SalesInvoiceListingTable Component", () => {
    it("renders table with full invoice rows, headers, and footer total", () => {
      renderWithProviders(
        <SalesInvoiceListingTable
          items={mockListingItems}
          totalElements={2}
          totalPages={1}
          page={0}
          size={20}
        />
      );

      expect(screen.getByText("Bảng kê chi tiết Hóa đơn bán ra theo kỳ")).toBeInTheDocument();
      expect(screen.getByText("00000123")).toBeInTheDocument();
      expect(screen.getByText("Công ty TNHH ABC")).toBeInTheDocument();
      expect(screen.getByText("8%")).toBeInTheDocument();
      expect(screen.getByText("HĐ Gốc")).toBeInTheDocument();
    });

    it("renders adjustment decrease invoices with distinct badge and styling (TC-02)", () => {
      renderWithProviders(
        <SalesInvoiceListingTable
          items={mockListingItems}
          totalElements={2}
          totalPages={1}
          page={0}
          size={20}
        />
      );

      expect(screen.getByText("00000124")).toBeInTheDocument();
      expect(screen.getByText("ĐC Giảm (-)")).toBeInTheDocument();
      expect(screen.getByText("Nguyễn Văn B")).toBeInTheDocument();
    });

    it("renders friendly empty state when no invoices exist in period (TC-03)", () => {
      renderWithProviders(
        <SalesInvoiceListingTable
          items={[]}
          totalElements={0}
          totalPages={1}
          page={0}
          size={20}
        />
      );

      expect(screen.getByText("Kỳ chưa có hóa đơn hợp lệ")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Không tìm thấy hóa đơn được Cơ quan thuế cấp mã trong kỳ đã chọn. Hệ thống không tạo bảng kê rỗng."
        )
      ).toBeInTheDocument();
    });

    it("triggers pagination callback on page change click", () => {
      const handlePageChange = vi.fn();
      renderWithProviders(
        <SalesInvoiceListingTable
          items={mockListingItems}
          totalElements={50}
          totalPages={3}
          page={1}
          size={20}
          onPageChange={handlePageChange}
        />
      );

      const nextButton = screen.getByText("Trang sau");
      fireEvent.click(nextButton);
      expect(handlePageChange).toHaveBeenCalledWith(2);

      const prevButton = screen.getByText("Trang trước");
      fireEvent.click(prevButton);
      expect(handlePageChange).toHaveBeenCalledWith(0);
    });
  });

  describe("NCL-12-CN-001: SalesInvoiceSummaryCards Component", () => {
    it("renders summary cards with valid invoices count, net revenue, and tax amount", () => {
      renderWithProviders(<SalesInvoiceSummaryCards period={mockPeriod} />);

      expect(screen.getByText("320")).toBeInTheDocument();
      expect(screen.getByText("Đang mở (GENERATED)")).toBeInTheDocument();
      expect(screen.getByText("Doanh thu chịu thuế (Net)")).toBeInTheDocument();
      expect(screen.getByText("Tổng tiền thuế GTGT (Net)")).toBeInTheDocument();
    });

    it("displays LOCKED status badge when period is closed", () => {
      const lockedPeriod: ITaxPeriodResponse = {
        ...mockPeriod,
        status: "LOCKED",
      };
      renderWithProviders(<SalesInvoiceSummaryCards period={lockedPeriod} />);

      expect(screen.getByText("Đã chốt (LOCKED)")).toBeInTheDocument();
    });
  });

  describe("NCL-12-CN-002: TaxRevenueKPICards Component", () => {
    it("renders active tax rates count and validity indicator (TC-01)", () => {
      const summary = {
        periodId: "period-1",
        periodName: "Tháng 8/2026",
        periodType: "MONTHLY" as const,
        year: 2026,
        periodNumber: 8,
        totalRevenue: 184000000,
        totalTaxAmount: 14720000,
        taxRateSummaries: [
          { taxRatePercentage: 8, taxRateName: "Thuế suất 8%", revenueAmount: 100000000, taxAmount: 8000000, invoiceCount: 150 },
          { taxRatePercentage: 5, taxRateName: "Thuế suất 5%", revenueAmount: 84000000, taxAmount: 4200000, invoiceCount: 170 },
        ],
      };

      renderWithProviders(<TaxRevenueKPICards summary={summary} hasExpiredWarning={false} />);

      expect(screen.getByText("Phân tích mức thuế")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("✓ Thuế suất hợp lệ 100%")).toBeInTheDocument();
      expect(screen.getByText("Thuế GTGT phải nộp")).toBeInTheDocument();
    });

    it("displays warning badge when expired tax rate is detected (TC-02)", () => {
      renderWithProviders(<TaxRevenueKPICards hasExpiredWarning={true} />);

      expect(screen.getByText("Phát sinh thuế ngưng hiệu lực")).toBeInTheDocument();
    });
  });

  describe("NCL-12-CN-002: TaxRevenueByRateTable Component", () => {
    it("renders breakdown table by tax rates with revenue share percentages (TC-01)", () => {
      const rateItems: ITaxRateRevenueSummaryItem[] = [
        {
          taxRatePercentage: 8,
          taxRateName: "Thuế suất 8.0%",
          revenueAmount: 100000000,
          taxAmount: 8000000,
          invoiceCount: 200,
        },
        {
          taxRatePercentage: 5,
          taxRateName: "Thuế suất 5.0%",
          revenueAmount: 50000000,
          taxAmount: 2500000,
          invoiceCount: 100,
        },
      ];

      renderWithProviders(
        <TaxRevenueByRateTable
          items={rateItems}
          grandTotalRevenue={150000000}
          grandTotalTax={10500000}
        />
      );

      expect(
        screen.getByText("Bảng Tổng hợp Doanh thu chịu thuế & Tiền thuế GTGT theo Thuế suất")
      ).toBeInTheDocument();
      expect(screen.getByText("Thuế suất 8.0%")).toBeInTheDocument();
      expect(screen.getByText("Thuế suất 5.0%")).toBeInTheDocument();
      expect(screen.getByText("66.7%")).toBeInTheDocument();
      expect(screen.getByText("33.3%")).toBeInTheDocument();
      expect(screen.getByText("Tổng cộng kỳ kê khai:")).toBeInTheDocument();
    });
  });

  describe("NCL-12-CN-002: InvalidTaxRateWarningBanner Component", () => {
    it("renders warning banner with action link to tax rate settings (TC-02)", () => {
      const invalidItems: IInvalidTaxRateItem[] = [
        {
          id: "item-inv-1",
          productCode: "SP001",
          productName: "Bia Saigon Special",
          invoiceSymbolNumber: "1C26TBB-00000123",
          assignedTaxRate: "VAT 10% (Cũ)",
          reason: "Mức thuế suất đã bị vô hiệu hóa từ 01/07/2026",
        },
      ];

      renderWithProviders(
        <InvalidTaxRateWarningBanner
          items={invalidItems}
          errorMessage="Có mặt hàng trong kỳ đang gán mức thuế đã ngừng hiệu lực."
        />
      );

      expect(screen.getByText("Cảnh báo thuế")).toBeInTheDocument();
      expect(screen.getByText("SP001")).toBeInTheDocument();
      expect(screen.getByText("Bia Saigon Special")).toBeInTheDocument();
      expect(screen.getByText("Cập nhật mức thuế")).toBeInTheDocument();
    });

    it("toggles item list expansion when clicking toggle button", () => {
      const invalidItems: IInvalidTaxRateItem[] = [
        {
          id: "item-inv-1",
          productCode: "SP002",
          productName: "Nước ngọt Coca",
          invoiceSymbolNumber: "1C26TBB-00000124",
          assignedTaxRate: "VAT 10%",
          reason: "Thuế hết hạn",
        },
      ];

      renderWithProviders(
        <InvalidTaxRateWarningBanner
          items={invalidItems}
          errorMessage="Lỗi thuế ngưng hiệu lực"
        />
      );

      const toggleButton = screen.getByText("Ẩn danh sách");
      fireEvent.click(toggleButton);
      expect(screen.getByText("Xem chi tiết")).toBeInTheDocument();
    });
  });

  describe("NCL-12-CN-001 & 002: ForbiddenTaxReportAccess Component", () => {
    it("renders security barrier screen with navigation actions (TC-04 & TC-03)", () => {
      renderWithProviders(<ForbiddenTaxReportAccess />);

      expect(screen.getByText("Chặn truy cập bảo mật (TC-03)")).toBeInTheDocument();
      expect(
        screen.getByText("Không có quyền xem Tổng hợp doanh thu chịu thuế")
      ).toBeInTheDocument();
      expect(screen.getByText("Quay lại Màn hình Bán hàng (POS)")).toBeInTheDocument();
      expect(screen.getByText("Trang chủ")).toBeInTheDocument();
    });
  });

  describe("NCL-12-CN-003: ExportSalesInvoiceModal Component", () => {
    it("renders export modal and handles format selection and callbacks", () => {
      const handleClose = vi.fn();
      const handleConfirm = vi.fn();

      renderWithProviders(
        <ExportSalesInvoiceModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          filters={{ periodType: "MONTHLY", periodNumber: 8, year: 2026 }}
        />
      );

      expect(screen.getByText("Xuất Bảng kê & Tờ khai thuế")).toBeInTheDocument();
      expect(screen.getByText("Tháng 8/2026")).toBeInTheDocument();

      const pdfRadio = screen.getByLabelText(/PDF/i);
      fireEvent.click(pdfRadio);

      const exportBtn = screen.getByText("Tải tệp kê khai");
      fireEvent.click(exportBtn);
      expect(handleConfirm).toHaveBeenCalledWith("pdf");
    });
  });
});
