export const SUPPLIER_DEBT_PAYMENT_METHODS = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
} as const;

export const SUPPLIER_DEBT_STATUS_MAP = {
  PENDING: {
    label: "Chưa trả hết",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  PAID: {
    label: "Đã thanh toán",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  OVERDUE: {
    label: "Quá hạn",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
} as const;

export const SUPPLIER_DEBT_TYPE_MAP = {
  DEBT_CREATED: {
    label: "Nhập hàng ghi nợ",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    sign: "+",
    amountClass: "text-orange-600 font-bold",
  },
  DEBT_PAID: {
    label: "Thanh toán trả nợ",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sign: "-",
    amountClass: "text-emerald-600 font-bold",
  },
} as const;

export const SUPPLIER_DEBT_UI = {
  SUMMARY: {
    TOTAL_OUTSTANDING: "Tổng nợ phải trả",
    SUPPLIERS_WITH_DEBT: "Số NCC còn nợ",
    TOTAL_OVERDUE: "Nợ quá hạn",
  },
  PAY_MODAL: {
    TITLE: "Thanh toán công nợ Nhà cung cấp",
    SUBTITLE: "Ghi nhận trả tiền hàng cho nhà cung cấp (theo nguyên tắc FIFO trừ dần)",
    LABEL_SUPPLIER: "Nhà cung cấp",
    LABEL_CURRENT_DEBT: "Dư nợ hiện tại",
    LABEL_AMOUNT: "Số tiền thanh toán",
    PLACEHOLDER_AMOUNT: "Nhập số tiền cần trả...",
    QUICK_FULL: "Trả hết (100%)",
    QUICK_HALF: "Trả 50%",
    LABEL_REMAINING_DEBT: "Dư nợ còn lại sau thanh toán",
    LABEL_PAYMENT_METHOD: "Hình thức thanh toán",
    LABEL_DUE_DATE: "Ngày hẹn trả lần tiếp theo",
    LABEL_NOTES: "Ghi chú thanh toán",
    PLACEHOLDER_NOTES: "Nhập ghi chú thanh toán (nếu có)...",
    CANCEL_BUTTON: "Hủy bỏ",
    SUBMIT_BUTTON: "Xác nhận thanh toán",
    SUBMITTING_BUTTON: "Đang xử lý...",
  },
  HISTORY_TAB: {
    TITLE: "Lịch sử biến động công nợ",
    EMPTY_TITLE: "Chưa có lịch sử công nợ",
    EMPTY_DESC: "Nhà cung cấp này chưa phát sinh phiếu nhập ghi nợ hoặc giao dịch thanh toán nào.",
    COL_DATE: "Thời gian",
    COL_TYPE: "Loại giao dịch",
    COL_RECEIPT: "Mã phiếu nhập",
    COL_AMOUNT: "Số tiền giao dịch",
    COL_REMAINING: "Dư nợ còn lại",
    COL_STATUS: "Trạng thái",
    COL_ACTOR: "Người thực hiện",
    COL_NOTES: "Ghi chú",
  },
} as const;

export const SUPPLIER_DEBT_MESSAGES = {
  PAY_SUCCESS: "Ghi nhận thanh toán công nợ thành công!",
  PAY_FAILED: "Không thể thanh toán công nợ. Vui lòng kiểm tra lại.",
  INVALID_AMOUNT: "Số tiền thanh toán phải lớn hơn 0.",
  AMOUNT_EXCEEDS_DEBT: "Số tiền thanh toán không được lớn hơn tổng dư nợ hiện tại của nhà cung cấp.",
  NO_DEBT_TO_PAY: "Nhà cung cấp hiện không có dư nợ cần thanh toán.",
} as const;

export const SUPPLIER_DEBT_LOG_ACTIONS = {
  PAY: "Thanh toán nợ NCC",
} as const;
