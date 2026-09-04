export const RETURN_TICKET_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type TReturnTicketStatus =
  (typeof RETURN_TICKET_STATUS)[keyof typeof RETURN_TICKET_STATUS];

export const RETURN_TICKET_STATUS_LABELS: Record<TReturnTicketStatus, string> = {
  [RETURN_TICKET_STATUS.PENDING]: "Chờ duyệt",
  [RETURN_TICKET_STATUS.APPROVED]: "Đã duyệt",
  [RETURN_TICKET_STATUS.REJECTED]: "Từ chối",
};

export const RETURN_TICKET_STATUS_BADGES: Record<
  TReturnTicketStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  [RETURN_TICKET_STATUS.PENDING]: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Chờ duyệt",
  },
  [RETURN_TICKET_STATUS.APPROVED]: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Đã duyệt",
  },
  [RETURN_TICKET_STATUS.REJECTED]: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    label: "Từ chối",
  },
};

export const REFUND_PAYMENT_METHODS = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  DEBT_REDUCTION: "DEBT_REDUCTION",
} as const;

export type TRefundPaymentMethod =
  (typeof REFUND_PAYMENT_METHODS)[keyof typeof REFUND_PAYMENT_METHODS];

export const REFUND_PAYMENT_METHOD_LABELS: Record<TRefundPaymentMethod, string> = {
  [REFUND_PAYMENT_METHODS.CASH]: "Tiền mặt",
  [REFUND_PAYMENT_METHODS.BANK_TRANSFER]: "Chuyển khoản",
  [REFUND_PAYMENT_METHODS.DEBT_REDUCTION]: "Giảm trừ công nợ",
};

export const REFUND_PAYMENT_METHOD_OPTIONS = [
  { value: REFUND_PAYMENT_METHODS.CASH, label: "Tiền mặt" },
  { value: REFUND_PAYMENT_METHODS.BANK_TRANSFER, label: "Chuyển khoản ngân hàng" },
  { value: REFUND_PAYMENT_METHODS.DEBT_REDUCTION, label: "Giảm trừ công nợ khách hàng" },
];

export const RETURN_TICKET_CONFIG = {
  DEFAULT_MAX_RETURN_DAYS: 7,
  MIN_SEARCH_LENGTH: 1,
  DEFAULT_PAGE_SIZE: 8,
} as const;
