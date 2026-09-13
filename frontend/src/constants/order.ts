export const ORDER_API_ENDPOINTS = {
  LIST: "/orders",
  CANCEL_REASONS: "/orders/cancel-reasons",
  CANCELED_STATISTICS: "/orders/canceled-statistics",
  CANCEL: (orderId: string) => `/orders/${orderId}/cancel`,
  // NCL-03-CN-010: Đặt tên nhận diện và treo nhiều đơn theo bàn hoặc khách
  HELD_ORDERS: "/orders/held",
  HOLD: (orderId: string) => `/orders/${orderId}/hold`,
  UPDATE_LABEL: (orderId: string) => `/orders/${orderId}/order-label`,
  SWITCH_TABLE: (orderId: string) => `/orders/${orderId}/switch-table`,
  // NCL-03-CN-011 & NCL-03-CN-012: Thanh toán kết hợp & Xác nhận chuyển khoản
  PAYMENTS: (orderId: string) => `/orders/${orderId}/payments`,
  CONFIRM_BANK_TRANSFER: (orderId: string) => `/orders/${orderId}/confirm-bank-transfer`,
  CONFIRM_PAYMENT_BANK_TRANSFER: (orderId: string, paymentId: string) => `/orders/${orderId}/payments/${paymentId}/confirm-bank-transfer`,
  SWITCH_PAYMENT_METHOD: (orderId: string) => `/orders/${orderId}/payment-method`,
} as const;

export const ORDER_HOLD_MESSAGES = {
  MODAL_TITLE: "Treo đơn & Đặt tên nhận diện / Bàn",
  LABEL_PLACEHOLDER: "Ví dụ: Bác Nam áo xanh, Khách mang về...",
  TABLE_LABEL: "Bàn ăn phục vụ tại chỗ",
  LABEL_FIELD: "Tên nhận diện gợi nhớ",
  CONFIRM_BUTTON: "Lưu & Treo đơn",
  SWITCH_TABLE_TITLE: "Chuyển bàn ăn cho đơn hàng",
  UPDATE_LABEL_TITLE: "Đổi tên nhận diện đơn hàng",
  LABEL_OR_TABLE_REQUIRED: "Vui lòng nhập tên nhận diện hoặc chọn một bàn ăn",
  TABLE_OCCUPIED_WARNING: "Bàn này đang có khách phục vụ. Vui lòng chọn bàn khác!",
  HOLD_SUCCESS: "Đã lưu thông tin bàn và treo đơn hàng thành công",
  SWITCH_TABLE_SUCCESS: "Chuyển bàn ăn thành công",
  UPDATE_LABEL_SUCCESS: "Cập nhật tên nhận diện thành công",
} as const;

export const ORDER_CANCEL_REASON_CODES = {
  CUSTOMER_CHANGED_MIND: "CUSTOMER_CHANGED_MIND",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  STAFF_INPUT_ERROR: "STAFF_INPUT_ERROR",
  OTHER: "OTHER",
} as const;

export const ORDER_CANCEL_DEFAULT_REASONS = [
  { code: ORDER_CANCEL_REASON_CODES.CUSTOMER_CHANGED_MIND, description: "Khách đổi ý", requiresNote: false },
  { code: ORDER_CANCEL_REASON_CODES.OUT_OF_STOCK, description: "Hết hàng", requiresNote: false },
  { code: ORDER_CANCEL_REASON_CODES.STAFF_INPUT_ERROR, description: "Nhân viên nhập nhầm", requiresNote: false },
  { code: ORDER_CANCEL_REASON_CODES.OTHER, description: "Lý do khác", requiresNote: true },
] as const;

export const ORDER_CANCEL_MESSAGES = {
  MODAL_TITLE: "Hủy đơn hàng chưa thanh toán",
  CONFIRM_BUTTON: "Xác nhận hủy đơn",
  CANCEL_BUTTON: "Quay lại",
  REASON_REQUIRED: "Vui lòng chọn lý do trước khi hủy đơn hàng",
  NOTE_REQUIRED: "Vui lòng nhập ghi chú chi tiết khi chọn lý do khác",
  CANCEL_SUCCESS: "Hủy đơn hàng thành công",
  STOCK_NEUTRALITY_NOTICE: "Đơn hàng chưa thanh toán khi hủy sẽ không trừ tồn kho và không tính vào doanh thu.",
  COMPLETED_ORDER_BLOCK_NOTICE: "Đơn hàng đã hoàn tất thanh toán. Vui lòng sử dụng chức năng Hủy hóa đơn hoặc Lập phiếu trả hàng thay thế.",
} as const;

