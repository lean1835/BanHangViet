import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: (import.meta.env.VITE_API_URL as string) || "http://localhost:8080/api/v1",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// Custom baseQuery that implements Mock API for Auth endpoints
const customBaseQuery = async (args: any, api: any, extraOptions: any) => {
  const useMock = import.meta.env.VITE_USE_MOCK_API !== "false";
  
  if (useMock) {
    const url = typeof args === 'string' ? args : args.url;
    const method = typeof args === 'string' ? 'GET' : args.method || 'GET';
    const body = typeof args === 'string' ? null : args.body;

    if (url.includes('/auth/register') && method === 'POST') {
      const households = JSON.parse(localStorage.getItem('ban_hang_viet_households') || '[]');
      const users = JSON.parse(localStorage.getItem('ban_hang_viet_users') || '[]');
      
      const { name, taxCode, phoneNumber, address, username, password } = body;

      // Validate taxCode format: 10 or 13 digits
      const taxRegex = /^\d{10}(-\d{3})?$/;
      if (!taxRegex.test(taxCode)) {
        return {
          error: {
            status: 400,
            data: { message: "Mã số thuế không hợp lệ! Định dạng yêu cầu là 10 hoặc 13 chữ số." }
          }
        };
      }

      if (households.some((h: any) => h.taxCode === taxCode)) {
        return {
          error: {
            status: 400,
            data: { message: "Mã số thuế này đã tồn tại trên hệ thống!" }
          }
        };
      }

      if (users.some((u: any) => u.username === username)) {
        return {
          error: {
            status: 400,
            data: { message: "Tên đăng nhập này đã tồn tại!" }
          }
        };
      }

      const newHousehold = {
        id: 'h-' + Math.random().toString(36).substr(2, 9),
        name,
        taxCode,
        phoneNumber,
        address: address || 'Chưa cập nhật',
      };

      const newOwner = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        householdId: newHousehold.id,
        roleId: 'VT-01', // Chủ hộ
        username,
        fullName: 'Chủ hộ ' + name,
        phoneNumber,
        password,
        isActive: true,
      };

      households.push(newHousehold);
      users.push(newOwner);

      localStorage.setItem('ban_hang_viet_households', JSON.stringify(households));
      localStorage.setItem('ban_hang_viet_users', JSON.stringify(users));

      // Auto login after registration
      const mockToken = 'mock-jwt-token-' + newOwner.id;
      localStorage.setItem('token', mockToken);

      return {
        data: {
          token: mockToken,
          user: {
            id: newOwner.id,
            username: newOwner.username,
            fullName: newOwner.fullName,
            roleId: newOwner.roleId,
            household: newHousehold
          }
        }
      };
    }

    if (url.includes('/auth/login') && method === 'POST') {
      const { username, password } = body;
      const users = JSON.parse(localStorage.getItem('ban_hang_viet_users') || '[]');
      const households = JSON.parse(localStorage.getItem('ban_hang_viet_households') || '[]');

      // Default system accounts if empty
      const defaultUsers = [
        { id: 'u-owner', householdId: 'h-default', roleId: 'VT-01', username: 'chuho_viet', fullName: 'Nguyễn Văn A', password: '123', isActive: true },
        { id: 'u-staff', householdId: 'h-default', roleId: 'VT-02', username: 'nhanvien_viet', fullName: 'Trần Thị B', password: '123', isActive: true },
        { id: 'u-accountant', householdId: 'h-default', roleId: 'VT-03', username: 'ketoan_viet', fullName: 'Phạm Văn C', password: '123', isActive: true },
        { id: 'u-admin', householdId: 'h-admin', roleId: 'VT-04', username: 'quantri_viet', fullName: 'Lê Quản Trị', password: '123', isActive: true },
        { id: 'u-tax', householdId: 'h-tax', roleId: 'VT-05', username: 'thue_viet', fullName: 'Chi cục Thuế Hà Nội', password: '123', isActive: true },
      ];
      
      const allUsers = [...defaultUsers, ...users];
      const user = allUsers.find((u: any) => u.username === username);

      if (!user) {
        return {
          error: {
            status: 401,
            data: { message: "Tên đăng nhập không tồn tại!" }
          }
        };
      }

      if (user.password !== password) {
        return {
          error: {
            status: 401,
            data: { message: "Mật khẩu không chính xác!" }
          }
        };
      }

      if (!user.isActive) {
        return {
          error: {
            status: 403,
            data: { message: "Tài khoản của bạn đã bị khóa! Liên hệ chủ hộ để mở khóa." }
          }
        };
      }

      let household = households.find((h: any) => h.id === user.householdId);
      if (!household) {
        if (user.householdId === 'h-default') {
          household = { id: 'h-default', name: 'Tạp Hóa Việt', taxCode: '0123456789', address: '123 Đường Lê Lợi, Quận 1, TP. HCM', phoneNumber: '0901234567' };
        } else if (user.householdId === 'h-admin') {
          household = { id: 'h-admin', name: 'Hệ thống Quản trị BanHangViet', taxCode: 'ADMIN-PLATFORM', address: 'Trung tâm Vận hành Cloud', phoneNumber: '19001234' };
        } else if (user.householdId === 'h-tax') {
          household = { id: 'h-tax', name: 'Tổng cục Thuế Việt Nam', taxCode: 'TAX-AUTHORITY', address: '123 Phan Bội Châu, Hà Nội', phoneNumber: '19005656' };
        }
      }

      const mockToken = 'mock-jwt-token-' + user.id;
      localStorage.setItem('token', mockToken);

      return {
        data: {
          token: mockToken,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            roleId: user.roleId,
            household
          }
        }
      };
    }
  }

  // Real backend call
  try {
    const result = await rawBaseQuery(args, api, extraOptions);
    return result;
  } catch (error: any) {
    return {
      error: {
        status: 'FETCH_ERROR',
        data: { message: error.message || 'Lỗi kết nối tới máy chủ' }
      }
    };
  }
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: customBaseQuery,
  tagTypes: ["User", "Auth", "Product"],
  endpoints: () => ({}),
});
