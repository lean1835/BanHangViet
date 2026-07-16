import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IProduct, PRODUCT_GROUPS, TAX_RATES } from "../types/product";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<IProduct> & { taxRateId: string }) => void | Promise<void>;
  product?: IProduct | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
}) => {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [priceInput, setPriceInput] = useState("");
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [taxRateId, setTaxRateId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setSku(product.sku || "");
      setName(product.name || "");
      setGroupId(product.groupId || "");
      setUnit(product.unit || "");
      setPrice(product.price || 0);
      setPriceInput(product.price ? new Intl.NumberFormat("vi-VN").format(product.price) : "");
      setStockQuantity(product.stockQuantity || 0);
      setTaxRateId(product.taxRateId || "");
      setStatus(product.status || "ACTIVE");
    } else {
      setSku("");
      setName("");
      // Mặc định chọn nhóm hàng đầu tiên nếu có
      setGroupId(PRODUCT_GROUPS[0]?.id || "");
      setUnit("Lon");
      setPrice(0);
      setPriceInput("");
      setStockQuantity(0);
      // Mặc định chọn thuế suất đầu tiên nếu có
      setTaxRateId(TAX_RATES[0]?.id || "");
      setStatus("ACTIVE");
    }
    setErrors({});
  }, [product, isOpen]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setPriceInput("");
      setPrice(0);
      return;
    }
    const num = Number(rawVal);
    setPrice(num);
    setPriceInput(new Intl.NumberFormat("vi-VN").format(num));
  };

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!sku.trim()) {
      newErrors.sku = "Vui lòng nhập mã sản phẩm (SKU)";
    }
    if (!name.trim()) {
      newErrors.name = "Vui lòng nhập tên sản phẩm";
    }
    if (!unit.trim()) {
      newErrors.unit = "Vui lòng nhập đơn vị tính";
    }
    if (price < 0) {
      newErrors.price = "Giá bán không được nhỏ hơn 0";
    }
    if (stockQuantity < 0) {
      newErrors.stockQuantity = "Tồn kho không được nhỏ hơn 0";
    }
    if (!taxRateId) {
      newErrors.taxRateId = "Vui lòng chọn thuế suất";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    const data: Partial<IProduct> & { taxRateId: string } = {
      sku: sku.trim(),
      name: name.trim(),
      groupId: groupId || null,
      unit: unit.trim(),
      price,
      stockQuantity,
      taxRateId,
      status,
    };

    setIsSaving(true);
    try {
      await onSave(data);
      onClose();
    } catch (err) {
      // Error handled by the page / parent component
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col my-4 animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="bg-kv-blue-primary text-white px-5 py-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            {product ? "Cập nhật thông tin hàng hóa" : "Thêm mới hàng hóa"}
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
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 font-semibold text-slate-700 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {/* SKU */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Mã hàng hóa (SKU)*:</label>
              <input
                type="text"
                placeholder="Ví dụ: 8934567890123"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className={`border ${errors.sku ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.sku && <span className="text-[10px] text-rose-500 font-bold">{errors.sku}</span>}
            </div>

            {/* Đơn vị tính */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Đơn vị tính*:</label>
              <input
                type="text"
                placeholder="Ví dụ: Lon, Chai, Gói..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={`border ${errors.unit ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.unit && <span className="text-[10px] text-rose-500 font-bold">{errors.unit}</span>}
            </div>

            {/* Tên hàng hóa */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-slate-600">Tên hàng hóa*:</label>
              <input
                type="text"
                placeholder="Ví dụ: Nước ngọt Coca-Cola lon 320ml"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`border ${errors.name ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.name && <span className="text-[10px] text-rose-500 font-bold">{errors.name}</span>}
            </div>

            {/* Nhóm hàng */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Nhóm hàng hóa:</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="border border-slate-300 h-9 px-2 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary"
              >
                <option value="">-- Chọn nhóm hàng --</option>
                {PRODUCT_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trạng thái */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Trạng thái bán:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="border border-slate-300 h-9 px-2 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary"
              >
                <option value="ACTIVE">Đang bán (ACTIVE)</option>
                <option value="INACTIVE">Ngừng bán (INACTIVE)</option>
              </select>
            </div>

            {/* Giá bán lẻ */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Giá bán lẻ (đ)*:</label>
              <input
                type="text"
                placeholder="Ví dụ: 10.000"
                value={priceInput}
                onChange={handlePriceChange}
                className={`border ${errors.price ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.price && <span className="text-[10px] text-rose-500 font-bold">{errors.price}</span>}
            </div>

            {/* Tồn kho ban đầu */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Tồn kho ban đầu:</label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className={`border ${errors.stockQuantity ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
                disabled={!!product} // Chỉ cho phép nhập tồn kho khi tạo mới sản phẩm.
              />
              {errors.stockQuantity && (
                <span className="text-[10px] text-rose-500 font-bold">{errors.stockQuantity}</span>
              )}
            </div>

            {/* Thuế suất */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-slate-600">Thuế suất doanh thu áp dụng*:</label>
              <select
                value={taxRateId}
                onChange={(e) => setTaxRateId(e.target.value)}
                className={`border ${errors.taxRateId ? "border-rose-500" : "border-slate-300"} h-9 px-2 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary`}
              >
                <option value="">-- Chọn thuế suất --</option>
                {TAX_RATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.taxRateId && <span className="text-[10px] text-rose-500 font-bold">{errors.taxRateId}</span>}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 border-t pt-4 mt-3">
            <button
              onClick={onClose}
              type="button"
              className="bg-slate-100 hover:bg-slate-200 transition-colors px-4 h-9 rounded-lg text-slate-700 font-bold"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white transition-colors px-5 h-9 rounded-lg font-bold shadow-sm"
            >
              {isSaving ? "Đang lưu..." : "Lưu sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
