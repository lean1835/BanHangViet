export type SetupStepKey =
  | "HOUSEHOLD_INFO"
  | "INVOICE_TEMPLATE"
  | "TAX_RATE"
  | "INITIAL_PRODUCT"
  | "EMPLOYEE_ACCOUNT";

export interface ISetupStep {
  key: SetupStepKey;
  stepNumber: number;
  title: string;
  description: string;
  whyImportant: string;
  isRequired: boolean;
  isCompleted: boolean;
  isSkipped?: boolean;
  actionLabel: string;
  routePath: string;
}

export interface ISetupGuideProgress {
  totalSteps: number;
  totalRequired: number;
  completedRequired: number;
  skippedRequired?: number;
  completedTotal: number;
  skippedTotal?: number;
  isReadyForInvoice: boolean;
  isDismissed: boolean;
  isPermanentlyHidden?: boolean;
  steps: ISetupStep[];
}

export const INITIAL_SETUP_STEPS: ISetupStep[] = [
  {
    key: "HOUSEHOLD_INFO",
    stepNumber: 1,
    title: "Hoàn thiện thông tin hộ kinh doanh",
    description: "Cập nhật Tên cửa hàng, Mã số thuế, Địa chỉ kinh doanh và Số điện thoại liên hệ.",
    whyImportant: "Thông tin bắt buộc phải hiển thị chính xác trên tiêu đề hóa đơn điện tử gửi Cơ quan Thuế.",
    isRequired: true,
    isCompleted: false,
    actionLabel: "Khai báo thông tin",
    routePath: "/settings/business-info",
  },
  {
    key: "INVOICE_TEMPLATE",
    stepNumber: 2,
    title: "Khai báo ký hiệu & mẫu số hóa đơn",
    description: "Thiết lập mẫu số 1/001, ký hiệu hóa đơn (C24TYY) và kiểm tra dải số phát hành.",
    whyImportant: "Quy tắc QTN-02: Hóa đơn bắt buộc phải có ký hiệu và mẫu số hợp lệ trước khi cấp mã.",
    isRequired: true,
    isCompleted: false,
    actionLabel: "Cấu hình mẫu số",
    routePath: "/settings/invoice-template",
  },
  {
    key: "TAX_RATE",
    stepNumber: 3,
    title: "Chọn mức thuế suất áp dụng",
    description: "Kích hoạt các mức thuế GTGT và thuế TNCN theo ngành nghề kinh doanh của hộ.",
    whyImportant: "Quy tắc QTN-17: Mọi mặt hàng khi xuất hóa đơn phải được áp thuế suất đang có hiệu lực.",
    isRequired: true,
    isCompleted: false,
    actionLabel: "Chọn thuế suất",
    routePath: "/settings/tax-rates",
  },
  {
    key: "INITIAL_PRODUCT",
    stepNumber: 4,
    title: "Thêm ít nhất một mặt hàng vào danh mục",
    description: "Tạo sản phẩm đầu tiên với tên hàng, đơn vị tính, giá bán và mức thuế suất tương ứng.",
    whyImportant: "Để quầy thu ngân có thể tìm kiếm, chọn hàng và tính tiền tạo đơn bán đầu tiên.",
    isRequired: true,
    isCompleted: false,
    actionLabel: "Thêm mặt hàng",
    routePath: "/products",
  },
  {
    key: "EMPLOYEE_ACCOUNT",
    stepNumber: 5,
    title: "Tạo tài khoản nhân viên bán hàng",
    description: "Phân quyền tài khoản thu ngân (VT-02) nếu cửa hàng có thuê nhân viên bán theo ca.",
    whyImportant: "Tùy chọn: Giúp quản lý doanh thu theo từng nhân viên và kiểm kê tiền mặt đầu ca - cuối ca.",
    isRequired: false,
    isCompleted: false,
    actionLabel: "Thêm nhân viên",
    routePath: "/employees",
  },
];

export interface IOnboardingStepBackend {
  stepCode: "HOUSEHOLD_INFO" | "INVOICE_TEMPLATE" | "TAX_RATE" | "PRODUCT" | "STAFF" | string;
  stepName: string;
  isRequired: boolean;
  isCompleted: boolean;
  redirectUrl: string;
  description: string;
}

export interface IOnboardingStatusBackendResponse {
  isCompleted: boolean;
  isSkipped: boolean;
  isReadyForInvoicing: boolean;
  remainingRequiredSteps: number;
  steps: IOnboardingStepBackend[];
}

