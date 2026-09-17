export const SUPPLIER_RETURN_REASONS = [
  "Hàng hỏng",
  "Cận hạn",
  "Sai quy cách",
  "Giao thừa",
  "Khác",
] as const;

export type TSupplierReturnReason = (typeof SUPPLIER_RETURN_REASONS)[number];

export const SUPPLIER_RETURN_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  INITIAL_PAGE: 0,
  PAGE_SIZE_OPTIONS: [10, 20, 50],
} as const;

export const SUPPLIER_RETURN_MESSAGES = {
  CREATE_SUCCESS: "Lập phiếu trả hàng cho nhà cung cấp thành công.",
  CREATE_FAILED: "Lập phiếu trả hàng cho nhà cung cấp thất bại.",
  CHECK_RECEIPT_FAILED: "Không thể lấy thông tin hoàn trả của phiếu nhập kho.",
  EMPTY_ITEMS: "Vui lòng chọn ít nhất một mặt hàng với số lượng trả lớn hơn 0.",
  EXCEEDED_RETURNABLE: "Số lượng trả vượt quá số lượng còn lại có thể trả của phiếu nhập.",
  INSUFFICIENT_STOCK: "Tồn kho hiện tại không đủ để trả lại cho nhà cung cấp.",
  CONFIRM_RETURN_TITLE: "Xác nhận trả hàng nhà cung cấp",
  CONFIRM_RETURN_DESC:
    "Sau khi xác nhận, tồn kho sẽ giảm và số nợ phải trả cho nhà cung cấp sẽ được khấu trừ tương ứng. Thao tác này không thể hoàn tác.",
} as const;
