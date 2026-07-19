import React, { useState } from "react";
import { Search, Plus, Edit, Trash2, Users, ClipboardCheck, LayoutGrid, List } from "lucide-react";
import {
  EMPLOYEE_MESSAGES,
  EMPLOYEE_ROLE_FILTER_ALL,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_STATUS_FILTERS,
  EMPLOYEE_UI,
  type TEmployeeStatusFilter,
} from "@/constants/employee";
import { USER_ROLES } from "@/constants/roles";
import type { IEmployee, IRole } from "../types/IEmployee";
import { EmployeeFormModal } from "./EmployeeFormModal";
import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from "../services/employeeApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface EmployeeListProps {
  employees: IEmployee[];
  roles: IRole[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: TEmployeeStatusFilter;
  selectedRole: string;
  userRole?: string;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  roles,
  searchQuery,
  setSearchQuery,
  statusFilter,
  selectedRole,
  userRole,
}) => {
  const isOwner = userRole === USER_ROLES.OWNER;

  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<IEmployee | null>(null);

  // Add / Edit actions
  const handleSaveEmployee = async (emp: IEmployee & { password?: string }) => {
    try {
      if (editingEmployee) {
        // Edit mode
        await updateEmployee({ id: editingEmployee.id, data: emp }).unwrap();
        alert(EMPLOYEE_MESSAGES.UPDATED);
      } else {
        // Create mode
        await createEmployee(emp).unwrap();
        alert(EMPLOYEE_MESSAGES.CREATED);
      }
    } catch (error: unknown) {
      alert(
        EMPLOYEE_MESSAGES.ERROR_PREFIX +
          getApiErrorMessage(
            error,
            EMPLOYEE_MESSAGES.SAVE_FAILED,
          ),
      );
      throw error;
    }
  };

  const handleEditEmployee = (emp: IEmployee) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm(EMPLOYEE_MESSAGES.DELETE_CONFIRM)) {
      try {
        await deleteEmployee(id).unwrap();
        alert(EMPLOYEE_MESSAGES.DELETED);
      } catch (error: unknown) {
        alert(
          EMPLOYEE_MESSAGES.ERROR_PREFIX +
            getApiErrorMessage(error, EMPLOYEE_MESSAGES.DELETE_FAILED),
        );
      }
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
      statusFilter === EMPLOYEE_STATUS_FILTERS.ALL ||
      (statusFilter === EMPLOYEE_STATUS_FILTERS.ACTIVE &&
        emp.isActive !== false) ||
      (statusFilter === EMPLOYEE_STATUS_FILTERS.INACTIVE &&
        emp.isActive === false);

    const matchesRole =
      selectedRole === EMPLOYEE_ROLE_FILTER_ALL ||
      emp.roleCode === selectedRole;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[520px] w-full animate-auth-fade-in">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <h3 className="font-extrabold text-slate-800 text-sm">
            {EMPLOYEE_UI.LIST.TITLE}
          </h3>
          <span className="text-[10px] bg-blue-50 text-kv-blue-primary font-bold px-2 py-0.5 rounded-full border border-blue-100">
            {EMPLOYEE_UI.LIST.countLabel(
              filteredEmployees.length,
              employees.length,
            )}
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
              {EMPLOYEE_UI.LIST.ADD_LABEL}
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => alert(EMPLOYEE_MESSAGES.ATTENDANCE_SYNC)}
              className="bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all font-bold px-3.5 h-9 rounded-lg flex items-center gap-1.5 text-xs text-slate-700"
            >
              <ClipboardCheck size={14} />
              {EMPLOYEE_UI.LIST.REVIEW_LABEL}
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
          placeholder={EMPLOYEE_UI.LIST.SEARCH_PLACEHOLDER}
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
                <th className="p-3">{EMPLOYEE_UI.LIST.COLUMNS.USERNAME}</th>
                <th className="p-3">{EMPLOYEE_UI.LIST.COLUMNS.FULL_NAME}</th>
                <th className="p-3">
                  {EMPLOYEE_UI.LIST.COLUMNS.PHONE_NUMBER}
                </th>
                <th className="p-3">{EMPLOYEE_UI.LIST.COLUMNS.ROLE}</th>
                <th className="p-3 text-center">
                  {EMPLOYEE_UI.LIST.COLUMNS.STATUS}
                </th>
                {isOwner && (
                  <th className="p-3 text-center">
                    {EMPLOYEE_UI.LIST.COLUMNS.ACTIONS}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs animate-auth-fade-in">
              {filteredEmployees.map((emp) => {
                const role = roles.find((r) => r.code === emp.roleCode);

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 group transition-all">
                    <td className="p-3">
                      <input type="checkbox" className="rounded border-slate-300 text-kv-blue-primary" />
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">{emp.username}</td>
                    <td className="p-3 font-bold text-slate-800">{emp.fullName}</td>
                    <td className="p-3 font-mono font-semibold">
                      {emp.phoneNumber || EMPLOYEE_UI.LIST.EMPTY_PHONE_LABEL}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.roleCode === USER_ROLES.OWNER ? "bg-amber-100 text-amber-800" :
                        emp.roleCode === USER_ROLES.CASHIER ? "bg-blue-100 text-blue-800" : "bg-indigo-100 text-indigo-800"
                      }`}>
                        {role?.name || EMPLOYEE_UI.LIST.DEFAULT_ROLE_LABEL} ({emp.roleCode})
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {emp.isActive !== false
                          ? EMPLOYEE_STATUS_LABELS.ACTIVE
                          : EMPLOYEE_STATUS_LABELS.LOCKED_TABLE}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditEmployee(emp)}
                            className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                            title={EMPLOYEE_UI.LIST.EDIT_TITLE}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                            title={EMPLOYEE_UI.LIST.DELETE_TITLE}
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
            {EMPLOYEE_UI.LIST.EMPTY_TITLE}
          </h4>
          <p className="text-[11px] text-slate-400 max-w-[320px] font-medium leading-relaxed mb-4">
            {EMPLOYEE_UI.LIST.EMPTY_DESCRIPTION}
          </p>
          {isOwner && (
            <button
              onClick={() => {
                setEditingEmployee(null);
                setIsModalOpen(true);
              }}
              className="text-xs bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              {EMPLOYEE_UI.LIST.EMPTY_ADD_LABEL}
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
