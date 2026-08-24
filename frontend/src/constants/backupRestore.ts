export const BACKUP_TYPES = {
  FULL: "FULL",
  PRODUCTS: "PRODUCTS",
  ORDERS: "ORDERS",
  INVOICES: "INVOICES",
} as const;

export type TBackupType = (typeof BACKUP_TYPES)[keyof typeof BACKUP_TYPES];

export const BACKUP_TYPE_LABELS: Record<TBackupType, string> = {
  [BACKUP_TYPES.FULL]: "Toàn bộ cơ sở dữ liệu (Full Backup)",
  [BACKUP_TYPES.PRODUCTS]: "Danh mục Hàng hóa & Tồn kho",
  [BACKUP_TYPES.ORDERS]: "Lịch sử Đơn bán hàng (Orders)",
  [BACKUP_TYPES.INVOICES]: "Hóa đơn điện tử thuế GTGT",
};

export const BACKUP_TRIGGER_TYPES = {
  AUTOMATIC: "AUTOMATIC",
  MANUAL: "MANUAL",
} as const;

export type TBackupTriggerType = (typeof BACKUP_TRIGGER_TYPES)[keyof typeof BACKUP_TRIGGER_TYPES];

export const BACKUP_TRIGGER_TYPE_LABELS: Record<TBackupTriggerType, string> = {
  [BACKUP_TRIGGER_TYPES.AUTOMATIC]: "Tự động theo lịch",
  [BACKUP_TRIGGER_TYPES.MANUAL]: "Kích hoạt thủ công",
};

export const BACKUP_STATUSES = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  PURGED: "PURGED",
} as const;

export type TBackupStatus = (typeof BACKUP_STATUSES)[keyof typeof BACKUP_STATUSES];

export const BACKUP_STATUS_LABELS: Record<TBackupStatus, string> = {
  [BACKUP_STATUSES.SUCCESS]: "Thành công",
  [BACKUP_STATUSES.FAILED]: "Thất bại",
  [BACKUP_STATUSES.PURGED]: "Đã dọn dẹp (Purged)",
};

export const BACKUP_STATUS_STYLES: Record<
  TBackupStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  [BACKUP_STATUSES.SUCCESS]: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Thành công",
  },
  [BACKUP_STATUSES.FAILED]: {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    text: "text-rose-700",
    border: "border-rose-200",
    label: "Thất bại",
  },
  [BACKUP_STATUSES.PURGED]: {
    bg: "bg-slate-100 text-slate-600 border-slate-300",
    text: "text-slate-600",
    border: "border-slate-300",
    label: "Đã dọn dẹp",
  },
};

export const RESTORE_STATUSES = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;

export type TRestoreStatus = (typeof RESTORE_STATUSES)[keyof typeof RESTORE_STATUSES];

export const RESTORE_STATUS_STYLES: Record<
  TRestoreStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  [RESTORE_STATUSES.SUCCESS]: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Thành công",
  },
  [RESTORE_STATUSES.FAILED]: {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    text: "text-rose-700",
    border: "border-rose-200",
    label: "Thất bại",
  },
};

export const BACKUP_RESTORE_CONFIG = {
  MIN_RETENTION_COUNT: 1,
  MAX_RETENTION_COUNT: 100,
  DEFAULT_RETENTION_COUNT: 30,
  DEFAULT_SCHEDULED_TIME: "02:00",
  TIME_REGEX: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DEFAULT_PAGE_SIZE: 10,
} as const;

