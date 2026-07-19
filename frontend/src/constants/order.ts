export const ORDER_API_ENDPOINTS = {
  LIST: "/orders",
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
} as const;

export const ORDER_PAYMENT_METHOD_LABELS = {
  [ORDER_PAYMENT_METHOD.CASH]: "Tiền mặt",
  [ORDER_PAYMENT_METHOD.BANK_TRANSFER]: "Chuyển khoản",
  [ORDER_PAYMENT_METHOD.DEBT]: "Ghi nợ",
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
    TITLE: "Hóa đơn",
    STATUS_FILTER_LABEL: "Trạng thái hóa đơn",
    DELIVERY_TIME_FILTER_LABEL: "Thời gian giao hàng",
    TIME_FILTER_NAME: "invTime",
    ALL_TIME_LABEL: "Toàn thời gian",
    CUSTOM_TIME_LABEL: "Tùy chỉnh",
  },
  HISTORY: {
    LOADING_MESSAGE: "Đang tải lịch sử đơn hàng...",
    TITLE: (orderCount: number) =>
      `Lịch sử Đơn hàng bán lẻ (${orderCount} đơn hàng)`,
    STATUS_FILTER_LABEL: "Lọc theo trạng thái:",
    EMPTY_MESSAGE: "Không có đơn hàng nào khớp với bộ lọc.",
    WALK_IN_CUSTOMER_LABEL: "Khách vãng lai",
    READ_ONLY_LABEL: "🔒 Chỉ xem",
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
