export const AUDIT_LOG_ACTIONS = {
  // E-Invoice actions
  ISSUE_INVOICE: "ISSUE_INVOICE",
  CANCEL_INVOICE: "CANCEL_INVOICE",
  ADJUST_INVOICE: "ADJUST_INVOICE",
  RETRY_INVOICE: "RETRY_INVOICE",
  TAX_AUTHORITY_ACCEPT: "TAX_AUTHORITY_ACCEPT",
  TAX_AUTHORITY_REJECT: "TAX_AUTHORITY_REJECT",
  
  // Return Ticket actions
  CREATE_RETURN_TICKET: "CREATE_RETURN_TICKET",
  APPROVE_RETURN_TICKET: "APPROVE_RETURN_TICKET",
  REJECT_RETURN_TICKET: "REJECT_RETURN_TICKET",
  
  // Inventory actions
  KIEM_KE_KHO: "KIEM_KE_KHO",
  GOODS_RECEIPT_CREATE: "GOODS_RECEIPT_CREATE",
  
  // Order actions
  CREATE_ORDER: "CREATE_ORDER",
  COMPLETE_ORDER: "COMPLETE_ORDER",
  ADD_ORDER_ITEM: "ADD_ORDER_ITEM",
  SET_PAYMENT_METHOD: "SET_PAYMENT_METHOD",
  CANCEL_ORDER: "CANCEL_ORDER",
  UPDATE_ORDER: "UPDATE_ORDER",
  
  // Tax period actions
  CLOSE_TAX_PERIOD: "CLOSE_TAX_PERIOD",
  REOPEN_TAX_PERIOD: "REOPEN_TAX_PERIOD",
  LOCK_TAX_PERIOD: "LOCK_TAX_PERIOD",
  CREATE_TAX_PERIOD: "CREATE_TAX_PERIOD",
  UPDATE_TAX_RATE: "UPDATE_TAX_RATE",
  
  // System / Backup / Restore actions
  AUTO_BACKUP_EXECUTE: "AUTO_BACKUP_EXECUTE",
  MANUAL_BACKUP_EXECUTE: "MANUAL_BACKUP_EXECUTE",
  RESTORE_DATA_EXECUTE: "RESTORE_DATA_EXECUTE",
  ANOMALY_SCAN: "ANOMALY_SCAN",
  REVIEW_ANOMALY_ALERT: "REVIEW_ANOMALY_ALERT",
  
  // Self-auditing actions
  AUDIT_LOG_VIEW: "AUDIT_LOG_VIEW",
  AUDIT_LOG_EXPORT: "AUDIT_LOG_EXPORT",
} as const;

export type TAuditLogAction = (typeof AUDIT_LOG_ACTIONS)[keyof typeof AUDIT_LOG_ACTIONS];

export const AUDIT_ACTION_MAP: Record<string, { label: string; category: string }> = {
  // E-Invoice
  ISSUE_INVOICE: { label: "Phát hành hóa đơn", category: "Hóa đơn điện tử" },
  CANCEL_INVOICE: { label: "Hủy hóa đơn", category: "Hóa đơn điện tử" },
  ADJUST_INVOICE: { label: "Điều chỉnh hóa đơn", category: "Hóa đơn điện tử" },
  RETRY_INVOICE: { label: "Gửi lại cơ quan thuế", category: "Hóa đơn điện tử" },
  TAX_AUTHORITY_ACCEPT: { label: "Thuế duyệt cấp mã", category: "Hóa đơn điện tử" },
  TAX_AUTHORITY_REJECT: { label: "Thuế từ chối cấp mã", category: "Hóa đơn điện tử" },

  // Return Ticket
  CREATE_RETURN_TICKET: { label: "Lập phiếu trả hàng", category: "Trả hàng" },
  APPROVE_RETURN_TICKET: { label: "Duyệt phiếu trả hàng", category: "Trả hàng" },
  REJECT_RETURN_TICKET: { label: "Từ chối trả hàng", category: "Trả hàng" },

  // Orders / POS
  CREATE_ORDER: { label: "Tạo đơn hàng", category: "Đơn hàng" },
  COMPLETE_ORDER: { label: "Hoàn tất đơn hàng", category: "Đơn hàng" },
  ADD_ORDER_ITEM: { label: "Thêm món vào đơn", category: "Đơn hàng" },
  SET_PAYMENT_METHOD: { label: "Phương thức thanh toán", category: "Đơn hàng" },
  CANCEL_ORDER: { label: "Hủy đơn hàng", category: "Đơn hàng" },
  UPDATE_ORDER: { label: "Cập nhật đơn hàng", category: "Đơn hàng" },
  ORDER_CREATE: { label: "Tạo đơn hàng", category: "Đơn hàng" },
  ORDER_COMPLETE: { label: "Hoàn tất đơn hàng", category: "Đơn hàng" },
  ORDER_CANCEL: { label: "Hủy đơn hàng", category: "Đơn hàng" },

  // Inventory
  KIEM_KE_KHO: { label: "Kiểm kê & Cân tồn kho", category: "Kho hàng" },
  GOODS_RECEIPT_CREATE: { label: "Nhập hàng vào kho", category: "Kho hàng" },

  // Tax
  CLOSE_TAX_PERIOD: { label: "Khóa kỳ kê khai thuế", category: "Kê khai thuế" },
  REOPEN_TAX_PERIOD: { label: "Mở lại kỳ kê khai", category: "Kê khai thuế" },
  LOCK_TAX_PERIOD: { label: "Khóa vĩnh viễn kỳ thuế", category: "Kê khai thuế" },
  CREATE_TAX_PERIOD: { label: "Tạo kỳ kê khai mới", category: "Kê khai thuế" },
  UPDATE_TAX_RATE: { label: "Cập nhật thuế suất", category: "Cấu hình thuế" },

  // System
  AUTO_BACKUP_EXECUTE: { label: "Sao lưu tự động", category: "Hệ thống" },
  MANUAL_BACKUP_EXECUTE: { label: "Sao lưu thủ công", category: "Hệ thống" },
  RESTORE_DATA_EXECUTE: { label: "Phục hồi dữ liệu", category: "Hệ thống" },
  ANOMALY_SCAN: { label: "Quét giao dịch bất thường", category: "Giám sát rủi ro" },
  REVIEW_ANOMALY_ALERT: { label: "Xử lý cảnh báo rủi ro", category: "Giám sát rủi ro" },
  AUDIT_LOG_VIEW: { label: "Tra cứu nhật ký", category: "Kiểm toán" },
  AUDIT_LOG_EXPORT: { label: "Xuất báo cáo kiểm toán", category: "Kiểm toán" },
};

