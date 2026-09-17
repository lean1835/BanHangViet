export const EXCHANGE_TYPES = {
  EQUAL_VALUE: "EQUAL_VALUE",
  HIGHER_VALUE: "HIGHER_VALUE",
  LOWER_VALUE: "LOWER_VALUE",
} as const;

export type TExchangeType = (typeof EXCHANGE_TYPES)[keyof typeof EXCHANGE_TYPES];

export const EXCHANGE_TYPE_LABELS: Record<TExchangeType, string> = {
  [EXCHANGE_TYPES.EQUAL_VALUE]: "Đổi ngang giá (diff = 0)",
  [EXCHANGE_TYPES.HIGHER_VALUE]: "Đổi giá cao hơn (Phụ thu)",
  [EXCHANGE_TYPES.LOWER_VALUE]: "Đổi giá thấp hơn (Hoàn tiền)",
};

export const EXCHANGE_TYPE_BADGES: Record<
  TExchangeType,
  { bg: string; text: string; border: string }
> = {
  [EXCHANGE_TYPES.EQUAL_VALUE]: {
    bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  [EXCHANGE_TYPES.HIGHER_VALUE]: {
    bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  [EXCHANGE_TYPES.LOWER_VALUE]: {
    bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
};

export const EXCHANGE_STATUS = {
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type TExchangeStatus = (typeof EXCHANGE_STATUS)[keyof typeof EXCHANGE_STATUS];

export const EXCHANGE_STATUS_LABELS: Record<string, string> = {
  [EXCHANGE_STATUS.COMPLETED]: "Hoàn thành",
  [EXCHANGE_STATUS.CANCELLED]: "Đã hủy",
};

export const EXCHANGE_STATUS_BADGES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  [EXCHANGE_STATUS.COMPLETED]: {
    bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
    text: "text-emerald-800 dark:text-emerald-200",
    border: "border-emerald-300 dark:border-emerald-800",
  },
  [EXCHANGE_STATUS.CANCELLED]: {
    bg: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
    text: "text-rose-800 dark:text-rose-200",
    border: "border-rose-300 dark:border-rose-800",
  },
};

export const EXTRA_PAYMENT_METHODS = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  QR_TRANSFER: "QR_TRANSFER",
  DEBT: "DEBT",
} as const;

export type TExtraPaymentMethod =
  (typeof EXTRA_PAYMENT_METHODS)[keyof typeof EXTRA_PAYMENT_METHODS];

export const EXTRA_PAYMENT_METHOD_OPTIONS: {
  value: TExtraPaymentMethod;
  label: string;
  description: string;
}[] = [
  {
    value: EXTRA_PAYMENT_METHODS.CASH,
    label: "Tiền mặt",
    description: "Khách đưa tiền mặt tại quầy cho khoản chênh lệch",
  },
  {
    value: EXTRA_PAYMENT_METHODS.QR_TRANSFER,
    label: "Quét mã VietQR",
    description: "Khách quét mã chuyển khoản nhanh tại quầy",
  },
  {
    value: EXTRA_PAYMENT_METHODS.BANK_TRANSFER,
    label: "Chuyển khoản ngân hàng",
    description: "Khách chuyển qua số tài khoản cửa hàng",
  },
  {
    value: EXTRA_PAYMENT_METHODS.DEBT,
    label: "Ghi nợ (Khách quen)",
    description: "Cộng khoản chênh lệch vào công nợ theo QTN-13",
  },
];

export const EXTRA_PAYMENT_METHOD_LABELS: Record<string, string> = {
  [EXTRA_PAYMENT_METHODS.CASH]: "Tiền mặt",
  [EXTRA_PAYMENT_METHODS.QR_TRANSFER]: "Quét mã QR",
  [EXTRA_PAYMENT_METHODS.BANK_TRANSFER]: "Chuyển khoản",
  [EXTRA_PAYMENT_METHODS.DEBT]: "Ghi nợ",
};

export const PRODUCT_EXCHANGE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_MAX_DAYS: 7,
} as const;
