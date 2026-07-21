import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { IProduct } from "../types/IProduct";

const getLocalDateTimeValue = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
};

const goodsReceiptSchema = z.object({
  receiptNumber: z.string().trim().max(50, "Mã phiếu không được vượt quá 50 ký tự"),
  receivedAt: z.string().min(1, "Vui lòng chọn ngày nhập kho")
    .refine((value) => new Date(value).getTime() <= Date.now(), "Ngày nhập kho không được ở tương lai"),
  productId: z.string().min(1, "Vui lòng chọn hàng hóa"),
  quantity: z.number({ invalid_type_error: "Vui lòng nhập số lượng" }).min(0.001, "Số lượng nhập phải lớn hơn 0"),
  purchasePrice: z.number({ invalid_type_error: "Vui lòng nhập đơn giá" }).min(0, "Đơn giá nhập không được âm"),
  notes: z.string().trim().max(500, "Ghi chú không được vượt quá 500 ký tự"),
});

export type GoodsReceiptFormValues = z.infer<typeof goodsReceiptSchema>;

interface GoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: GoodsReceiptFormValues) => void | Promise<void>;
  products: IProduct[];
}

export const GoodsReceiptModal: React.FC<GoodsReceiptModalProps> = ({ isOpen, onClose, onSave, products }) => {
  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState(-1);
  const productComboboxRef = useRef<HTMLDivElement>(null);
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, reset, setValue, clearErrors, formState: { errors, isSubmitting } } = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: { receiptNumber: "", receivedAt: getLocalDateTimeValue(), productId: "", quantity: 1, purchasePrice: 0, notes: "" },
  });

  const normalizedProductSearch = productSearch.trim().toLocaleLowerCase("vi");
  const filteredProducts = useMemo(() => {
    if (!normalizedProductSearch) return products;
    return products.filter((product) => [product.name, product.sku].some((value) => value.toLocaleLowerCase("vi").includes(normalizedProductSearch)));
  }, [normalizedProductSearch, products]);

  useEffect(() => {
    if (!isOpen) return;
    reset({ receiptNumber: "", receivedAt: getLocalDateTimeValue(), productId: "", quantity: 1, purchasePrice: 0, notes: "" });
    setProductSearch("");
    setIsProductDropdownOpen(false);
    setActiveProductIndex(-1);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, reset]);

  useEffect(() => {
    if (!isProductDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!productComboboxRef.current?.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
        setActiveProductIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProductDropdownOpen]);

  if (!isOpen) return null;
  const submitForm = async (values: GoodsReceiptFormValues) => { await onSave(values); onClose(); };
  const handleSelectProduct = (product: IProduct) => {
    setValue("productId", product.id, { shouldDirty: true, shouldValidate: true });
    clearErrors("productId");
    setProductSearch(`${product.name} (${product.sku})`);
    setIsProductDropdownOpen(false);
    setActiveProductIndex(-1);
  };
  const handleClearProduct = () => {
    setValue("productId", "", { shouldDirty: true, shouldValidate: true });
    setProductSearch("");
    setIsProductDropdownOpen(true);
    setActiveProductIndex(-1);
    productSearchInputRef.current?.focus();
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="goods-receipt-modal-title" onMouseDown={(event) => event.target === event.currentTarget && !isSubmitting && onClose()} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden my-4 animate-modal-bounce-in">
        <div className="bg-kv-blue-primary text-white px-5 py-3 flex items-center justify-between">
          <h2 id="goods-receipt-modal-title" className="text-xs font-bold uppercase tracking-wider">Lập phiếu nhập kho</h2>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Đóng modal lập phiếu nhập kho" className="text-white/80 hover:text-white disabled:opacity-50 transition-colors text-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit(submitForm)} className="p-5 flex flex-col gap-4 font-semibold text-slate-700 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">Mã phiếu nhập
              <input type="text" maxLength={50} autoFocus disabled={isSubmitting} placeholder="Để trống để hệ thống tự sinh" {...register("receiptNumber")} className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary" />
              {errors.receiptNumber && <span className="text-[10px] text-rose-500">{errors.receiptNumber.message}</span>}
            </label>
            <label className="flex flex-col gap-1">Ngày nhập kho <span className="text-rose-500">*</span>
              <input type="datetime-local" max={getLocalDateTimeValue()} disabled={isSubmitting} {...register("receivedAt")} className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary" />
              {errors.receivedAt && <span className="text-[10px] text-rose-500">{errors.receivedAt.message}</span>}
            </label>
          </div>
          <div ref={productComboboxRef} className="relative flex flex-col gap-1">
            <label htmlFor="receipt-product-search">Chọn hàng hóa nhập <span className="text-rose-500">*</span></label>
            <input type="hidden" {...register("productId")} />
            <div className="relative">
              <input ref={productSearchInputRef} id="receipt-product-search" type="text" role="combobox" aria-autocomplete="list" aria-expanded={isProductDropdownOpen} aria-controls="receipt-product-options" disabled={isSubmitting} value={productSearch} onFocus={() => setIsProductDropdownOpen(true)} onChange={(event) => { setProductSearch(event.target.value); setValue("productId", "", { shouldDirty: true }); clearErrors("productId"); setIsProductDropdownOpen(true); setActiveProductIndex(-1); }} onKeyDown={(event) => {
                if (event.key === "ArrowDown") { event.preventDefault(); setIsProductDropdownOpen(true); setActiveProductIndex((current) => Math.min(current + 1, filteredProducts.length - 1)); }
                else if (event.key === "ArrowUp") { event.preventDefault(); setActiveProductIndex((current) => Math.max(current - 1, 0)); }
                else if (event.key === "Enter" && activeProductIndex >= 0) { event.preventDefault(); handleSelectProduct(filteredProducts[activeProductIndex]); }
                else if (event.key === "Escape") { event.stopPropagation(); setIsProductDropdownOpen(false); }
              }} placeholder="Tìm theo tên hàng hóa hoặc SKU" className="w-full border border-slate-300 h-9 pl-3 pr-16 rounded-lg focus:outline-none focus:border-kv-blue-primary" />
              {productSearch && !isSubmitting && <button type="button" onClick={handleClearProduct} aria-label="Xóa hàng hóa đã tìm kiếm" title="Xóa nhanh" className="absolute inset-y-0 right-8 px-2 text-slate-400 hover:text-slate-700">✕</button>}
              <button type="button" disabled={isSubmitting} onMouseDown={(event) => event.preventDefault()} onClick={() => { setIsProductDropdownOpen((current) => !current); productSearchInputRef.current?.focus(); }} aria-label="Mở danh sách hàng hóa" className="absolute inset-y-0 right-0 px-3 text-slate-400">▾</button>
            </div>
            {isProductDropdownOpen && <div id="receipt-product-options" role="listbox" className="absolute z-20 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
              {filteredProducts.length ? filteredProducts.map((product, index) => <button key={product.id} type="button" role="option" aria-selected={activeProductIndex === index} onMouseEnter={() => setActiveProductIndex(index)} onClick={() => handleSelectProduct(product)} className={`w-full px-3 py-2 text-left ${activeProductIndex === index ? "bg-kv-blue-light" : "hover:bg-slate-50"}`}><span className="block font-bold">{product.name}</span><span className="block text-[10px] text-slate-400">SKU: {product.sku} · Tồn: {product.stockQuantity}</span></button>) : <div className="px-3 py-4 text-center text-slate-400">Không tìm thấy hàng hóa phù hợp</div>}
            </div>}
            {errors.productId && <span className="text-[10px] text-rose-500">{errors.productId.message}</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">Số lượng nhập <span className="text-rose-500">*</span><input type="number" min="0.001" step="0.001" disabled={isSubmitting} {...register("quantity", { valueAsNumber: true })} className="border border-slate-300 h-9 px-3 rounded-lg" />{errors.quantity && <span className="text-[10px] text-rose-500">{errors.quantity.message}</span>}</label>
            <label className="flex flex-col gap-1">Đơn giá nhập (đ) <span className="text-rose-500">*</span><input type="number" min="0" step="0.01" disabled={isSubmitting} {...register("purchasePrice", { valueAsNumber: true })} className="border border-slate-300 h-9 px-3 rounded-lg" />{errors.purchasePrice && <span className="text-[10px] text-rose-500">{errors.purchasePrice.message}</span>}</label>
          </div>
          <label className="flex flex-col gap-1">Ghi chú / Nhà cung cấp<textarea rows={3} maxLength={500} disabled={isSubmitting} placeholder="Ví dụ: Nhập đại lý cấp 1, có hóa đơn VAT đầu vào..." {...register("notes")} className="border border-slate-300 p-3 rounded-lg resize-none" />{errors.notes && <span className="text-[10px] text-rose-500">{errors.notes.message}</span>}</label>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="h-9 px-4 rounded-lg border border-slate-300">Hủy</button>
            <button type="submit" disabled={isSubmitting || products.length === 0} className="h-9 px-4 rounded-lg bg-kv-blue-primary text-white disabled:bg-slate-300">{isSubmitting ? "Đang nhập kho..." : "Xác nhận nhập kho"}</button>
          </div>
        </form>
      </div>
    </div>, document.body,
  );
};
