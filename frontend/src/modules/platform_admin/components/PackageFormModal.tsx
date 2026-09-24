import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Check,
  Users,
  Store,
  FileText,
  Clock,
  Coins,
  FileEdit,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import type {
  IServicePackageItem,
  ICreatePackagePayload,
  IUpdatePackagePayload,
} from "../types/platformAdminTypes";
import { formatCurrency } from "@/utils/formatCurrency";

interface PackageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: IServicePackageItem | null;
  onSubmit: (data: ICreatePackagePayload | IUpdatePackagePayload) => Promise<void>;
  isLoading: boolean;
}

export const PackageFormModal: React.FC<PackageFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isLoading,
}) => {
  const isEdit = Boolean(initialData);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [maxUsers, setMaxUsers] = useState<number>(5);
  const [maxPosPoints, setMaxPosPoints] = useState<number>(2);
  const [maxInvoicesPerMonth, setMaxInvoicesPerMonth] = useState<number>(1000);
  const [dataRetentionDays, setDataRetentionDays] = useState<number>(365);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code || "");
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setPrice(initialData.price ?? 0);
      setMaxUsers(initialData.maxUsers ?? 5);
      setMaxPosPoints(initialData.maxPosPoints ?? 2);
      setMaxInvoicesPerMonth(initialData.maxInvoicesPerMonth ?? 1000);
      setDataRetentionDays(initialData.dataRetentionDays ?? 365);
      setIsActive(initialData.isActive ?? true);
    } else {
      setCode("");
      setName("");
      setDescription("");
      setPrice(199000);
      setMaxUsers(5);
      setMaxPosPoints(2);
      setMaxInvoicesPerMonth(1000);
      setDataRetentionDays(365);
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!isEdit && !trimmedCode) {
      setErrorMsg("Vui lòng nhập mã định danh gói dịch vụ.");
      return;
    }
    if (!trimmedName) {
      setErrorMsg("Vui lòng nhập tên gói dịch vụ.");
      return;
    }
    if (price < 0) {
      setErrorMsg("Giá gói dịch vụ không được âm.");
      return;
    }
    if (maxUsers <= 0) {
      setErrorMsg("Số lượng tài khoản tối đa phải lớn hơn 0.");
      return;
    }
    if (maxPosPoints <= 0) {
      setErrorMsg("Số điểm bán POS tối đa phải lớn hơn 0.");
      return;
    }
    if (maxInvoicesPerMonth <= 0) {
      setErrorMsg("Số hóa đơn tối đa mỗi tháng phải lớn hơn 0.");
      return;
    }
    if (dataRetentionDays <= 0) {
      setErrorMsg("Thời gian lưu trữ dữ liệu phải lớn hơn 0 ngày.");
      return;
    }

    try {
      if (isEdit && initialData) {
        await onSubmit({
          id: initialData.id,
          name: trimmedName,
          description: description.trim(),
          price: Number(price),
          maxUsers: Number(maxUsers),
          maxPosPoints: Number(maxPosPoints),
          maxInvoicesPerMonth: Number(maxInvoicesPerMonth),
          dataRetentionDays: Number(dataRetentionDays),
          isActive,
        });
      } else {
        await onSubmit({
          code: trimmedCode,
          name: trimmedName,
          description: description.trim(),
          price: Number(price),
          maxUsers: Number(maxUsers),
          maxPosPoints: Number(maxPosPoints),
          maxInvoicesPerMonth: Number(maxInvoicesPerMonth),
          dataRetentionDays: Number(dataRetentionDays),
        });
      }
      onClose();
    } catch (err: any) {
      const serverMsg =
        err?.data?.message || err?.message || "Có lỗi xảy ra khi lưu gói dịch vụ.";
      setErrorMsg(serverMsg);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isEdit ? "bg-blue-50 text-kv-blue-primary" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {isEdit ? <FileEdit size={20} /> : <PlusCircle size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isEdit ? "Chỉnh sửa cấu hình gói dịch vụ" : "Tạo mới gói dịch vụ nền tảng"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isEdit
                  ? `Mã gói: ${initialData?.code} - Thiết lập giới hạn và quyền lợi`
                  : "Thiết lập hạn mức người dùng, điểm bán POS, hóa đơn và giá thuê bao"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Mã định danh gói <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                disabled={isEdit}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: STANDARD, PRO_MAX, ENTERPRISE"
                className={`w-full px-3 py-2 border rounded-xl outline-hidden font-bold tracking-wide transition-all ${
                  isEdit
                    ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                    : "border-slate-200 focus:border-kv-blue-primary focus:ring-1 focus:ring-blue-100 bg-slate-50/40 text-slate-900"
                }`}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isEdit ? "Mã gói dịch vụ không được sửa sau khi tạo" : "Viết hoa, không dấu, dùng dấu gạch dưới"}
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Tên gói dịch vụ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Gói Tiêu Chuẩn, Gói Doanh Nghiệp"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-1 focus:ring-blue-100 outline-hidden font-semibold text-slate-900 bg-slate-50/40"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Tên hiển thị trên bảng giá và trang quản trị</span>
            </div>
          </div>

          {/* Row 2: Price */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Coins size={15} className="text-amber-500" />
                <span>Giá thuê bao theo tháng (VNĐ)</span> <span className="text-rose-500">*</span>
              </label>
              <span className="font-extrabold text-sm text-kv-blue-primary">
                {formatCurrency(price)} / tháng
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={1000}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-1 focus:ring-blue-100 outline-hidden font-bold text-slate-900 bg-white"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 mr-1 font-medium">Gợi ý nhanh:</span>
              {[
                { label: "Miễn phí (0đ)", val: 0 },
                { label: "99.000đ", val: 99000 },
                { label: "199.000đ", val: 199000 },
                { label: "399.000đ", val: 399000 },
                { label: "599.000đ", val: 599000 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setPrice(item.val)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white border border-slate-200 hover:border-kv-blue-primary hover:text-kv-blue-primary transition-all text-slate-600"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Limits (2x2 Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Max Users */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Users size={14} className="text-blue-500" />
                <span>Tối đa tài khoản người dùng</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={maxUsers}
                onChange={(e) => setMaxUsers(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-kv-blue-primary outline-hidden font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 block">Số nhân viên / quản lý được tạo trong hộ</span>
            </div>

            {/* Max POS */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Store size={14} className="text-emerald-500" />
                <span>Tối đa điểm bán POS</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={maxPosPoints}
                onChange={(e) => setMaxPosPoints(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-kv-blue-primary outline-hidden font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 block">Số chi nhánh hoặc quầy thu ngân hoạt động</span>
            </div>

            {/* Max Invoices */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText size={14} className="text-purple-500" />
                <span>Hóa đơn tối đa / tháng</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={10}
                step={100}
                value={maxInvoicesPerMonth}
                onChange={(e) => setMaxInvoicesPerMonth(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-kv-blue-primary outline-hidden font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 block">Hạn mức hóa đơn điện tử phát hành hàng tháng</span>
            </div>

            {/* Data Retention Days */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-500" />
                <span>Thời gian lưu trữ dữ liệu (ngày)</span> <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={30}
                  step={30}
                  value={dataRetentionDays}
                  onChange={(e) => setDataRetentionDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-kv-blue-primary outline-hidden font-bold text-slate-900"
                />
                <span className="text-slate-500 font-semibold text-[11px] whitespace-nowrap">
                  (~{Math.round(dataRetentionDays / 30)} tháng)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">365 ngày (1 năm), 730 ngày (2 năm), 1825 ngày (5 năm)</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Mô tả chi tiết & quyền lợi gói
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Phù hợp hộ kinh doanh vừa và nhỏ, hỗ trợ ký số CQT 24/7, xuất hóa đơn không giới hạn..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-1 focus:ring-blue-100 outline-hidden font-medium text-slate-800 bg-slate-50/40 resize-none"
            />
          </div>

          {/* Active Toggle (for edit mode) */}
          {isEdit && (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <div>
                <span className="font-bold text-slate-800 text-xs block">Trạng thái phát hành</span>
                <span className="text-[11px] text-slate-500">
                  {isActive
                    ? "Gói đang hoạt động, có thể gán cho hộ kinh doanh mới."
                    : "Gói tạm ngưng, các hộ đã gán vẫn dùng bình thường nhưng không thể đăng ký mới."}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isActive ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{isEdit ? "Lưu thay đổi" : "Tạo gói mới"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
