export const ADJUSTMENT_TYPE = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
  PROFIT_MARGIN: "PROFIT_MARGIN",
} as const;

export type TAdjustmentType = (typeof ADJUSTMENT_TYPE)[keyof typeof ADJUSTMENT_TYPE];

export const ADJUSTMENT_TYPE_LABELS: Record<TAdjustmentType, string> = {
  [ADJUSTMENT_TYPE.PERCENTAGE]: "Tăng/giảm theo tỷ lệ phần trăm (%)",
  [ADJUSTMENT_TYPE.FIXED_AMOUNT]: "Tăng/giảm theo số tiền cố định (VNĐ)",
  [ADJUSTMENT_TYPE.PROFIT_MARGIN]: "Thiết lập theo tỷ lệ lãi trên giá vốn (%)",
};

export const ADJUSTMENT_TYPE_DESCRIPTIONS: Record<TAdjustmentType, string> = {
  [ADJUSTMENT_TYPE.PERCENTAGE]:
    "Ví dụ: Nhập 5 để tăng giá 5%, nhập -3 để giảm giá 3% so với giá bán hiện tại.",
  [ADJUSTMENT_TYPE.FIXED_AMOUNT]:
    "Ví dụ: Nhập 2000 để tăng thêm 2.000đ, nhập -1000 để giảm 1.000đ so với giá bán hiện tại.",
  [ADJUSTMENT_TYPE.PROFIT_MARGIN]:
    "Ví dụ: Nhập 20 để đặt giá bán bằng giá vốn bình quân + 20% tiền lãi.",
};

export const PRICE_ROUNDING_METHOD = {
  NONE: "NONE",
  ROUND_TO_100: "ROUND_TO_100",
  ROUND_TO_500: "ROUND_TO_500",
  ROUND_TO_1000: "ROUND_TO_1000",
} as const;

export type TPriceRoundingMethod =
  (typeof PRICE_ROUNDING_METHOD)[keyof typeof PRICE_ROUNDING_METHOD];

export const PRICE_ROUNDING_LABELS: Record<TPriceRoundingMethod, string> = {
  [PRICE_ROUNDING_METHOD.NONE]: "Không làm tròn (giữ nguyên số lẻ)",
  [PRICE_ROUNDING_METHOD.ROUND_TO_100]: "Làm tròn đến 100đ gần nhất",
  [PRICE_ROUNDING_METHOD.ROUND_TO_500]: "Làm tròn đến 500đ gần nhất",
  [PRICE_ROUNDING_METHOD.ROUND_TO_1000]: "Làm tròn đến 1.000đ gần nhất",
};

export const BATCH_STATUS = {
  APPLIED: "APPLIED",
  REVERTED: "REVERTED",
} as const;

export type TBatchStatus = (typeof BATCH_STATUS)[keyof typeof BATCH_STATUS];

export const BATCH_STATUS_LABELS: Record<TBatchStatus, string> = {
  [BATCH_STATUS.APPLIED]: "Đã áp dụng",
  [BATCH_STATUS.REVERTED]: "Đã hoàn tác",
};

export const PRICE_ADJUSTMENT_COPY = {
  PAGE_TITLE: "Cập nhật giá bán hàng loạt",
  PAGE_SUBTITLE:
    "Đổi giá cho nhiều mặt hàng cùng lúc theo nhóm hàng hoặc theo tỷ lệ phần trăm",
  TAB_SETUP: "Thiết lập điều chỉnh giá",
  TAB_HISTORY: "Lịch sử điều chỉnh giá",

  SCOPE_GROUP: "Theo nhóm hàng",
  SCOPE_CUSTOM: "Chọn từng mặt hàng lẻ",

  PREVIEW_BUTTON: "Xem trước thay đổi giá",
  APPLY_BUTTON: "Xác nhận áp dụng giá mới",
  REVERT_BUTTON: "Hoàn tác đợt đổi giá",
  VIEW_DETAIL_BUTTON: "Xem chi tiết",

  KPI_TOTAL: "Tổng mặt hàng",
  KPI_INCREASED: "Tăng giá",
  KPI_DECREASED: "Giảm giá",
  KPI_UNCHANGED: "Không đổi",
  KPI_BELOW_COST: "Bán dưới giá vốn (Cảnh báo)",

  BELOW_COST_WARNING_TITLE: "Cảnh báo bán lỗ so với giá vốn!",
  BELOW_COST_WARNING_DESC:
    "Có một số mặt hàng sau khi áp dụng sẽ có giá bán thấp hơn giá vốn bình quân. Hãy kiểm tra kỹ các dòng bôi đỏ trước khi xác nhận.",

  CAN_REVERT_TOOLTIP: "Được phép hoàn tác đợt đổi giá này trong vòng 24 giờ kể từ lúc áp dụng",
  EXPIRED_REVERT_TOOLTIP: "Đã quá 24 giờ kể từ thời điểm áp dụng, không thể hoàn tác",
  ALREADY_REVERTED_TOOLTIP: "Đợt điều chỉnh này đã được hoàn tác trước đó",

  CONFIRM_APPLY_TITLE: "Xác nhận áp dụng giá bán mới",
  CONFIRM_APPLY_DESC:
    "Giá mới sẽ áp dụng ngay cho tất cả các giao dịch bán hàng và hóa đơn phát sinh sau thời điểm này. Bạn vẫn có thể hoàn tác trong vòng 24 giờ nếu cần.",
};

export const PRICE_ADJUSTMENT_MESSAGES = {
  PREVIEW_SUCCESS: "Đã tính toán xem trước thành công",
  APPLY_SUCCESS: "Áp dụng cập nhật giá bán hàng loạt thành công!",
  REVERT_SUCCESS: "Hoàn tác thành công, giá toàn bộ mặt hàng đã được khôi phục!",
  NAME_REQUIRED: "Vui lòng nhập tên cho đợt điều chỉnh giá",
  SCOPE_REQUIRED: "Vui lòng chọn nhóm hàng hoặc ít nhất một mặt hàng",
  VALUE_REQUIRED: "Vui lòng nhập giá trị điều chỉnh",
  INVALID_VALUE_PERCENT: "Tỷ lệ giảm giá không được vượt quá -100%",
  REVERT_REASON_REQUIRED: "Vui lòng nhập lý do hoàn tác đợt điều chỉnh",
  PERMISSION_DENIED: "Chức năng này chỉ dành riêng cho Chủ hộ kinh doanh (VT-01)",
};
