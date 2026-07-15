import React from "react";
import { IRole } from "../types/employee";

interface EmployeeSidebarProps {
  statusFilter: "ACTIVE" | "INACTIVE" | "ALL";
  setStatusFilter: (status: "ACTIVE" | "INACTIVE" | "ALL") => void;
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
          Trạng thái tài khoản
        </span>
        <div className="flex flex-col gap-2.5 font-medium text-slate-700 text-xs">
          <label className="flex items-center gap-2.5 cursor-pointer hover:text-kv-blue-primary transition-colors">
            <input
              type="radio"
              name="employeeStatus"
              checked={statusFilter === "ACTIVE"}
              onChange={() => setStatusFilter("ACTIVE")}
              className="text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4 border-slate-300"
            />
            <span>Đang hoạt động</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer hover:text-kv-blue-primary transition-colors">
            <input
              type="radio"
              name="employeeStatus"
              checked={statusFilter === "INACTIVE"}
              onChange={() => setStatusFilter("INACTIVE")}
              className="text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4 border-slate-300"
            />
            <span>Bị khóa</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer hover:text-kv-blue-primary transition-colors">
            <input
              type="radio"
              name="employeeStatus"
              checked={statusFilter === "ALL"}
              onChange={() => setStatusFilter("ALL")}
              className="text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4 border-slate-300"
            />
            <span>Tất cả</span>
          </label>
        </div>
      </div>

      {/* Vai trò phân quyền */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Vai trò phân quyền
        </span>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-700 text-xs focus:outline-none focus:border-kv-blue-primary transition-all cursor-pointer"
        >
          <option value="ALL">Tất cả vai trò</option>
          {roles
            .filter((r) => r.code !== "VT-01") // Loại trừ Chủ hộ khỏi bộ lọc chọn lựa thông thường của nhân viên
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
