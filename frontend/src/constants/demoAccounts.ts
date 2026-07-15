/**
 * Danh sách tài khoản demo dùng để kiểm thử giao diện.
 * Dữ liệu này chỉ dùng để hiển thị hướng dẫn cho người dùng tự điền vào form.
 * Thông tin xác thực thực tế được quản lý bởi Backend.
 */

export interface DemoAccount {
  /** Mã vai trò theo hệ thống (VT-01 ... VT-05) */
  roleId: string;
  /** Tên hiển thị của vai trò */
  roleName: string;
  /** Mô tả ngắn về quyền hạn */
  description: string;
  /** Tên đăng nhập demo */
  username: string;
  /** Mật khẩu demo */
  password: string;
  /** Màu badge để phân biệt vai trò */
  badgeColor: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    roleId: "VT-01",
    roleName: "Chủ hộ kinh doanh",
    description: "Toàn quyền: quản lý nhân viên, danh mục, hóa đơn, báo cáo",
    username: "chuho_viet",
    password: "123456",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    roleId: "VT-02",
    roleName: "Nhân viên bán hàng",
    description: "Tạo đơn, tính tiền, phát hành và gửi hóa đơn cho khách",
    username: "nhanvien_viet",
    password: "123456",
    badgeColor: "bg-green-100 text-green-800 border-green-300",
  },
  {
    roleId: "VT-03",
    roleName: "Kế toán",
    description: "Tra cứu hóa đơn, lập hóa đơn điều chỉnh, xem và xuất báo cáo",
    username: "ketoan_viet",
    password: "123456",
    badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  {
    roleId: "VT-04",
    roleName: "Quản trị nền tảng",
    description: "Quản lý tài khoản hộ, gói dịch vụ và nhật ký hệ thống",
    username: "quantri_viet",
    password: "123456",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    roleId: "VT-05",
    roleName: "Cơ quan thuế (mô phỏng)",
    description: "Nhận hóa đơn từ hàng đợi, trả kết quả cấp mã hoặc lỗi",
    username: "thue_viet",
    password: "123456",
    badgeColor: "bg-red-100 text-red-800 border-red-300",
  },
];
