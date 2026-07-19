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
    <div className="h-11 bg-white border-b border-slate-200 px-4 flex items-center justify-between text-[11px] shrink-0 font-medium">
      <div className="flex items-center gap-2">
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
          <span>
            {APP_BRAND.PREFIX}
            <strong className="text-slate-800 font-extrabold">{APP_BRAND.SUFFIX}</strong>
          </span>
        </div>
        <span className="text-slate-300 font-normal">{APP_SYMBOLS.DIVIDER}</span>
        <span className="text-slate-500 font-bold">{APP_BRAND.DEMO_LABEL}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
          <span className="text-slate-500">{APP_MESSAGES.ROLE_LABEL}</span>
          <select
            value={currentRole}
            onChange={handleRoleChange}
            className="font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer text-[11px]"
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
          className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md border transition-all ${
            isOnline
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-rose-50 text-rose-600 border-rose-200"
          }`}
          title={APP_MESSAGES.NETWORK_TOGGLE_TITLE}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full inline-block ${
              isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span>{isOnline ? CONNECTION_STATUS.ONLINE : CONNECTION_STATUS.OFFLINE}</span>
        </button>

        <div className="flex items-center gap-1.5 bg-rose-50/50 border border-rose-200/60 px-2.5 py-1 rounded-md font-semibold text-rose-700">
          <input
            type="checkbox"
            id={APP_ELEMENT_IDS.CONFLICT_TOGGLE}
            checked={simConflict}
            onChange={(event) => onConflictChange(event.target.checked)}
            className="cursor-pointer rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-3 h-3"
          />
          <label htmlFor={APP_ELEMENT_IDS.CONFLICT_TOGGLE} className="cursor-pointer">
            {APP_MESSAGES.OFFLINE_CONFLICT_LABEL}
          </label>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-md font-bold text-slate-700">
          <span>
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
          className="bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-md hover:bg-slate-900 transition-all shadow-sm"
        >
          {APP_MESSAGES.EXIT_DEMO}
        </button>
      </div>
    </div>
  );
};
