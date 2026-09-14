export const CUSTOMER_DEBT_STATUS_FILTER = {
  ALL: "Tất cả trạng thái nợ",
  HAS_DEBT: "Đang có nợ",
  NO_DEBT: "Không có nợ",
  EXCEEDED: "Vượt hạn mức",
  OVERDUE: "Quá hạn nợ",
} as const;

export const CUSTOMER_DETAIL_TABS = {
  INFO: "INFO",
  DEBT_ORDERS: "DEBT_ORDERS",
  RECONCILIATION: "RECONCILIATION",
  LOYALTY: "LOYALTY",
} as const;

export type TCustomerDetailTab =
  (typeof CUSTOMER_DETAIL_TABS)[keyof typeof CUSTOMER_DETAIL_TABS];

export const CUSTOMER_TAB_QUERY_PARAMS = {
  INFO: "",
  DEBT: "debt",
  RECONCILIATION: "reconciliation",
  LOYALTY: "loyalty",
} as const;

export const CUSTOMER_FILTER_OPTIONS = {
  DEBT_STATUSES: Object.values(CUSTOMER_DEBT_STATUS_FILTER),
  DEFAULT_DEBT_STATUS: CUSTOMER_DEBT_STATUS_FILTER.ALL,
} as const;

export const CUSTOMER_FORM_DEFAULTS = {
  CREDIT_LIMIT: 5_000_000,
  INITIAL_DEBT: 0,
} as const;

export const CUSTOMER_FORM_FIELDS = {
  NAME: "name",
  PHONE: "phone",
  EMAIL: "email",
  ADDRESS: "address",
  CREDIT_LIMIT: "creditLimit",
  DUE_DATE: "dueDate",
} as const;

export const CUSTOMER_DEBT_STATUS = {
  THRESHOLD: 0,
  HAS_DEBT: "Đang ghi nợ",
  CLEAR: "Không có nợ",
  EXCEEDED: "Vượt hạn mức",
  OVERDUE: "Quá hạn nợ",
} as const;

export const CUSTOMER_IDENTIFIERS = {
  PREFIX: "c",
  START_INDEX: 1,
} as const;

export const getNextCustomerId = (customerCount: number): string =>
  `${CUSTOMER_IDENTIFIERS.PREFIX}${
    customerCount + CUSTOMER_IDENTIFIERS.START_INDEX
  }`;

export const CUSTOMER_LOG = {
  ACTION: "THÊM_KHÁCH_HÀNG",
  UPDATE_ACTION: "SỬA_KHÁCH_HÀNG",
  DELETE_ACTION: "XÓA_KHÁCH_HÀNG",
  REMINDER_ACTION: "NHẮC_CÔNG_NỢ",
  REMIND_ACTION: "NHẮC_CÔNG_NỢ",
  PAY_DEBT_ACTION: "THU_CÔNG_NỢ",
  PAY_ACTION: "THU_CÔNG_NỢ",
  RECONCILE_CREATE_ACTION: "TẠO_ĐỐI_CHIẾU_CÔNG_NỢ",
  RECONCILE_CONFIRM_ACTION: "CHỐT_ĐỐI_CHIẾU_CÔNG_NỢ",
  RECONCILE_CANCEL_ACTION: "HỦY_ĐỐI_CHIẾU_CÔNG_NỢ",
  DEBT_ADJUSTMENT_ACTION: "ĐIỀU_CHỈNH_CÔNG_NỢ",
  added: (name: string, phone: string) =>
    `Khách hàng mới: ${name} (SĐT: ${phone})`,
  updated: (name: string) => `Cập nhật thông tin khách hàng: ${name}`,
  deleted: (name: string) => `Đã xóa khách hàng: ${name}`,
  reminded: (name: string, debtAmount: string) =>
    `Đã nhắc nợ khách hàng: ${name} (Số tiền: ${debtAmount} đ)`,
  paid: (name: string, paidAmount: string) =>
    `Ghi nhận thu nợ: ${name} (Số tiền: ${paidAmount} đ)`,
  debtPaid: (name: string, paidAmount: string, remainingDebt: string) =>
    `Ghi nhận thu nợ: ${name} (Thu: ${paidAmount} đ - Dư nợ còn lại: ${remainingDebt} đ)`,
  reconcileCreated: (code: string, customerName: string) =>
    `Lập biên bản đối chiếu ${code} cho khách hàng ${customerName}`,
  reconcileConfirmed: (code: string, toDate: string) =>
    `Chốt khóa sổ biên bản đối chiếu ${code} đến ngày ${toDate}`,
  debtAdjusted: (customerName: string, type: string, amount: string) =>
    `Lập bút toán ${type} cho ${customerName}: ${amount} đ`,
} as const;

