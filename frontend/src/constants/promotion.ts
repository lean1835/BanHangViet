export const DISCOUNT_TYPE = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
} as const;

export type TDiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE];

export const DISCOUNT_TYPE_LABELS: Record<TDiscountType, string> = {
  [DISCOUNT_TYPE.PERCENTAGE]: "Phần trăm (%)",
  [DISCOUNT_TYPE.FIXED_AMOUNT]: "Số tiền cố định (VNĐ)",
};

export const PROMOTION_APPLY_SCOPE = {
  ALL: "ALL",
  PRODUCT: "PRODUCT",
  PRODUCT_GROUP: "PRODUCT_GROUP",
} as const;

export type TPromotionApplyScope =
  (typeof PROMOTION_APPLY_SCOPE)[keyof typeof PROMOTION_APPLY_SCOPE];

export const PROMOTION_APPLY_SCOPE_LABELS: Record<TPromotionApplyScope, string> = {
  [PROMOTION_APPLY_SCOPE.ALL]: "Toàn bộ hàng hóa",
  [PROMOTION_APPLY_SCOPE.PRODUCT]: "Sản phẩm cụ thể",
  [PROMOTION_APPLY_SCOPE.PRODUCT_GROUP]: "Nhóm hàng",
};

export const PROMOTION_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type TPromotionStatus =
  (typeof PROMOTION_STATUS)[keyof typeof PROMOTION_STATUS];

export const PROMOTION_CALCULATED_STATE = {
  UPCOMING: "UPCOMING",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  INACTIVE: "INACTIVE",
} as const;

export type TPromotionCalculatedState =
  (typeof PROMOTION_CALCULATED_STATE)[keyof typeof PROMOTION_CALCULATED_STATE];

export const PROMOTION_STATE_LABELS: Record<TPromotionCalculatedState, string> = {
  [PROMOTION_CALCULATED_STATE.ACTIVE]: "Đang áp dụng",
  [PROMOTION_CALCULATED_STATE.UPCOMING]: "Sắp diễn ra",
  [PROMOTION_CALCULATED_STATE.EXPIRED]: "Đã kết thúc",
  [PROMOTION_CALCULATED_STATE.INACTIVE]: "Tạm dừng",
};

export const PROMOTION_STATE_BADGE_CLASSES: Record<TPromotionCalculatedState, string> = {
  [PROMOTION_CALCULATED_STATE.ACTIVE]:
    "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20",
  [PROMOTION_CALCULATED_STATE.UPCOMING]:
    "bg-sky-50 text-sky-700 border-sky-200 ring-sky-600/20",
  [PROMOTION_CALCULATED_STATE.EXPIRED]:
    "bg-zinc-100 text-zinc-600 border-zinc-200 ring-zinc-500/20",
  [PROMOTION_CALCULATED_STATE.INACTIVE]:
    "bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20",
};

export const PROMOTION_CONFIG = {
  PAGE_SIZE: 10,
  INITIAL_PAGE: 0,
} as const;

export const PROMOTION_MESSAGES = {
  CREATE_SUCCESS: "Tạo chương trình khuyến mại thành công",
  UPDATE_SUCCESS: "Cập nhật chương trình khuyến mại thành công",
  DELETE_SUCCESS: "Xóa chương trình khuyến mại thành công",
  TOGGLE_STATUS_SUCCESS: "Cập nhật trạng thái chương trình thành công",
  FETCH_ERROR: "Không thể tải danh sách khuyến mại",
  DELETE_CONFIRM_TITLE: "Xóa chương trình khuyến mại",
  DELETE_CONFIRM_DESC:
    "Bạn có chắc chắn muốn xóa chương trình khuyến mại này? Thao tác này sẽ ngừng áp dụng khuyến mại cho các đơn hàng tiếp theo.",
  NO_DATA: "Chưa có chương trình khuyến mại nào được thiết lập.",
  EMPTY_FILTER_RESULT: "Không tìm thấy chương trình khuyến mại nào phù hợp với bộ lọc.",
  PRODUCT_REQUIRED: "Vui lòng chọn ít nhất một sản phẩm áp dụng",
  GROUP_REQUIRED: "Vui lòng chọn ít nhất một nhóm sản phẩm áp dụng",
  NAME_REQUIRED: "Vui lòng nhập tên chương trình khuyến mại",
  DATE_INVALID: "Thời gian kết thúc phải lớn hơn thời gian bắt đầu",
  DISCOUNT_VALUE_INVALID: "Mức giảm giá phải lớn hơn 0",
  PERCENTAGE_MAX_INVALID: "Mức giảm phần trăm không được vượt quá 100%",
} as const;

export const PROMOTION_ERROR_CODES = {
  PROMOTION_NOT_FOUND: 3050,
  INVALID_PROMOTION_DATE: 3051,
  INVALID_PROMOTION_DISCOUNT_VALUE: 3052,
  PROMOTION_TARGET_REQUIRED: 3053,
  ONLY_STORE_OWNER_CAN_MANAGE_PROMOTION: 3054,
  PROMOTION_NAME_EXISTS: 3055,
} as const;
