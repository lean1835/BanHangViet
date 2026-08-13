export const SUPPLIER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ALL: "ALL",
} as const;

export const SUPPLIER_FILTER = {
  ALL_GROUPS: "ALL",
} as const;

export const SUPPLIER_FILTER_DEFAULTS = {
  groupId: SUPPLIER_FILTER.ALL_GROUPS,
  debtFrom: "",
  debtTo: "",
  status: SUPPLIER_STATUS.ACTIVE,
} as const;

export const SUPPLIER_QUERY_CONFIG = {
  SEARCH_DEBOUNCE_MS: 350,
  INITIAL_PAGE: 0,
  PAGE_SIZE: 10,
  DISPLAY_INDEX_OFFSET: 1,
} as const;

export const SUPPLIER_API_ENDPOINTS = {
  SUPPLIERS: "/suppliers",
  SUPPLIER_BY_ID: (supplierId: string): string => `/suppliers/${supplierId}`,
  GROUPS: "/supplier-groups",
  GROUP_BY_ID: (groupId: string): string => `/supplier-groups/${groupId}`,
} as const;

export const SUPPLIER_API_TAG_IDS = {
  LIST: "LIST",
} as const;

export const SUPPLIER_SECTION_COPY = {
  NAVIGATION_LABEL: "Quản lý Nhà cung cấp",
  FILTER_TITLE: "Bộ lọc nhà cung cấp",
  GROUP_LABEL: "Nhóm nhà cung cấp",
  GROUP_CREATE_ACTION: "Tạo mới",
  ALL_GROUPS_LABEL: "Tất cả các nhóm",
  GROUPS_LOADING_LABEL: "Đang tải danh sách nhóm...",
  CURRENT_DEBT_LABEL: "Nợ hiện tại",
  DEBT_FROM_LABEL: "Từ",
  DEBT_TO_LABEL: "Tới",
  DEBT_PLACEHOLDER: "Nhập giá trị",
  STATUS_LABEL: "Trạng thái",
  ACTIVE_STATUS_LABEL: "Đang hoạt động",
  INACTIVE_STATUS_LABEL: "Ngừng hoạt động",
  ALL_STATUS_LABEL: "Tất cả trạng thái",
  CLEAR_FILTER_ACTION: "Xóa bộ lọc",
  INVALID_DEBT_RANGE: 'Giá trị "Từ" không được lớn hơn "Tới".',
} as const;

export const SUPPLIER_LIST_COPY = {
  TITLE: "Quản lý Nhà cung cấp",
  SEARCH_PLACEHOLDER: "Theo mã, tên, SĐT nhà cung cấp",
  SEARCH_LABEL: "Tìm kiếm nhà cung cấp",
  EXPORT_ACTION: "Xuất file",
  STOCK_ENTRY_ACTION: "Nhập kho",
  CREATE_ACTION: "Nhà cung cấp",
  LOADING_MESSAGE: "Đang tải danh sách nhà cung cấp...",
  LOAD_ERROR_TITLE: "Chưa thể tải danh sách nhà cung cấp",
  LOAD_ERROR_DESCRIPTION: "Vui lòng kiểm tra kết nối và thử tải lại dữ liệu.",
  RETRY_ACTION: "Thử lại",
  EMPTY_TITLE: "Chưa có nhà cung cấp",
  EMPTY_DESCRIPTION: "Tạo hồ sơ nhà cung cấp đầu tiên để theo dõi thông tin và công nợ.",
  FILTERED_EMPTY_TITLE: "Không tìm thấy nhà cung cấp",
  FILTERED_EMPTY_DESCRIPTION: "Không tìm thấy nhà cung cấp nào phù hợp bộ lọc.",
  CLEAR_SEARCH_ACTION: "Xóa nội dung tìm kiếm",
  RESULT_COUNT_SUFFIX: "nhà cung cấp",
  ACTIVE_STATUS: "Đang hoạt động",
  INACTIVE_STATUS: "Ngừng hoạt động",
  DEBT_DELETE_TOOLTIP: "Không thể xóa nhà cung cấp đang còn công nợ",
  EDIT_TOOLTIP: "Chỉnh sửa nhà cung cấp",
  DELETE_TOOLTIP: "Xóa nhà cung cấp",
  PREVIOUS_PAGE_ACTION: "Trước",
  NEXT_PAGE_ACTION: "Sau",
  PAGE_LABEL: "Trang",
  TABLE_HEADERS: {
    INDEX: "STT",
    SYSTEM_CODE: "Mã nhà cung cấp",
    NAME: "Nhà cung cấp",
    GROUP: "Nhóm",
    CONTACT: "Liên hệ",
    ADDRESS: "Địa chỉ",
    TAX_CODE: "Mã số thuế",
    CURRENT_DEBT: "Nợ hiện tại",
    STATUS: "Trạng thái",
    ACTION: "Thao tác",
  },
} as const;

