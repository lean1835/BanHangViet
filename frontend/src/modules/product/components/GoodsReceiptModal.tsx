import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { ISupplier } from "@/modules/supplier/types/ISupplier";
import { formatNumber } from "@/utils/formatCurrency";
import type { IProduct } from "../types/IProduct";

const getLocalDateTimeValue = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
};

const goodsReceiptSchema = z.object({
  receiptNumber: z
    .string()
    .trim()
    .max(50, "Mã phiếu không được vượt quá 50 ký tự"),
  receivedAt: z
    .string()
    .min(1, "Vui lòng chọn ngày nhập kho")
    .refine(
      (value) => new Date(value).getTime() <= Date.now(),
      "Ngày nhập kho không được ở tương lai",
    ),
  supplierId: z
    .string()
    .max(36, "Mã nhà cung cấp không được vượt quá 36 ký tự"),
  productId: z.string().min(1, "Vui lòng chọn hàng hóa"),
  quantity: z
    .number({ invalid_type_error: "Vui lòng nhập số lượng" })
    .min(1, "Số lượng nhập phải lớn hơn 0")
    .int("Số lượng nhập phải là số nguyên"),
  purchasePrice: z
    .number({ invalid_type_error: "Vui lòng nhập đơn giá" })
    .min(0, "Đơn giá nhập không được âm"),
  notes: z
    .string()
    .trim()
    .max(500, "Ghi chú không được vượt quá 500 ký tự"),
});

export type GoodsReceiptFormValues = z.infer<typeof goodsReceiptSchema>;

interface GoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: GoodsReceiptFormValues) => void | Promise<void>;
  products: IProduct[];
  suppliers: ISupplier[];
  isSuppliersLoading?: boolean;
}

const getDefaultValues = (): GoodsReceiptFormValues => ({
  receiptNumber: "",
  receivedAt: getLocalDateTimeValue(),
  supplierId: "",
  productId: "",
  quantity: 1,
  purchasePrice: 0,
  notes: "",
});