export const ORDER_API_TAG_IDS = {
  LIST: "LIST",
} as const;

export const ORDER_STATUS = {
  CREATING: "CREATING",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
} as const;

export const ORDER_FILTER_STATUS = {
  ALL: "ALL",
  ...ORDER_STATUS,
} as const;

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.CREATING]: "Nháp",
  [ORDER_STATUS.COMPLETED]: "Hoàn thành",
  [ORDER_STATUS.CANCELED]: "Đã hủy",
} as const;

export const ORDER_FILTER_OPTIONS = [
  { value: ORDER_FILTER_STATUS.ALL, label: "Tất cả đơn hàng" },
  { value: ORDER_FILTER_STATUS.CREATING, label: "Nháp (CREATING)" },
  { value: ORDER_FILTER_STATUS.COMPLETED, label: "Hoàn thành (COMPLETED)" },
  { value: ORDER_FILTER_STATUS.CANCELED, label: "Đã hủy (CANCELED)" },
] as const;

export const ORDER_PAYMENT_METHOD = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  DEBT: "DEBT",
  COMBINED: "COMBINED",
} as const;

export const ORDER_PAYMENT_METHOD_LABELS = {
  [ORDER_PAYMENT_METHOD.CASH]: "Tiền mặt",
  [ORDER_PAYMENT_METHOD.BANK_TRANSFER]: "Chuyển khoản",
  [ORDER_PAYMENT_METHOD.DEBT]: "Ghi nợ",
  [ORDER_PAYMENT_METHOD.COMBINED]: "Kết hợp",
} as const;

export const DEFAULT_ORDER_PAYMENT_METHOD_LABEL = "Chưa chọn";

export const ORDER_SIDEBAR_STATUS = {
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  UNDELIVERABLE: "Không giao được",
  CANCELED: "Đã hủy",
} as const;

export const ORDER_SIDEBAR_STATUS_OPTIONS = [
  ORDER_SIDEBAR_STATUS.PROCESSING,
  ORDER_SIDEBAR_STATUS.COMPLETED,
  ORDER_SIDEBAR_STATUS.UNDELIVERABLE,
  ORDER_SIDEBAR_STATUS.CANCELED,
] as const;

export const DEFAULT_ORDER_SIDEBAR_STATUSES: readonly string[] = [
  ORDER_SIDEBAR_STATUS.PROCESSING,
  ORDER_SIDEBAR_STATUS.COMPLETED,
];

export const ORDER_UI = {
  SIDEBAR: {
    TITLE: "Bộ lọc đơn hàng",
    STATUS_FILTER_LABEL: "Trạng thái đơn hàng",
    DELIVERY_TIME_FILTER_LABEL: "Thời gian giao hàng",
    TIME_FILTER_NAME: "invTime",
    ALL_TIME_LABEL: "Toàn thời gian",
    CUSTOM_TIME_LABEL: "Tùy chỉnh",
  },
  HISTORY: {
    LOADING_MESSAGE: "Đang tải lịch sử đơn hàng...",
    TITLE: "Lịch sử Đơn hàng",
    STATUS_FILTER_LABEL: "Lọc theo trạng thái:",
    EMPTY_MESSAGE: "Không có đơn hàng nào khớp với bộ lọc.",
    WALK_IN_CUSTOMER_LABEL: "Khách vãng lai",
    READ_ONLY_LABEL: "Chỉ xem",
    DETAILS_LABEL: "Chi tiết",
    DETAILS_MESSAGE: (orderNumber: string) => `Xem chi tiết đơn hàng: ${orderNumber}`,
    COLUMNS: {
      ORDER_NUMBER: "Mã đơn hàng",
      CASHIER: "Nhân viên chốt",
      CREATED_AT: "Thời gian tạo",
      CUSTOMER: "Khách hàng",
      TOTAL_AMOUNT: "Tổng tiền hàng",
      DISCOUNT: "Giảm giá",
      PAID_AMOUNT: "Khách đã trả",
      PAYMENT_METHOD: "Phương thức",
      STATUS: "Trạng thái đơn",
      ACTIONS: "Thao tác",
    },
  },
} as const;
