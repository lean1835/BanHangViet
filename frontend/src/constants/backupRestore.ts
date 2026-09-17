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

export const VERIFICATION_STATUSES = {
  PASSED: "PASSED",
  FAILED: "FAILED",
} as const;

export type TVerificationStatus =
  (typeof VERIFICATION_STATUSES)[keyof typeof VERIFICATION_STATUSES];

export const VERIFICATION_STATUS_LABELS: Record<TVerificationStatus, string> = {
  [VERIFICATION_STATUSES.PASSED]: "Đạt (An toàn)",
  [VERIFICATION_STATUSES.FAILED]: "Không đạt (Lỗi)",
};

export const VERIFICATION_STATUS_STYLES: Record<
  TVerificationStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  [VERIFICATION_STATUSES.PASSED]: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Đạt (An toàn)",
  },
  [VERIFICATION_STATUSES.FAILED]: {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    text: "text-rose-700",
    border: "border-rose-200",
    label: "Không đạt (Lỗi)",
  },
};

export const VERIFICATION_HEALTH_STATUSES = {
  NORMAL: "NORMAL",
  WARNING: "WARNING",
  DANGER: "DANGER",
} as const;

export type TVerificationHealthStatus =
  (typeof VERIFICATION_HEALTH_STATUSES)[keyof typeof VERIFICATION_HEALTH_STATUSES];

export const VERIFICATION_HEALTH_STYLES: Record<
  TVerificationHealthStatus,
  { bg: string; text: string; border: string; badge: string; label: string }
> = {
  [VERIFICATION_HEALTH_STATUSES.NORMAL]: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    label: "An toàn - Đã kiểm chứng",
  },
  [VERIFICATION_HEALTH_STATUSES.WARNING]: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    label: "Cảnh báo - Quá hạn kiểm chứng",
  },
  [VERIFICATION_HEALTH_STATUSES.DANGER]: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-800 border-rose-300",
    label: "Nguy hiểm - Thử phục hồi thất bại",
  },
};

export const VERIFICATION_TRIGGER_TYPES = {
  AUTOMATIC: "AUTOMATIC",
  MANUAL: "MANUAL",
} as const;

export type TVerificationTriggerType =
  (typeof VERIFICATION_TRIGGER_TYPES)[keyof typeof VERIFICATION_TRIGGER_TYPES];

export const VERIFICATION_TRIGGER_TYPE_LABELS: Record<
  TVerificationTriggerType,
  string
> = {
  [VERIFICATION_TRIGGER_TYPES.AUTOMATIC]: "Tự động định kỳ",
  [VERIFICATION_TRIGGER_TYPES.MANUAL]: "Kích hoạt thủ công",
};

export const BACKUP_RESTORE_CONFIG = {
  MIN_RETENTION_COUNT: 1,
  MAX_RETENTION_COUNT: 100,
  DEFAULT_RETENTION_COUNT: 30,
  DEFAULT_SCHEDULED_TIME: "02:00",
  TIME_REGEX: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DEFAULT_PAGE_SIZE: 8,
} as const;

