import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IEmployee, IRole } from "../types/employee";

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: IEmployee) => void;
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
  const [roleId, setRoleId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (employee) {
      setUsername(employee.username || "");
      setPassword(""); // Mật khẩu để trống khi cập nhật trừ khi muốn đổi
      setFullName(employee.fullName || "");
      setPhoneNumber(employee.phoneNumber || "");
      setRoleId(employee.roleId || "");
      setIsActive(employee.isActive !== false);
    } else {
      setUsername("");
      setPassword("");
      setFullName("");
      setPhoneNumber("");
      // Mặc định chọn vai trò nhân viên bán hàng đầu tiên nếu có
      const defaultRole = roles.find(r => r.code === "VT-02")?.code || "";
      setRoleId(defaultRole);
      setIsActive(true);
    }
    setErrors({});
  }, [employee, isOpen, roles]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!username.trim()) {
      newErrors.username = "Vui lòng nhập tên đăng nhập";
    } else if (username.trim().length < 4) {
      newErrors.username = "Tên đăng nhập phải có ít nhất 4 ký tự";
    }

    if (!employee && !password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu cho nhân viên mới";
    } else if (password.trim() && password.trim().length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên";
    }

    if (phoneNumber.trim() && !/^[0-9+() -]{9,15}$/.test(phoneNumber)) {
      newErrors.phoneNumber = "Số điện thoại không hợp lệ";
    }

    if (!roleId) {
      newErrors.roleId = "Vui lòng chọn vai trò phân quyền";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: IEmployee = {
      id: employee?.id || "emp-" + Math.random().toString(36).substring(2, 9),
      username: username.trim(),
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      roleId,
      isActive,
      ...(password.trim() ? { password: password.trim() } : {}),
    };

    onSave(data);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-auth-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="bg-kv-blue-primary text-white px-5 py-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            {employee ? "Cập nhật tài khoản nhân viên" : "Thêm mới tài khoản nhân viên"}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-white/80 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3 font-semibold text-slate-700 text-[11px]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {/* Tên đăng nhập */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">Tên đăng nhập (Tài khoản)*:</label>
              <input
                type="text"
                placeholder="Ví dụ: nhanvien_a"
                value={username}
                disabled={!!employee}
                onChange={(e) => setUsername(e.target.value)}
                className={`border ${errors.username ? "border-rose-500" : "border-slate-300"
                  } h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs ${employee ? "bg-slate-100 cursor-not-allowed" : ""
                  }`}
              />
              {errors.username && <span className="text-[10px] text-rose-500 font-bold">{errors.username}</span>}
            </div>

            {/* Mật khẩu */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">
                {employee ? "Mật khẩu mới (Để trống nếu không đổi):" : "Mật khẩu đăng nhập*:"}
              </label>
              <input
                type="password"
                placeholder={employee ? "••••••" : "Tối thiểu 6 ký tự"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`border ${errors.password ? "border-rose-500" : "border-slate-300"
                  } h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs`}
              />
              {errors.password && <span className="text-[10px] text-rose-500 font-bold">{errors.password}</span>}
            </div>

            {/* Họ và tên */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">Họ và tên nhân viên*:</label>
              <input
                type="text"
                placeholder="Nhập đầy đủ họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`border ${errors.fullName ? "border-rose-500" : "border-slate-300"
                  } h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs`}
              />
              {errors.fullName && <span className="text-[10px] text-rose-500 font-bold">{errors.fullName}</span>}
            </div>

            {/* Số điện thoại */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">Số điện thoại liên hệ:</label>
              <input
                type="text"
                placeholder="Ví dụ: 0988888888"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`border ${errors.phoneNumber ? "border-rose-500" : "border-slate-300"
                  } h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs`}
              />
              {errors.phoneNumber && <span className="text-[10px] text-rose-500 font-bold">{errors.phoneNumber}</span>}
            </div>

            {/* Vai trò / Chức danh */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">Vai trò phân quyền*:</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className={`border ${errors.roleId ? "border-rose-500" : "border-slate-300"
                  } h-9 px-2 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary text-xs`}
              >
                <option value="">Chọn vai trò</option>
                {roles
                  .filter((r) => r.code === "VT-02" || r.code === "VT-03")
                  .map((r) => (
                    <option key={r.id} value={r.code}>
                      {r.name}
                    </option>
                  ))}
              </select>
              {errors.roleId && <span className="text-[10px] text-rose-500 font-bold">{errors.roleId}</span>}
            </div>

            {/* Trạng thái tài khoản */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-600">Trạng thái hoạt động:</label>
              <div className="flex items-center gap-4 h-9">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="modalActiveStatus"
                    checked={isActive === true}
                    onChange={() => setIsActive(true)}
                    className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                  />
                  <span>Đang hoạt động</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="modalActiveStatus"
                    checked={isActive === false}
                    onChange={() => setIsActive(false)}
                    className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                  />
                  <span>Bị khóa</span>
                </label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-2 border-t pt-3">
            <button
              onClick={onClose}
              type="button"
              className="border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold px-4 h-8 rounded-lg transition-colors text-xs"
            >
              Bỏ qua
            </button>
            <button
              type="submit"
              className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-5 h-8 rounded-lg transition-colors shadow-sm text-xs"
            >
              Lưu tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
