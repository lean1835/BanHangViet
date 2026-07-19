import { APP_ROUTES } from "./routes";

export const AUTH_API_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
} as const;

export const AUTH_API_RESPONSE_FIELDS = {
  RESULT: "result",
  TOKEN: "token",
  USER_ID: "userId",
  USERNAME: "username",
  FULL_NAME: "fullName",
  ROLE_CODE: "roleCode",
  HOUSEHOLD_ID: "householdId",
  HOUSEHOLD_NAME: "householdName",
  TAX_CODE: "taxCode",
  HOUSEHOLD_PHONE: "householdPhone",
  HOUSEHOLD_ADDRESS: "householdAddress",
} as const;

export const AUTH_FORM_FIELDS = {
  HOUSEHOLD_NAME: "householdName",
  TAX_CODE: "taxCode",
  HOUSEHOLD_PHONE: "householdPhone",
  HOUSEHOLD_ADDRESS: "householdAddress",
  FULL_NAME: "fullName",
  USERNAME: "username",
  PASSWORD: "password",
} as const;

export const AUTH_ENVIRONMENT = {
  PRODUCTION: "production",
} as const;

export const AUTH_VALIDATION = {
  REQUIRED_TEXT_MIN_LENGTH: 1,
  OWNER_NAME_MIN_LENGTH: 2,
  USERNAME_MIN_LENGTH: 4,
  PASSWORD_MIN_LENGTH: 6,
  TAX_CODE_PATTERN: /^\d{10}(-\d{3})?$/,
  VIETNAM_PHONE_PATTERN: /^(0[3|5|7|8|9])([0-9]{8})$/,
} as const;

export const AUTH_VALIDATION_MESSAGES = {
  HOUSEHOLD_NAME_REQUIRED: "Vui lòng nhập tên Hộ kinh doanh",
  HOUSEHOLD_NAME_FORM_REQUIRED: "Vui lòng nhập tên Hộ kinh doanh!",
  TAX_CODE_REQUIRED: "Vui lòng nhập mã số thuế!",
  PHONE_REQUIRED: "Vui lòng nhập số điện thoại!",
  HOUSEHOLD_ADDRESS_REQUIRED: "Vui lòng nhập địa chỉ Hộ kinh doanh",
  HOUSEHOLD_ADDRESS_FORM_REQUIRED:
    "Vui lòng nhập địa chỉ Hộ kinh doanh!",
  FULL_NAME_REQUIRED: "Vui lòng nhập họ và tên chủ hộ",
  FULL_NAME_FORM_REQUIRED: "Vui lòng nhập họ và tên!",
  FULL_NAME_FORM_MIN_LENGTH: "Họ tên phải từ 2 ký tự trở lên!",
  USERNAME_REQUIRED: "Vui lòng nhập tên đăng nhập!",
  PASSWORD_REQUIRED: "Vui lòng nhập mật khẩu!",
  USERNAME_MIN_LENGTH: "Tên đăng nhập phải chứa ít nhất 4 ký tự",
  PASSWORD_MIN_LENGTH: "Mật khẩu phải chứa ít nhất 6 ký tự",
  USERNAME_FORM_MIN_LENGTH: "Tối thiểu 4 ký tự!",
  PASSWORD_FORM_MIN_LENGTH: "Tối thiểu 6 ký tự!",
  TAX_CODE_INVALID:
    "Mã số thuế không hợp lệ! Vui lòng nhập đúng 10 hoặc 13 chữ số (dạng XXXXXXXXXX-XXX).",
  TAX_CODE_FORM_INVALID:
    "Mã số thuế gồm 10 hoặc 13 chữ số (dạng XXXXXXXXXX-XXX).",
  PHONE_INVALID: "Số điện thoại không đúng định dạng Việt Nam!",
  PHONE_FORM_INVALID: "Định dạng SĐT Việt Nam không hợp lệ!",
} as const;

export const AUTH_MESSAGES = {
  LOGIN_INVALID_DATA: "Dữ liệu đăng nhập không đúng định dạng.",
  LOGIN_FAILED: "Đã xảy ra lỗi đăng nhập. Vui lòng thử lại!",
  REGISTER_INVALID_DATA: "Dữ liệu đăng ký không đúng định dạng.",
  REGISTER_FAILED:
    "Đã xảy ra lỗi đăng ký hộ kinh doanh. Vui lòng thử lại!",
  INVALID_RESPONSE: "Phản hồi xác thực không hợp lệ",
  missingResponseField: (field: string) =>
    `Phản hồi đăng nhập thiếu trường ${field}`,
} as const;

export const AUTH_TABS = [
  { path: APP_ROUTES.LOGIN, label: "Đăng nhập" },
  { path: APP_ROUTES.REGISTER, label: "Đăng ký hộ mới" },
] as const;

export const AUTH_UI = {
  INTRO_TITLE:
    "Giải pháp quản lý bán hàng & hóa đơn điện tử thông minh",
  INTRO_DESCRIPTION:
    "Ứng dụng chuyên biệt cho hộ kinh doanh cá thể, tự động đồng bộ Tổng cục Thuế theo Nghị định 70/2025/NĐ-CP.",
  TAX_AUTHORITY_LABEL: "Tổng cục Thuế",
  POS_LABEL: "Bán Hàng Việt (POS)",
  SECURITY_LABEL: "Bảo mật dữ liệu theo tiêu chuẩn ISO/IEC 27001",
  LOGIN: {
    USERNAME_LABEL: "Tên đăng nhập:",
    USERNAME_PLACEHOLDER: "Tên tài khoản hoặc email",
    PASSWORD_LABEL: "Mật khẩu:",
    PASSWORD_PLACEHOLDER: "Mật khẩu tài khoản",
    SUBMIT_LABEL: "ĐĂNG NHẬP HỆ THỐNG",
  },
  REGISTER: {
    HOUSEHOLD_SECTION_LABEL: "Thông tin Hộ kinh doanh:",
    ACCOUNT_SECTION_LABEL: "Thiết lập Tài khoản Quản lý (Chủ hộ):",
    HOUSEHOLD_NAME_LABEL: "Tên Hộ kinh doanh*:",
    HOUSEHOLD_NAME_PLACEHOLDER: "Ví dụ: Tạp Hóa Việt",
    TAX_CODE_LABEL: "Mã số thuế*:",
    TAX_CODE_PLACEHOLDER: "10 hoặc 13 chữ số",
    PHONE_LABEL: "Số điện thoại*:",
    PHONE_PLACEHOLDER: "Số điện thoại liên hệ",
    ADDRESS_LABEL: "Địa chỉ cửa hàng*:",
    ADDRESS_PLACEHOLDER: "Địa chỉ hộ kinh doanh",
    FULL_NAME_LABEL: "Họ và tên chủ hộ*:",
    FULL_NAME_PLACEHOLDER: "Ví dụ: Nguyễn Văn An",
    USERNAME_LABEL: "Tên đăng nhập*:",
    USERNAME_PLACEHOLDER: "Tên đăng nhập",
    PASSWORD_LABEL: "Mật khẩu*:",
    PASSWORD_PLACEHOLDER: "Mật khẩu chủ hộ",
    SUBMIT_LABEL: "ĐĂNG KÝ & BẮT ĐẦU TRẢI NGHIỆM",
  },
  DEMO_ACCOUNTS: {
    HEADER: "Tài khoản Demo (môi trường phát triển)",
    SELECT_HINT: "Click vào tài khoản để tự động điền vào form",
  },
} as const;
