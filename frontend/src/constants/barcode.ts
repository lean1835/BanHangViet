export const BARCODE_API_ENDPOINTS = {
  SCAN: "/barcodes/scan",
  GENERATE_INTERNAL: (productId: string): string =>
    `/barcodes/products/${productId}/generate`,
  ASSIGN: (productId: string): string =>
    `/barcodes/products/${productId}/assign`,
  PRINT_DATA: (productId: string): string =>
    `/barcodes/products/${productId}/print`,
} as const;

export const BARCODE_PAPER_SIZES = {
  SIZE_58MM: "58mm",
  SIZE_80MM: "80mm",
  STANDARD: "standard",
} as const;

export type TBarcodePaperSize =
  (typeof BARCODE_PAPER_SIZES)[keyof typeof BARCODE_PAPER_SIZES];

export const BARCODE_PAPER_SIZE_OPTIONS = [
  { label: "Khổ 58mm (K80 / Tem nhiệt nhỏ)", value: BARCODE_PAPER_SIZES.SIZE_58MM },
  { label: "Khổ 80mm (Máy in hóa đơn / Decal tiêu chuẩn)", value: BARCODE_PAPER_SIZES.SIZE_80MM },
  { label: "Khổ Decal chuẩn (A4 / Tem mã công nghiệp)", value: BARCODE_PAPER_SIZES.STANDARD },
];

export const BARCODE_HOTKEYS = {
  CAMERA_SCAN: "F2",
  PRODUCT_SEARCH: "/",
} as const;

export const BARCODE_API_TAG_IDS = {
  LIST: "LIST",
} as const;

export const BARCODE_MESSAGES = {
  SCAN_SUCCESS: "Quét mã vạch thành công!",
  SCAN_NOT_FOUND: "Mã vạch chưa được gán cho mặt hàng nào trong hệ thống.",
  SCAN_ERROR: "Đã xảy ra lỗi khi quét mã vạch. Vui lòng thử lại!",
  ASSIGN_SUCCESS: "Gán mã vạch cho mặt hàng thành công!",
  GENERATE_SUCCESS: "Sinh mã vạch nội bộ thành công!",
  PRINT_SUCCESS: "Chuẩn bị dữ liệu in tem mã vạch thành công!",
  PERMISSION_DENIED: "Bạn không có quyền thực hiện thao tác mã vạch này.",
  EMPTY_BARCODE_WARNING: "Vui lòng nhập hoặc quét mã vạch hợp lệ.",
  DUPLICATE_BARCODE: "Mã vạch này đã tồn tại trên một mặt hàng khác trong cửa hàng!",
} as const;
