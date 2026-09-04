import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { useGetSuppliersQuery } from "@/modules/supplier/services/supplierApi";
import type { IProduct } from "../types/IProduct";
import type { ICreateGoodsReceiptPayload } from "../types/IGoodsReceipt";

const getLocalDateTimeValue = (): string => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
};

export interface GoodsReceiptItemRow {
  productId: string;
  productName: string;
  productSku: string;
  unit: string;
  currentStock: number;
  listedPrice: number;
  quantity: number;
  purchasePrice: number;
  purchasePriceDisplay: string;
}

export type GoodsReceiptFormValues = ICreateGoodsReceiptPayload;

interface GoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: ICreateGoodsReceiptPayload) => void | Promise<void>;
  products: IProduct[];
  initialSupplierId?: string;
  initialItems?: GoodsReceiptItemRow[];
}

export const GoodsReceiptModal: React.FC<GoodsReceiptModalProps> = ({
  isOpen,
  onClose,
  onSave,
  products,
  initialSupplierId,
  initialItems,
}) => {
  const { data: suppliers = [] } = useGetSuppliersQuery(undefined, {
    skip: !isOpen,
  });

  // Master Form State
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [receivedAt, setReceivedAt] = useState<string>(getLocalDateTimeValue());
  const [supplierId, setSupplierId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<GoodsReceiptItemRow[]>([]);

  // Validation Errors
  const [formErrors, setFormErrors] = useState<{
    receiptNumber?: string;
    receivedAt?: string;
    items?: string;
    notes?: string;
  }>({});

  // Product Combobox Search State
  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState(-1);
  const productComboboxRef = useRef<HTMLDivElement>(null);
  const productSearchInputRef = useRef<HTMLInputElement>(null);

  // Submitting and Selling Below Cost Warning Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBelowCostModal, setShowBelowCostModal] = useState(false);

  // Reset form state ONLY when the modal is opened
  useEffect(() => {
    if (isOpen) {
      setReceiptNumber("");
      setReceivedAt(getLocalDateTimeValue());
      setSupplierId(initialSupplierId || "");
      setNotes("");

      const resolvedItems: GoodsReceiptItemRow[] = (initialItems || []).map((item) => {
        const matchingProduct = products.find((p) => p.id === item.productId);
        const resolvedListedPrice =
          item.listedPrice && item.listedPrice > 0
            ? item.listedPrice
            : matchingProduct?.price || 0;
        return {
          ...item,
          listedPrice: resolvedListedPrice,
        };
      });

      setItems(resolvedItems);
      setFormErrors({});
      setProductSearch("");
      setIsProductDropdownOpen(false);
      setActiveProductIndex(-1);
      setIsSubmitting(false);
      setShowBelowCostModal(false);
    }
  }, [isOpen, initialSupplierId, initialItems, products]);

  // Lock scroll & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !showBelowCostModal && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, showBelowCostModal, isSubmitting]);

  // Click outside listener for product combobox
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

  // Filter products for dropdown
  const normalizedProductSearch = productSearch.trim().toLocaleLowerCase("vi");
  const filteredProducts = useMemo(() => {
    if (!normalizedProductSearch) return products.slice(0, 30);
    return products
      .filter((product) =>
        [product.name, product.sku].some((value) =>
          (value || "").toLocaleLowerCase("vi").includes(normalizedProductSearch)
        )
      )
      .slice(0, 30);
  }, [normalizedProductSearch, products]);

  // Calculate totals
  const totalItemsCount = items.length;
  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [items]
  );
  const totalAmount = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (Number(item.quantity) || 0) * (Number(item.purchasePrice) || 0),
        0
      ),
    [items]
  );

  // Detect items selling below cost (purchasePrice > 0 and purchasePrice > listedPrice)
  const belowCostItems = useMemo(
    () =>
      items.filter(
        (item) =>
          Number(item.purchasePrice) > 0 &&
          Number(item.purchasePrice) > Number(item.listedPrice || 0)
      ),
    [items]
  );

  if (!isOpen) return null;

  // Handle adding product from combobox
  const handleSelectProduct = (product: IProduct) => {
    const existingIndex = items.findIndex((item) => item.productId === product.id);
    if (existingIndex >= 0) {
      // Product already in list: increment quantity
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const defaultPrice = 0;
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          unit: product.unit || "Cái",
          currentStock: product.stockQuantity || 0,
          listedPrice: product.price || 0,
          quantity: 1,
          purchasePrice: defaultPrice,
          purchasePriceDisplay: defaultPrice > 0 ? formatNumber(defaultPrice) : "0",
        },
      ]);
    }
    setFormErrors((prev) => ({ ...prev, items: undefined }));
    setProductSearch("");
    setIsProductDropdownOpen(false);
    setActiveProductIndex(-1);
    productSearchInputRef.current?.focus();
  };

  // Item row modifications
  const handleQuantityChange = (index: number, newQty: number) => {
    const validQty = Math.max(1, Math.floor(newQty || 1));
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, quantity: validQty } : item
      )
    );
  };

  const handlePriceChange = (index: number, rawInput: string) => {
    const numericStr = rawInput.replace(/\D/g, "");
    const numericVal = numericStr ? Number(numericStr) : 0;
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              purchasePrice: numericVal,
              purchasePriceDisplay: numericStr ? formatNumber(numericVal) : "0",
            }
          : item
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: {
      receiptNumber?: string;
      receivedAt?: string;
      items?: string;
      notes?: string;
    } = {};

    if (receiptNumber.trim().length > 50) {
      errors.receiptNumber = "Mã phiếu không được vượt quá 50 ký tự";
    }

    if (!receivedAt) {
      errors.receivedAt = "Vui lòng chọn ngày nhập kho";
    } else if (new Date(receivedAt).getTime() > Date.now() + 120_000) {
      errors.receivedAt = "Ngày nhập kho không được là ngày trong tương lai";
    }

    if (items.length === 0) {
      errors.items = "Phiếu nhập kho phải chứa ít nhất một mặt hàng";
    } else {
      for (const item of items) {
        if (!item.quantity || item.quantity < 1) {
          errors.items = `Số lượng của hàng "${item.productName}" phải lớn hơn 0`;
          break;
        }
        if (item.purchasePrice < 0) {
          errors.items = `Đơn giá của hàng "${item.productName}" không được âm`;
          break;
        }
      }
    }

    if (notes.trim().length > 500) {
      errors.notes = "Ghi chú không được vượt quá 500 ký tự";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const executeSubmit = async (confirmSellingBelowCost: boolean) => {
    const payload: ICreateGoodsReceiptPayload = {
      supplierId: supplierId || undefined,
      receiptNumber: receiptNumber.trim() || undefined,
      receivedAt: receivedAt ? receivedAt + ":00" : undefined,
      notes: notes.trim() || undefined,
      confirmSellingBelowCost,
      details: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
      })),
    };

    setIsSubmitting(true);
    try {
      await onSave(payload);
      setShowBelowCostModal(false);
      onClose();
    } catch {
      // Error is caught & alerted by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Check if there are items selling below cost (TC-02) -> Show confirmation modal
    if (belowCostItems.length > 0) {
      setShowBelowCostModal(true);
      return;
    }

    await executeSubmit(false);
  };

  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="goods-receipt-modal-title"
        onMouseDown={(event) =>
          event.target === event.currentTarget &&
          !isSubmitting &&
          !showBelowCostModal &&
          onClose()
        }
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-backdrop-fade-in"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto flex flex-col max-h-[92vh] animate-modal-bounce-in">
          {/* Header */}
          <div className="bg-kv-blue-primary text-white px-6 py-3.5 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white/10 text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </span>
              <div>
                <h2 id="goods-receipt-modal-title" className="text-sm font-bold uppercase tracking-wider">
                  Lập phiếu nhập kho từ nhà cung cấp
                </h2>
                <p className="text-[11px] text-blue-100 font-normal">
                  Cộng tồn kho & tự động tính lại giá vốn bình quân
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Đóng modal lập phiếu nhập kho"
              className="text-white/80 hover:text-white disabled:opacity-50 transition-colors p-1 rounded-lg hover:bg-blue-600"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5 text-xs text-slate-700 font-semibold">
            {/* Section 1: General Info */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Supplier Selection */}
              <div className="flex flex-col gap-1.5 sm:col-span-1">
                <label htmlFor="receipt-supplier" className="flex items-center gap-1 font-bold text-slate-800">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Nhà cung cấp
                </label>
                <select
                  id="receipt-supplier"
                  disabled={isSubmitting}
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="border border-slate-300 h-9 px-3 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary font-normal"
                >
                  <option value="">-- Nhập lẻ / Không chọn NCC --</option>
                  {suppliers.map((sup) => (
                    <option
                      key={sup.id}
                      value={sup.id}
                      disabled={sup.status === "INACTIVE"}
                    >
                      {sup.name} ({sup.phoneNumber || "Chưa có SĐT"})
                      {sup.status === "INACTIVE" ? " - [Ngừng hoạt động]" : ""}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 font-normal">
                  {supplierId ? "Tự động ghi nhận công nợ NCC" : "Nhập lẻ không tính vào công nợ NCC"}
                </span>
              </div>

              {/* Receipt Number */}
              <div className="flex flex-col gap-1.5 sm:col-span-1">
                <label htmlFor="receipt-number-input" className="font-bold text-slate-800">
                  Mã phiếu nhập
                </label>
                <input
                  id="receipt-number-input"
                  type="text"
                  maxLength={50}
                  disabled={isSubmitting}
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Để trống để hệ thống tự sinh"
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary font-normal uppercase"
                />
                {formErrors.receiptNumber ? (
                  <span className="text-[10px] text-rose-500 font-normal">{formErrors.receiptNumber}</span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">Mã tự sinh dạng NK-XXXX</span>
                )}
              </div>

              {/* Received At */}
              <div className="flex flex-col gap-1.5 sm:col-span-1">
                <label htmlFor="received-at-input" className="flex items-center gap-1 font-bold text-slate-800">
                  Ngày nhập kho <span className="text-rose-500">*</span>
                </label>
                <input
                  id="received-at-input"
                  type="datetime-local"
                  max={getLocalDateTimeValue()}
                  disabled={isSubmitting}
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary font-normal"
                />
                {formErrors.receivedAt && (
                  <span className="text-[10px] text-rose-500 font-normal">{formErrors.receivedAt}</span>
                )}
              </div>
            </div>

            {/* Section 2: Product Search & Add to Receipt */}
            <div ref={productComboboxRef} className="relative flex flex-col gap-1.5">
              <label htmlFor="receipt-product-search" className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-kv-blue-primary">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Thêm hàng hóa vào phiếu nhập <span className="text-rose-500">*</span>
              </label>

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
                    setIsProductDropdownOpen(true);
                    setActiveProductIndex(-1);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setIsProductDropdownOpen(true);
                      setActiveProductIndex((current) =>
                        Math.min(current + 1, filteredProducts.length - 1)
                      );
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveProductIndex((current) => Math.max(current - 1, 0));
                    } else if (event.key === "Enter" && activeProductIndex >= 0) {
                      event.preventDefault();
                      if (filteredProducts[activeProductIndex]) {
                        handleSelectProduct(filteredProducts[activeProductIndex]);
                      }
                    } else if (event.key === "Escape") {
                      event.stopPropagation();
                      setIsProductDropdownOpen(false);
                    }
                  }}
                  placeholder="Gõ tên hàng hóa hoặc mã SKU để tìm kiếm và thêm vào phiếu..."
                  className="w-full border border-slate-300 h-10 pl-3.5 pr-20 rounded-xl focus:outline-none focus:border-kv-blue-primary font-normal shadow-sm text-xs"
                />

                {productSearch && !isSubmitting && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearch("");
                      setIsProductDropdownOpen(true);
                      productSearchInputRef.current?.focus();
                    }}
                    aria-label="Xóa từ khóa tìm kiếm"
                    className="absolute inset-y-0 right-8 px-2 flex items-center text-slate-400 hover:text-slate-700"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
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
                  className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
                >
                  ▾
                </button>
              </div>

              {/* Autocomplete Dropdown List */}
              {isProductDropdownOpen && (
                <div
                  id="receipt-product-options"
                  role="listbox"
                  className="absolute z-30 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl"
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => {
                      const isAdded = items.some((item) => item.productId === product.id);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          role="option"
                          aria-selected={activeProductIndex === index}
                          onMouseEnter={() => setActiveProductIndex(index)}
                          onClick={() => handleSelectProduct(product)}
                          className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors ${
                            activeProductIndex === index
                              ? "bg-blue-50/80 text-kv-blue-primary"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{product.name}</span>
                              {isAdded && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                                  Đã chọn
                                </span>
                              )}
                            </div>
                            <span className="block text-[11px] text-slate-400 font-normal">
                              Mã SKU: <span className="font-mono text-slate-600 font-bold">{product.sku}</span> · ĐVT: {product.unit || "Cái"} · Tồn: <span className="font-bold text-slate-700">{product.stockQuantity}</span>
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] text-slate-500 font-normal block">Giá bán</span>
                            <span className="font-bold text-slate-800">{formatCurrency(product.price || 0)}</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-6 text-center text-slate-400 font-normal">
                      Không tìm thấy hàng hóa nào phù hợp với &quot;{productSearch}&quot;
                    </div>
                  )}
                </div>
              )}

              {formErrors.items && (
                <span className="text-[11px] text-rose-500 font-normal flex items-center gap-1 mt-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {formErrors.items}
                </span>
              )}
            </div>

            {/* Section 3: Multi-item Table */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                  Danh sách hàng hóa nhập ({items.length} mặt hàng)
                </span>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-normal underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 min-w-[220px]">Tên hàng hóa & SKU</th>
                      <th className="p-3 text-center w-20">Tồn kho</th>
                      <th className="p-3 text-right w-28">Giá niêm yết</th>
                      <th className="p-3 text-center w-36">Số lượng nhập</th>
                      <th className="p-3 text-right w-36">Đơn giá nhập (đ)</th>
                      <th className="p-3 text-right w-32">Thành tiền</th>
                      <th className="p-3 w-12 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {items.length > 0 ? (
                      items.map((item, index) => {
                        const itemSubtotal = item.quantity * item.purchasePrice;
                        const isBelowCost =
                          Number(item.purchasePrice) > 0 &&
                          Number(item.purchasePrice) > Number(item.listedPrice || 0);

                        return (
                          <tr key={item.productId} className={`hover:bg-slate-50/60 transition-colors ${isBelowCost ? "bg-amber-50/40" : ""}`}>
                            {/* 1. STT */}
                            <td className="p-3 text-center font-bold text-slate-400">
                              {index + 1}
                            </td>

                            {/* 2. Tên hàng & SKU */}
                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">{item.productName}</span>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                  {item.productSku}
                                </span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">ĐVT: {item.unit}</span>
                                {isBelowCost && (
                                  <span
                                    title={`Đơn giá nhập (${formatCurrency(item.purchasePrice)}) cao hơn giá bán (${formatCurrency(item.listedPrice)})`}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300/80 inline-flex items-center whitespace-nowrap shrink-0"
                                  >
                                    Bán lỗ
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 3. Tồn kho */}
                            <td className="p-3 text-center font-semibold text-slate-600">
                              {item.currentStock}
                            </td>

                            {/* 4. Giá niêm yết */}
                            <td className="p-3 text-right font-normal text-slate-500">
                              {formatCurrency(item.listedPrice)}
                            </td>

                            {/* 5. Số lượng nhập */}
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  disabled={isSubmitting || item.quantity <= 1}
                                  onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                  className="w-7 h-7 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-600 font-bold"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  disabled={isSubmitting}
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                                  className="w-16 h-7 border border-slate-300 rounded-lg text-center font-bold focus:outline-none focus:border-kv-blue-primary"
                                />
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-600 font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* 6. Đơn giá nhập */}
                            <td className="p-3 text-right">
                              <input
                                type="text"
                                placeholder="0"
                                disabled={isSubmitting}
                                value={item.purchasePriceDisplay}
                                onChange={(e) => handlePriceChange(index, e.target.value)}
                                className={`w-full h-8 px-2.5 text-right border rounded-lg font-bold focus:outline-none ${
                                  isBelowCost
                                    ? "border-amber-400 bg-amber-50/50 text-amber-900 focus:border-amber-500"
                                    : "border-slate-300 focus:border-kv-blue-primary text-slate-800"
                                }`}
                              />
                            </td>

                            {/* 7. Thành tiền */}
                            <td className="p-3 text-right font-extrabold text-kv-blue-primary">
                              {formatCurrency(itemSubtotal)}
                            </td>

                            {/* 8. Xóa */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleRemoveItem(index)}
                                aria-label={`Xóa ${item.productName}`}
                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 font-normal">
                          <div className="flex flex-col items-center gap-2">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                              <line x1="8" y1="21" x2="16" y2="21" />
                              <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                            <span>Chưa có mặt hàng nào trong phiếu nhập.</span>
                            <span className="text-[11px] text-slate-400">
                              Vui lòng tìm kiếm và chọn hàng hóa ở ô phía trên.
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Notes & Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2 border-t border-slate-100">
              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="receipt-notes" className="font-bold text-slate-700">
                  Ghi chú phiếu nhập
                </label>
                <textarea
                  id="receipt-notes"
                  rows={3}
                  maxLength={500}
                  disabled={isSubmitting}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Nhập đại lý cấp 1, có hóa đơn VAT đầu vào..."
                  className="border border-slate-300 p-3 rounded-xl resize-none focus:outline-none focus:border-kv-blue-primary font-normal text-xs"
                />
                {formErrors.notes && (
                  <span className="text-[10px] text-rose-500 font-normal">{formErrors.notes}</span>
                )}
              </div>

              {/* Totals Card */}
              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-slate-600 font-semibold">
                  <span>Số lượng mặt hàng:</span>
                  <span className="font-bold text-slate-800">{totalItemsCount} mặt hàng</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 font-semibold">
                  <span>Tổng số lượng nhập:</span>
                  <span className="font-bold text-indigo-700">{totalQuantity}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200/60">
                  <span className="font-bold text-slate-800 text-sm">Tổng tiền phiếu nhập:</span>
                  <span className="font-extrabold text-rose-600 text-lg">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Below Cost Warning Banner (if any) */}
            {belowCostItems.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 animate-auth-fade-in">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 shrink-0 mt-0.5">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="text-xs">
                  <span className="font-bold block">
                    Cảnh báo giá nhập cao hơn giá niêm yết (TC-02)
                  </span>
                  <span className="text-[11px] font-normal text-amber-800 leading-relaxed block mt-0.5">
                    Có {belowCostItems.length} mặt hàng có đơn giá nhập cao hơn giá bán đang niêm yết. Hệ thống sẽ yêu cầu xác nhận trước khi lưu.
                  </span>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl border border-slate-300 font-bold hover:bg-slate-50 transition-colors text-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="h-10 px-6 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Đang lưu phiếu nhập...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Xác nhận nhập kho
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Selling Below Cost Confirmation Modal (TC-02) */}
      {showBelowCostModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-backdrop-fade-in"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 max-w-lg w-full overflow-hidden animate-modal-bounce-in">
            <div className="bg-amber-500 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Xác nhận cảnh báo bán lỗ
              </div>
              <button
                type="button"
                onClick={() => setShowBelowCostModal(false)}
                disabled={isSubmitting}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-amber-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs">
              <p className="text-slate-700 leading-relaxed font-medium">
                Hệ thống phát hiện có <span className="font-bold text-rose-600">{belowCostItems.length} mặt hàng</span> có <strong>đơn giá nhập cao hơn giá bán niêm yết</strong>. Việc này có thể dẫn tới bán lỗ khi giao dịch tại quầy:
              </p>

              {/* List of Below Cost Items */}
              <div className="max-h-48 overflow-y-auto border border-amber-200 rounded-xl bg-amber-50/50 divide-y divide-amber-100">
                {belowCostItems.map((item) => (
                  <div key={item.productId} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">{item.productName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">SKU: {item.productSku}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-rose-600 font-bold">
                        Nhập: {formatCurrency(item.purchasePrice)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Bán: {formatCurrency(item.listedPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-slate-600 text-[11px] font-normal leading-relaxed">
                Là Chủ hộ kinh doanh, bạn có đồng ý tiếp tục xác nhận lưu phiếu nhập này không?
              </p>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowBelowCostModal(false)}
                  className="h-9 px-4 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Kiểm tra lại giá
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => executeSubmit(true)}
                  className="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting ? "Đang lưu..." : "Xác nhận & Tiếp tục nhập"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};
