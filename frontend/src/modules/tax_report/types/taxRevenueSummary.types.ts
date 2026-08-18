import type { EPeriodType } from "./salesInvoiceListing.types";

export interface ITaxRateRevenueSummaryItem {
  taxRatePercentage: number;  // Giá trị phần trăm thuế (vd: 8.0, 5.0, 0.0)
  taxRateName: string;        // Tên mức thuế (vd: "Thuế suất 8.0%", "Thuế suất 5.0%")
  revenueAmount: number;      // Doanh thu chịu thuế net tương ứng (VND)
  taxAmount: number;          // Tiền thuế GTGT tương ứng (VND)
  invoiceCount: number;       // Số lượng hóa đơn phát sinh
}

export interface ITaxRevenueSummaryResponse {
  periodId: string;
  periodName: string;
  periodType: EPeriodType;
  year: number;
  periodNumber: number;
  totalRevenue: number;
  totalTaxAmount: number;
  taxRateSummaries: ITaxRateRevenueSummaryItem[];
}

export interface IInvalidTaxRateItem {
  id: string;
  productCode: string;
  productName: string;
  invoiceSymbolNumber: string;
  assignedTaxRate: string;
  reason: string;
}
