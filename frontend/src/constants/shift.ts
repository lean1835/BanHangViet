import { DATE_FORMAT, NUMBER_FORMAT } from "@/constants/format";

export const SHIFT_API_ENDPOINTS = {
  LIST: "/shifts",
  ACTIVE: "/shifts/active",
  OPEN: "/shifts/open",
  CLOSE: (shiftId: string) => `/shifts/${shiftId}/close`,
} as const;

export const SHIFT_API_TAG_IDS = {
  LIST: "LIST",
  ACTIVE: "ACTIVE",
} as const;

export const SHIFT_STATUS = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
} as const;

export const SHIFT_STATUS_LABELS = {
  [SHIFT_STATUS.OPEN]: "Đang mở",
  [SHIFT_STATUS.CLOSED]: "Đã đóng",
} as const;

export const SHIFT_SIDEBAR_STATUS_OPTIONS = [
  "Tất cả",
  SHIFT_STATUS_LABELS[SHIFT_STATUS.OPEN],
  SHIFT_STATUS_LABELS[SHIFT_STATUS.CLOSED],
] as const;

export const DEFAULT_SHIFT_CASH_AMOUNT = 1_000_000;

export const SHIFT_SEARCH_DEBOUNCE_MS = 300;

export const SHIFT_CODE_SUFFIX_LENGTH = 6;

export const SHIFT_MESSAGES = {
  OPEN_SUCCESS: "Mở ca bán hàng thành công!",
  CLOSE_SUCCESS: "Đóng ca bán hàng thành công!",
  OPEN_ERROR: "Không thể mở ca bán hàng!",
  CLOSE_ERROR: "Không thể đóng ca bán hàng!",
  OPEN_ERROR_PREFIX: "Lỗi mở ca: ",
  CLOSE_ERROR_PREFIX: "Lỗi đóng ca: ",
  DIFFERENCE_REASON_REQUIRED: "Lỗi: Phải nhập lý do chênh lệch tiền đếm thực tế!",
  DELETE_CONFIRM: (shiftCode: string) =>
    `Bạn có chắc chắn muốn xóa ca bán hàng mã số ${shiftCode} khỏi hệ thống?`,
  DELETE_SUCCESS: (shiftCode: string) =>
    `Đã thực hiện xóa ca bán hàng ${shiftCode} thành công!`,
  EDIT_SUCCESS: "Cập nhật thông tin ca bán hàng thành công!",
} as const;

const SHIFT_TABLE_COLUMNS = {
  CODE: "Mã ca",
  EMPLOYEE: "Nhân viên",
  OPENED_AT: "Thời gian mở",
  CLOSED_AT: "Thời gian đóng",
  OPENING_CASH: "Quỹ đầu ca",
  EXPECTED_CASH: "Tiền mặt kì vọng",
  ACTUAL_CASH: "Đếm thực tế",
  DIFFERENCE: "Chênh lệch",
  DIFFERENCE_REASON: "Lý do chênh lệch",
  STATUS: "Trạng thái",
  ACTIONS: "Thao tác",
} as const;

const SHIFT_OPEN_MODAL_UI = {
  TITLE: " KHAI BÁO MỞ CA MỚI",
  OWNER_DESCRIPTION:
    "Vui lòng khai báo quỹ tiền đầu ca và chọn nhân viên (nếu mở ca hộ) để kích hoạt ca làm việc.",
  CASHIER_DESCRIPTION:
    "Khai báo tiền quỹ đầu ca để kích hoạt phiên làm việc POS của bạn.",
  EMPLOYEE_LABEL: "Nhân viên nhận ca:",
  SELF_OPTION_LABEL: "-- Chính mình --",
  OPENING_CASH_LABEL: "Tiền mặt đầu ca (đ):",
  CONFIRM_BUTTON: "XÁC NHẬN MỞ CA",
} as const;

const SHIFT_RECONCILIATION_UI = {
  EXPECTED_CASH_LABEL: "Tiền mặt kì vọng:",
  ACTUAL_CASH_LABEL: "Tiền mặt thực tế:",
  DIFFERENCE_LABEL: "Chênh lệch:",
  ACTUAL_CASH_INPUT_LABEL: "Tiền mặt thực tế đếm tại két (đ):",
  DIFFERENCE_REASON_LABEL: "⚠️ Nhập lý do chênh lệch bắt buộc:",
  DIFFERENCE_REASON_PLACEHOLDER: "Nhập lý do...",
} as const;

