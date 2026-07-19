export const E_INVOICE_STATUS = {
  DRAFT: "DRAFT",
  WAITING_TAX_CODE: "WAITING_TAX_CODE",
  ISSUED: "ISSUED",
  SEND_ERROR: "SEND_ERROR",
  ADJUSTED: "ADJUSTED",
  CANCELED: "CANCELED",
} as const;

export type TEInvoiceStatus =
  (typeof E_INVOICE_STATUS)[keyof typeof E_INVOICE_STATUS];

export const E_INVOICE_DEFAULTS = {
  EMPTY_TAX_AUTHORITY_CODE: "-",
} as const;
