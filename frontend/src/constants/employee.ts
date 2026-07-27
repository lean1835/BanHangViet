import { ROLE_LABELS, USER_ROLES } from "./roles";

export const EMPLOYEE_API_ENDPOINTS = {
  ROOT: "/employees",
  BY_ID: (id: string) => `/employees/${id}`,
} as const;

export const EMPLOYEE_API_TAGS = {
  LIST: "LIST",
} as const;

export const EMPLOYEE_API_RESPONSE_FIELDS = {
  RESULT: "result",
  ID: "id",
  USERNAME: "username",
  FULL_NAME: "fullName",
  PHONE_NUMBER: "phoneNumber",
  ROLE_CODE: "roleCode",
  IS_ACTIVE: "isActive",
} as const;

export const EMPLOYEE_STATUS_FILTERS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ALL: "ALL",
} as const;

export const EMPLOYEE_STATUS_LABELS = {
  ACTIVE: "Đang hoạt động",
  LOCKED: "Bị khóa",
  LOCKED_TABLE: "Đã khóa",
  ALL: "Tất cả",
} as const;

export type TEmployeeStatusFilter =
  (typeof EMPLOYEE_STATUS_FILTERS)[keyof typeof EMPLOYEE_STATUS_FILTERS];

export const EMPLOYEE_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: TEmployeeStatusFilter;
  label: string;
}> = [
  {
    value: EMPLOYEE_STATUS_FILTERS.ACTIVE,
    label: EMPLOYEE_STATUS_LABELS.ACTIVE,
  },
  {
    value: EMPLOYEE_STATUS_FILTERS.INACTIVE,
    label: EMPLOYEE_STATUS_LABELS.LOCKED,
  },
  {
    value: EMPLOYEE_STATUS_FILTERS.ALL,
    label: EMPLOYEE_STATUS_LABELS.ALL,
  },
];

export const EMPLOYEE_ROLE_FILTER_ALL = "ALL";
export const DEFAULT_EMPLOYEE_ROLE_CODE = USER_ROLES.CASHIER;
export const ASSIGNABLE_EMPLOYEE_ROLE_CODES: readonly string[] = [
  USER_ROLES.CASHIER,
  USER_ROLES.ACCOUNTANT,
];

export const EMPLOYEE_VALIDATION = {
  USERNAME_MIN_LENGTH: 4,
  PASSWORD_MIN_LENGTH: 6,
  PHONE_PATTERN: /^[0-9+() -]{9,15}$/,
} as const;

export const EMPLOYEE_VALIDATION_MESSAGES = {
  USERNAME_REQUIRED: "Vui lòng nhập tên đăng nhập",
  USERNAME_MIN_LENGTH: "Tên đăng nhập phải có ít nhất 4 ký tự",
  PASSWORD_REQUIRED: "Vui lòng nhập mật khẩu cho nhân viên mới",
  PASSWORD_MIN_LENGTH: "Mật khẩu phải có ít nhất 6 ký tự",
  FULL_NAME_REQUIRED: "Vui lòng nhập họ và tên",
  PHONE_INVALID: "Số điện thoại không hợp lệ",
  ROLE_REQUIRED: "Vui lòng chọn vai trò phân quyền",
} as const;

export const EMPLOYEE_FORM_FIELDS = {
  USERNAME: "username",
  PASSWORD: "password",
  FULL_NAME: "fullName",
  PHONE_NUMBER: "phoneNumber",
  ROLE_CODE: "roleCode",
} as const;

export const EMPLOYEE_INPUT_NAMES = {
  SIDEBAR_STATUS: "employeeStatus",
  MODAL_ACTIVE_STATUS: "modalActiveStatus",
} as const;

export const EMPLOYEE_MESSAGES = {
  UPDATED: "Cập nhật tài khoản nhân viên thành công!",
  CREATED: "Thêm tài khoản nhân viên thành công!",
  SAVE_FAILED: "Không thể lưu thông tin nhân viên!",
  DELETE_CONFIRM:
    "Bạn có chắc chắn muốn xóa tài khoản nhân viên này khỏi hệ thống?",
  DELETED: "Xóa tài khoản nhân viên thành công!",
  DELETE_FAILED: "Không thể xóa nhân viên!",
  ERROR_PREFIX: "Lỗi: ",
  ATTENDANCE_UNAVAILABLE:
    "Chức năng duyệt yêu cầu chấm công chưa được hỗ trợ trong phiên bản hiện tại.",
  INVALID_RESPONSE: "Phản hồi nhân viên không hợp lệ",
  INVALID_EMPLOYEE_DATA: "Dữ liệu nhân viên không hợp lệ",
  missingResponseField: (field: string) =>
    `Phản hồi nhân viên thiếu trường ${field}`,
} as const;

