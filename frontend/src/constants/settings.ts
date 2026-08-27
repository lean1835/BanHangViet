import { APP_ROUTES } from "./routes";
import { APP_FALLBACKS } from "./app";

export const SETTINGS_NAVIGATION_ITEMS = [
  {
    path: APP_ROUTES.SETTINGS_POINTS_OF_SALE,
    label: "Điểm bán (Chi nhánh)",
  },
  {
    path: APP_ROUTES.SETTINGS_BUSINESS_INFO,
    label: "Thông tin cửa hàng",
  },
  {
    path: APP_ROUTES.SETTINGS_INVOICE_TEMPLATE,
    label: "Mẫu hóa đơn",
  },
  {
    path: APP_ROUTES.SETTINGS_TAX_RATES,
    label: "Thuế suất",
  },
  {
    path: APP_ROUTES.SETTINGS_BACKUP_EXPORT,
    label: "Sao lưu & Phục hồi dữ liệu",
  },
] as const;

export const SETTINGS_UI = {
  SIDEBAR: {
    TITLE: "Cấu hình",
    SECTION_LABEL: "Danh mục cấu hình",
  },
  BUSINESS_INFO: {
    TITLE: "Hồ sơ Thông tin Hộ kinh doanh",
    LABELS: {
      NAME: "Tên Hộ kinh doanh cá thể:",
      TAX_CODE: "Mã số thuế đăng ký:",
      PHONE: "Số điện thoại liên lạc:",
      ADDRESS: "Địa chỉ cửa hàng vật lý:",
    },
    NOTICE_ICON: "",
    NOTICE:
      "Thông tin hồ sơ hộ kinh doanh được đồng bộ tự động từ tờ khai hóa đơn thuế điện tử và không được phép chỉnh sửa tự do sau khi cơ quan thuế đã cấp mã số kinh doanh.",
  },
  PRINTER: {
    TITLE: "Thiết lập Máy in Hóa đơn bán lẻ",
    DEVICE_LABEL: "Chọn thiết bị máy in kết nối:",
    PAPER_SIZE_LABEL: "Khổ giấy (Khổ in):",
    COPY_COUNT_LABEL: "Số liên bản in:",
    AUTO_PRINT_LABEL:
      "Tự động in hóa đơn ngay sau khi thanh toán đơn hàng (Chốt ca)",
    SAVE_ACTION: "Lưu cấu hình",
    TEST_ACTION: "In thử hóa đơn K80",
  },
  TAX_RATE: {
    TITLE: "Cấu hình Thuế suất doanh thu Hộ kinh doanh",
    COLUMNS: {
      CODE: "Mã ngành/Thuế",
      DESCRIPTION: "Mô tả nhóm hàng hóa",
      VAT_RATE: "Tỷ lệ tính thuế GTGT",
      PERSONAL_INCOME_TAX_RATE: "Tỷ lệ thuế TNCN",
      STATUS: "Trạng thái áp dụng",
    },
  },
} as const;

export const SETTINGS_ELEMENT_IDS = {
  AUTO_PRINT: "auto-print",
} as const;

export const DEFAULT_BUSINESS_INFO = {
  NAME: APP_FALLBACKS.HOUSEHOLD_NAME,
  TAX_CODE: "8934567890",
  PHONE_NUMBER: "0988888888",
  ADDRESS: "Hà Nội, Việt Nam",
} as const;

export const PRINTER_DEVICE_OPTIONS = [
  "Máy in nhiệt K80 (Kết nối USB/LAN)",
  "Máy in khổ giấy A5 (Kết nối văn phòng)",
  "Máy in hóa đơn bluetooth mini",
] as const;

export const PRINTER_PAPER_SIZE_OPTIONS = [
  "K80 (80mm)",
  "K58 (58mm)",
  "Khổ A5 dọc",
] as const;

export const PRINTER_DEFAULTS = {
  COPY_COUNT: 1,
  MIN_COPY_COUNT: 1,
  AUTO_PRINT: true,
} as const;

export const PRINTER_MESSAGES = {
  SAVE_UNAVAILABLE:
    "Chức năng lưu cấu hình máy in chưa được kết nối với hệ thống.",
  TEST_UNAVAILABLE:
    "Chức năng in thử hóa đơn chưa được kết nối với thiết bị máy in.",
} as const;

export const TAX_RATE_STATUS = {
  DEFAULT: "DEFAULT",
  ACTIVE: "ACTIVE",
} as const;

export interface TaxSectorPreset {
  id: string;
  label: string;
  name: string;
  vatRate: number;
  pitRate: number;
}

export const TAX_SECTOR_PRESETS: TaxSectorPreset[] = [
  {
    id: "DISTRIBUTION",
    label: "Phân phối, cung cấp hàng hóa (GTGT 1.0% - TNCN 0.5%)",
    name: "VAT-01 (Phân phối, cung cấp hàng hóa)",
    vatRate: 1.0,
    pitRate: 0.5,
  },
  {
    id: "SERVICES",
    label: "Dịch vụ, ăn uống, thi công không bao thầu (GTGT 5.0% - TNCN 2.0%)",
    name: "VAT-05 (Dịch vụ, ăn uống, thi công)",
    vatRate: 5.0,
    pitRate: 2.0,
  },
  {
    id: "PRODUCTION",
    label: "Sản xuất, vận tải, dịch vụ gắn hàng hóa (GTGT 3.0% - TNCN 1.5%)",
    name: "VAT-03 (Sản xuất, vận tải, dịch vụ hàng hóa)",
    vatRate: 3.0,
    pitRate: 1.5,
  },
  {
    id: "OTHER",
    label: "Hoạt động kinh doanh khác (GTGT 2.0% - TNCN 1.0%)",
    name: "VAT-02 (Hoạt động kinh doanh khác)",
    vatRate: 2.0,
    pitRate: 1.0,
  },
  {
    id: "EXEMPT",
    label: "Không chịu thuế / Miễn thuế (GTGT 0.0% - TNCN 0.0%)",
    name: "VAT-00 (Miễn thuế / Không chịu thuế)",
    vatRate: 0.0,
    pitRate: 0.0,
  },
];
