import { USER_ROLES } from "@/constants/roles";

export const PRODUCT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export const PRODUCT_STATUS_VALUES = [
  PRODUCT_STATUS.ACTIVE,
  PRODUCT_STATUS.INACTIVE,
] as const;

export const PRODUCT_STATUS_OPTIONS = [
  {
    value: PRODUCT_STATUS.ACTIVE,
    label: "Đang bán (ACTIVE)",
    displayLabel: "Đang bán",
  },
  {
    value: PRODUCT_STATUS.INACTIVE,
    label: "Ngừng bán (INACTIVE)",
    displayLabel: "Ngừng bán",
  },
] as const;

export const PRODUCT_STATUS_LABELS = {
  [PRODUCT_STATUS.ACTIVE]: "Đang bán",
  [PRODUCT_STATUS.INACTIVE]: "Ngừng bán",
} as const;

export const PRODUCT_FILTER = {
  ALL: "ALL",
} as const;

export const PRODUCT_STOCK_FILTER = {
  ALL: PRODUCT_FILTER.ALL,
  IN_STOCK: "IN_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
} as const;

export type TProductStockFilterValue =
  (typeof PRODUCT_STOCK_FILTER)[keyof typeof PRODUCT_STOCK_FILTER];

export const isProductStockFilter = (
  value: string,
): value is TProductStockFilterValue =>
  Object.values(PRODUCT_STOCK_FILTER).some(
    (stockFilterValue) => stockFilterValue === value,
  );

export const PRODUCT_STOCK_FILTER_OPTIONS = [
  { value: PRODUCT_STOCK_FILTER.ALL, label: "Tất cả" },
  { value: PRODUCT_STOCK_FILTER.IN_STOCK, label: "Còn hàng (Tồn > 0)" },
  { value: PRODUCT_STOCK_FILTER.OUT_OF_STOCK, label: "Hết hàng (Tồn = 0)" },
] as const;

export const PRODUCT_QUERY_CONFIG = {
  SEARCH_DEBOUNCE_MS: 350,
  INITIAL_PAGE: 0,
  PAGE_STEP: 1,
  DISPLAY_INDEX_OFFSET: 1,
  MIN_PAGINATION_PAGE_COUNT: 1,
  PAGE_SIZE: 15,
  API_FALLBACK_PAGE_SIZE: 10,
} as const;

export const PRODUCT_UI_CONFIG = {
  NOTIFICATION_DURATION_MS: 4000,
} as const;

export const PRODUCT_NOTIFICATION_TYPE = {
  SUCCESS: "success",
  ERROR: "error",
} as const;

export type TProductNotificationType =
  (typeof PRODUCT_NOTIFICATION_TYPE)[keyof typeof PRODUCT_NOTIFICATION_TYPE];

export const PRODUCT_KEYBOARD_KEY = {
  ENTER: "Enter",
  ESCAPE: "Escape",
} as const;

export const PRODUCT_SYMBOLS = {
  CLOSE: "✕",
  SUCCESS: "✓",
} as const;

export const PRODUCT_FORM_DEFAULTS = {
  EMPTY_TEXT: "",
  SKU: "",
  NAME: "",
  GROUP_ID: "",
  TAX_RATE_ID: "",
  UNIT: "Lon",
  PRICE: 0,
  STOCK_QUANTITY: 0,
  DEFAULT_TAX_RATE_INDEX: 0,
  STATUS: PRODUCT_STATUS.ACTIVE,
} as const;

export const PRODUCT_FORM_FIELD_NAMES = {
  SKU: "sku",
  NAME: "name",
  GROUP_ID: "groupId",
  UNIT: "unit",
  PRICE: "price",
  STOCK_QUANTITY: "stockQuantity",
  TAX_RATE_ID: "taxRateId",
  STATUS: "status",
} as const;

export const PRODUCT_FORM_LIMITS = {
  MIN_REQUIRED_LENGTH: 1,
  MIN_NON_NEGATIVE_VALUE: 0,
  SKU_MAX_LENGTH: 50,
  NAME_MAX_LENGTH: 255,
  UNIT_MAX_LENGTH: 50,
} as const;

export const PRODUCT_STOCK_ENTRY_DEFAULTS = {
  QUANTITY: 50,
  MIN_QUANTITY: 1,
  MIN_IMPORT_PRICE: 0,
} as const;

export const PRODUCT_STOCK_ENTRY_CONFIG = {
  PRODUCT_QUERY_SIZE: 100,
  ID_PREFIX: "se",
  START_INDEX: 1,
} as const;

