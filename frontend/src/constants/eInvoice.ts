export const E_INVOICE_STATUS = {
  DRAFT: "DRAFT",
  WAITING_TAX_CODE: "WAITING_TAX_CODE",
  ISSUED: "ISSUED",
  SEND_ERROR: "SEND_ERROR",
  ADJUSTED: "ADJUSTED",
  CANCELED: "CANCELED",
} as const;

export type TEInvoiceStatus =
  (typeof E_INVOICE_STATUS)[keyof typeof E_INVOICE_STATUS];

export const E_INVOICE_DEFAULTS = {
  EMPTY_TAX_AUTHORITY_CODE: "-",
} as const;

export const INVOICE_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: E_INVOICE_STATUS.DRAFT, label: "Nháp (DRAFT)" },
  { value: E_INVOICE_STATUS.WAITING_TAX_CODE, label: "Chờ cấp mã (WAITING)" },
  { value: E_INVOICE_STATUS.ISSUED, label: "Đã cấp mã (ISSUED)" },
  { value: E_INVOICE_STATUS.SEND_ERROR, label: "Lỗi gửi thuế (SEND_ERROR)" },
  { value: E_INVOICE_STATUS.ADJUSTED, label: "Điều chỉnh (ADJUSTED)" },
  { value: E_INVOICE_STATUS.CANCELED, label: "Đã hủy (CANCELED)" },
];

export const E_INVOICE_UI = {
  SIDEBAR: {
    TITLE: "Bộ lọc Hóa đơn",
    QUICK_SEARCH_LABEL: "Tìm kiếm nhanh",
    SEARCH_PLACEHOLDER: "Mã tra cứu, khách hàng...",
    DATE_FILTER_LABEL: "Thời gian lập",
    FROM_DATE_LABEL: "Từ ngày:",
    TO_DATE_LABEL: "Đến ngày:",
    STATUS_FILTER_LABEL: "Trạng thái hóa đơn",
  },
} as const;
