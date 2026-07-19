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
    } catch (err) {
      // Error handled by onSave handler
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-auth-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="bg-kv-blue-primary text-white px-5 py-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            {employee
              ? EMPLOYEE_UI.FORM.UPDATE_TITLE
              : EMPLOYEE_UI.FORM.CREATE_TITLE}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-white/80 hover:text-white transition-colors text-lg"
          >
            {EMPLOYEE_UI.FORM.CLOSE_LABEL}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3 font-semibold text-slate-700 text-[11px]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
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
              <div className="flex items-center gap-4 h-9">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name={EMPLOYEE_INPUT_NAMES.MODAL_ACTIVE_STATUS}
                    checked={isActive === true}
                    onChange={() => setIsActive(true)}
                    className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                  />
                  <span>{EMPLOYEE_STATUS_LABELS.ACTIVE}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
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

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-2 border-t pt-3">
            <button
              onClick={onClose}
              type="button"
              disabled={isSaving}
              className="border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold px-4 h-8 rounded-lg transition-colors text-xs disabled:opacity-50"
            >
              {EMPLOYEE_UI.FORM.CANCEL_LABEL}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-5 h-8 rounded-lg transition-colors shadow-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
