import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Store, AlertCircle, Loader2 } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { IPointOfSale, IPointOfSaleRequest } from "../types/IPointOfSale";

interface PointOfSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IPointOfSaleRequest) => Promise<void>;
  initialData?: IPointOfSale | null;
  isLoading?: boolean;
}

export const PointOfSaleModal: React.FC<PointOfSaleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isLoading,
  });

  const [name, setName] = useState("");
  const [posCode, setPosCode] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [invoiceSymbol, setInvoiceSymbol] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<{
    name?: string;
    address?: string;
    invoiceSymbol?: string;
  }>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setPosCode(initialData.posCode || "");
      setAddress(initialData.address || "");
      setPhoneNumber(initialData.phoneNumber || "");
      setInvoiceSymbol(initialData.invoiceSymbol || "");
      setIsDefault(Boolean(initialData.isDefault));
      setIsActive(initialData.isActive !== false);
    } else {
      setName("");
      setPosCode("");
      setAddress("");
      setPhoneNumber("");
      setInvoiceSymbol("");
      setIsDefault(false);
      setIsActive(true);
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) {
      newErrors.name = "Vui lòng nhập tên điểm bán";
    }
    if (!address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ điểm bán";
    }
    if (invoiceSymbol.trim() && !/^[A-Z0-9]{5,10}$/i.test(invoiceSymbol.trim())) {
      newErrors.invoiceSymbol = "Ký hiệu hóa đơn không hợp lệ (gồm 5-10 ký tự chữ và số, ví dụ C26TAA)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    const payload: IPointOfSaleRequest = {
      name: name.trim(),
      posCode: posCode.trim() || undefined,
      address: address.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      invoiceSymbol: invoiceSymbol.trim() ? invoiceSymbol.trim().toUpperCase() : undefined,
      isDefault,
      isActive,
    };

    await onSubmit(payload);
  };

  const isEditing = Boolean(initialData?.id);

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-kv-blue-light text-kv-blue-primary">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? "Chỉnh sửa điểm bán" : "Thêm điểm bán mới"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Cập nhật thông tin chi nhánh / điểm bán"
                  : "Khai báo điểm bán mới trong hộ kinh doanh"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Tên điểm bán */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên điểm bán / Chi nhánh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Ví dụ: Tạp hóa Bà Năm - Chi nhánh 2"
                className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border bg-white transition-all outline-none ${
                  errors.name
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    : "border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                }`}
                disabled={isLoading}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Mã điểm bán & Ký hiệu hóa đơn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã điểm bán
                </label>
                <input
                  type="text"
                  value={posCode}
                  onChange={(e) => setPosCode(e.target.value)}
                  placeholder="Tự sinh nếu để trống (vd: POS-02)"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 transition-all outline-none uppercase"
                  disabled={isLoading}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Mã định danh riêng của quầy
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ký hiệu HĐ riêng (nếu có)
                </label>
                <input
                  type="text"
                  value={invoiceSymbol}
                  onChange={(e) => {
                    setInvoiceSymbol(e.target.value);
                    if (errors.invoiceSymbol)
                      setErrors((prev) => ({ ...prev, invoiceSymbol: undefined }));
                  }}
                  placeholder="Ví dụ: C26TAA"
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border bg-white transition-all outline-none uppercase ${
                    errors.invoiceSymbol
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                  }`}
                  disabled={isLoading}
                />
                {errors.invoiceSymbol ? (
                  <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.invoiceSymbol}
                  </p>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Ký hiệu xuất HĐĐT riêng cho điểm này
                  </span>
                )}
              </div>
            </div>

            {/* Địa chỉ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ chi nhánh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address)
                    setErrors((prev) => ({ ...prev, address: undefined }));
                }}
                placeholder="Ví dụ: Số 12 đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
                className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border bg-white transition-all outline-none ${
                  errors.address
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    : "border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                }`}
                disabled={isLoading}
              />
              {errors.address && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.address}
                </p>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ví dụ: 0988123456"
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                disabled={isLoading}
              />
            </div>

            {/* Cài đặt Mặc định & Trạng thái */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={isLoading || (isEditing && initialData?.isDefault)}
                  className="w-4 h-4 text-kv-blue-primary rounded border-slate-300 focus:ring-kv-blue-primary"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Đặt làm điểm bán mặc định
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Điểm bán mặc định được chọn ưu tiên khi mở ca hoặc xem báo cáo
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isLoading || (isEditing && initialData?.isDefault)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Đang hoạt động (Kích hoạt)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Cho phép mở ca bán hàng và thực hiện giao dịch tại điểm này
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-xl shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Cập nhật điểm bán" : "Lưu điểm bán"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
