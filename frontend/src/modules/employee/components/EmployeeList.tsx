import React, { useState } from "react";
import { createPortal } from "react-dom";
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
import { useNotification } from "@/hooks/useNotification";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

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
  const { showSuccess, showError, showInfo } = useNotification();

  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [deleteEmployee, { isLoading: isDeletingEmployee }] =
    useDeleteEmployeeMutation();

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<IEmployee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<IEmployee | null>(null);
  const deleteDialogRef = useAccessibleDialog({
    isOpen: Boolean(employeeToDelete),
    onClose: () => setEmployeeToDelete(null),
    canClose: !isDeletingEmployee,
  });

  // Add / Edit actions
  const handleSaveEmployee = async (emp: IEmployee & { password?: string }) => {
    try {
      if (editingEmployee) {
        // Edit mode
        await updateEmployee({ id: editingEmployee.id, data: emp }).unwrap();
        showSuccess(EMPLOYEE_MESSAGES.UPDATED);
      } else {
        // Create mode
        await createEmployee(emp).unwrap();
        showSuccess(EMPLOYEE_MESSAGES.CREATED);
      }
    } catch (error: unknown) {
      showError(
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

  const handleConfirmDeleteEmployee = async () => {
    if (!employeeToDelete || isDeletingEmployee) return;

    try {
      await deleteEmployee(employeeToDelete.id).unwrap();
      showSuccess(EMPLOYEE_MESSAGES.DELETED);
      setEmployeeToDelete(null);
    } catch (error: unknown) {
      showError(
        EMPLOYEE_MESSAGES.ERROR_PREFIX +
          getApiErrorMessage(error, EMPLOYEE_MESSAGES.DELETE_FAILED),
      );
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
              className="flex h-11 items-center gap-1.5 rounded-lg bg-kv-blue-primary px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-kv-blue-dark lg:h-9"
            >
              <Plus size={14} />
              {EMPLOYEE_UI.LIST.ADD_LABEL}
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => showInfo(EMPLOYEE_MESSAGES.ATTENDANCE_UNAVAILABLE)}
              className="flex h-11 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 lg:h-9"
            >
              <ClipboardCheck size={14} />
              {EMPLOYEE_UI.LIST.REVIEW_LABEL}
            </button>
          )}
          <div className="flex items-center border rounded-lg p-0.5 bg-slate-50">
            <button
              type="button"
              aria-label="Hiển thị dạng danh sách"
              className="flex min-h-11 min-w-11 items-center justify-center rounded bg-white p-1.5 text-slate-400 shadow-sm hover:text-slate-600 lg:min-h-0 lg:min-w-0"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              aria-label="Hiển thị dạng lưới"
              className="flex min-h-11 min-w-11 items-center justify-center rounded p-1.5 text-slate-400 hover:text-slate-600 lg:min-h-0 lg:min-w-0"
            >
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
          className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs font-semibold text-slate-700 transition-all focus:border-kv-blue-primary focus:bg-white focus:outline-none lg:h-9"
        />
      </div>

      {/* Table Content */}
      {filteredEmployees.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
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
                        <div className="flex items-center justify-center gap-1.5 opacity-100 transition-opacity lg:opacity-80 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                          <button
                            onClick={() => handleEditEmployee(emp)}
                            aria-label={EMPLOYEE_UI.LIST.EDIT_TITLE}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded p-1 text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 lg:min-h-0 lg:min-w-0"
                            title={EMPLOYEE_UI.LIST.EDIT_TITLE}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setEmployeeToDelete(emp)}
                            aria-label={EMPLOYEE_UI.LIST.DELETE_TITLE}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded p-1 text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 lg:min-h-0 lg:min-w-0"
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

      {employeeToDelete &&
        createPortal(
          <div
            onClick={() => {
              if (!isDeletingEmployee) setEmployeeToDelete(null);
            }}
            className="app-modal-backdrop fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-2 backdrop-blur-sm animate-backdrop-fade-in sm:items-center sm:p-4"
          >
            <div
              ref={deleteDialogRef}
              tabIndex={-1}
              onClick={(event) => event.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="employee-delete-title"
              aria-describedby="employee-delete-description"
              className="app-modal-panel flex w-full max-w-sm flex-col overflow-hidden rounded-xl border border-slate-100 bg-white text-center shadow-2xl animate-modal-bounce-in"
            >
              <div className="app-modal-body p-5 sm:p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600">
                  <Trash2 aria-hidden="true" size={24} />
                </div>
                <h2
                  id="employee-delete-title"
                  className="text-sm font-extrabold text-slate-800"
                >
                  {EMPLOYEE_UI.LIST.DELETE_TITLE}
                </h2>
                <p
                  id="employee-delete-description"
                  className="mt-2 text-xs font-semibold leading-5 text-slate-500"
                >
                  {EMPLOYEE_MESSAGES.DELETE_CONFIRM} ({employeeToDelete.fullName})
                </p>
              </div>
              <div className="app-modal-footer flex gap-3 border-t bg-white p-4">
                <button
                  type="button"
                  disabled={isDeletingEmployee}
                  onClick={() => setEmployeeToDelete(null)}
                  className="min-h-11 flex-1 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60"
                >
                  {EMPLOYEE_UI.LIST.DELETE_CANCEL_ACTION}
                </button>
                <button
                  type="button"
                  disabled={isDeletingEmployee}
                  aria-busy={isDeletingEmployee}
                  onClick={() => void handleConfirmDeleteEmployee()}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-rose-600 px-3 text-xs font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {isDeletingEmployee && (
                    <span
                      aria-hidden="true"
                      className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                  )}
                  {EMPLOYEE_UI.LIST.DELETE_CONFIRM_ACTION}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