export const getNextStockEntryId = (currentEntryCount: number): string =>
  `${PRODUCT_STOCK_ENTRY_CONFIG.ID_PREFIX}${
    currentEntryCount + PRODUCT_STOCK_ENTRY_CONFIG.START_INDEX
  }`;

export const PRODUCT_STOCK_ENTRY_FORM_FIELDS = {
  PRODUCT_ID: "prodId",
  QUANTITY: "qty",
  IMPORT_PRICE: "importPrice",
  NOTES: "notes",
} as const;

export const PRODUCT_VALIDATION_MESSAGES = {
  SKU_REQUIRED: "Vui lòng nhập mã sản phẩm (SKU)",
  SKU_TOO_LONG: "Mã hàng (SKU) không được vượt quá 50 ký tự",
  NAME_REQUIRED: "Vui lòng nhập tên sản phẩm",
  NAME_TOO_LONG: "Tên hàng hóa không được vượt quá 255 ký tự",
  UNIT_REQUIRED: "Vui lòng nhập đơn vị tính",
  UNIT_TOO_LONG: "Đơn vị tính không được vượt quá 50 ký tự",
  PRICE_NEGATIVE: "Giá bán không được nhỏ hơn 0",
  STOCK_NEGATIVE: "Tồn kho không được nhỏ hơn 0",
  TAX_RATE_REQUIRED: "Vui lòng chọn thuế suất",
} as const;

export const PRODUCT_LABELS = {
  CREATE: "Tạo mới",
  NOTIFICATION_SUCCESS: "Thành công",
  NOTIFICATION_NOTICE: "Thông báo",
} as const;

export const PRODUCT_FORM_COPY = {
  CREATE_TITLE: "Thêm mới hàng hóa",
  UPDATE_TITLE: "Cập nhật thông tin hàng hóa",
  SKU_LABEL: "Mã hàng hóa (SKU)*:",
  SKU_PLACEHOLDER: "Ví dụ: 8934567890123",
  UNIT_LABEL: "Đơn vị tính*:",
  UNIT_PLACEHOLDER: "Ví dụ: Lon, Chai, Gói...",
  NAME_LABEL: "Tên hàng hóa*:",
  NAME_PLACEHOLDER: "Ví dụ: Nước ngọt Coca-Cola lon 320ml",
  GROUP_LABEL: "Nhóm hàng hóa:",
  GROUP_PLACEHOLDER: "-- Chọn nhóm hàng --",
  STATUS_LABEL: "Trạng thái bán:",
  PRICE_LABEL: "Giá bán lẻ (đ)*:",
  PRICE_PLACEHOLDER: "Ví dụ: 10.000",
  STOCK_LABEL: "Tồn kho ban đầu:",
  TAX_RATE_LABEL: "Thuế suất doanh thu áp dụng*:",
  TAX_RATE_PLACEHOLDER: "-- Chọn thuế suất --",
  CANCEL_ACTION: "Hủy bỏ",
  SAVING_ACTION: "Đang lưu...",
  SAVE_ACTION: "Lưu sản phẩm",
} as const;

export const PRODUCT_GROUP_COPY = {
  TITLE: "Quản lý nhóm hàng hóa",
  SECURITY_RULE_TITLE: "Quy tắc bảo mật QTN-17:",
  SECURITY_RULE_DESCRIPTION:
    "Chỉ có Chủ hộ kinh doanh mới được phép tạo, chỉnh sửa hoặc xóa nhóm hàng. Nhân viên/Kế toán chỉ có quyền xem danh sách.",
  CREATE_TITLE: "Thêm nhóm hàng mới",
  NAME_PLACEHOLDER: "Nhập tên nhóm hàng...",
  CREATE_TOOLTIP: "Thêm nhóm hàng",
  LIST_TITLE: "Danh sách nhóm hàng",
  INDEX_HEADER: "STT",
  NAME_HEADER: "Tên nhóm hàng",
  ACTION_HEADER: "Thao tác",
  EMPTY_MESSAGE: "Chưa có nhóm hàng nào được tạo.",
  INLINE_EDIT_TOOLTIP: "Nhấp chuột để sửa trực tiếp",
  INLINE_SAVE_TOOLTIP: "Lưu trực tiếp",
  CANCEL_TOOLTIP: "Hủy bỏ",
  DELETE_TOOLTIP: "Xóa nhóm",
  CLOSE_ACTION: "Đóng",
  DELETE_TITLE: "Xác nhận xóa nhóm hàng?",
  DELETE_DESCRIPTION_PREFIX: "Bạn có chắc chắn muốn xóa nhóm hàng",
  DELETE_DESCRIPTION_SUFFIX:
    "? Hàng hóa thuộc nhóm này sẽ được chuyển về nhóm mặc định.",
  DELETE_CONFIRM_ACTION: "Xác nhận xóa",
} as const;

