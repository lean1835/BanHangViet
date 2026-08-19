export const SUPPLIER_MESSAGES = {
  CREATE_SUCCESS: "Thêm nhà cung cấp thành công!",
  CREATE_FAILED: "Không thể thêm nhà cung cấp. Vui lòng thử lại sau.",
  UPDATE_SUCCESS: "Cập nhật thông tin nhà cung cấp thành công!",
  UPDATE_FAILED: "Không thể cập nhật nhà cung cấp. Vui lòng thử lại sau.",
  DELETE_SUCCESS: "Xóa nhà cung cấp thành công!",
  DELETE_FAILED: "Không thể xóa nhà cung cấp. Vui lòng thử lại sau.",
  DELETE_CONFIRM_TITLE: "Xác nhận xóa nhà cung cấp",
  DELETE_CONFIRM_TEXT: "Bạn có chắc chắn muốn xóa nhà cung cấp này? Thao tác này không thể hoàn tác.",
  SEARCH_PLACEHOLDER: "Tìm kiếm theo tên, số điện thoại...",
  EMPTY_TITLE: "Chưa có nhà cung cấp nào",
  EMPTY_DESC: "Lưu hồ sơ nhà cung cấp giúp quản lý nguồn hàng nhập và theo dõi công nợ dễ dàng.",
  EMPTY_SEARCH_TITLE: "Không tìm thấy kết quả",
  EMPTY_SEARCH_DESC: "Không tìm thấy nhà cung cấp phù hợp với từ khóa tìm kiếm.",
  PHONE_EXISTS_ERROR: "Số điện thoại này đã tồn tại trong danh sách nhà cung cấp của hộ kinh doanh.",
  HAS_DEBT_ERROR: "Không thể xóa nhà cung cấp đang còn công nợ chưa thanh toán.",
  HAS_DEPENDENCIES_ERROR: "Không thể xóa nhà cung cấp đã phát sinh phiếu nhập kho trong hệ thống.",
  HAS_RECEIPTS_ERROR: "Không thể xóa nhà cung cấp đã phát sinh phiếu nhập kho trong hệ thống.",
  UNAUTHORIZED_ACTION: "Bạn không có quyền thực hiện thao tác này. Chỉ Chủ hộ mới có quyền thêm/sửa/xóa nhà cung cấp.",
} as const;

export const SUPPLIER_VALIDATION = {
  NAME_MIN: 1,
  NAME_MAX: 100,
  PHONE_PATTERN: /^(0|84|\+84)[0-9]{8,13}$/,
  PHONE_MAX: 20,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  EMAIL_MAX: 100,
  ADDRESS_MAX: 255,
  TAX_CODE_MAX: 20,
  NOTE_MAX: 1000,
} as const;

export const SUPPLIER_ERROR_CODES = {
  NOT_FOUND: 3031,
  PHONE_EXISTS: 3032,
  HAS_DEPENDENCIES: 3033,
  HAS_OUTSTANDING_DEBT: 3037,
} as const;

export const SUPPLIER_LOG_ACTIONS = {
  CREATE: "Thêm nhà cung cấp",
  UPDATE: "Cập nhật nhà cung cấp",
  DELETE: "Xóa nhà cung cấp",
} as const;

export const SUPPLIER_PAGINATION = {
  PAGE_SIZE: 9,
  INITIAL_PAGE: 0,
} as const;

