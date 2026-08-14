import type { EPeriodType } from "./salesInvoiceListing.types";

export type ETaxRateStatus = "ACTIVE" | "EXPIRED";

export interface ITaxRateGroupSummary {
  id: string;
  taxRateLabel: string;        // Ví dụ: "Thuế suất 8%", "Thuế suất 5%", "KCT (Không chịu thuế)"
  taxRateValue: number;        // Giá trị phần trăm (vd: 8, 5, 0, -1 cho KCT)
  taxableRevenue: number;      // Doanh thu chưa thuế (Net - đã trừ ĐC giảm) (VND)
  taxAmount: number;           // Tiền thuế GTGT tương ứng (VND)
  totalPayment: number;        // Tổng tiền thanh toán (VND)
  revenueSharePercent: number; // Tỷ trọng doanh thu (%)
  invoiceItemCount: number;    // Số lượng dòng hóa đơn phát sinh
  status: ETaxRateStatus;      // Trạng thái mức thuế đang áp dụng hay ngưng hiệu lực
  note?: string;               // Ghi chú chi tiết
}

export interface IInvalidTaxRateItem {
  id: string;
  productCode: string;          // Mã hàng hóa (vd: SP001)
  productName: string;          // Tên hàng hóa (vd: Bánh mì pate)
  invoiceSymbolNumber: string;  // Số hóa đơn / Ký hiệu (vd: 1/001 - 00001234)
  assignedTaxRate: string;      // Mức thuế đang gán (vd: 10%)
  reason: string;               // Lý do (vd: "Mức thuế 10% đã ngưng hiệu lực từ 31/12")
}

export interface ITaxRevenueSummary {
  totalTaxableRevenue: number;        // Tổng doanh thu chịu thuế (Net)
  totalTaxAmount: number;             // Tổng tiền thuế GTGT phải nộp (Net)
  totalAmount: number;                // Tổng tiền thanh toán
  activeTaxRateGroupsCount: number;   // Số lượng nhóm thuế suất đang áp dụng
  hasExpiredTaxRateWarning: boolean;  // Có cảnh báo thuế suất ngưng hiệu lực hay không
}

export interface ITaxRevenueSummaryResponse {
  periodTitle: string;
  periodType: EPeriodType;
  periodValue: number;
  year: number;
  summary: ITaxRevenueSummary;
  taxRateGroups: ITaxRateGroupSummary[];
  invalidTaxRateItems: IInvalidTaxRateItem[];
}