export const BACKUP_RESTORE_UI = {
  PAGE_TITLE: "Sao lưu & Phục hồi dữ liệu",
  PAGE_SUBTITLE: "Bảo đảm an toàn dữ liệu, chống mất mát và khôi phục khi gặp sự cố hệ thống",
  TABS: {
    AUTO_BACKUP: "auto_backup",
    RESTORE: "restore",
    MANUAL_EXPORT: "manual_export",
    LABELS: {
      AUTO_BACKUP: "Sao lưu tự động & Lịch sử",
      RESTORE: "Phục hồi dữ liệu",
      MANUAL_EXPORT: "Xuất dữ liệu thủ công (Excel/ZIP)",
    },
  },
  RBAC_WARNING: {
    TITLE: "Giới hạn quyền quản trị sao lưu & phục hồi",
    DESCRIPTION:
      "Chức năng cấu hình sao lưu tự động và phục hồi cơ sở dữ liệu chỉ dành cho vai trò Chủ hộ kinh doanh (VT-01). Bạn không có quyền thực hiện thao tác này.",
    ACTION_BACK: "Quay lại trang chủ",
  },
  OVERVIEW: {
    AUTO_STATUS_LABEL: "Tự động sao lưu:",
    SCHEDULED_TIME_LABEL: "Thời gian chạy hằng ngày:",
    RETENTION_LABEL: "Bản sao lưu lưu giữ tối đa:",
    LAST_BACKUP_LABEL: "Lần sao lưu gần nhất:",
    TOTAL_STORAGE_LABEL: "Tổng dung lượng lưu trữ:",
    ACTIVE_COUNT_LABEL: "Số bản sao lưu hiện hữu:",
    TRIGGER_BTN: "Sao lưu ngay",
    TRIGGERING_BTN: "Đang tạo bản sao lưu...",
  },
  CONFIG: {
    CARD_TITLE: "Cấu hình lịch sao lưu tự động",
    ENABLE_LABEL: "Bật chế độ tự động sao lưu định kỳ mỗi ngày",
    TIME_LABEL: "Thời điểm chạy sao lưu trong ngày (HH:mm):",
    TIME_PLACEHOLDER: "Ví dụ: 02:00 hoặc 23:30",
    RETENTION_LABEL: "Số lượng bản sao lưu giữ lại (1 - 100 bản):",
    TYPE_LABEL: "Phạm vi dữ liệu mặc định:",
    SAVE_BTN: "Lưu thiết lập",
    SAVING_BTN: "Đang lưu cấu hình...",
  },
  HISTORY: {
    TABLE_TITLE: "Lịch sử các bản sao lưu",
    COLUMNS: {
      FILE_NAME: "Tên tệp sao lưu",
      TYPE: "Phạm vi",
      TRIGGER: "Hình thức",
      SIZE: "Dung lượng",
      STATUS: "Trạng thái",
      CREATED_BY: "Người thực hiện",
      TIME: "Thời điểm sao lưu",
    },
    EMPTY: "Chưa có bản ghi lịch sử sao lưu nào.",
  },
  RESTORE: {
    AVAILABLE_TITLE: "Các điểm khôi phục (Bản sao lưu khả dụng)",
    AVAILABLE_SUBTITLE: "Chọn một bản sao lưu trạng thái [Thành công] để xem trước và phục hồi dữ liệu",
    COLUMNS: {
      FILE_NAME: "Tên bản sao lưu",
      TYPE: "Phạm vi",
      SIZE: "Dung lượng",
      TIME: "Thời điểm sao lưu",
      ACTION: "Thao tác",
    },
    RESTORE_ACTION_BTN: "Khôi phục từ bản này",
    EMPTY_AVAILABLE: "Không có bản sao lưu nào khả dụng để phục hồi.",
    HISTORY_TITLE: "Lịch sử các lần phục hồi dữ liệu",
    HISTORY_COLUMNS: {
      RESTORE_ID: "Mã phục hồi",
      BACKUP_FILE: "Từ bản sao lưu",
      TYPE: "Phạm vi",
      STATUS: "Trạng thái",
      RESTORED_BY: "Người thực hiện",
      RESTORED_AT: "Thời gian phục hồi",
      NOTES: "Ghi chú",
    },
    EMPTY_HISTORY: "Chưa có lịch sử phục hồi dữ liệu nào.",
  },
  PREVIEW_MODAL: {
    TITLE: "Xác nhận phục hồi dữ liệu từ bản sao lưu",
    SUBTITLE: "Xem trước thông tin bản sao lưu và xác nhận an toàn trước khi khôi phục",
    FILE_NAME_LABEL: "Tên tệp sao lưu:",
    BACKUP_TIME_LABEL: "Thời điểm tạo bản sao lưu:",
    SIZE_LABEL: "Dung lượng tệp:",
    TYPE_LABEL: "Phạm vi phục hồi:",
    STATUS_LABEL: "Trạng thái bản sao lưu:",
    CREATED_BY_LABEL: "Người tạo bản sao lưu:",
    WARNING_TITLE: "CẢNH BÁO QUAN TRỌNG VỀ PHỤC HỒI DỮ LIỆU",
    WARNING_DESC:
      "Thao tác phục hồi sẽ GHI ĐÈ dữ liệu hiện tại về đúng trạng thái tại thời điểm tạo bản sao lưu. Các giao dịch, đơn hàng hoặc hóa đơn phát sinh sau thời điểm này có thể bị hoàn tác. Thao tác này KHÔNG THỂ đảo ngược.",
    INELIGIBLE_ALERT:
      "Bản sao lưu này không đủ điều kiện để phục hồi (bị lỗi hoặc đã bị dọn dẹp). Vui lòng chọn bản sao lưu khác!",
    CONFIRM_CHECKBOX: "Tôi hiểu rõ rủi ro và xác nhận đồng ý phục hồi toàn bộ dữ liệu từ bản sao lưu này.",
    NOTES_LABEL: "Ghi chú lý do phục hồi (bắt buộc ghi nhận kiểm toán):",
    NOTES_PLACEHOLDER: "Ví dụ: Phục hồi sau sự cố mất điện / kiểm tra số liệu quý...",
    EXECUTE_BTN: "Tiến hành phục hồi CSDL",
    EXECUTING_BTN: "Đang phục hồi dữ liệu...",
    CANCEL_BTN: "Hủy bỏ",
  },
} as const;
