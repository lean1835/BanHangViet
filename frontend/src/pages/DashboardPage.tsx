import React from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { logout } from "@/stores/authSlice";

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const household = user?.household;
  const roleId = user?.roleId || "VT-01";

  // Helper to resolve role name
  const getRoleName = (role: string) => {
    switch (role) {
      case "VT-01":
        return "Chủ hộ kinh doanh";
      case "VT-02":
        return "Nhân viên bán hàng";
      case "VT-03":
        return "Kế toán viên";
      default:
        return "Người dùng";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-gray-800 font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#E2E8F0] shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7 text-[#0068FF]"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span className="font-extrabold text-lg text-[#0068FF] tracking-wide">
              Bán Hàng<strong className="text-gray-800 font-extrabold">Việt</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-sm text-[#1A1A2E]">{user?.fullName}</div>
              <div className="text-xs text-[#8A94A6] font-bold">
                {getRoleName(roleId)} ({roleId})
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold text-xs transition-colors"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-[#E2E8F0] mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#1A1A2E] mb-1">
                Chào mừng trở lại, {user?.fullName}!
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                {roleId === "VT-02" 
                  ? "Vui lòng mở ca và thực hiện bán hàng tại điểm bán hàng POS."
                  : roleId === "VT-03"
                  ? "Cổng quản lý hóa đơn điện tử và đối soát sổ sách kế toán."
                  : "Hệ thống quản lý hộ kinh doanh & phát hành hóa đơn điện tử sẵn sàng."}
              </p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold self-start sm:self-auto flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
              <span>Đồng bộ Thuế: Đang kết nối</span>
            </div>
          </div>
        </div>

        {/* Dynamic Views by Role */}

        {/* 1. CHỦ HỘ DASHBOARD (VT-01) */}
        {roleId === "VT-01" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1: Household info */}
              <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden flex flex-col justify-between">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#1A1A2E]">Thông tin Hộ kinh doanh</h3>
                      <p className="text-xs text-[#8A94A6] font-semibold">Hồ sơ đăng ký chính thức</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-[#8A94A6] font-medium">Tên Hộ kinh doanh:</span>
                      <span className="font-bold text-[#1A1A2E]">{household?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-[#8A94A6] font-medium">Mã số thuế:</span>
                      <span className="font-bold text-[#1A1A2E] tracking-wider">{household?.taxCode}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-[#8A94A6] font-medium">Số điện thoại:</span>
                      <span className="font-bold text-[#1A1A2E]">{household?.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-[#8A94A6] font-medium">Địa chỉ cửa hàng:</span>
                      <span className="font-bold text-[#1A1A2E] text-right max-w-[240px] truncate" title={household?.address}>
                        {household?.address}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#0068FF] font-semibold">
                  <span>Trực thuộc quản lý của bạn</span>
                  <span className="bg-[#E8F0FF] px-2.5 py-1 rounded-lg">Chủ sở hữu</span>
                </div>
              </div>

              {/* Card 2: Admin details */}
              <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden flex flex-col justify-between">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#1A1A2E]">Tài khoản Quản lý</h3>
                      <p className="text-xs text-[#8A94A6] font-semibold">Thông tin quản trị hệ thống</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-[#8A94A6] font-medium">Họ và tên:</span>
                      <span className="font-bold text-[#1A1A2E]">{user?.fullName}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-[#8A94A6] font-medium">Tên đăng nhập:</span>
                      <span className="font-bold text-[#1A1A2E]">{user?.username}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-[#8A94A6] font-medium">Vai trò:</span>
                      <span className="font-bold text-amber-600">Chủ hộ kinh doanh (VT-01)</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-[#8A94A6] font-medium">Trạng thái gán:</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold">
                        Hoạt động
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50/30 px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-emerald-600 font-semibold">
                  <span>Quyền hạn tối cao trên hệ thống</span>
                  <span className="bg-emerald-100/60 px-2.5 py-1 rounded-lg">Admin</span>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4 items-start">
              <div className="text-blue-600 mt-0.5">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#0068FF] mb-1">Quyền quản trị Chủ hộ</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Với tư cách là **Chủ hộ kinh doanh (VT-01)**, bạn có quyền quản lý danh mục hàng hóa, nhân viên bán hàng, cấu hình mẫu hóa đơn, và xem báo cáo tài chính tổng quan của cửa hàng.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. NHÂN VIÊN BÁN HÀNG DASHBOARD (VT-02) */}
        {roleId === "VT-02" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1: POS Sales simulator */}
              <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden flex flex-col justify-between">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#1A1A2E]">Màn hình Bán hàng (POS)</h3>
                      <p className="text-xs text-[#8A94A6] font-semibold">Tạo đơn và tính tiền nhanh</p>
                    </div>
                  </div>

                  <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-[#FAFBFD] text-center my-4">
                    <span className="text-xs text-gray-500 font-semibold block mb-2">Đang có ca bán hàng hoạt động</span>
                    <button className="bg-kv-blue-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-kv-blue-dark transition-colors">
                      MỞ QUẦY BÁN HÀNG
                    </button>
                  </div>
                </div>
                <div className="bg-blue-50/50 px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#0068FF] font-semibold">
                  <span>Trình giả lập bán hàng</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">Ca mở</span>
                </div>
              </div>

              {/* Card 2: Active user role limitations */}
              <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden flex flex-col justify-between">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#1A1A2E]">Giới hạn Vai trò (Security)</h3>
                      <p className="text-xs text-[#8A94A6] font-semibold">Chế độ Nhân viên bán hàng</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-medium text-gray-600">
                    <div className="flex items-center gap-2 text-red-600">
                      <span>✕ Chặn xem báo cáo doanh thu tổng (QTN-10)</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-600">
                      <span>✕ Chặn sửa danh mục giá hàng hóa (QTN-17)</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-600">
                      <span>✕ Chặn sửa/hủy hóa đơn đã cấp mã (QTN-05)</span>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50/30 px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-red-600 font-semibold">
                  <span>Quyền hạn tài khoản bị giới hạn</span>
                  <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-lg">Nhân viên</span>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4 items-start">
              <div className="text-amber-600 mt-0.5">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-700 mb-1">Chặn truy cập dữ liệu tổng hợp cửa hàng</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hệ thống tuân thủ nghiêm ngặt quy tắc **QTN-10**: Nhân viên bán hàng chỉ được thao tác với các đơn hàng trong ca hiện tại do chính mình lập. Bạn không thể xem doanh thu tổng hợp của Hộ kinh doanh.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. KẾ TOÁN DASHBOARD (VT-03) */}
        {roleId === "VT-03" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1: Invoice lookup */}
              <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden flex flex-col justify-between">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#1A1A2E]">Tra cứu Hóa đơn điện tử</h3>
                      <p className="text-xs text-[#8A94A6] font-semibold">Tra cứu, điều chỉnh hóa đơn lỗi</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-semibold">
                    <div className="p-2.5 bg-[#FAFBFD] border border-gray-100 rounded-lg flex items-center justify-between">
                      <span className="text-[#1A1A2E]">Hóa đơn mẫu 1C26TAA</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px]">Đã cấp mã</span>
                    </div>
                    <div className="p-2.5 bg-[#FAFBFD] border border-gray-100 rounded-lg flex items-center justify-between">
                      <span className="text-[#1A1A2E]">Hóa đơn mẫu C26TAA</span>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px]">Chờ gửi thuế</span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#0068FF] font-semibold">
                  <span>Mở bảng quản trị kế toán</span>
                  <span className="bg-blue-100 px-2.5 py-1 rounded-lg">Kế toán</span>
                </div>
              </div>

              {/* Card 2: Accounting tools details */}
              <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden flex flex-col justify-between">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#1A1A2E]">Báo cáo doanh thu &amp; Thuế</h3>
                      <p className="text-xs text-[#8A94A6] font-semibold">Đối soát sổ sách tài chính</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-[#8A94A6] font-medium">Báo cáo thuế doanh thu:</span>
                      <span className="font-bold text-emerald-600">Đầy đủ</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-[#8A94A6] font-medium">Chức năng lập điều chỉnh:</span>
                      <span className="font-bold text-blue-600">Có quyền (QTN-04)</span>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50/30 px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-emerald-600 font-semibold">
                  <span>Quyền hạn tra cứu đối soát</span>
                  <span className="bg-emerald-100/60 px-2.5 py-1 rounded-lg">Kế toán viên</span>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4 items-start">
              <div className="text-blue-600 mt-0.5">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#0068FF] mb-1">Nghiệp vụ đối soát &amp; Sửa đổi hóa đơn điện tử</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kế toán viên có quyền truy cập báo cáo tài chính và sổ sách hóa đơn điện tử. Khi có hóa đơn sai sót đã cấp mã, kế toán viên có quyền lập hóa đơn điều chỉnh có liên kết tham chiếu tới hóa đơn gốc (**QTN-12** &amp; **QTN-04**).
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
