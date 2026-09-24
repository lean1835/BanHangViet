import React from "react";
import { Search } from "lucide-react";
import {
  EMPLOYEE_INPUT_NAMES,
  EMPLOYEE_ROLE_FILTER_ALL,
  EMPLOYEE_STATUS_FILTER_OPTIONS,
  EMPLOYEE_UI,
  type TEmployeeStatusFilter,
} from "@/constants/employee";
import { USER_ROLES } from "@/constants/roles";
import type { IRole } from "../types/IEmployee";

interface EmployeeSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: TEmployeeStatusFilter;
  setStatusFilter: (status: TEmployeeStatusFilter) => void;
  selectedRole: string;
  setSelectedRole: (roleId: string) => void;
  roles: IRole[];
}

export const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  selectedRole,
  setSelectedRole,
  roles,
}) => {
  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Title */}
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        {EMPLOYEE_UI.SIDEBAR.TITLE}
      </div>

      {/* Tìm kiếm */}
      <div className="flex flex-col gap-1.5">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          {EMPLOYEE_UI.SIDEBAR.SEARCH_LABEL}
        </span>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder={EMPLOYEE_UI.SIDEBAR.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs font-semibold text-slate-700 transition-all focus:border-kv-blue-primary focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Trạng thái hoạt động */}
      <div className="flex flex-col gap-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          {EMPLOYEE_UI.SIDEBAR.STATUS_FILTER_LABEL}
        </span>
        <div className="flex flex-col gap-2.5 font-medium text-slate-700 text-xs">
          {EMPLOYEE_STATUS_FILTER_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 transition-colors hover:text-kv-blue-primary lg:min-h-0"
            >
              <input
                type="radio"
                name={EMPLOYEE_INPUT_NAMES.SIDEBAR_STATUS}
                checked={statusFilter === option.value}
                onChange={() => setStatusFilter(option.value)}
                className="text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4 border-slate-300"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Vai trò phân quyền */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          {EMPLOYEE_UI.SIDEBAR.ROLE_FILTER_LABEL}
        </span>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-700 text-xs focus:outline-none focus:border-kv-blue-primary transition-all cursor-pointer"
        >
          <option value={EMPLOYEE_ROLE_FILTER_ALL}>
            {EMPLOYEE_UI.SIDEBAR.ALL_ROLES_LABEL}
          </option>
          {roles
            .filter((r) => r.code !== USER_ROLES.OWNER) // Loại trừ Chủ hộ khỏi bộ lọc chọn lựa thông thường của nhân viên
            .map((r) => (
              <option key={r.id} value={r.code}>
                {r.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};