export const PRODUCT_LIST_COPY = {
  SEARCH_PLACEHOLDER: "Theo mã, tên hàng",
  OWNER_CREATE_TOOLTIP: "Chỉ Chủ hộ kinh doanh mới được thêm hàng hóa",
  LOADING_MESSAGE: "Đang tải danh mục hàng hóa...",
  LOAD_ERROR_MESSAGE: "Không thể kết nối đến máy chủ API để lấy hàng hóa!",
  RETRY_ACTION: "Thử lại",
  EMPTY_MESSAGE: "Không tìm thấy hàng hóa nào phù hợp bộ lọc!",
  TABLE_HEADERS: {
    INDEX: "STT",
    SKU: "Mã hàng (SKU)",
    NAME: "Tên hàng",
    UNIT: "Đơn vị",
    PRICE: "Giá bán",
    STOCK: "Tồn kho",
    GROUP: "Nhóm hàng",
    STATUS: "Trạng thái",
    CREATED_AT: "Ngày tạo",
    ACTION: "Thao tác",
  },
  EDIT_TOOLTIP: "Chỉnh sửa sản phẩm",
  DELETE_TOOLTIP: "Xóa sản phẩm",
  PAGINATION_PREFIX: "Đang hiển thị",
  PAGINATION_TOTAL: "trên tổng số",
  PAGINATION_SUFFIX: "hàng hóa",
  PREVIOUS_PAGE_ACTION: "Trước",
  PAGE_LABEL: "Trang",
  NEXT_PAGE_ACTION: "Sau",
  DELETE_TITLE: "Xác nhận xóa hàng hóa?",
  DELETE_DESCRIPTION_PREFIX: "Bạn có chắc chắn muốn xóa sản phẩm",
  DELETE_DESCRIPTION_SUFFIX:
    "khỏi hệ thống? Thao tác này sẽ ngừng kinh doanh sản phẩm này và không thể hoàn tác.",
  CANCEL_ACTION: "Hủy bỏ",
  DELETE_CONFIRM_ACTION: "Xác nhận xóa",
} as const;

export const PRODUCT_SECTION_COPY = {
  TITLE: "Hàng hóa",
  FUNCTION_SECTION: "Danh mục chức năng",
  PRODUCT_LIST_ROUTE: "Danh mục hàng hóa",
  STOCK_ENTRY_ROUTE: "Nhập kho hàng hóa",
  GROUP_LABEL: "Nhóm hàng",
  GROUP_MANAGEMENT_ACTION: "Quản lý",
  GROUP_PLACEHOLDER: "Chọn nhóm hàng",
  STOCK_LABEL: "Tồn kho",
  STOCK_CRITERIA_LABEL: "Tiêu chí tồn",
} as const;

export const PRODUCT_STOCK_ENTRY_COPY = {
  FORM_TITLE: "Lập phiếu nhập kho",
  ACCOUNTANT_READ_ONLY_MESSAGE:
    `Tài khoản Kế toán (${USER_ROLES.ACCOUNTANT}) chỉ được xem phiếu nhập kho và đối chiếu tồn, không có quyền lập phiếu nhập kho hoặc thay đổi số lượng kho (QTN-17).`,
  PRODUCT_LABEL: "Chọn hàng hóa nhập*:",
  QUANTITY_LABEL: "Số lượng nhập*:",
  IMPORT_PRICE_LABEL: "Đơn giá nhập (đ)*:",
  IMPORT_PRICE_PLACEHOLDER: "Đơn giá nhập",
  NOTES_LABEL: "Ghi chú / Nhà cung cấp:",
  NOTES_PLACEHOLDER:
    "Ví dụ: Nhập đại lý cấp 1, có hóa đơn VAT đầu vào...",
  SUBMIT_ACTION: "Xác nhận Nhập kho",
  HISTORY_TITLE: "Lịch sử Phiếu nhập kho (stock_entries)",
  HISTORY_HEADERS: {
    ID: "Mã phiếu",
    TIME: "Thời gian nhập",
    PRODUCT: "Sản phẩm (SKU)",
    QUANTITY: "Số lượng",
    IMPORT_PRICE: "Giá nhập",
    TOTAL: "Thành tiền",
    NOTES: "Ghi chú / NCC",
  },
} as const;

