import React from "react";
import { useNavigate } from "react-router-dom";
import { User, ShieldCheck, LogOut, Store, AtSign } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { logout } from "@/stores/authSlice";
import { baseApi } from "@/stores/baseApi";
import { ROLE_LABELS, type TDemoRole } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";

export const UserProfilePanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(baseApi.util.resetApiState());
    dispatch(logout());
    navigate(APP_ROUTES.LOGIN);
  };

  const roleName =
    user?.roleId && ROLE_LABELS[user.roleId as TDemoRole]
      ? ROLE_LABELS[user.roleId as TDemoRole]
      : "Người dùng hệ thống";

  return (
    <div className="flex flex-col flex-1 w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 min-h-[580px] justify-between animate-auth-fade-in">
      <div className="flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-slate-800">
            Thông tin tài khoản
          </h2>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Đang hoạt động
          </div>
        </div>

        {/* Detailed Info Cards Grid (2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          {/* Họ và tên */}
          <div className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-colors">
            <div className="flex items-center gap-2 text-slate-400 mb-1.5">
              <User size={14} className="text-kv-blue-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Họ và tên người dùng
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-800 truncate">
              {user?.fullName || "--"}
            </div>
          </div>

          {/* Tên đăng nhập */}
          <div className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-colors">
            <div className="flex items-center gap-2 text-slate-400 mb-1.5">
              <AtSign size={14} className="text-kv-blue-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Tên đăng nhập (Username)
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-800 font-mono">
              @{user?.username || "--"}
            </div>
          </div>

          {/* Vai trò phân quyền */}
          <div className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-colors">
            <div className="flex items-center gap-2 text-slate-400 mb-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Vai trò phân quyền
              </span>
            </div>
            <div className="text-sm font-extrabold text-emerald-700 flex items-center gap-1.5">
              <span>{roleName}</span>
              <span className="text-xs font-semibold text-slate-400 font-mono">
                ({user?.roleId || "--"})
              </span>
            </div>
          </div>

          {/* Điểm bán / Chi nhánh */}
          <div className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-colors">
            <div className="flex items-center gap-2 text-slate-400 mb-1.5">
              <Store size={14} className="text-kv-blue-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Điểm bán / Chi nhánh
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-800 truncate">
              {user?.pointOfSaleName || "Hội sở chính / Tất cả điểm bán"}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Action Bar */}
      <div className="pt-6 border-t border-slate-100 flex items-center justify-start">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <LogOut size={16} />
          Đăng xuất tài khoản
        </button>
      </div>
    </div>
  );
};

export default UserProfilePanel;
