import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatNumber } from "@/utils/formatCurrency";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { ICreateInventoryAuditPayload } from "../types/IInventoryAudit";
import { useCheckPendingOrdersQuery } from "../services/inventoryAuditApi";
import {
  INVENTORY_AUDIT_MODAL_COPY,
  INVENTORY_AUDIT_VALIDATION,
} from "@/constants/inventoryAudit";

export interface InventoryAuditItemRow {
  productId: string;
  productSku: string;
  productName: string;
  unit: string;
  systemQuantity: number;
  actualQuantity: number;
  actualQuantityDisplay: string;
  differenceQuantity: number;
  reason: string;
  reasonError?: string;
}

interface InventoryAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ICreateInventoryAuditPayload) => Promise<void> | void;
  products: IProduct[];
}

export const InventoryAuditModal: React.FC<InventoryAuditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  products,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Pending orders query
  const { data: pendingOrderData, refetch: refetchPendingOrders } =
    useCheckPendingOrdersQuery(undefined, { skip: !isOpen });

  // State
  const [items, setItems] = useState<InventoryAuditItemRow[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Search & Combobox State
  const [productSearch, setProductSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(-1);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setItems([]);
      setNotes("");
      setGeneralError(null);
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setProductSearch("");
      setIsDropdownOpen(false);
      setActiveItemIndex(-1);
      refetchPendingOrders();
    }
  }, [isOpen, refetchPendingOrders]);

  // Lock scroll & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !showConfirmModal && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, showConfirmModal, isSubmitting]);

  // Close combobox when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter available products for combobox
  const existingProductIds = useMemo(
    () => new Set(items.map((i) => i.productId)),
    [items]
  );

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (existingProductIds.has(p.id)) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
      );
    });
  }, [products, productSearch, existingProductIds]);

  const handleAddProduct = (product: IProduct) => {
    const systemQty = product.stockQuantity ?? 0;
    const initialActualQty = Math.max(0, systemQty);
    const diffQty = initialActualQty - systemQty;
    const newItem: InventoryAuditItemRow = {
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      unit: product.unit || "Cái",
      systemQuantity: systemQty,
      actualQuantity: initialActualQty,
      actualQuantityDisplay: String(initialActualQty),
      differenceQuantity: diffQty,
      reason: "",
      reasonError:
        diffQty !== 0
          ? INVENTORY_AUDIT_VALIDATION.REASON_REQUIRED_WHEN_DIFF
          : undefined,
    };

    setItems((prev) => [...prev, newItem]);
    setProductSearch("");
    setIsDropdownOpen(false);
    setActiveItemIndex(-1);
    setGeneralError(null);
  };

  const handleAddAllActiveProducts = () => {
    const newItems: InventoryAuditItemRow[] = products
      .filter((p) => !existingProductIds.has(p.id))
      .map((p) => {
        const sysQty = p.stockQuantity ?? 0;
        const initialActualQty = Math.max(0, sysQty);
        const diffQty = initialActualQty - sysQty;
        return {
          productId: p.id,
          productSku: p.sku,
          productName: p.name,
          unit: p.unit || "Cái",
          systemQuantity: sysQty,
          actualQuantity: initialActualQty,
          actualQuantityDisplay: String(initialActualQty),
          differenceQuantity: diffQty,
          reason: "",
          reasonError:
            diffQty !== 0
              ? INVENTORY_AUDIT_VALIDATION.REASON_REQUIRED_WHEN_DIFF
              : undefined,
        };
      });

    setItems((prev) => [...prev, ...newItems]);
    setGeneralError(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const handleActualQtyChange = (index: number, valueStr: string) => {
    // Clean non-numeric except dot/comma
    const cleanStr = valueStr.replace(/[^0-9.]/g, "");
    const parsed = cleanStr === "" ? 0 : parseFloat(cleanStr);
    const actualQty = isNaN(parsed) ? 0 : Math.max(0, parsed);

    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const diff = actualQty - item.systemQuantity;
        // If difference becomes 0, clear reason error
        const reasonErr =
          diff !== 0 && (!item.reason || item.reason.trim() === "")
            ? item.reasonError
            : undefined;

        return {
          ...item,
          actualQuantity: actualQty,
          actualQuantityDisplay: cleanStr,
          differenceQuantity: diff,
          reasonError: reasonErr,
        };
      })
    );
  };

  const handleReasonChange = (index: number, reasonValue: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const reasonErr =
          item.differenceQuantity !== 0 && reasonValue.trim() === ""
            ? INVENTORY_AUDIT_VALIDATION.REASON_REQUIRED_WHEN_DIFF
            : undefined;

        return {
          ...item,
          reason: reasonValue,
          reasonError: reasonErr,
        };
      })
    );
  };

  // Aggregated calculations
  const totalItems = items.length;
  const matchedItems = items.filter((i) => i.differenceQuantity === 0).length;
  const discrepancyItems = items.filter((i) => i.differenceQuantity !== 0).length;
  const totalIncrease = items
    .filter((i) => i.differenceQuantity > 0)
    .reduce((sum, i) => sum + i.differenceQuantity, 0);
  const totalDecrease = items
    .filter((i) => i.differenceQuantity < 0)
    .reduce((sum, i) => sum + Math.abs(i.differenceQuantity), 0);

  const validateForm = (): boolean => {
    if (items.length === 0) {
      setGeneralError(INVENTORY_AUDIT_VALIDATION.EMPTY_DETAILS);
      return false;
    }

    let hasInvalidQty = false;
    let hasReasonError = false;
    const updatedItems = items.map((item) => {
      if (item.actualQuantity < 0 || isNaN(item.actualQuantity)) {
        hasInvalidQty = true;
      }
      if (
        item.differenceQuantity !== 0 &&
        (!item.reason || item.reason.trim() === "")
      ) {
        hasReasonError = true;
        return {
          ...item,
          reasonError: INVENTORY_AUDIT_VALIDATION.REASON_REQUIRED_WHEN_DIFF,
        };
      }
      return { ...item, reasonError: undefined };
    });

    setItems(updatedItems);

    if (hasInvalidQty) {
      setGeneralError(INVENTORY_AUDIT_VALIDATION.INVALID_ACTUAL_QTY);
      return false;
    }

    if (hasReasonError) {
      setGeneralError(INVENTORY_AUDIT_VALIDATION.REASON_REQUIRED_WHEN_DIFF);
      return false;
    }

    setGeneralError(null);
    return true;
  };

  const handleOpenConfirm = () => {
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const payload: ICreateInventoryAuditPayload = {
        notes: notes.trim() || undefined,
        details: items.map((item) => ({
          productId: item.productId,
          actualQuantity: item.actualQuantity,
          reason: item.differenceQuantity !== 0 ? item.reason.trim() : undefined,
        })),
      };

      await onSave(payload);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-audit-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !showConfirmModal && !isSubmitting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden my-auto flex flex-col h-[94vh] max-h-[94vh] focus:outline-none animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-kv-blue-primary/20 text-kv-blue-light border border-kv-blue-primary/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <path d="m9 14 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 id="inventory-audit-modal-title" className="text-sm sm:text-base font-bold">
                {INVENTORY_AUDIT_MODAL_COPY.TITLE}
              </h2>
              <p className="text-xs text-slate-400">
                {INVENTORY_AUDIT_MODAL_COPY.SUBTITLE}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng cửa sổ"
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-4">
          {/* Pending Orders Warning Banner */}
          {pendingOrderData?.hasPendingOrders && (
            <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 text-amber-900 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 text-xs">
                  <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                    Cảnh báo đơn bán hàng đang tạo dang dở ({pendingOrderData.pendingOrderCount} đơn)
                  </h4>
                  <p className="mt-1 text-amber-900 leading-relaxed">
                    Cửa hàng hiện có các đơn bán hàng chưa hoàn tất thanh toán:{" "}
                    <strong>{pendingOrderData.pendingOrderNumbers.join(", ")}</strong>.
                    Việc kiểm kê trong lúc có đơn tạo dang dở có thể làm sai lệch số lượng đếm thực tế với số tồn ghi nhận trên máy!
                  </p>
                  <p className="mt-1 text-amber-800 font-medium italic">
                    Khuyến nghị: Vui lòng chốt thanh toán hoặc hủy các đơn trên tại màn hình Bán hàng (POS) trước khi chốt kiểm kê.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* General Error Banner */}
          {generalError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span>{generalError}</span>
            </div>
          )}

          {/* Action & Combobox Bar */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Product Combobox */}
              <div ref={comboboxRef} className="relative flex-1 min-w-[260px]">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-sm">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={INVENTORY_AUDIT_MODAL_COPY.SEARCH_PRODUCT_PLACEHOLDER}
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsDropdownOpen(true);
                      setActiveItemIndex(-1);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-kv-blue-primary focus:outline-none transition-colors"
                  />
                </div>

                {/* Combobox Dropdown Results */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto p-1.5 divide-y divide-slate-100">
                    {filteredProducts.length === 0 ? (
                      <div className="py-4 text-center text-slate-400 text-xs">
                        {productSearch.trim()
                          ? "Không tìm thấy mặt hàng phù hợp hoặc đã thêm vào danh sách"
                          : "Tất cả sản phẩm đã được thêm vào danh sách kiểm kê"}
                      </div>
                    ) : (
                      filteredProducts.slice(0, 50).map((prod, idx) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleAddProduct(prod)}
                          onMouseEnter={() => setActiveItemIndex(idx)}
                          className={`w-full text-left p-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                            activeItemIndex === idx
                              ? "bg-kv-blue-light/50 text-kv-blue-primary"
                              : "hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div>
                            <div className="font-bold">{prod.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              SKU: {prod.sku} | ĐVT: {prod.unit || "Cái"}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400">Tồn máy: </span>
                            <span className="font-bold text-slate-700">{formatNumber(prod.stockQuantity)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAddAllActiveProducts}
                  disabled={products.length === 0 || existingProductIds.size === products.length}
                  className="h-10 px-3.5 rounded-lg border border-kv-blue-primary/40 bg-kv-blue-light/30 hover:bg-kv-blue-light text-kv-blue-primary font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {INVENTORY_AUDIT_MODAL_COPY.ADD_ALL_PRODUCTS}
                </button>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="h-10 px-3 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs transition-colors"
                  >
                    {INVENTORY_AUDIT_MODAL_COPY.CLEAR_ALL_ITEMS}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Items Audit Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-center">
                    <th className="py-2.5 px-2 w-12 text-center">STT</th>
                    <th className="py-2.5 px-3 w-28 text-left">Mã SKU</th>
                    <th className="py-2.5 px-3 min-w-[180px] text-left">Tên hàng hóa</th>
                    <th className="py-2.5 px-2 w-16 text-center">ĐVT</th>
                    <th className="py-2.5 px-3 w-24 text-right">Tồn máy</th>
                    <th className="py-2.5 px-3 w-32 text-right">Thực tế đếm*</th>
                    <th className="py-2.5 px-3 w-24 text-right">Chênh lệch</th>
                    <th className="py-2.5 px-3 min-w-[220px] text-left">
                      Lý do điều chỉnh*
                    </th>
                    <th className="py-2.5 px-2 w-12 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <span className="font-semibold text-xs text-slate-600">Chưa có sản phẩm nào trong danh sách kiểm kê</span>
                          <span className="text-[11px] text-slate-400">
                            Tìm kiếm sản phẩm hoặc bấm &quot;Thêm tất cả sản phẩm đang bán&quot; ở trên để bắt đầu đếm kho.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const hasDiff = item.differenceQuantity !== 0;
                      const isIncrease = item.differenceQuantity > 0;
                      const hasReasonErr = Boolean(item.reasonError);

                      return (
                        <tr
                          key={item.productId}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            hasDiff ? (isIncrease ? "bg-emerald-50/20" : "bg-rose-50/20") : ""
                          }`}
                        >
                          <td className="py-2.5 px-2 text-center text-slate-500 font-medium">
                            {index + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 font-semibold">
                            {item.productSku}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {item.productName}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                            {item.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-600">
                            {formatNumber(item.systemQuantity)}
                          </td>
                          {/* Actual Quantity Input */}
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="text"
                              value={item.actualQuantityDisplay}
                              onChange={(e) => handleActualQtyChange(index, e.target.value)}
                              className="w-28 h-8 px-2 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-kv-blue-primary focus:outline-none"
                            />
                          </td>
                          {/* Difference Badge */}
                          <td className="py-2.5 px-3 text-right font-bold">
                            {item.differenceQuantity === 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500">
                                0
                              </span>
                            ) : isIncrease ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                +{formatNumber(item.differenceQuantity)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                                {formatNumber(item.differenceQuantity)}
                              </span>
                            )}
                          </td>
                          {/* Reason Input with validation error */}
                          <td className="py-1.5 px-2">
                            <div className="space-y-1">
                              <input
                                type="text"
                                placeholder={
                                  hasDiff
                                    ? INVENTORY_AUDIT_MODAL_COPY.REASON_PLACEHOLDER
                                    : "Không lệch (không cần lý do)"
                                }
                                disabled={!hasDiff}
                                value={item.reason}
                                onChange={(e) => handleReasonChange(index, e.target.value)}
                                className={`w-full h-8 px-2.5 text-xs rounded-lg border transition-colors ${
                                  !hasDiff
                                    ? "bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed"
                                    : hasReasonErr
                                    ? "bg-rose-50 border-rose-400 text-rose-900 focus:border-rose-600 focus:outline-none"
                                    : "bg-white border-amber-300 text-slate-900 focus:border-kv-blue-primary focus:outline-none"
                                }`}
                              />
                              {hasReasonErr && (
                                <p className="text-[10px] text-rose-600 font-semibold">
                                  {item.reasonError}
                                </p>
                              )}
                            </div>
                          </td>
                          {/* Delete Item */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                              title="Xóa mặt hàng khỏi phiếu"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Summary Footer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Notes */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1.5">
              <label className="font-bold text-xs text-slate-700">
                {INVENTORY_AUDIT_MODAL_COPY.NOTES_LABEL}
              </label>
              <textarea
                rows={3}
                placeholder={INVENTORY_AUDIT_MODAL_COPY.NOTES_PLACEHOLDER}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-kv-blue-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Audit Summary Box */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="font-bold text-xs text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                {INVENTORY_AUDIT_MODAL_COPY.SUMMARY_LABEL}
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-500">{INVENTORY_AUDIT_MODAL_COPY.TOTAL_ITEMS_LABEL}</span>
                  <span className="font-bold text-slate-900">{totalItems} mặt hàng</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-500">{INVENTORY_AUDIT_MODAL_COPY.MATCHED_ITEMS_LABEL}</span>
                  <span className="font-bold text-slate-700">{matchedItems}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-amber-50/70 text-amber-900">
                  <span className="text-amber-700">{INVENTORY_AUDIT_MODAL_COPY.DISCREPANCY_ITEMS_LABEL}</span>
                  <span className="font-bold">{discrepancyItems}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-500">Chênh lệch ròng:</span>
                  <span className={`font-bold ${
                    totalIncrease - totalDecrease > 0
                      ? "text-emerald-700"
                      : totalIncrease - totalDecrease < 0
                      ? "text-rose-700"
                      : "text-slate-700"
                  }`}>
                    {totalIncrease - totalDecrease > 0 ? `+${formatNumber(totalIncrease - totalDecrease)}` : formatNumber(totalIncrease - totalDecrease)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="text-xs text-slate-500 italic">
            * Nhấn &quot;Xác nhận &amp; Cập nhật tồn kho&quot; để chốt số liệu và lưu vết kiểm toán.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors text-xs disabled:opacity-50"
            >
              {INVENTORY_AUDIT_MODAL_COPY.CANCEL_ACTION}
            </button>
            <button
              type="button"
              onClick={handleOpenConfirm}
              disabled={items.length === 0 || isSubmitting}
              className="h-10 px-6 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {INVENTORY_AUDIT_MODAL_COPY.SUBMITTING_ACTION}
                </>
              ) : (
                INVENTORY_AUDIT_MODAL_COPY.SUBMIT_ACTION
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Sub-Modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4 animate-backdrop-fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-modal-bounce-in">
            <div className="flex items-center gap-3 text-amber-600">
              <h3 className="font-bold text-slate-900 text-base">
                {INVENTORY_AUDIT_MODAL_COPY.CONFIRM_MODAL_TITLE}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {INVENTORY_AUDIT_MODAL_COPY.CONFIRM_MODAL_DESC}
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div>Tổng mặt hàng: <strong>{totalItems}</strong></div>
              <div>Số mặt hàng lệch tồn: <strong>{discrepancyItems}</strong></div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="h-9 px-4 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="h-9 px-5 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs"
              >
                Đồng ý cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default InventoryAuditModal;
