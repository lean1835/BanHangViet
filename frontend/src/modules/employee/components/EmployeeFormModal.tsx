import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ASSIGNABLE_EMPLOYEE_ROLE_CODES,
  DEFAULT_EMPLOYEE_ROLE_CODE,
  EMPLOYEE_FORM_FIELDS,
  EMPLOYEE_INPUT_NAMES,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_UI,
  EMPLOYEE_VALIDATION,
  EMPLOYEE_VALIDATION_MESSAGES,
} from "@/constants/employee";
import type { IEmployee, IRole } from "../types/IEmployee";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: IEmployee & { password?: string }) => void | Promise<void>;
  employee?: IEmployee | null;
  roles: IRole[];
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employee,
  roles,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSaving,
  });

  useEffect(() => {
    if (employee) {
      setUsername(employee.username || "");
      setPassword(""); // Mật khẩu để trống khi cập nhật trừ khi muốn đổi
      setFullName(employee.fullName || "");
      setPhoneNumber(employee.phoneNumber || "");
      setRoleCode(employee.roleCode || "");
      setIsActive(employee.isActive !== false);
    } else {
      setUsername("");
      setPassword("");
      setFullName("");
      setPhoneNumber("");
      // Mặc định chọn vai trò nhân viên bán hàng đầu tiên nếu có
      const defaultRole =
        roles.find((role) => role.code === DEFAULT_EMPLOYEE_ROLE_CODE)?.code ||
        "";
      setRoleCode(defaultRole);
      setIsActive(true);
    }
    setErrors({});
  }, [employee, isOpen, roles]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!username.trim()) {
      newErrors[EMPLOYEE_FORM_FIELDS.USERNAME] =
        EMPLOYEE_VALIDATION_MESSAGES.USERNAME_REQUIRED;
    } else if (
      username.trim().length < EMPLOYEE_VALIDATION.USERNAME_MIN_LENGTH
    ) {
      newErrors[EMPLOYEE_FORM_FIELDS.USERNAME] =
        EMPLOYEE_VALIDATION_MESSAGES.USERNAME_MIN_LENGTH;
    }

    if (!employee && !password.trim()) {
      newErrors[EMPLOYEE_FORM_FIELDS.PASSWORD] =
        EMPLOYEE_VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    } else if (
      password.trim() &&
      password.trim().length < EMPLOYEE_VALIDATION.PASSWORD_MIN_LENGTH
    ) {
      newErrors[EMPLOYEE_FORM_FIELDS.PASSWORD] =
        EMPLOYEE_VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH;
    }

    if (!fullName.trim()) {
      newErrors[EMPLOYEE_FORM_FIELDS.FULL_NAME] =
        EMPLOYEE_VALIDATION_MESSAGES.FULL_NAME_REQUIRED;
    }

    if (
      phoneNumber.trim() &&
      !EMPLOYEE_VALIDATION.PHONE_PATTERN.test(phoneNumber)
    ) {
      newErrors[EMPLOYEE_FORM_FIELDS.PHONE_NUMBER] =
        EMPLOYEE_VALIDATION_MESSAGES.PHONE_INVALID;
    }

    if (!roleCode) {
      newErrors[EMPLOYEE_FORM_FIELDS.ROLE_CODE] =
        EMPLOYEE_VALIDATION_MESSAGES.ROLE_REQUIRED;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    const data: IEmployee & { password?: string } = {
      id: employee?.id || "",
      username: username.trim(),
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      roleCode,
      isActive,
      ...(password.trim() ? { password: password.trim() } : {}),
    };

    setIsSaving(true);
    try {
      await onSave(data);
      onClose();
    } catch {
      // Error handled by onSave handler
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={() => {
        if (!isSaving) onClose();
      }}
      className="app-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-2 animate-auth-fade-in sm:items-center sm:p-4"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={employee ? EMPLOYEE_UI.FORM.UPDATE_TITLE : EMPLOYEE_UI.FORM.CREATE_TITLE}
        className="app-modal-panel flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="app-modal-header flex items-center justify-between bg-kv-blue-primary px-5 py-3 text-white">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            {employee
              ? EMPLOYEE_UI.FORM.UPDATE_TITLE
              : EMPLOYEE_UI.FORM.CREATE_TITLE}
          </h2>
          <button
            onClick={onClose}
            type="button"
            disabled={isSaving}
            aria-label={EMPLOYEE_UI.FORM.CANCEL_LABEL}
            className="flex min-h-11 min-w-11 items-center justify-center text-lg text-white/80 transition-colors hover:text-white"
          >
            {EMPLOYEE_UI.FORM.CLOSE_LABEL}
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col text-[11px] font-semibold text-slate-700"
        >
          <div className="app-modal-body p-4">
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            {/* Tên đăng nhập */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">
                {EMPLOYEE_UI.FORM.USERNAME_LABEL}
              </label>
              <input
                type="text"
                placeholder={EMPLOYEE_UI.FORM.USERNAME_PLACEHOLDER}
                value={username}
                disabled={!!employee}
                onChange={(e) => setUsername(e.target.value)}
                className={`border ${errors[EMPLOYEE_FORM_FIELDS.USERNAME] ? "border-rose-500" : "border-slate-300"
                  } h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs ${employee ? "bg-slate-100 cursor-not-allowed" : ""
                  }`}
              />
              {errors[EMPLOYEE_FORM_FIELDS.USERNAME] && (
                <span className="text-[10px] text-rose-500 font-bold">
                  {errors[EMPLOYEE_FORM_FIELDS.USERNAME]}
                </span>
              )}
            </div>

            {/* Mật khẩu */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">
                {employee
                  ? EMPLOYEE_UI.FORM.UPDATE_PASSWORD_LABEL
                  : EMPLOYEE_UI.FORM.CREATE_PASSWORD_LABEL}
              </label>
              <input
                type="password"
                placeholder={
                  employee
                    ? EMPLOYEE_UI.FORM.UPDATE_PASSWORD_PLACEHOLDER
                    : EMPLOYEE_UI.FORM.CREATE_PASSWORD_PLACEHOLDER
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`border ${errors[EMPLOYEE_FORM_FIELDS.PASSWORD] ? "border-rose-500" : "border-slate-300"
                  } h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs`}
              />
              {errors[EMPLOYEE_FORM_FIELDS.PASSWORD] && (
                <span className="text-[10px] text-rose-500 font-bold">
                  {errors[EMPLOYEE_FORM_FIELDS.PASSWORD]}
                </span>
              )}
            </div>

            {/* Họ và tên */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">
                {EMPLOYEE_UI.FORM.FULL_NAME_LABEL}
              </label>
              <input
                type="text"
                placeholder={EMPLOYEE_UI.FORM.FULL_NAME_PLACEHOLDER}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`border ${errors[EMPLOYEE_FORM_FIELDS.FULL_NAME] ? "border-rose-500" : "border-slate-300"
                  } h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs`}
              />
              {errors[EMPLOYEE_FORM_FIELDS.FULL_NAME] && (
                <span className="text-[10px] text-rose-500 font-bold">
                  {errors[EMPLOYEE_FORM_FIELDS.FULL_NAME]}
                </span>
              )}
            </div>

            {/* Số điện thoại */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">
                {EMPLOYEE_UI.FORM.PHONE_LABEL}
              </label>
              <input
                type="text"
                placeholder={EMPLOYEE_UI.FORM.PHONE_PLACEHOLDER}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`border ${errors[EMPLOYEE_FORM_FIELDS.PHONE_NUMBER] ? "border-rose-500" : "border-slate-300"
                  } h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs`}
              />
              {errors[EMPLOYEE_FORM_FIELDS.PHONE_NUMBER] && (
                <span className="text-[10px] text-rose-500 font-bold">
                  {errors[EMPLOYEE_FORM_FIELDS.PHONE_NUMBER]}
                </span>
              )}
            </div>

            {/* Vai trò / Chức danh */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">
                {EMPLOYEE_UI.FORM.ROLE_LABEL}
              </label>
              <select
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value)}
                className={`border ${errors[EMPLOYEE_FORM_FIELDS.ROLE_CODE] ? "border-rose-500" : "border-slate-300"
                  } h-9 px-2 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary text-xs`}
              >
                <option value="">{EMPLOYEE_UI.FORM.ROLE_PLACEHOLDER}</option>
                {roles
                  .filter((role) =>
                    ASSIGNABLE_EMPLOYEE_ROLE_CODES.includes(role.code),
                  )
                  .map((r) => (
                    <option key={r.id} value={r.code}>
                      {r.name}
                    </option>
                  ))}
              </select>
              {errors[EMPLOYEE_FORM_FIELDS.ROLE_CODE] && (
                <span className="text-[10px] text-rose-500 font-bold">
                  {errors[EMPLOYEE_FORM_FIELDS.ROLE_CODE]}
                </span>
              )}
            </div>

            {/* Trạng thái tài khoản */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">
                {EMPLOYEE_UI.FORM.STATUS_LABEL}
              </label>
              <div className="flex min-h-11 items-center gap-4">
                <label className="flex min-h-11 cursor-pointer items-center gap-1.5 text-slate-700">
                  <input
                    type="radio"
                    name={EMPLOYEE_INPUT_NAMES.MODAL_ACTIVE_STATUS}
                    checked={isActive === true}
                    onChange={() => setIsActive(true)}
                    className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                  />
                  <span>{EMPLOYEE_STATUS_LABELS.ACTIVE}</span>
                </label>
                <label className="flex min-h-11 cursor-pointer items-center gap-1.5 text-slate-700">
                  <input
                    type="radio"
                    name={EMPLOYEE_INPUT_NAMES.MODAL_ACTIVE_STATUS}
                    checked={isActive === false}
                    onChange={() => setIsActive(false)}
                    className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                  />
                  <span>{EMPLOYEE_STATUS_LABELS.LOCKED}</span>
                </label>
              </div>
            </div>
          </div>
          </div>

          {/* Buttons */}
          <div className="app-modal-footer flex shrink-0 justify-end gap-3 border-t bg-white p-4">
            <button
              onClick={onClose}
              type="button"
              disabled={isSaving}
              className="min-h-11 rounded-lg border border-slate-300 px-4 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50 sm:min-h-8"
            >
              {EMPLOYEE_UI.FORM.CANCEL_LABEL}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-11 rounded-lg bg-kv-blue-primary px-5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-kv-blue-dark disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-8"
            >
              {isSaving
                ? EMPLOYEE_UI.FORM.SAVING_LABEL
                : EMPLOYEE_UI.FORM.SAVE_LABEL}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
