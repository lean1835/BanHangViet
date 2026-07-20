import type { ChangeEvent } from "react";
import {
  APP_BRAND,
  APP_ELEMENT_IDS,
  APP_FALLBACKS,
  APP_MESSAGES,
  APP_SYMBOLS,
  CONNECTION_STATUS,
} from "@/constants/app";
import { ROLE_OPTIONS } from "@/constants/roles";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import type { TDemoRole } from "@/constants/roles";
import { logout } from "@/stores/authSlice";
import { baseApi } from "@/stores/baseApi";

interface DashboardUtilityBarProps {
  currentRole: TDemoRole;
  isOnline: boolean;
  simConflict: boolean;
  onRoleChange: (role: TDemoRole) => void;
  onToggleOnline: () => void;
  onConflictChange: (isEnabled: boolean) => void;
}

export const DashboardUtilityBar = ({
  currentRole,
  isOnline,
  simConflict,
  onRoleChange,
  onToggleOnline,
  onConflictChange,
}: DashboardUtilityBarProps) => {
  const dispatch = useAppDispatch();
  const household = useAppSelector((state) => state.auth.user?.household);

  const handleLogout = () => {
    dispatch(baseApi.util.resetApiState());
    dispatch(logout());
  };

  const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onRoleChange(event.target.value as TDemoRole);
  };

  return (
    <div className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex items-center text-kv-blue-primary font-extrabold text-sm tracking-wide gap-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span className="whitespace-nowrap">
            {APP_BRAND.PREFIX}
            <strong className="text-slate-800 font-extrabold">{APP_BRAND.SUFFIX}</strong>
          </span>
        </div>
        <span className="hidden text-slate-300 font-normal md:inline">{APP_SYMBOLS.DIVIDER}</span>
        <span className="hidden text-slate-500 font-bold md:inline">{APP_BRAND.DEMO_LABEL}</span>
      </div>

      <div className="flex min-w-0 basis-full flex-wrap items-center justify-end gap-1.5 sm:basis-auto sm:flex-1 sm:flex-nowrap sm:gap-2 lg:gap-4">
        <div className="flex min-h-11 min-w-0 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 sm:px-2.5 lg:min-h-0 lg:py-1">
          <span className="hidden text-slate-500 lg:inline">{APP_MESSAGES.ROLE_LABEL}</span>
          <select
            value={currentRole}
            onChange={handleRoleChange}
            aria-label={APP_MESSAGES.ROLE_LABEL}
            className="h-11 max-w-24 cursor-pointer truncate border-none bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none sm:max-w-40 lg:h-auto"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

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

        <label
          htmlFor={APP_ELEMENT_IDS.CONFLICT_TOGGLE}
          title={APP_MESSAGES.OFFLINE_CONFLICT_LABEL}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-rose-200/60 bg-rose-50/50 px-2 font-semibold text-rose-700 lg:min-h-0 lg:min-w-0 lg:px-2.5 lg:py-1"
        >
          <input
            type="checkbox"
            id={APP_ELEMENT_IDS.CONFLICT_TOGGLE}
            checked={simConflict}
            onChange={(event) => onConflictChange(event.target.checked)}
            aria-label={APP_MESSAGES.OFFLINE_CONFLICT_LABEL}
            className="h-4 w-4 cursor-pointer rounded border-rose-300 text-rose-600 focus:ring-rose-500"
          />
          <span className="hidden lg:inline">
            {APP_MESSAGES.OFFLINE_CONFLICT_LABEL}
          </span>
        </label>

        <div className="hidden items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 font-bold text-slate-700 xl:flex">
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

        <button
          onClick={handleLogout}
          aria-label={APP_MESSAGES.EXIT_DEMO}
          className="min-h-11 min-w-11 rounded-md bg-slate-800 px-2 font-extrabold text-white shadow-sm transition-all hover:bg-slate-900 sm:px-3 lg:min-h-0 lg:min-w-0 lg:py-1.5"
        >
          <span className="hidden sm:inline">{APP_MESSAGES.EXIT_DEMO}</span>
          <span aria-hidden="true" className="sm:hidden">✕</span>
        </button>
      </div>
    </div>
  );
};