export const EMPLOYEE_UI = {
  SIDEBAR: {
    STATUS_FILTER_LABEL: "Trạng thái tài khoản",
    ROLE_FILTER_LABEL: "Vai trò phân quyền",
    ALL_ROLES_LABEL: "Tất cả vai trò",
  },
  FORM: {
    CREATE_TITLE: "Thêm mới tài khoản nhân viên",
    UPDATE_TITLE: "Cập nhật tài khoản nhân viên",
    CLOSE_LABEL: "✕",
    USERNAME_LABEL: "Tên đăng nhập (Tài khoản)*:",
    USERNAME_PLACEHOLDER: "Ví dụ: nhanvien_a",
    CREATE_PASSWORD_LABEL: "Mật khẩu đăng nhập*:",
    UPDATE_PASSWORD_LABEL: "Mật khẩu mới (Để trống nếu không đổi):",
    CREATE_PASSWORD_PLACEHOLDER: "Tối thiểu 6 ký tự",
    UPDATE_PASSWORD_PLACEHOLDER: "••••••",
    FULL_NAME_LABEL: "Họ và tên nhân viên*:",
    FULL_NAME_PLACEHOLDER: "Nhập đầy đủ họ và tên",
    PHONE_LABEL: "Số điện thoại liên hệ:",
    PHONE_PLACEHOLDER: "Ví dụ: 0988888888",
    ROLE_LABEL: "Vai trò phân quyền*:",
    ROLE_PLACEHOLDER: "Chọn vai trò",
    STATUS_LABEL: "Trạng thái hoạt động:",
    CANCEL_LABEL: "Bỏ qua",
    SAVING_LABEL: "Đang lưu...",
    SAVE_LABEL: "Lưu tài khoản",
  },
  LIST: {
    TITLE: "Danh sách tài khoản nhân viên",
    ADD_LABEL: "Nhân viên",
    REVIEW_LABEL: "Duyệt yêu cầu",
    SEARCH_PLACEHOLDER:
      "Tìm theo tên tài khoản hoặc họ tên nhân viên...",
    COLUMNS: {
      USERNAME: "Tên đăng nhập (Tài khoản)",
      FULL_NAME: "Họ và tên",
      PHONE_NUMBER: "Số điện thoại",
      ROLE: "Vai trò phân quyền",
      STATUS: "Trạng thái tài khoản",
      ACTIONS: "Thao tác",
    },
    DEFAULT_ROLE_LABEL: "Mặc định",
    EMPTY_PHONE_LABEL: "--",
    EDIT_TITLE: "Chỉnh sửa",
    DELETE_TITLE: "Xóa tài khoản",
    DELETE_CONFIRM_ACTION: "Xóa tài khoản",
    DELETE_CANCEL_ACTION: "Hủy bỏ",
    EMPTY_TITLE: "Không tìm thấy tài khoản nhân viên nào.",
    EMPTY_DESCRIPTION:
      "Vui lòng thay đổi từ khóa hoặc thêm tài khoản nhân viên mới vào hệ thống.",
    EMPTY_ADD_LABEL: "Thêm tài khoản nhân viên",
    countLabel: (visibleCount: number, totalCount: number) =>
      `Đang hiển thị ${visibleCount} / ${totalCount} nhân viên`,
  },
} as const;

export const DEFAULT_EMPLOYEE_ROLES = [
  {
    id: "r1",
    code: USER_ROLES.OWNER,
    name: ROLE_LABELS[USER_ROLES.OWNER],
    description: "Chủ hộ kinh doanh quản lý toàn bộ hệ thống",
  },
  {
    id: "r2",
    code: USER_ROLES.CASHIER,
    name: ROLE_LABELS[USER_ROLES.CASHIER],
    description: "Nhân viên bán hàng trực ca",
  },
  {
    id: "r3",
    code: USER_ROLES.ACCOUNTANT,
    name: `${ROLE_LABELS[USER_ROLES.ACCOUNTANT]} viên`,
    description: "Kế toán đối chiếu hóa đơn thuế",
  },
];
