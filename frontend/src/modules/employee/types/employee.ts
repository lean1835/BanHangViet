export interface IEmployee {
  id: string;
  username: string; // Tên đăng nhập (yêu cầu duy nhất, dùng để đăng nhập hệ thống)
  password?: string; // Mật khẩu (để trống khi sửa nếu không đổi)
  fullName: string; // Họ và tên
  phoneNumber?: string; // Số điện thoại
  roleId: string; // Mã vai trò (VT-02: Nhân viên bán hàng, VT-03: Kế toán)
  isActive: boolean; // Trạng thái hoạt động (true: Đang hoạt động, false: Bị khóa)
}

export interface IRole {
  id: string;
  code: string;
  name: string;
  description: string;
}
