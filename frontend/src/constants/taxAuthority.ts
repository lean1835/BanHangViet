import { APP_ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import {
  E_INVOICE_DEFAULTS,
  E_INVOICE_STATUS,
} from "@/constants/eInvoice";

export const TAX_AUTHORITY_COPY = {
  HEADER_TITLE: "Cổng Tiếp Nhận & Cấp Mã Hóa Đơn Điện Tử",
  HEADER_DESCRIPTION:
    "Mô phỏng quy trình xử lý hóa đơn, cấp mã số thuế tự động hoặc thủ công từ điểm bán.",
  ROLE_BADGE: `Cơ quan thuế Mô phỏng (${USER_ROLES.TAX_AUTHORITY})`,
  SIDEBAR_TITLE: "Cổng cơ quan thuế",
} as const;

export const TAX_AUTHORITY_NAV_ITEMS = [
  { to: APP_ROUTES.TAX_AUTHORITY_INVOICES, label: "Duyệt cấp mã hóa đơn" },
  { to: APP_ROUTES.TAX_AUTHORITY_CONFIG, label: "Cấu hình tiếp nhận" },
] as const;

export const TAX_AUTHORITY_INVOICE_STATUS = {
  ISSUED: E_INVOICE_STATUS.ISSUED,
  WAITING: E_INVOICE_STATUS.WAITING_TAX_CODE,
  SEND_ERROR: E_INVOICE_STATUS.SEND_ERROR,
} as const;

export const TAX_AUTHORITY_STATUS_LABELS = {
  ISSUED: "Đã cấp mã",
  WAITING: "Chờ cấp mã",
  SEND_ERROR: "Lỗi thuế/Từ chối",
  DEFAULT: "Khởi tạo",
} as const;

export const TAX_AUTHORITY_APPROVAL_CONFIG = {
  APPROVAL_RATE: "100%",
  TAX_CODE_PREFIX: "CQT-20260715-",
  TAX_CODE_RANDOM_MIN: 100000,
  TAX_CODE_RANDOM_RANGE: 900000,
  EMPTY_TAX_CODE: E_INVOICE_DEFAULTS.EMPTY_TAX_AUTHORITY_CODE,
} as const;

export const createTaxAuthorityCode = (): string =>
  `${TAX_AUTHORITY_APPROVAL_CONFIG.TAX_CODE_PREFIX}${Math.floor(
    TAX_AUTHORITY_APPROVAL_CONFIG.TAX_CODE_RANDOM_MIN +
      Math.random() * TAX_AUTHORITY_APPROVAL_CONFIG.TAX_CODE_RANDOM_RANGE,
  )}`;

export const TAX_AUTHORITY_UI = {
  SUMMARY: {
    RECEIVED_TITLE: "Tổng hóa đơn tiếp nhận",
    RECEIVED_DETAIL: "Tự động bắt gói từ hàng đợi",
    ISSUED_TITLE: "Hóa đơn đã cấp mã thành công",
    ISSUED_RATE_PREFIX: "Tỷ lệ duyệt cấp mã:",
    WAITING_TITLE: "Hóa đơn chờ cấp mã (WAITING)",
    WAITING_DETAIL: "Cần duyệt thủ công phía dưới",
    INVOICE_SUFFIX: "hóa đơn",
  },
  APPROVAL: {
    TITLE: "Danh sách hóa đơn được truyền tới Cơ quan Thuế",
    COLUMNS: {
      INVOICE_CODE: "Mã hóa đơn",
      CUSTOMER: "Khách hàng",
      TOTAL: "Tổng thanh toán",
      STATUS: "Trạng thái thuế",
      TAX_CODE: "Mã cơ quan thuế cấp",
      ACTIONS: "Thao tác cơ quan thuế",
    },
    APPROVE_ACTION: "Cấp mã thuế",
    REJECT_ACTION: "Từ chối",
  },
  RECEIVING_CONFIG_TITLE: "Cấu hình tham số tiếp nhận mô phỏng",
} as const;

export const TAX_AUTHORITY_LOG_ACTIONS = {
  APPROVE: "THUẾ_CẤP_MÃ",
  REJECT: "THUẾ_TỪ_CHỐI",
} as const;

export const TAX_AUTHORITY_MESSAGES = {
  APPROVE_SUCCESS: "Đã cấp mã hóa đơn thành công!",
  REJECT_SUCCESS: "Đã từ chối cấp mã!",
  APPROVED_STATE: "🟢 Đã duyệt thành công",
  NO_ACTION: "Không cần thao tác",
} as const;

export const TAX_AUTHORITY_LOG_TARGETS = {
  approve: (lookupCode: string): string =>
    `Cơ quan thuế duyệt cấp mã cho hóa đơn ${lookupCode}`,
  reject: (lookupCode: string): string =>
    `Cơ quan thuế từ chối cấp mã cho hóa đơn ${lookupCode}`,
} as const;

export const TAX_RECEIVING_OPTIONS = [
  {
    id: "auto-cert",
    defaultChecked: true,
    label:
      "Tự động duyệt cấp mã ngay lập tức cho các hóa đơn DRAFT gửi lên",
  },
  {
    id: "tax-strict",
    defaultChecked: true,
    label: "Bắt buộc hóa đơn phải có ký hiệu và mẫu số hợp lệ (QTN-02)",
  },
] as const;