export const SUPPLIER_FORM_COPY = {
  CREATE_TITLE: "Thêm nhà cung cấp mới",
  EDIT_TITLE: "Cập nhật nhà cung cấp",
  CODE_LABEL: "Mã nhà cung cấp",
  CODE_HINT: "Mặc định tự sinh",
  CODE_PLACEHOLDER: "NCC00001",
  NAME_LABEL: "Tên nhà cung cấp",
  NAME_PLACEHOLDER: "Công ty TNHH Nông Sản Việt Nam",
  PHONE_LABEL: "Điện thoại",
  PHONE_PLACEHOLDER: "0912345678",
  EMAIL_LABEL: "Email",
  EMAIL_PLACEHOLDER: "nhacungcap@gmail.com",
  GROUP_LABEL: "Nhóm nhà cung cấp",
  NO_GROUP_LABEL: "Không thuộc nhóm",
  TAX_CODE_LABEL: "Mã số thuế",
  TAX_CODE_PLACEHOLDER: "0102030405",
  ADDRESS_LABEL: "Địa chỉ",
  ADDRESS_PLACEHOLDER: "123 Đường Lê Lợi, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  INITIAL_DEBT_LABEL: "Nợ cần trả ban đầu (VNĐ)",
  CURRENT_DEBT_LABEL: "Nợ hiện tại (VNĐ)",
  NOTE_LABEL: "Ghi chú",
  NOTE_PLACEHOLDER: "Ghi chú thêm về nhà cung cấp...",
  STATUS_LABEL: "Trạng thái",
  CANCEL_ACTION: "Hủy",
  CREATE_ACTION: "Lưu nhà cung cấp",
  UPDATE_ACTION: "Lưu thay đổi",
  SAVING_ACTION: "Đang lưu...",
} as const;

export const SUPPLIER_GROUP_FORM_COPY = {
  TITLE: "Tạo mới Nhóm nhà cung cấp",
  NAME_LABEL: "Tên nhóm nhà cung cấp",
  NAME_PLACEHOLDER: "VD: Gia vị & Phụ gia, Bao bì - Vật tư...",
  NOTE_LABEL: "Ghi chú",
  NOTE_PLACEHOLDER: "Mô tả hoặc ghi chú thêm về nhóm nhà cung cấp...",
  CANCEL_ACTION: "Hủy",
  SAVE_ACTION: "Lưu nhóm",
  SAVING_ACTION: "Đang lưu...",
} as const;

export const SUPPLIER_DELETE_COPY = {
  TITLE: "Xác nhận xóa nhà cung cấp?",
  DESCRIPTION: (supplierName: string): string =>
    `Bạn có chắc chắn muốn xóa nhà cung cấp “${supplierName}”? Thao tác này không thể hoàn tác.`,
  CANCEL_ACTION: "Hủy bỏ",
  CONFIRM_ACTION: "Xác nhận xóa",
  DELETING_ACTION: "Đang xóa...",
} as const;

export const SUPPLIER_MESSAGES = {
  CREATE_SUCCESS: "Thêm nhà cung cấp thành công.",
  UPDATE_SUCCESS: "Cập nhật nhà cung cấp thành công.",
  DELETE_SUCCESS: "Xóa nhà cung cấp thành công.",
  GROUP_CREATE_SUCCESS: "Tạo nhóm nhà cung cấp thành công.",
  SAVE_FAILED: "Chưa thể lưu nhà cung cấp. Vui lòng kiểm tra thông tin và thử lại.",
  GROUP_SAVE_FAILED: "Chưa thể lưu nhóm nhà cung cấp. Vui lòng thử lại.",
  DELETE_FAILED: "Chưa thể xóa nhà cung cấp. Vui lòng kiểm tra công nợ và thử lại.",
  EXPORT_SUCCESS: "Đã xuất danh sách nhà cung cấp thành công.",
  EXPORT_FAILED: "Chưa thể xuất file. Vui lòng thử lại.",
} as const;

export const SUPPLIER_EXPORT_CONFIG = {
  SHEET_NAME: "Nha_Cung_Cap",
  FILE_PREFIX: "Danh_sach_nha_cung_cap",
} as const;