export const GoodsReceiptModal: React.FC<GoodsReceiptModalProps> = ({
  isOpen,
  onClose,
  onSave,
  products,
  suppliers,
  isSuppliersLoading = false,
}) => {
  const [productSearch, setProductSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState(-1);
  const [activeSupplierIndex, setActiveSupplierIndex] = useState(-1);
  const [purchasePriceDisplay, setPurchasePriceDisplay] = useState("0");
  const productComboboxRef = useRef<HTMLDivElement>(null);
  const supplierComboboxRef = useRef<HTMLDivElement>(null);
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const supplierSearchInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: getDefaultValues(),
  });
  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSubmitting,
  });

  const normalizedProductSearch = productSearch
    .trim()
    .toLocaleLowerCase("vi");
  const filteredProducts = useMemo(() => {
    if (!normalizedProductSearch) return products;
    return products.filter((product) =>
      [product.name, product.sku].some((value) =>
        value.toLocaleLowerCase("vi").includes(normalizedProductSearch),
      ),
    );
  }, [normalizedProductSearch, products]);

  const normalizedSupplierSearch = supplierSearch
    .trim()
    .toLocaleLowerCase("vi");
  const filteredSuppliers = useMemo(() => {
    if (!normalizedSupplierSearch) return suppliers;
    return suppliers.filter((supplier) =>
      [supplier.name, supplier.phoneNumber].some((value) =>
        value.toLocaleLowerCase("vi").includes(normalizedSupplierSearch),
      ),
    );
  }, [normalizedSupplierSearch, suppliers]);

  useEffect(() => {
    if (!isOpen) return;

    reset(getDefaultValues());
    setProductSearch("");
    setSupplierSearch("");
    setPurchasePriceDisplay("0");
    setIsProductDropdownOpen(false);
    setIsSupplierDropdownOpen(false);
    setActiveProductIndex(-1);
    setActiveSupplierIndex(-1);
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isProductDropdownOpen && !isSupplierDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!productComboboxRef.current?.contains(target)) {
        setIsProductDropdownOpen(false);
        setActiveProductIndex(-1);
      }
      if (!supplierComboboxRef.current?.contains(target)) {
        setIsSupplierDropdownOpen(false);
        setActiveSupplierIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProductDropdownOpen, isSupplierDropdownOpen]);

  if (!isOpen) return null;

  const submitForm = async (values: GoodsReceiptFormValues) => {
    await onSave(values);
    onClose();
  };

  const handleSelectProduct = (product: IProduct) => {
    setValue("productId", product.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
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

  const handleSelectSupplier = (supplier: ISupplier) => {
    setValue("supplierId", supplier.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearErrors("supplierId");
    setSupplierSearch(`${supplier.name} (${supplier.phoneNumber})`);
    setIsSupplierDropdownOpen(false);
    setActiveSupplierIndex(-1);
  };

  const handleClearSupplier = () => {
    setValue("supplierId", "", { shouldDirty: true, shouldValidate: true });
    setSupplierSearch("");
    setIsSupplierDropdownOpen(true);
    setActiveSupplierIndex(-1);
    supplierSearchInputRef.current?.focus();
  };

  return createPortal(
    <div
      onMouseDown={(event) =>
        event.target === event.currentTarget && !isSubmitting && onClose()
      }
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goods-receipt-modal-title"
        className="my-4 w-full max-w-xl overflow-visible rounded-xl border border-slate-100 bg-white shadow-2xl animate-modal-bounce-in"
      >
        <div className="flex items-center justify-between rounded-t-xl bg-kv-blue-primary px-5 py-3 text-white">
          <h2
            id="goods-receipt-modal-title"
            className="text-xs font-bold uppercase tracking-wider"
          >
            Lập phiếu nhập kho
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng modal lập phiếu nhập kho"
            className="text-lg text-white/80 transition-colors hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit(submitForm)}
          className="flex flex-col gap-4 p-5 text-xs font-semibold text-slate-700"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              Mã phiếu nhập
              <input
                type="text"
                maxLength={50}
                autoFocus
                disabled={isSubmitting}
                placeholder="Để trống để hệ thống tự sinh"
                {...register("receiptNumber")}
                className="h-9 rounded-lg border border-slate-300 px-3 focus:border-kv-blue-primary focus:outline-none"
              />
              {errors.receiptNumber && (
                <span className="text-[10px] text-rose-500">
                  {errors.receiptNumber.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1">
              <span>
                Ngày nhập kho <span className="text-rose-500">*</span>
              </span>
              <input
                type="datetime-local"
                max={getLocalDateTimeValue()}
                disabled={isSubmitting}
                {...register("receivedAt")}
                className="h-9 rounded-lg border border-slate-300 px-3 focus:border-kv-blue-primary focus:outline-none"
              />
              {errors.receivedAt && (
                <span className="text-[10px] text-rose-500">
                  {errors.receivedAt.message}
                </span>
              )}
            </label>
          </div>

          <div
            ref={supplierComboboxRef}
            className="relative flex flex-col gap-1"
          >
            <label htmlFor="receipt-supplier-search">
              Nhà cung cấp <span className="font-medium text-slate-400">(không bắt buộc)</span>
            </label>
            <input type="hidden" {...register("supplierId")} />
            <div className="relative">
              <input
                ref={supplierSearchInputRef}
                id="receipt-supplier-search"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isSupplierDropdownOpen}
                aria-controls="receipt-supplier-options"
                disabled={isSubmitting || isSuppliersLoading}
                value={supplierSearch}
                onFocus={() => setIsSupplierDropdownOpen(true)}
                onChange={(event) => {
                  setSupplierSearch(event.target.value);
                  setValue("supplierId", "", { shouldDirty: true });
                  clearErrors("supplierId");
                  setIsSupplierDropdownOpen(true);
                  setActiveSupplierIndex(-1);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setIsSupplierDropdownOpen(true);
                    setActiveSupplierIndex((current) =>
                      Math.min(current + 1, filteredSuppliers.length - 1),
                    );
                  } else if (
                    event.key === "ArrowUp" &&
                    filteredSuppliers.length > 0
                  ) {
                    event.preventDefault();
                    setActiveSupplierIndex((current) => Math.max(current - 1, 0));
                  } else if (
                    event.key === "Enter" &&
                    activeSupplierIndex >= 0 &&
                    filteredSuppliers[activeSupplierIndex]
                  ) {
                    event.preventDefault();
                    handleSelectSupplier(filteredSuppliers[activeSupplierIndex]);
                  } else if (event.key === "Escape") {
                    event.stopPropagation();
                    setIsSupplierDropdownOpen(false);
                  }
                }}
                placeholder={
                  isSuppliersLoading
                    ? "Đang tải nhà cung cấp..."
                    : "Tìm theo tên hoặc số điện thoại"
                }
                className="h-9 w-full rounded-lg border border-slate-300 pl-3 pr-16 focus:border-kv-blue-primary focus:outline-none disabled:bg-slate-50"
              />
              {supplierSearch && !isSubmitting && (
                <button
                  type="button"
                  onClick={handleClearSupplier}
                  aria-label="Bỏ chọn nhà cung cấp"
                  title="Bỏ chọn"
                  className="absolute inset-y-0 right-8 px-2 text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                disabled={isSubmitting || isSuppliersLoading}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setIsSupplierDropdownOpen((current) => !current);
                  supplierSearchInputRef.current?.focus();
                }}
                aria-label="Mở danh sách nhà cung cấp"
                className="absolute inset-y-0 right-0 px-3 text-slate-400 disabled:opacity-50"
              >
                ▾
              </button>
            </div>
            {isSupplierDropdownOpen && (
              <div
                id="receipt-supplier-options"
                role="listbox"
                className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
              >
                {filteredSuppliers.length ? (
                  filteredSuppliers.map((supplier, index) => (
                    <button
                      key={supplier.id}
                      type="button"
                      role="option"
                      aria-selected={activeSupplierIndex === index}
                      onMouseEnter={() => setActiveSupplierIndex(index)}
                      onClick={() => handleSelectSupplier(supplier)}
                      className={`w-full px-3 py-2 text-left ${
                        activeSupplierIndex === index
                          ? "bg-kv-blue-light"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="block font-bold">{supplier.name}</span>
                      <span className="block text-[10px] text-slate-400">
                        SĐT: {supplier.phoneNumber}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-slate-400">
                    Không tìm thấy nhà cung cấp đang hoạt động
                  </div>
                )}
              </div>
            )}
            {errors.supplierId && (
              <span className="text-[10px] text-rose-500">
                {errors.supplierId.message}
              </span>
            )}
          </div>

          <div ref={productComboboxRef} className="relative flex flex-col gap-1">
            <label htmlFor="receipt-product-search">
              Chọn hàng hóa nhập <span className="text-rose-500">*</span>
            </label>
            <input type="hidden" {...register("productId")} />
            <div className="relative">
              <input
                ref={productSearchInputRef}
                id="receipt-product-search"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isProductDropdownOpen}
                aria-controls="receipt-product-options"
                disabled={isSubmitting}
                value={productSearch}
                onFocus={() => setIsProductDropdownOpen(true)}
                onChange={(event) => {
                  setProductSearch(event.target.value);
                  setValue("productId", "", { shouldDirty: true });
                  clearErrors("productId");
                  setIsProductDropdownOpen(true);
                  setActiveProductIndex(-1);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setIsProductDropdownOpen(true);
                    setActiveProductIndex((current) =>
                      Math.min(current + 1, filteredProducts.length - 1),
                    );
                  } else if (
                    event.key === "ArrowUp" &&
                    filteredProducts.length > 0
                  ) {
                    event.preventDefault();
                    setActiveProductIndex((current) => Math.max(current - 1, 0));
                  } else if (
                    event.key === "Enter" &&
                    activeProductIndex >= 0 &&
                    filteredProducts[activeProductIndex]
                  ) {
                    event.preventDefault();
                    handleSelectProduct(filteredProducts[activeProductIndex]);
                  } else if (event.key === "Escape") {
                    event.stopPropagation();
                    setIsProductDropdownOpen(false);
                  }
                }}
                placeholder="Tìm theo tên hàng hóa hoặc SKU"
                className="h-9 w-full rounded-lg border border-slate-300 pl-3 pr-16 focus:border-kv-blue-primary focus:outline-none"
              />
              {productSearch && !isSubmitting && (
                <button
                  type="button"
                  onClick={handleClearProduct}
                  aria-label="Xóa hàng hóa đã tìm kiếm"
                  title="Xóa nhanh"
                  className="absolute inset-y-0 right-8 px-2 text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                disabled={isSubmitting}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setIsProductDropdownOpen((current) => !current);
                  productSearchInputRef.current?.focus();
                }}
                aria-label="Mở danh sách hàng hóa"
                className="absolute inset-y-0 right-0 px-3 text-slate-400"
              >
                ▾
              </button>
            </div>
            {isProductDropdownOpen && (
              <div
                id="receipt-product-options"
                role="listbox"
                className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
              >
                {filteredProducts.length ? (
                  filteredProducts.map((product, index) => (
                    <button
                      key={product.id}
                      type="button"
                      role="option"
                      aria-selected={activeProductIndex === index}
                      onMouseEnter={() => setActiveProductIndex(index)}
                      onClick={() => handleSelectProduct(product)}
                      className={`w-full px-3 py-2 text-left ${
                        activeProductIndex === index
                          ? "bg-kv-blue-light"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="block font-bold">{product.name}</span>
                      <span className="block text-[10px] text-slate-400">
                        SKU: {product.sku} · Tồn: {product.stockQuantity}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-slate-400">
                    Không tìm thấy hàng hóa phù hợp
                  </div>
                )}
              </div>
            )}
            {errors.productId && (
              <span className="text-[10px] text-rose-500">
                {errors.productId.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span>
                Số lượng nhập <span className="text-rose-500">*</span>
              </span>
              <input
                type="number"
                min="1"
                step="1"
                disabled={isSubmitting}
                {...register("quantity", { valueAsNumber: true })}
                className="h-9 rounded-lg border border-slate-300 px-3"
              />
              {errors.quantity && (
                <span className="text-[10px] text-rose-500">
                  {errors.quantity.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1">
              <span>
                Đơn giá nhập (đ) <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                disabled={isSubmitting}
                value={purchasePriceDisplay}
                onChange={(event) => {
                  const rawValue = event.target.value.replace(/\D/g, "");
                  const numericValue = rawValue ? Number(rawValue) : 0;
                  setPurchasePriceDisplay(
                    rawValue ? formatNumber(numericValue) : "0",
                  );
                  setValue("purchasePrice", numericValue, {
                    shouldValidate: true,
                  });
                }}
                className="h-9 rounded-lg border border-slate-300 px-3 font-bold"
              />
              {errors.purchasePrice && (
                <span className="text-[10px] text-rose-500">
                  {errors.purchasePrice.message}
                </span>
              )}
            </label>
          </div>

          <label className="flex flex-col gap-1">
            Ghi chú
            <textarea
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
              placeholder="Ví dụ: Có hóa đơn VAT đầu vào..."
              {...register("notes")}
              className="resize-none rounded-lg border border-slate-300 p-3"
            />
            {errors.notes && (
              <span className="text-[10px] text-rose-500">
                {errors.notes.message}
              </span>
            )}
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 rounded-lg border border-slate-300 px-4"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || products.length === 0}
              className="h-9 rounded-lg bg-kv-blue-primary px-4 text-white disabled:bg-slate-300"
            >
              {isSubmitting ? "Đang nhập kho..." : "Xác nhận nhập kho"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
