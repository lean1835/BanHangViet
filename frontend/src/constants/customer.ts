export const CUSTOMER_TYPE_FILTER = {
  ALL: "Tất cả",
  INDIVIDUAL: "Cá nhân",
  COMPANY: "Công ty",
} as const;

export const CUSTOMER_GENDER_FILTER = {
  ALL: "Tất cả",
  MALE: "Nam",
  FEMALE: "Nữ",
} as const;

export const CUSTOMER_FILTER_OPTIONS = {
  TYPES: Object.values(CUSTOMER_TYPE_FILTER),
  GENDERS: Object.values(CUSTOMER_GENDER_FILTER),
  DEFAULT_TYPE: CUSTOMER_TYPE_FILTER.ALL,
  DEFAULT_GENDER: CUSTOMER_GENDER_FILTER.ALL,
} as const;

export const CUSTOMER_FORM_DEFAULTS = {
  CREDIT_LIMIT: 5_000_000,
  INITIAL_DEBT: 0,
} as const;

export const CUSTOMER_FORM_FIELDS = {
  NAME: "name",
  PHONE: "phone",
  EMAIL: "email",
  CREDIT_LIMIT: "creditLimit",
} as const;

export const CUSTOMER_DEBT_STATUS = {
  THRESHOLD: 0,
  HAS_DEBT: "Đang ghi nợ",
  CLEAR: "Không có nợ",
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
  added: (name: string, phone: string) =>
    `Khách hàng mới: ${name} (SĐT: ${phone})`,
} as const;

export const CUSTOMER_UI = {
  SIDEBAR: {
    TITLE: "Khách hàng",
    TYPE_FILTER: "Loại khách hàng",
    GENDER_FILTER: "Giới tính",
  },
  LIST: {
    TITLE: "Khách hàng thân thiết & Công nợ chi tiết",
    COLUMNS: {
      NAME: "Họ và tên",
      PHONE: "Số điện thoại",
      EMAIL: "Địa chỉ thư điện tử",
      CREDIT_LIMIT: "Hạn mức ghi nợ",
      CURRENT_DEBT: "Dư nợ hiện tại",
      AVAILABLE_DEBT: "Dư nợ khả dụng",
      DEBT_STATUS: "Trạng thái công nợ",
    },
    EMPTY_EMAIL: "--",
  },
  FORM: {
    TITLE: "Thêm khách hàng mới",
    LABELS: {
      NAME: "Tên khách hàng:",
      PHONE: "Số điện thoại:",
      EMAIL: "Địa chỉ Email:",
      CREDIT_LIMIT: "Hạn mức nợ tối đa (đ):",
    },
    PLACEHOLDERS: {
      NAME: "Họ và tên",
      PHONE: "Ví dụ: 0988888888",
      EMAIL: "example@gmail.com",
    },
    SUBMIT: "Lưu hồ sơ khách",
  },
} as const;
