import { USER_ROLES } from "@/constants/roles";

export const INVENTORY_AUDIT_FILTER_STATUS = {
  ALL: "ALL",
  HAS_DIFFERENCE: "HAS_DIFFERENCE",
  NO_DIFFERENCE: "NO_DIFFERENCE",
} as const;

export type TInventoryAuditFilterStatus =
  (typeof INVENTORY_AUDIT_FILTER_STATUS)[keyof typeof INVENTORY_AUDIT_FILTER_STATUS];

export const INVENTORY_AUDIT_FILTER_OPTIONS = [
  { value: INVENTORY_AUDIT_FILTER_STATUS.ALL, label: "Tất cả phiếu kiểm kê" },
  { value: INVENTORY_AUDIT_FILTER_STATUS.HAS_DIFFERENCE, label: "Có chênh lệch tồn" },
  { value: INVENTORY_AUDIT_FILTER_STATUS.NO_DIFFERENCE, label: "Khớp hoàn toàn" },
] as const;

export const INVENTORY_AUDIT_CONFIG = {
  INITIAL_PAGE: 0,
  PAGE_SIZE: 10,
  BATCH_SIZE: 1000,
  PRODUCT_QUERY_SIZE: 500,
  SEARCH_DEBOUNCE_MS: 350,
} as const;

export const INVENTORY_AUDIT_API_ENDPOINTS = {
  AUDITS: "/inventory-audits",
  AUDIT_BY_ID: (id: string): string => `/inventory-audits/${id}`,
  CHECK_PENDING_ORDERS: "/inventory-audits/check-pending-orders",
} as const;

export const INVENTORY_AUDIT_COPY = {
  PAGE_TITLE: "Kiểm kê kho & Điều chỉnh tồn kho",
  PAGE_SUBTITLE:
    "Thực hiện đếm thực tế hàng hóa, đối chiếu tồn máy và ghi nhận bút toán điều chỉnh tồn kho tự động",
  CREATE_BUTTON: "Tạo phiếu kiểm kê kho",
  CREATE_BUTTON_TOOLTIP: "Lập phiếu kiểm kê hàng hóa và điều chỉnh tồn kho (Chỉ dành cho Chủ hộ)",
  ACCOUNTANT_READ_ONLY_WARNING:
    `Tài khoản Kế toán (${USER_ROLES.ACCOUNTANT}) chỉ có quyền tra cứu danh sách và đối chiếu chi tiết phiếu kiểm kê, không có quyền tạo phiếu điều chỉnh số lượng tồn kho.`,
  SEARCH_PLACEHOLDER: "Tìm theo mã phiếu (KK-...), người lập, ghi chú...",
  STATS: {
    TOTAL_AUDITS: "Tổng phiếu kiểm kê",
    TOTAL_DIFFERENCE_ITEMS: "Lượt điều chỉnh tồn",
    TOTAL_INCREASED_QTY: "Tổng chênh lệch tăng",
    TOTAL_DECREASED_QTY: "Tổng chênh lệch giảm",
  },
  TABLE_HEADERS: {
    INDEX: "STT",
    AUDIT_NUMBER: "Mã phiếu kiểm kê",
    AUDIT_DATE: "Thời gian kiểm kê",
    CREATED_BY: "Người thực hiện",
    TOTAL_ITEMS: "Số mặt hàng",
    TOTAL_DIFF: "Tổng chênh lệch",
    STATUS: "Trạng thái",
    NOTES: "Ghi chú",
    ACTION: "Thao tác",
  },
  STATUS_LABELS: {
    COMPLETED: "Đã hoàn thành",
  },
  EMPTY_MESSAGE: "Chưa có phiếu kiểm kê nào được thực hiện.",
  NO_SEARCH_RESULT: "Không tìm thấy phiếu kiểm kê nào phù hợp với bộ lọc.",
} as const;

export const INVENTORY_AUDIT_MODAL_COPY = {
  TITLE: "Lập Phiếu Kiểm Kê Kho & Điều Chỉnh Tồn Kho",
  SUBTITLE: "Nhập số lượng đếm thực tế để hệ thống tự động cân đối và cập nhật tồn kho sản phẩm",
  SEARCH_PRODUCT_PLACEHOLDER: "Tìm kiếm sản phẩm theo tên, mã SKU để kiểm kê...",
  ADD_ALL_PRODUCTS: "Thêm tất cả sản phẩm đang bán",
  CLEAR_ALL_ITEMS: "Xóa toàn bộ danh sách",
  TABLE_HEADERS: {
    INDEX: "STT",
    SKU: "Mã SKU",
    PRODUCT_NAME: "Tên hàng hóa",
    UNIT: "ĐVT",
    SYSTEM_QTY: "Tồn hệ thống",
    ACTUAL_QTY: "Thực tế đếm*",
    DIFFERENCE_QTY: "Chênh lệch",
    REASON: "Lý do chênh lệch (Bắt buộc nếu lệch)*",
    ACTION: "Xóa",
  },
  REASON_PLACEHOLDER: "Nhập lý do chênh lệch (hao hụt, hỏng, nhập sót...)",
  SUMMARY_LABEL: "Tóm tắt kiểm kê:",
  TOTAL_ITEMS_LABEL: "Tổng mặt hàng:",
  MATCHED_ITEMS_LABEL: "Khớp tồn:",
  DISCREPANCY_ITEMS_LABEL: "Lệch tồn:",
  TOTAL_INCREASE: "Tăng (+):",
  TOTAL_DECREASE: "Giảm (-):",
  NOTES_LABEL: "Ghi chú đợt kiểm kê:",
  NOTES_PLACEHOLDER: "Ví dụ: Kiểm kê định kỳ cuối tháng, rà soát kho sau nhập hàng lớn...",
  CANCEL_ACTION: "Hủy bỏ",
  SUBMIT_ACTION: "Xác nhận & Cập nhật tồn kho",
  SUBMITTING_ACTION: "Đang lưu và điều chỉnh...",
  CONFIRM_MODAL_TITLE: "Xác nhận điều chỉnh tồn kho?",
  CONFIRM_MODAL_DESC:
    "Hệ thống sẽ ngay lập tức cập nhật lại số lượng tồn kho của các sản phẩm theo số lượng thực tế đếm được và ghi lại nhật ký kiểm toán. Bạn có chắc chắn muốn tiếp tục?",
} as const;

export const INVENTORY_AUDIT_VALIDATION = {
  EMPTY_DETAILS: "Vui lòng chọn ít nhất một mặt hàng để kiểm kê kho.",
  DUPLICATE_PRODUCT: "Không thể thêm sản phẩm đã có trong danh sách kiểm kê.",
  INVALID_ACTUAL_QTY: "Số lượng đếm thực tế không được là số âm và tối đa 3 chữ số thập phân.",
  REASON_REQUIRED_WHEN_DIFF: "Vui lòng nhập lý do điều chỉnh cho tất cả các mặt hàng có chênh lệch tồn.",
} as const;

export const INVENTORY_AUDIT_MESSAGES = {
  CREATE_SUCCESS: "Lập phiếu kiểm kê và điều chỉnh tồn kho thành công!",
  CREATE_FAILED: "Không thể tạo phiếu kiểm kê kho!",
  FETCH_DETAIL_FAILED: "Không thể tải chi tiết phiếu kiểm kê kho!",
} as const;
