export const INVENTORY_VALUATION_SORT_FIELDS = [
  { value: "inventoryValue", label: "Giá trị tồn (vốn đọng)" },
  { value: "stockQuantity", label: "Số lượng tồn kho" },
  { value: "costPrice", label: "Giá vốn bình quân" },
  { value: "daysInStock", label: "Số ngày lưu kho" },
  { value: "productName", label: "Tên mặt hàng" },
] as const;

export type TInventoryValuationSortField =
  (typeof INVENTORY_VALUATION_SORT_FIELDS)[number]["value"];

export const INVENTORY_VALUATION_UI = {
  TITLE: "Báo cáo giá trị tồn kho theo giá vốn",
  SUBTITLE:
    "Định giá vốn tồn kho toàn cửa hàng, cơ cấu nhóm hàng và phân tích dòng tiền đọng theo quy tắc QTN-23",
  BADGE_RULE: "Nghiệp vụ QTN-23 & QTN-10",
  REALTIME_BADGE: "Thời gian thực (Hôm nay)",
  HISTORICAL_BADGE: "Lịch sử chốt ngày",
  EXPORT_BTN: "Xuất file Excel (.xlsx)",
  PRINT_BTN: "In báo cáo",
  SEARCH_PLACEHOLDER: "Tìm theo mã SKU, tên mặt hàng...",
  TAB_VALUATION_REPORT: "Báo cáo định giá kho",
  TAB_MISSING_COST: "Chưa có giá vốn",
  MISSING_COST_WARNING_TITLE: "Mặt hàng chưa có giá vốn từ phiếu nhập (QTN-23)",
  MISSING_COST_WARNING_DESC:
    "Các mặt hàng này được tách riêng và KHÔNG tính vào tổng giá trị tồn kho để đảm bảo tính chuẩn xác của số liệu tài chính.",
} as const;

export const INVENTORY_VALUATION_MESSAGES = {
  LOAD_FAILED: "Không thể tải dữ liệu báo cáo giá trị tồn kho.",
  EXPORT_SUCCESS: "Xuất tệp Excel báo cáo thành công.",
  EXPORT_FAILED: "Không thể xuất tệp Excel báo cáo giá trị tồn kho.",
  FUTURE_DATE_NOT_ALLOWED: "Không được chọn ngày chốt dữ liệu trong tương lai.",
} as const;

export const DAYS_IN_STOCK_LEVELS = {
  NORMAL: 30,
  WARNING: 60,
  CRITICAL: 90,
} as const;
