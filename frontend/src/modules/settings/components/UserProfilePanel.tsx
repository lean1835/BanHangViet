import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ShieldCheck,
  LogOut,
  Store,
  AtSign,
  Mail,
  Phone,
  KeyRound,
  Edit3,
  Lock,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { logout, updateUser } from "@/stores/authSlice";
import { baseApi } from "@/stores/baseApi";
import { ROLE_LABELS, type TDemoRole } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import { useGetProfileQuery } from "../services/profileApi";
import { EditProfileModal } from "./EditProfileModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { UpdatePhoneModal } from "./UpdatePhoneModal";

export const UserProfilePanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  // Live profile query
  const { data: profileResponse } = useGetProfileQuery();
  const profile = profileResponse?.result;

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUpdatePhoneOpen, setIsUpdatePhoneOpen] = useState(false);

  // Sync profile data with auth slice if loaded
  useEffect(() => {
    if (profile) {
      if (
        profile.fullName !== user?.fullName ||
        profile.phoneNumber !== user?.phoneNumber
      ) {
        dispatch(
          updateUser({
            fullName: profile.fullName,
            phoneNumber: profile.phoneNumber,
          })
        );
      }
    }
  }, [profile, user, dispatch]);

  const handleLogout = () => {
    dispatch(baseApi.util.resetApiState());
    dispatch(logout());
    navigate(APP_ROUTES.LOGIN);
  };

  const fullName = profile?.fullName || user?.fullName || "--";
  const username = profile?.username || user?.username || "--";
  const phoneNumber = profile?.phoneNumber || user?.phoneNumber || null;
  const email = profile?.email || user?.email || null;
  const pointOfSaleName =
    profile?.pointOfSaleName || user?.pointOfSaleName || "Hội sở chính / Tất cả điểm bán";
  const roleCode = profile?.roleCode || user?.roleId || "--";
  const roleName =
    profile?.roleName ||
    (user?.roleId && ROLE_LABELS[user.roleId as TDemoRole]) ||
    "Người dùng hệ thống";
  const isActive = profile ? profile.isActive : true;

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "Chưa từng đổi";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 min-h-[580px] justify-between animate-auth-fade-in">
      <div className="flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Thông tin tài khoản
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý thông tin cá nhân, cập nhật số điện thoại và đổi mật khẩu bảo mật
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs self-start sm:self-auto">
            <span
              className={`w-2 h-2 rounded-full ${
                isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            {isActive ? "Đang hoạt động" : "Bị khóa"}
          </div>
        </div>

        {/* Detailed Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          {/* Họ và tên */}
          <div className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 text-slate-400 mb-1.5">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-kv-blue-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Họ và tên người dùng
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-kv-blue-primary hover:text-blue-700 cursor-pointer p-1 -m-1 rounded hover:bg-blue-50 transition-colors"
                  title="Chỉnh sửa họ tên"
                >
                  <Edit3 size={13} />
                  <span>Sửa</span>
                </button>
              </div>
              <div className="text-sm font-extrabold text-slate-800 truncate">
                {fullName}
              </div>
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
              @{username}
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
                ({roleCode})
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
              {pointOfSaleName}
            </div>
          </div>

          {/* Địa chỉ Email / Gmail */}
          <div className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-colors">
            <div className="flex items-center gap-2 text-slate-400 mb-1.5">
              <Mail size={14} className="text-kv-blue-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Địa chỉ Email (Gmail)
              </span>
            </div>
            {email ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-800 truncate font-mono">
                  {email}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  Đã liên kết
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-amber-700 italic">
                  Chưa liên kết
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70">
                  Cần để quên MK
                </span>
              </div>
            )}
          </div>

          {/* Số điện thoại liên hệ */}
          <div className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 text-slate-400 mb-1.5">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-kv-blue-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Số điện thoại xác thực
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpdatePhoneOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-kv-blue-primary hover:text-blue-700 cursor-pointer p-1 -m-1 rounded hover:bg-blue-50 transition-colors"
                  title="Cập nhật số điện thoại qua OTP"
                >
                  <Edit3 size={13} />
                  <span>{phoneNumber ? "Đổi số" : "Thêm số"}</span>
                </button>
              </div>
              <div className="text-sm font-extrabold text-slate-800 font-mono">
                {phoneNumber || "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin bảo mật mật khẩu bổ sung */}
        {profile?.passwordChangedAt && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-200/60">
            <Lock size={13} className="text-slate-400" />
            <span>
              Mật khẩu được đổi gần nhất vào:{" "}
              <strong className="text-slate-700 font-medium">
                {formatDate(profile.passwordChangedAt)}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Action Bar (Đổi mật khẩu & Đăng xuất) */}
      <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsChangePasswordOpen(true)}
            className="inline-flex items-center gap-2 bg-kv-blue-primary hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <KeyRound size={15} />
            Đổi mật khẩu
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <LogOut size={15} />
          Đăng xuất tài khoản
        </button>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentFullName={fullName !== "--" ? fullName : ""}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <UpdatePhoneModal
        isOpen={isUpdatePhoneOpen}
        onClose={() => setIsUpdatePhoneOpen(false)}
        currentPhoneNumber={phoneNumber}
      />
    </div>
  );
};

export default UserProfilePanel;