export const CUSTOMER_UI = {
  SIDEBAR: {
    TITLE: "Bộ lọc khách hàng",
    DEBT_FILTER: "Trạng thái công nợ",
  },
  SUMMARY_CARDS: {
    TOTAL_DEBT_TITLE: "Tổng dư nợ cần thu",
    DEBTORS_COUNT_TITLE: "Khách hàng đang nợ",
    EXCEEDED_COUNT_TITLE: "Khách vượt hạn mức",
  },
  LIST: {
    TITLE: "Danh sách Khách hàng thân thiết & Công nợ",
    SEARCH_PLACEHOLDER: "Tìm kiếm theo tên, số điện thoại, email, địa chỉ...",
    CREATE_BUTTON: "Thêm khách hàng",
    REMIND_BUTTON: "Nhắc nợ",
    PAY_DEBT_BUTTON: "Thu nợ",
    RECONCILE_BUTTON: "Đối chiếu",
    EMPTY_MESSAGE: "Không tìm thấy khách hàng nào phù hợp với bộ lọc.",
    COLUMNS: {
      NAME: "Họ và tên",
      PHONE: "Số điện thoại",
      EMAIL: "Địa chỉ Email",
      ADDRESS: "Địa chỉ",
      CREDIT_LIMIT: "Hạn mức nợ",
      CURRENT_DEBT: "Dư nợ hiện tại",
      DUE_DATE: "Hạn thanh toán",
      AVAILABLE_DEBT: "Hạn mức còn lại",
      DEBT_STATUS: "Trạng thái nợ",
      REMIND_COLUMN: "Công nợ",
      ACTIONS: "Thao tác",
    },
    EMPTY_EMAIL: "--",
    EMPTY_ADDRESS: "--",
  },
  MODAL: {
    CREATE_TITLE: "Thêm khách hàng mới",
    EDIT_TITLE: "Cập nhật thông tin khách hàng",
    SUBMIT_CREATE: "Lưu khách hàng",
    SUBMIT_EDIT: "Cập nhật",
    CANCEL: "Hủy bỏ",
    LABELS: {
      NAME: "Họ và tên *",
      PHONE: "Số điện thoại *",
      TAX_CODE: "Mã số thuế",
      EMAIL: "Địa chỉ Email",
      ADDRESS: "Địa chỉ",
      CREDIT_LIMIT: "Hạn mức nợ tối đa (đ) *",
      DUE_DATE: "Ngày đến hạn thanh toán nợ",
    },
    PLACEHOLDERS: {
      NAME: "Nhập họ và tên khách hàng",
      PHONE: "Ví dụ: 0988888888",
      TAX_CODE: "Ví dụ: 0101234567",
      EMAIL: "example@gmail.com",
      ADDRESS: "Địa chỉ khách hàng",
      CREDIT_LIMIT: "5,000,000",
      DUE_DATE: "Chọn ngày đến hạn thanh toán",
    },
  },
  REMINDER_MODAL: {
    TITLE: "Nhắc nợ công nợ đến hạn",
    SUBTITLE: "Nội dung tin nhắn nhắc nợ gửi cho khách hàng",
    LABEL_MESSAGE: "Nội dung tin nhắn nhắc nợ (Có thể chỉnh sửa):",
    COPY_BUTTON: "Sao chép tin nhắn",
    EMAIL_BUTTON: "Gửi Email nhắc nợ",
    ZALO_BUTTON: "Gửi qua Zalo",
    CONFIRM_BUTTON: "Xác nhận đã nhắc nợ",
    CANCEL_BUTTON: "Đóng",
    TEMPLATE_BUILDER: (name: string, formattedDebt: string) =>
      `Kính gửi ${name}, Cửa hàng Bán Hàng Việt xin thông báo quý khách có khoản công nợ là ${formattedDebt} đ đã đến hạn thanh toán. Rất mong quý khách sắp xếp thanh toán sớm. Trân trọng cảm ơn!`,
  },
  PAY_DEBT_MODAL: {
    TITLE: "Ghi nhận Thu nợ Khách hàng",
    SUBTITLE: "Nhập số tiền khách hàng trả để trừ vào dư nợ hiện tại",
    LABEL_AMOUNT: "Số tiền thu nợ (đ) *",
    LABEL_PAYMENT_METHOD: "Hình thức thu nợ",
    LABEL_NOTES: "Ghi chú thu nợ",
    PLACEHOLDER_AMOUNT: "Nhập số tiền thu nợ...",
    PLACEHOLDER_NOTES: "Ví dụ: Khách trả tiền mặt tại cửa hàng...",
    QUICK_FULL: "Thu hết dư nợ",
    QUICK_HALF: "Thu 50%",
    SUBMIT_BUTTON: "Xác nhận thu nợ",
    CANCEL_BUTTON: "Hủy bỏ",
    PAYMENT_METHODS: {
      CASH: "Tiền mặt",
      BANK_TRANSFER: "Chuyển khoản",
    },
  },
  RECONCILIATION_MODAL: {
    TITLE: "Biên bản Đối chiếu Công nợ Khách hàng",
    PREVIEW_TITLE: "Bảng Đối Chiếu Công Nợ Phát Sinh Trong Kỳ",
    START_DATE_LABEL: "Từ ngày *",
    END_DATE_LABEL: "Đến ngày *",
    NOTES_LABEL: "Ghi chú / Thỏa thuận đối chiếu",
    NOTES_PLACEHOLDER: "Nhập ghi chú đối chiếu nếu có...",
    PREVIEW_BUTTON: "Xem trước số liệu",
    CONFIRM_NOW_LABEL: "Chốt khóa sổ ngay (khách đã ký trực tiếp)",
    CONFIRM_NOW_HELP: "Hệ thống sẽ khóa tất cả giao dịch nợ trước ngày kết thúc, chống sửa lùi",
    SAVE_DRAFT_BUTTON: "Lưu bản nháp (DRAFT)",
    DRAFT_SUBMIT_BUTTON: "Lưu bản nháp (DRAFT)",
    CONFIRM_LOCK_BUTTON: "Chốt & Khóa sổ nợ",
    CONFIRM_SUBMIT_BUTTON: "Chốt & Khóa sổ nợ",
    PRINT_STATEMENT_BUTTON: "In giấy xác nhận nợ",
    CANCEL_BUTTON: "Đóng",
    NO_TRANSACTIONS_BANNER: "Khách hàng không phát sinh giao dịch nợ trong kỳ đối chiếu này. Số dư đầu kỳ bằng số dư cuối kỳ.",
  },
  STATEMENT_PRINT_MODAL: {
    TITLE: "Giấy Đối Chiếu và Xác Nhận Công Nợ",
    SUBTITLE: "Mẫu chứng từ chuẩn quy định thương mại & kế toán",
    PRINT_BUTTON: "In biên bản (Print)",
    CLOSE_BUTTON: "Đóng",
  },
  ADJUSTMENT_MODAL: {
    TITLE: "Lập Bút toán Điều chỉnh Công nợ",
    SUBTITLE: "Điều chỉnh nợ cho khách hàng sau mốc khóa sổ (yêu cầu lý do kiểm toán)",
    LABEL_TYPE: "Loại điều chỉnh *",
    LABEL_AMOUNT: "Số tiền điều chỉnh (đ) *",
    LABEL_REASON: "Lý do điều chỉnh (bắt buộc theo kiểm toán) *",
    PLACEHOLDER_AMOUNT: "Nhập số tiền điều chỉnh...",
    PLACEHOLDER_REASON: "Ví dụ: Sai lệch số liệu đơn cũ đã khóa sổ...",
    SUBMIT_BUTTON: "Lập bút toán",
    CANCEL_BUTTON: "Hủy",
  },
  DELETE_MODAL: {
    TITLE: "Xóa khách hàng",
    CONFIRM_MESSAGE: (name: string) =>
      `Bạn có chắc chắn muốn xóa khách hàng "${name}"? Hành động này không thể hoàn tác.`,
    CONFIRM_BUTTON: "Xác nhận xóa",
    CANCEL_BUTTON: "Hủy",
  },
} as const;