export const PRODUCT_MESSAGES = {
  CREATE_SUCCESS: "Thêm hàng hóa mới thành công!",
  UPDATE_SUCCESS: "Cập nhật hàng hóa thành công!",
  SAVE_FAILED: "Không thể lưu sản phẩm!",
  DELETE_FAILED: "Không thể xóa hàng hóa!",
  OWNER_EDIT_ONLY:
    `Chỉ Chủ hộ kinh doanh (${USER_ROLES.OWNER}) mới có quyền chỉnh sửa hàng hóa!`,
  OWNER_DELETE_ONLY:
    `Chỉ Chủ hộ kinh doanh (${USER_ROLES.OWNER}) mới có quyền xóa hàng hóa!`,
  GROUP_DELETE_FAILED: "Không thể xóa nhóm hàng!",
  GROUP_UPDATE_FAILED: "Không thể cập nhật tên nhóm hàng!",
  GROUP_MUTATION_FAILED: "Không thể thực hiện tác vụ!",
  GROUP_NAME_REQUIRED: "Tên nhóm hàng không được để trống!",
  GROUP_UPDATE_SUCCESS: "Cập nhật tên nhóm hàng thành công",
  STOCK_UPDATE_FAILED: "Không thể cập nhật tồn kho!",
  STOCK_UPDATE_SUCCESS: "Lập phiếu nhập kho và cập nhật tồn kho thành công!",
} as const;

export const PRODUCT_MESSAGE_BUILDERS = {
  API_ERROR: (message: string): string => `Lỗi: ${message}`,
  PRODUCT_DELETE_SUCCESS: (productName: string): string =>
    `Xóa sản phẩm "${productName}" thành công!`,
  GROUP_DELETE_SUCCESS: (groupName: string): string =>
    `Xóa nhóm hàng "${groupName}" thành công`,
  GROUP_CREATE_SUCCESS: (groupName: string): string =>
    `Thêm nhóm hàng "${groupName}" thành công`,
  STOCK_ENTRY_ERROR: (message: string): string => `Lỗi nhập kho: ${message}`,
  STOCK_ENTRY_TARGET: (
    productName: string,
    quantity: number,
    unit: string,
  ): string => `Sản phẩm ${productName} (+${quantity} ${unit})`,
} as const;

export const PRODUCT_LOG_ACTIONS = {
  STOCK_ENTRY: "NHẬP_KHO",
} as const;

const PRODUCT_API_BASE_ENDPOINT = "/products";
const PRODUCT_GROUP_API_BASE_ENDPOINT = "/product-groups";
const GOODS_RECEIPT_API_BASE_ENDPOINT = "/goods-receipts";

export const PRODUCT_API_ENDPOINTS = {
  PRODUCTS: PRODUCT_API_BASE_ENDPOINT,
  PRODUCT_BY_ID: (productId: string): string =>
    `${PRODUCT_API_BASE_ENDPOINT}/${productId}`,
  PRODUCT_GROUPS: PRODUCT_GROUP_API_BASE_ENDPOINT,
  PRODUCT_GROUP_BY_ID: (groupId: string): string =>
    `${PRODUCT_GROUP_API_BASE_ENDPOINT}/${groupId}`,
  GOODS_RECEIPTS: GOODS_RECEIPT_API_BASE_ENDPOINT,
  GOODS_RECEIPT_BY_ID: (receiptId: string): string =>
    `${GOODS_RECEIPT_API_BASE_ENDPOINT}/${receiptId}`,
} as const;

export const PRODUCT_API_TAG_IDS = {
  LIST: "LIST",
} as const;

export const PRODUCT_API_RESPONSE_DEFAULTS = {
  NUMBER: 0,
} as const;

// Danh mục Nhóm hàng hóa tĩnh khớp với seed data của DB.
export const PRODUCT_GROUPS = [
  {
    id: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99",
    name: "Thực phẩm & Đồ uống",
  },
  { id: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380baa", name: "Hóa mỹ phẩm" },
] as const;

// Danh mục Thuế suất tĩnh khớp với seed data của DB.
export const TAX_RATES = [
  {
    id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
    name: "Thuế doanh thu phân phối hàng hóa (1%)",
    percentage: 1.0,
  },
  {
    id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
    name: "Thuế doanh thu sản xuất/gia công (3%)",
    percentage: 3.0,
  },
  {
    id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
    name: "Thuế doanh thu dịch vụ (5%)",
    percentage: 5.0,
  },
] as const;
