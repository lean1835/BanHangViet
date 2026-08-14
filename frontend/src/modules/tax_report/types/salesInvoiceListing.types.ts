export type EPeriodType = "MONTH" | "QUARTER" | "YEAR";

export type EInvoiceTaxListingStatus =
  | "GRANTED_CODE"
  | "CANCELED"
  | "ADJUSTED_REDUCED"
  | "ADJUSTED_INCREASED";

export interface ITaxPeriodQueryParams {
  periodType: EPeriodType;
  periodValue: number; // Month 1-12 or Quarter 1-4
  year: number;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ISalesInvoiceListingItem {
  id: string;
  invoiceSymbol: string;      // Ký hiệu mẫu số & ký hiệu HĐ (VD: 1/001 - C26TNV)
  invoiceNumber: string;      // Số hóa đơn (VD: 00001234)
  issuedDate: string;         // Ngày lập hóa đơn (ISO String)
  customerName: string;       // Tên người mua hàng
  customerTaxCode: string;   // Mã số thuế người mua (nếu có)
  revenue: number;            // Doanh thu chưa thuế (VND)
  taxRate: number;            // Mức thuế suất (0, 5, 8, 10%)
  taxAmount: number;          // Tiền thuế GTGT (VND)
  totalAmount: number;        // Tổng tiền thanh toán (VND)
  taxAuthorityCode: string;   // Mã CQT cấp
  status: EInvoiceTaxListingStatus;
  note?: string;              // Ghi chú (VD: "Đã trừ bớt 500,000đ do ĐC giảm")
}

export interface ISalesInvoiceSummary {
  totalInvoices: number;          // Tổng số dòng hóa đơn trong kỳ
  validInvoicesCount: number;     // Số hóa đơn hợp lệ đã cấp mã
  canceledInvoicesCount: number;  // Số hóa đơn đã hủy (bị loại khỏi tính toán)
  adjustedInvoicesCount: number;  // Số hóa đơn điều chỉnh
  totalRevenue: number;           // Doanh thu chịu thuế net (VND) (Đã trừ ĐC giảm)
  totalTaxAmount: number;         // Tổng tiền thuế GTGT net (VND) (Đã trừ ĐC giảm)
  totalAmount: number;            // Tổng tiền thanh toán net (VND)
}

export interface ISalesInvoiceListingResponse {
  summary: ISalesInvoiceSummary;
  items: ISalesInvoiceListingItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IExportSalesInvoiceParams extends ITaxPeriodQueryParams {
  format?: "excel" | "pdf";
}
