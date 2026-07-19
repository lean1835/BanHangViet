export const MOCK_BEST_SELLING_PRODUCTS = [
  {
    name: "Coca-Cola 320ml",
    quantityLabel: "8 lon",
    revenue: 80_000,
  },
  {
    name: "Mì ăn liền Hảo Hảo",
    quantityLabel: "10 gói",
    revenue: 45_000,
  },
] as const;

export const MOCK_ACTIVITY_LOGS = [
  {
    id: "l1",
    time: "2026-07-15 10:15:30",
    user: "nhanvien_viet",
    action: "ĐĂNG_NHẬP",
    target: "Thiết bị điểm bán POS-01",
  },
  {
    id: "l2",
    time: "2026-07-15 09:54:12",
    user: "chuho_viet",
    action: "CẬP_NHẬT_CẤU_HÌNH",
    target: "Mẫu hóa đơn GTGT (1C26TAA)",
  },
  {
    id: "l3",
    time: "2026-07-15 09:30:12",
    user: "nhanvien_viet",
    action: "PHÁT_HÀNH_HÓA_ĐƠN",
    target: "Đơn hàng HD-VT002 (Khách hàng Trần Thị B)",
  },
];