export const SHIFT_UI = {
  COMMON: {
    EMPTY_VALUE: DATE_FORMAT.EMPTY_FULL,
    ZERO_AMOUNT_LABEL: NUMBER_FORMAT.ZERO_CURRENCY,
    POSITIVE_AMOUNT_PREFIX: "+",
    CLOSE_ICON: "✕",
    CANCEL_BUTTON: "HỦY BỎ",
    OPEN_SHIFT_BUTTON: "+ MỞ CA LÀM VIỆC MỚI",
    EMPTY_HISTORY_MESSAGE: "Không tìm thấy ca bán hàng nào phù hợp.",
    TABLE_COLUMNS: SHIFT_TABLE_COLUMNS,
    OPEN_MODAL: SHIFT_OPEN_MODAL_UI,
    RECONCILIATION: SHIFT_RECONCILIATION_UI,
  },
  SIDEBAR: {
    TITLE: "Ca bán hàng",
    STATUS_FILTER_LABEL: "Trạng thái ca",
    TIME_FILTER_LABEL: "Thời gian",
    TIME_FILTER_NAME: "shiftTime",
    CURRENT_MONTH_LABEL: "Tháng này",
    CUSTOM_TIME_LABEL: "Tùy chỉnh",
  },
  CASHIER: {
    LOADING_MESSAGE: "Đang tải thông tin ca làm việc...",
    CURRENT_SHIFT_TITLE: "Thông tin ca làm việc của bạn",
    CLOSE_SHIFT_BUTTON: "ĐÓNG CA BÁN HÀNG",
    OPENING_FUND_LABEL: "Tiền quỹ đầu ca",
    OPENED_AT_LABEL: "Mở ca lúc:",
    EXPECTED_CASH_LABEL: "Tiền mặt kì vọng trong két",
    EXPECTED_CASH_HINT: "Tự động cộng dồn doanh số tiền mặt",
    NO_ACTIVE_SHIFT_TITLE: "Bạn chưa mở ca làm việc!",
    NO_ACTIVE_SHIFT_DESCRIPTION:
      "Vui lòng khai báo quỹ tiền đầu ca để bắt đầu ghi nhận doanh thu và bán hàng POS.",
    HISTORY_TITLE: "Lịch sử ca làm việc của bạn",
    SEARCH_PLACEHOLDER: "Tìm theo mã ca, lý do...",
    CLOSE_MODAL: {
      TITLE: "XÁC NHẬN ĐỐI SOÁT & ĐÓNG CA",
      DESCRIPTION:
        "Vui lòng nhập số tiền mặt đếm thực tế tại két để đối soát chênh lệch trước khi kết thúc ca.",
      CONFIRM_BUTTON: "XÁC NHẬN ĐÓNG CA",
    },
  },
  HISTORY: {
    LOADING_MESSAGE: "Đang tải dữ liệu ca làm việc...",
    SEARCH_PLACEHOLDER: "Tìm theo nhân viên, mã ca...",
    CLOSE_CURRENT_SHIFT_BUTTON: "ĐÓNG CA HIỆN TẠI",
    TITLE: "Lịch sử các ca bán hàng",
    CLOSE_FOR_EMPLOYEE_BUTTON: "Đóng ca hộ",
    EDIT_TOOLTIP: "Sửa ca",
    DELETE_TOOLTIP: "Xóa ca",
    CLOSE_MODAL: {
      TITLE: "XÁC NHẬN ĐỐI SOÁT & ĐÓNG CA HỘ",
      DESCRIPTION:
        "Nhập số tiền mặt đếm thực tế để đối soát ca bán hàng của nhân viên.",
      DIFFERENCE_REASON_LABEL: "⚠️ Lý do chênh lệch bắt buộc:",
      DIFFERENCE_REASON_PLACEHOLDER: "Nhập lý do chênh lệch...",
      CONFIRM_BUTTON: "ĐỒNG Ý ĐÓNG CA",
    },
    EDIT_MODAL: {
      TITLE: "✏️ CẬP NHẬT THÔNG TIN CA BÁN HÀNG",
      SHIFT_CODE_LABEL: "Mã ca bán hàng:",
      EMPLOYEE_LABEL: "Nhân viên phục vụ:",
      OPENING_CASH_LABEL: "Quỹ đầu ca (đ):",
      ACTUAL_CASH_LABEL: "Tiền mặt thực tế đếm được (đ):",
      DIFFERENCE_REASON_LABEL: "Lý do chênh lệch (nếu có):",
      DIFFERENCE_REASON_PLACEHOLDER: "Nhập lý do chênh lệch...",
      SAVE_BUTTON: "LƯU THAY ĐỔI",
    },
  },
  MANAGEMENT: {
    LOADING_MESSAGE: "Đang tải ca hiện tại...",
    ACCOUNTANT_RESTRICTION:
      "🔒 Bạn đang truy cập với vai trò Kế toán. Menu thao tác đóng/mở ca bán hàng bị hạn chế (Chỉ xem lịch sử).",
    TITLE: "Quản lý Ca Hiện Tại",
    NO_ACTIVE_SHIFT_DESCRIPTION:
      "Không có ca bán hàng nào đang hoạt động. Bấm vào nút bên dưới để khai báo mở ca bán hàng mới.",
    EMPLOYEE_LABEL: "Nhân viên ca:",
    OPENED_AT_LABEL: "Giờ mở ca:",
    OPENING_FUND_LABEL: "Tiền quỹ ban đầu:",
    EXPECTED_CASH_LABEL: "Tiền mặt dự kiến có trong két:",
    ACTUAL_CASH_INPUT_LABEL: "Tiền mặt đếm thực tế cuối ca:",
    DIFFERENCE_LABEL: "Chênh lệch (Thiếu/Thừa):",
    DIFFERENCE_WARNING_ICON: "⚠️",
    DIFFERENCE_WARNING_LABEL: "Phát hiện chênh lệch! Vui lòng nhập lý do:",
    DIFFERENCE_REASON_PLACEHOLDER:
      "Ví dụ: Thối thiếu cho khách hàng, thất lạc tiền lẻ...",
    CLOSE_SHIFT_BUTTON: "ĐỐI SOÁT & ĐÓNG CA",
  },
} as const;
