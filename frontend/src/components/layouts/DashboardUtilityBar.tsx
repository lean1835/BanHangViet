import {
  APP_FALLBACKS,
  APP_MESSAGES,
  APP_SYMBOLS,
  CONNECTION_STATUS,
} from "@/constants/app";
import { BrandLogo } from "@/components/common/BrandLogo";
import type { TDemoRole } from "@/constants/roles";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { logout } from "@/stores/authSlice";
import { baseApi } from "@/stores/baseApi";

interface DashboardUtilityBarProps {
  currentRole: TDemoRole;
  isOnline: boolean;
  simConflict: boolean;
  pendingCount?: number;
  onRoleChange: (role: TDemoRole) => void;
  onToggleOnline: () => void;
  onConflictChange: (isEnabled: boolean) => void;
  onSync?: () => void;
}

export const DashboardUtilityBar = ({
  isOnline,
  pendingCount = 0,
  onToggleOnline,
  onSync,
}: DashboardUtilityBarProps) => {
  const dispatch = useAppDispatch();
  const household = useAppSelector((state) => state.auth.user?.household);

  const handleLogout = () => {
    dispatch(baseApi.util.resetApiState());
    dispatch(logout());
  };

  return (
    <div className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <BrandLogo size="md" />
      </div>

      <div className="flex min-w-0 basis-full flex-wrap items-center justify-end gap-1.5 sm:basis-auto sm:flex-1 sm:flex-nowrap sm:gap-2 lg:gap-4">
        <button
          onClick={onToggleOnline}
          aria-pressed={isOnline}
          className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md border px-2.5 font-bold transition-all lg:min-h-0 lg:min-w-0 lg:py-1 ${
            isOnline
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-rose-50 text-rose-600 border-rose-200"
          }`}
          title={APP_MESSAGES.NETWORK_TOGGLE_TITLE}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span>{isOnline ? CONNECTION_STATUS.ONLINE : CONNECTION_STATUS.OFFLINE}</span>
        </button>

        {pendingCount > 0 && (
          <button
            onClick={onSync}
            className="flex min-h-11 items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 font-extrabold text-amber-800 hover:bg-amber-100 transition-colors lg:min-h-0 text-[11px]"
            title="Số lượng đơn hàng ngoại tuyến đang chờ đồng bộ"
          >
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>{pendingCount} đơn chờ đồng bộ</span>
          </button>
        )}

        <div className="flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
          <span className="max-w-48 truncate">
            {APP_MESSAGES.GREETING_PREFIX} {household?.name || APP_FALLBACKS.HOUSEHOLD_NAME}
          </span>
          <span className="text-slate-300">{APP_SYMBOLS.DIVIDER}</span>
          <button
            onClick={handleLogout}
            className="text-rose-600 hover:text-rose-800 transition-colors font-extrabold"
          >
            {APP_MESSAGES.LOGOUT}
          </button>
        </div>
      </div>
    </div>
  );
};
