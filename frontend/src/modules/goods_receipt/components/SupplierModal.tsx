import React, { useEffect, useState } from "react";
import type { ISupplier, ICreateSupplierRequest } from "../types/supplier";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateSupplierRequest & { id?: string }) => Promise<void>;
  initialData?: ISupplier | null;
  isLoading?: boolean;
}

const DEFAULT_FORM_STATE: ICreateSupplierRequest = {
  code: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  taxCode: "",
  identityCard: "",
  groupName: "Nông sản - Thực phẩm",
  companyName: "",
  notes: "",
  initialDebt: 0,
};

const SUPPLIER_GROUPS = [
  "Nông sản - Thực phẩm",
  "Bánh kẹo - Nước giải khát",
  "Hóa mỹ phẩm - Tiêu dùng",
  "Thiết bị - Gia dụng",
  "Nhà cung cấp khác",
];

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ICreateSupplierRequest>(DEFAULT_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code,
        name: initialData.name,
        phone: initialData.phone,
        email: initialData.email || "",
        address: initialData.address || "",
        taxCode: initialData.taxCode || "",
        identityCard: initialData.identityCard || "",
        groupName: initialData.groupName || "Nông sản - Thực phẩm",
        companyName: initialData.companyName || "",
        notes: initialData.notes || "",
        initialDebt: initialData.currentDebt || 0,
      });
    } else {
      setFormData(DEFAULT_FORM_STATE);
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Tên nhà cung cấp không được để trống";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^[0-9]{9,11}$/.test(formData.phone.trim())) {
      newErrors.phone = "Số điện thoại phải từ 9-11 chữ số";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Email không đúng định dạng";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSave({
        ...formData,
        id: initialData?.id,
      });
      onClose();
    } catch {
      // Error handled by parent
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-auth-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h2 className="text-base font-bold">
              {initialData ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng modal nhà cung cấp"
            className="text-slate-300 hover:text-white p-1 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mã nhà cung cấp */}
            <div>
              <label htmlFor="supplier-code" className="block mb-1 font-bold text-slate-700">
                Mã nhà cung cấp <span className="text-slate-400 font-normal">(Mặc định tự sinh)</span>
              </label>
              <input
                id="supplier-code"
                type="text"
                value={formData.code || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="NCC00001"
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary"
              />
            </div>

            {/* Tên nhà cung cấp */}
            <div>
              <label htmlFor="supplier-name" className="block mb-1 font-bold text-slate-700">
                Tên nhà cung cấp <span className="text-rose-500">*</span>
              </label>
              <input
                id="supplier-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Công ty TNHH Nông Sản Việt Nam"
                className={`w-full h-9 px-3 border rounded-lg focus:outline-none ${
                  errors.name ? "border-rose-500 focus:border-rose-500" : "border-slate-300 focus:border-kv-blue-primary"
                }`}
              />
              {errors.name && <p className="text-rose-500 text-[11px] mt-1 font-normal">{errors.name}</p>}
            </div>

            {/* Số điện thoại */}
            <div>
              <label htmlFor="supplier-phone" className="block mb-1 font-bold text-slate-700">
                Điện thoại <span className="text-rose-500">*</span>
              </label>
              <input
                id="supplier-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="0912345678"
                className={`w-full h-9 px-3 border rounded-lg focus:outline-none ${
                  errors.phone ? "border-rose-500 focus:border-rose-500" : "border-slate-300 focus:border-kv-blue-primary"
                }`}
              />
              {errors.phone && <p className="text-rose-500 text-[11px] mt-1 font-normal">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="supplier-email" className="block mb-1 font-bold text-slate-700">
                Email
              </label>
              <input
                id="supplier-email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="nhacungcap@gmail.com"
                className={`w-full h-9 px-3 border rounded-lg focus:outline-none ${
                  errors.email ? "border-rose-500 focus:border-rose-500" : "border-slate-300 focus:border-kv-blue-primary"
                }`}
              />
              {errors.email && <p className="text-rose-500 text-[11px] mt-1 font-normal">{errors.email}</p>}
            </div>

            {/* Nhóm nhà cung cấp */}
            <div>
              <label htmlFor="supplier-group" className="block mb-1 font-bold text-slate-700">
                Nhóm nhà cung cấp
              </label>
              <select
                id="supplier-group"
                value={formData.groupName || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, groupName: e.target.value }))}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white"
              >
                {SUPPLIER_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* Mã số thuế */}
            <div>
              <label htmlFor="supplier-taxcode" className="block mb-1 font-bold text-slate-700">
                Mã số thuế
              </label>
              <input
                id="supplier-taxcode"
                type="text"
                value={formData.taxCode || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, taxCode: e.target.value }))}
                placeholder="0102030405"
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary"
              />
            </div>
          </div>

          {/* Địa chỉ */}
          <div>
            <label htmlFor="supplier-address" className="block mb-1 font-bold text-slate-700">
              Địa chỉ
            </label>
            <input
              id="supplier-address"
              type="text"
              value={formData.address || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="123 Đường Lê Lợi, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh"
              className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary"
            />
          </div>

          {/* Công nợ ban đầu (chỉ hiện khi tạo mới) */}
          {!initialData && (
            <div>
              <label htmlFor="supplier-initial-debt" className="block mb-1 font-bold text-slate-700">
                Nợ cần trả ban đầu (VND)
              </label>
              <input
                id="supplier-initial-debt"
                type="number"
                min="0"
                step="1000"
                value={formData.initialDebt || 0}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, initialDebt: Math.max(0, parseFloat(e.target.value) || 0) }))
                }
                placeholder="0"
                className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary font-bold text-rose-600"
              />
            </div>
          )}

          {/* Ghi chú */}
          <div>
            <label htmlFor="supplier-notes" className="block mb-1 font-bold text-slate-700">
              Ghi chú
            </label>
            <textarea
              id="supplier-notes"
              rows={3}
              value={formData.notes || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Ghi chú thêm về nhà cung cấp..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors font-bold text-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 h-9 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang lưu...
                </>
              ) : (
                "Lưu nhà cung cấp"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