export const AUDIT_TABLE_MAP: Record<string, string> = {
  e_invoices: "Hóa đơn điện tử",
  invoices: "Hóa đơn điện tử",
  return_tickets: "Phiếu trả hàng",
  inventory_audits: "Phiếu kiểm kê kho",
  goods_receipts: "Phiếu nhập hàng",
  orders: "Đơn hàng bán lẻ",
  tax_declaration_periods: "Kỳ kê khai thuế",
  tax_rates: "Biểu thuế suất",
  backup_histories: "Sao lưu & Phục hồi",
  activity_logs: "Nhật ký kiểm toán",
  anomaly_alerts: "Cảnh báo bất thường",
  users: "Tài khoản nhân viên",
  business_households: "Hồ sơ Hộ kinh doanh",
};

export const AUDIT_TARGET_TABLES = [
  { value: "e_invoices", label: "Hóa đơn điện tử" },
  { value: "return_tickets", label: "Phiếu trả hàng" },
  { value: "inventory_audits", label: "Phiếu kiểm kê kho" },
  { value: "goods_receipts", label: "Phiếu nhập hàng" },
  { value: "orders", label: "Đơn hàng bán lẻ" },
  { value: "tax_declaration_periods", label: "Kỳ kê khai thuế" },
  { value: "tax_rates", label: "Biểu thuế suất" },
  { value: "backup_histories", label: "Sao lưu & Phục hồi" },
  { value: "activity_logs", label: "Nhật ký kiểm toán" },
  { value: "anomaly_alerts", label: "Cảnh báo bất thường" },
  { value: "users", label: "Tài khoản nhân viên" },
  { value: "business_households", label: "Hồ sơ Hộ kinh doanh" },
] as const;

export const AUDIT_ACTION_OPTIONS = [
  { value: "", label: "Tất cả hành động" },
  { value: "CREATE_ORDER", label: "Tạo đơn hàng" },
  { value: "COMPLETE_ORDER", label: "Hoàn tất đơn hàng" },
  { value: "ISSUE_INVOICE", label: "Phát hành hóa đơn" },
  { value: "CANCEL_INVOICE", label: "Hủy hóa đơn" },
  { value: "ADJUST_INVOICE", label: "Điều chỉnh hóa đơn" },
  { value: "CREATE_RETURN_TICKET", label: "Lập phiếu trả hàng" },
  { value: "APPROVE_RETURN_TICKET", label: "Duyệt phiếu trả hàng" },
  { value: "REJECT_RETURN_TICKET", label: "Từ chối trả hàng" },
  { value: "KIEM_KE_KHO", label: "Kiểm kê & Cân tồn kho" },
  { value: "CLOSE_TAX_PERIOD", label: "Khóa kỳ kê khai thuế" },
  { value: "RESTORE_DATA_EXECUTE", label: "Phục hồi dữ liệu sao lưu" },
  { value: "AUDIT_LOG_VIEW", label: "Tra cứu nhật ký" },
  { value: "AUDIT_LOG_EXPORT", label: "Xuất tệp báo cáo kiểm toán" },
] as const;

export const AUDIT_LOG_UI = {
  TITLE: "Nhật ký kiểm toán",
  SUBTITLE:
    "Hệ thống ghi vết bất biến, lưu giữ bằng chứng giải trình kiểm toán và thuế an toàn, minh bạch.",
  INTEGRITY_CHECK_BTN: "Kiểm tra tính toàn vẹn",
  EXPORT_EXCEL_BTN: "Xuất Excel báo cáo",
  SEARCH_PLACEHOLDER: "Tìm kiếm theo mã, người dùng, thao tác...",
  EMPTY_LOGS: "Không có nhật ký kiểm toán nào phù hợp với bộ lọc hiện tại.",
  COLUMNS: {
    SEQUENCE: "STT",
    TIMESTAMP: "Thời gian",
    ACTOR: "Người thực hiện",
    ACTION: "Hành động",
    TARGET: "Mục tiêu tác động",
  },
  RBAC_WARNING: {
    TITLE: "Yêu cầu quyền truy cập kiểm toán",
    MESSAGE:
      "Chỉ có Chủ hộ kinh doanh (VT-01) hoặc Quản trị nền tảng (VT-04) mới được phép tra cứu nhật ký kiểm toán.",
    ACTION_BACK: "Quay lại Bảng điều khiển",
  },
};
