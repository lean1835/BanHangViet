import React from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";

export const ForbiddenTaxReportAccess: React.FC = () => {
  return (
    <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-md text-center space-y-6">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <div>
        <span className="px-3 py-1 text-xs font-extrabold uppercase bg-rose-100 text-rose-800 rounded-full border border-rose-200">
          Chặn truy cập bảo mật (TC-03)
        </span>
        <h2 className="text-xl font-black text-slate-800 tracking-tight mt-3">
          Không có quyền xem Tổng hợp doanh thu chịu thuế
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed mt-2">
          Hệ thống bảo mật quy định vai trò <strong>Nhân viên bán hàng (VT-02)</strong> không được quyền truy cập thông tin thuế và doanh thu kê khai của cửa hàng.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 text-left space-y-1">
        <div className="font-bold flex items-center gap-1.5">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Hướng dẫn dành cho Nhân viên:
        </div>
        <p>
          Nếu bạn cần xuất số liệu thuế cho kỳ kê khai, vui lòng liên hệ <strong>Chủ hộ kinh doanh</strong> hoặc <strong>Kế toán</strong> cửa hàng để được hỗ trợ.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center gap-3">
        <Link
          to={APP_ROUTES.POS}
          className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
        >
          Quay lại Màn hình Bán hàng (POS)
        </Link>
        <Link
          to={APP_ROUTES.DASHBOARD}
          className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          Trang chủ
        </Link>
      </div>
    </div>
  );
};