export const BACKUP_RESTORE_UI = {
  PAGE_TITLE: "Sao lưu & Phục hồi dữ liệu",
  PAGE_SUBTITLE: "Bảo đảm an toàn dữ liệu, chống mất mát và khôi phục khi gặp sự cố hệ thống",
  TABS: {
    AUTO_BACKUP: "auto_backup",
    RESTORE: "restore",
    VERIFICATION: "verification",
    MANUAL_EXPORT: "manual_export",
    LABELS: {
      AUTO_BACKUP: "Sao lưu tự động & Lịch sử",
      RESTORE: "Phục hồi dữ liệu",
      VERIFICATION: "Tình trạng & Thử phục hồi",
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
  VERIFICATION: {
    OVERVIEW: {
      TITLE: "Báo cáo tình trạng & Thử phục hồi định kỳ",
      SUBTITLE:
        "Kiểm chứng tự động trong môi trường tạm độc lập (Sandbox), đối soát số lượng bản ghi và thẩm định chuỗi kiểm toán SHA-256",
      HEALTH_LABEL: "Tình trạng sức khỏe bản sao lưu",
      LATEST_VERIFIED_LABEL: "Lần kiểm chứng gần nhất:",
      DAYS_SINCE_SUCCESS_LABEL: "Thời gian từ lần thành công cuối:",
      MAX_ALLOWED_DAYS_LABEL: "Hạn mức tối đa:",
      TOTAL_RUNS_LABEL: "Tổng số lần kiểm thử:",
      PASSED_COUNT_LABEL: "Số lần Đạt:",
      FAILED_COUNT_LABEL: "Số lần Thất bại:",
      TRIGGER_BTN: "Kích hoạt thử phục hồi ngay",
      TRIGGERING_BTN: "Đang chạy thử nghiệm sandbox...",
    },
    BANNER: {
      SAFE_TITLE: "Bản sao lưu gần nhất an toàn và đã được kiểm chứng",
      SAFE_DESC:
        "Bản sao lưu gần nhất đã được kiểm thử phục hồi trong môi trường tạm thành công. CSDL toàn vẹn và sẵn sàng phục hồi khi cần.",
      WARNING_TITLE: "Cảnh báo: Bản sao lưu quá hạn kiểm chứng",
      WARNING_DESC:
        "Đã quá nhiều ngày kể từ lần kiểm chứng bản sao lưu thành công gần nhất. Vui lòng kích hoạt thử phục hồi để đảm bảo dữ liệu luôn sẵn sàng.",
      DANGER_TITLE: "CẢNH BÁO NGUY HIỂM: Thử phục hồi bản sao lưu thất bại!",
      DANGER_DESC:
        "Lần chạy thử phục hồi gần nhất không đạt tiêu chuẩn an toàn. Bản sao lưu có thể bị hỏng, thiếu thực thể hoặc đứt gãy chuỗi kiểm toán.",
    },
    HISTORY: {
      TITLE: "Nhật ký các lần chạy thử phục hồi (Sandbox Verification)",
      SUBTITLE:
        "Ghi nhận chi tiết kết quả 3 trụ cột kỹ thuật của từng lần kiểm thử tự động hoặc thủ công",
      EMPTY: "Chưa có bản ghi lịch sử kiểm thử phục hồi nào.",
      COLUMNS: {
        BACKUP_FILE: "Tên tệp sao lưu",
        TRIGGER_TYPE: "Hình thức",
        DURATION: "Thời gian chạy",
        PILLARS: "3 Trụ cột kiểm tra",
        STATUS: "Kết quả",
        VERIFIED_AT: "Thời điểm kiểm thử",
        ACTION: "Thao tác",
      },
      DETAIL_BTN: "Xem chi tiết",
    },
    TRIGGER_MODAL: {
      TITLE: "Kích hoạt thử phục hồi bản sao lưu (Sandbox Drill)",
      SUBTITLE:
        "Hệ thống sẽ chạy thử phục hồi vào môi trường tạm và kiểm tra toàn vẹn đa tầng",
      NOTICE_TITLE: "BẢO ĐẢM AN TOÀN TUYỆT ĐỐI CHO DỮ LIỆU ĐANG CHẠY",
      NOTICE_DESC:
        "Thao tác này chạy độc lập trong môi trường tạm (Sandbox) và tự động dọn dẹp sau khi kiểm tra xong. Dữ liệu bán hàng thực tế trên hệ thống KHÔNG bị gián đoạn hay ảnh hưởng.",
      TARGET_SELECT_LABEL: "Chọn bản sao lưu cần kiểm chứng:",
      TARGET_LATEST_OPTION: "Bản sao lưu thành công mới nhất (Khuyên dùng)",
      NOTES_LABEL: "Ghi chú kiểm thử (tùy chọn):",
      NOTES_PLACEHOLDER: "Ví dụ: Kiểm tra định kỳ sau đợt cập nhật danh mục...",
      SUBMIT_BTN: "Bắt đầu chạy thử nghiệm",
      SUBMITTING_BTN: "Đang kiểm thử sandbox...",
      CANCEL_BTN: "Đóng",
    },
    DETAIL_MODAL: {
      TITLE: "Chi tiết kết quả kiểm chứng bản sao lưu",
      SUBTITLE: "Bảng điểm đối soát 3 trụ cột kỹ thuật và tính toàn vẹn CSDL",
      INFO_SECTION: "Thông tin phiên kiểm thử",
      BACKUP_FILE_LABEL: "Tệp bản sao lưu:",
      BACKUP_TIME_LABEL: "Thời điểm sao lưu:",
      FILE_SIZE_LABEL: "Dung lượng tệp:",
      EXECUTION_TIME_LABEL: "Thời gian thực thi:",
      TRIGGER_TYPE_LABEL: "Hình thức kích hoạt:",
      VERIFIED_AT_LABEL: "Thời điểm hoàn tất:",
      NOTES_LABEL: "Ghi chú:",
      PILLARS_SECTION: "Kết quả đối soát 3 Trụ cột Thẩm định",
      PILLAR_1_TITLE: "Trụ cột 1: Đọc tệp & Tính hợp lệ đa người thuê",
      PILLAR_1_DESC: "Tệp sao lưu không rỗng, giải mã JSON hợp lệ và đúng hộ kinh doanh",
      PILLAR_2_TITLE: "Trụ cột 2: Đối soát số lượng bản ghi chính",
      PILLAR_2_DESC: "Đầy đủ các thực thể cốt lõi cho kịch bản phục hồi",
      PILLAR_3_TITLE: "Trụ cột 3: Thẩm định chuỗi kiểm toán SHA-256 (QTN-25)",
      PILLAR_3_DESC: "Chuỗi băm liên kết bất biến của nhật ký kiểm toán không bị đứt gãy",
      COUNTS_SECTION: "Số lượng bản ghi các bảng chính trong bản sao lưu",
      PRODUCT_COUNT: "Hàng hóa (Products):",
      CUSTOMER_COUNT: "Khách hàng (Customers):",
      SUPPLIER_COUNT: "Nhà cung cấp (Suppliers):",
      USER_COUNT: "Tài khoản (Users):",
      AUDIT_COUNT: "Nhật ký kiểm toán (Audit Logs):",
      FAILURE_REASON_TITLE: "Nguyên nhân thất bại chi tiết:",
      CLOSE_BTN: "Đóng",
    },
  },
} as const;
