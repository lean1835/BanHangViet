import React, { useState } from "react";
import { Search, Plus, Edit, Trash2, Users, ClipboardCheck, LayoutGrid, List } from "lucide-react";
import { IEmployee, IRole } from "../types/employee";
import { EmployeeFormModal } from "./EmployeeFormModal";

interface EmployeeListProps {
  employees: IEmployee[];
  setEmployees: React.Dispatch<React.SetStateAction<IEmployee[]>>;
  roles: IRole[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: "ACTIVE" | "INACTIVE" | "ALL";
  selectedRole: string;
  userRole?: string;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  setEmployees,
  roles,
  searchQuery,
  setSearchQuery,
  statusFilter,
  selectedRole,
  userRole,
}) => {
  const isOwner = userRole === "VT-01";

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<IEmployee | null>(null);

  // Add / Edit actions
  const handleSaveEmployee = (emp: IEmployee) => {
    const exists = employees.some((e) => e.id === emp.id);
    if (exists) {
      setEmployees(employees.map((e) => (e.id === emp.id ? emp : e)));
    } else {
      setEmployees([...employees, emp]);
    }
  };

  const handleEditEmployee = (emp: IEmployee) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản nhân viên này khỏi hệ thống?")) {
      setEmployees(employees.filter((e) => e.id !== id));
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const fullName = emp.fullName || "";
    const username = emp.username || "";
    const phoneNumber = emp.phoneNumber || "";

    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phoneNumber.includes(searchQuery);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && emp.isActive !== false) ||
      (statusFilter === "INACTIVE" && emp.isActive === false);

    const matchesRole = selectedRole === "ALL" || emp.roleId === selectedRole;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[520px] w-full animate-auth-fade-in">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <h3 className="font-extrabold text-slate-800 text-sm">
            Danh sách tài khoản nhân viên
          </h3>
          <span className="text-[10px] bg-blue-50 text-kv-blue-primary font-bold px-2 py-0.5 rounded-full border border-blue-100">
            Đang hiển thị {filteredEmployees.length} / {employees.length} nhân viên
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isOwner && (
            <button
              onClick={() => {
                setEditingEmployee(null);
                setIsModalOpen(true);
              }}
              className="bg-kv-blue-primary hover:bg-kv-blue-dark transition-all text-white font-bold px-4 h-9 rounded-lg flex items-center gap-1.5 shadow-sm text-xs"
            >
              <Plus size={14} />
              Nhân viên
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => alert("Chức năng đồng bộ & phân quyền chấm công ca nhân viên...")}
              className="bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all font-bold px-3.5 h-9 rounded-lg flex items-center gap-1.5 text-xs text-slate-700"
            >
              <ClipboardCheck size={14} />
              Duyệt yêu cầu
            </button>
          )}
          <div className="flex items-center border rounded-lg p-0.5 bg-slate-50">
            <button className="p-1.5 rounded text-slate-400 hover:text-slate-600 bg-white shadow-sm">
              <List size={14} />
            </button>
            <button className="p-1.5 rounded text-slate-400 hover:text-slate-600">
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search size={14} />
        </span>
        <input
          type="text"
          placeholder="Tìm theo tên tài khoản hoặc họ tên nhân viên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 h-9 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-kv-blue-primary text-xs font-semibold text-slate-700 transition-all"
        />
      </div>

      {/* Table Content */}
      {filteredEmployees.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                <th className="p-3 w-8">
                  <input type="checkbox" className="rounded border-slate-300 text-kv-blue-primary" />
                </th>
                <th className="p-3">Tên đăng nhập (Tài khoản)</th>
                <th className="p-3">Họ và tên</th>
                <th className="p-3">Số điện thoại</th>
                <th className="p-3">Vai trò phân quyền</th>
                <th className="p-3 text-center">Trạng thái tài khoản</th>
                {isOwner && <th className="p-3 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs animate-auth-fade-in">
              {filteredEmployees.map((emp) => {
                const role = roles.find((r) => r.code === emp.roleId);

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 group transition-all">
                    <td className="p-3">
                      <input type="checkbox" className="rounded border-slate-300 text-kv-blue-primary" />
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">{emp.username}</td>
                    <td className="p-3 font-bold text-slate-800">{emp.fullName}</td>
                    <td className="p-3 font-mono font-semibold">{emp.phoneNumber || "--"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.roleId === "VT-01" ? "bg-amber-100 text-amber-800" :
                        emp.roleId === "VT-02" ? "bg-blue-100 text-blue-800" : "bg-indigo-100 text-indigo-800"
                      }`}>
                        {role?.name || "Mặc định"} ({emp.roleId})
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {emp.isActive !== false ? "Đang hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditEmployee(emp)}
                            className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                            title="Xóa tài khoản"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 border border-blue-100">
            <Users size={30} className="stroke-[1.5]" />
          </div>
          <h4 className="text-slate-700 font-extrabold text-sm mb-1">
            Không tìm thấy tài khoản nhân viên nào.
          </h4>
          <p className="text-[11px] text-slate-400 max-w-[320px] font-medium leading-relaxed mb-4">
            Vui lòng thay đổi từ khóa hoặc thêm tài khoản nhân viên mới vào hệ thống.
          </p>
          {isOwner && (
            <button
              onClick={() => {
                setEditingEmployee(null);
                setIsModalOpen(true);
              }}
              className="text-xs bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Thêm tài khoản nhân viên
            </button>
          )}
        </div>
      )}

      {/* Form Modal */}
      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
        roles={roles}
      />
    </div>
  );
};
