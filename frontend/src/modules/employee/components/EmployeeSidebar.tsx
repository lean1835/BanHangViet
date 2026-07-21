import React from "react";
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
  statusFilter: TEmployeeStatusFilter;
  setStatusFilter: (status: TEmployeeStatusFilter) => void;
  selectedRole: string;
  setSelectedRole: (roleId: string) => void;
  roles: IRole[];
}

export const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({
  statusFilter,
  setStatusFilter,
  selectedRole,
  setSelectedRole,
  roles,
}) => {
  return (
    <div className="flex flex-col gap-5 w-full">
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
