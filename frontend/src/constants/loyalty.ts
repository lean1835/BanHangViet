/**
 * Constants for Loyalty Program & Customer Points (NCL-10-CN-008)
 */

export const POINT_TRANSACTION_TYPES = {
  EARN: "EARN",
  REDEEM: "REDEEM",
  RETURN_DEDUCTION: "RETURN_DEDUCTION",
  EXPIRED: "EXPIRED",
  ADJUST: "ADJUST",
} as const;

export type TPointTransactionType =
  (typeof POINT_TRANSACTION_TYPES)[keyof typeof POINT_TRANSACTION_TYPES];

export const POINT_TRANSACTION_TYPE_LABELS = {
  [POINT_TRANSACTION_TYPES.EARN]: "Tích điểm",
  [POINT_TRANSACTION_TYPES.REDEEM]: "Đổi điểm đơn hàng",
  [POINT_TRANSACTION_TYPES.RETURN_DEDUCTION]: "Thu hồi do trả hàng",
  [POINT_TRANSACTION_TYPES.ADJUST]: "Điều chỉnh thủ công",
  [POINT_TRANSACTION_TYPES.EXPIRED]: "Điểm hết hạn",
} as const;

export const POINT_TRANSACTION_FILTER_OPTIONS = [
  { value: "", label: "Tất cả loại giao dịch" },
  { value: POINT_TRANSACTION_TYPES.EARN, label: "Tích điểm từ đơn hàng" },
  { value: POINT_TRANSACTION_TYPES.REDEEM, label: "Đổi điểm đơn hàng" },
  { value: POINT_TRANSACTION_TYPES.RETURN_DEDUCTION, label: "Thu hồi do trả hàng" },
  { value: POINT_TRANSACTION_TYPES.ADJUST, label: "Điều chỉnh thủ công" },
  { value: POINT_TRANSACTION_TYPES.EXPIRED, label: "Điểm hết hạn" },
] as const;

export const LOYALTY_DEFAULT_CONFIG = {
  SPEND_AMOUNT_PER_POINT: 10_000,
  POINT_VALUE: 1_000,
  MIN_POINTS_TO_REDEEM: 50,
  MAX_REDEEM_RATE_PER_ORDER: 100,
  POINT_EXPIRY_DAYS: 365,
} as const;

export const LOYALTY_CONFIG_LIMITS = {
  MIN_SPEND_AMOUNT_PER_POINT: 100,
  MIN_POINT_VALUE: 1,
  MIN_POINTS_TO_REDEEM: 0,
  MIN_MAX_REDEEM_RATE: 1,
  MAX_MAX_REDEEM_RATE: 100,
  MIN_EXPIRY_DAYS: 0,
} as const;

export const LOYALTY_PAGINATION = {
  DEFAULT_PAGE_SIZE: 15,
  PAGE_SIZE_OPTIONS: [10, 15, 20, 50],
} as const;

export const POINT_ADJUSTMENT_ACTION_TYPES = {
  ADD: "ADD",
  DEDUCT: "DEDUCT",
} as const;

export type TPointAdjustmentActionType =
  (typeof POINT_ADJUSTMENT_ACTION_TYPES)[keyof typeof POINT_ADJUSTMENT_ACTION_TYPES];

export const LOYALTY_UI = {
  TABS: {
    LOYALTY: "Điểm thưởng & Khách thân thiết",
  },
  CARDS: {
    AVAILABLE_POINTS: "Điểm khả dụng",
    EXPIRING_SOON: "Sắp hết hạn (30 ngày)",
    TOTAL_EARNED: "Tổng tích lũy",
    REDEEMED_AND_DEDUCTED: "Đã tiêu / Thu hồi",
    EQUIVALENT_VALUE: "Tương đương",
    ELIGIBLE_MIN: (minPoints: number) => `Cần tối thiểu ${minPoints} điểm để đổi`,
    ELIGIBLE_READY: "Đủ điều kiện đổi điểm trên đơn",
    NO_EXPIRING: "Không có điểm sắp hết hạn",
    EXPIRING_NOTE: (dateStr: string) => `Hạn gần nhất: ${dateStr}`,
    EARNED_SUBTITLE: "Đã cộng từ các đơn hàng thành công",
    REDEEMED_LABEL: "Đã đổi trên đơn:",
    DEDUCTED_LABEL: "Thu hồi trả hàng:",
    UNIT: "điểm",
  },
  TOOLBAR: {
    FILTER_LABEL: "Lọc giao dịch:",
    REFRESH_BUTTON: "Làm mới",
    REFRESH_TITLE: "Tải lại dữ liệu điểm thưởng mới nhất",
    MANUAL_ADJUST_BUTTON: "Điều chỉnh điểm thủ công",
  },
  TABLE: {
    TITLE: "Sổ cái lịch sử biến động điểm thưởng",
    COLUMNS: {
      TIME: "Thời gian",
      TYPE: "Loại biến động",
      CHANGE: "Thay đổi",
      BALANCE_AFTER: "Số dư sau",
      DOCUMENT: "Chứng từ liên quan",
      OPERATOR: "Người thực hiện",
      REASON: "Diễn giải / Lý do",
    },
    EMPTY_MESSAGE: "Chưa có giao dịch biến động điểm nào",
  },
  MODAL_ADJUST: {
    TITLE: "Điều chỉnh điểm thưởng thủ công",
    SUBTITLE: "Cộng hoặc trừ điểm thưởng cho khách hàng",
    ADD_POINTS: "Cộng thêm điểm",
    DEDUCT_POINTS: "Khấu trừ điểm",
    CURRENT_POINTS_LABEL: "Điểm khả dụng hiện tại:",
    POINTS_LABEL: "Số điểm cần điều chỉnh *",
    REASON_LABEL: "Lý do điều chỉnh (bắt buộc) *",
    REASON_PLACEHOLDER: "Ví dụ: Bù điểm sự kiện, đền bù dịch vụ khách hàng...",
    SUBMIT_BUTTON: "Xác nhận điều chỉnh",
    CANCEL_BUTTON: "Đóng",
  },
} as const;
