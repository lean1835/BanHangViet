import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Truck,
  Trash2,
  AlertCircle,
  Loader2,
  Search,
  Package,
  Plus,
  Minus,
} from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { formatNumber } from "@/utils/formatCurrency";
import type { ICreatePosTransferRequest } from "../types/IPosTransfer";
import {
  useGetActivePointsOfSaleQuery,
  useGetPosInventoriesQuery,
} from "@/modules/point_of_sale/services/pointOfSaleApi";
import type { IPosInventory } from "@/modules/point_of_sale/types/IPointOfSale";
import { useGetProductsQuery } from "@/modules/product/services/productApi";
import type { IProduct } from "@/modules/product/types/IProduct";

interface CreatePosTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ICreatePosTransferRequest) => Promise<void>;
  isLoading?: boolean;
}

export interface TransferItemRow {
  productId: string;
  productName: string;
  productSku: string;
  unit: string;
  quantity: number;
  maxStock: number;
}

interface AvailableTransferItem {
  productId: string;
  productName: string;
  productSku: string;
  unit: string;
  stockQuantity: number;
}

export const CreatePosTransferModal: React.FC<CreatePosTransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isLoading,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const [fromPosId, setFromPosId] = useState<string>("WAREHOUSE");
  const [toPosId, setToPosId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<TransferItemRow[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Search & Combobox State
  const [productSearch, setProductSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState(-1);

  const { data: posData } = useGetActivePointsOfSaleQuery(undefined, {
    skip: !isOpen,
  });

  const posList = useMemo(() => posData || [], [posData]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFromPosId("WAREHOUSE");
      setToPosId((prev) => (prev ? prev : posList.length > 0 ? posList[0].id : ""));
      setNotes("");
      setItems([]);
      setErrors({});
      setProductSearch("");
      setIsDropdownOpen(false);
      setActiveProductIndex(-1);
    }
  }, [isOpen, posList]);

  // Set default toPosId once posList is loaded
  useEffect(() => {
    if (isOpen && posList.length > 0 && !toPosId) {
      setToPosId(posList[0].id);
    }
  }, [isOpen, posList, toPosId]);

  // Load products list for Warehouse stock
  const { data: productsData, isLoading: isLoadingProducts } =
    useGetProductsQuery({ page: 0, size: 300 }, { skip: !isOpen });

  // Load inventories at sender POS if sender is not Warehouse
  const isFromWarehouse = !fromPosId || fromPosId === "WAREHOUSE";

  const { data: fromInventoryData, isLoading: isLoadingInventory } =
    useGetPosInventoriesQuery(
      { posId: fromPosId, params: { size: 300 } },
      { skip: isFromWarehouse || !isOpen }
    );

  // Unified available items depending on sender
  const availableItems: AvailableTransferItem[] = useMemo(() => {
    const productList: IProduct[] = productsData?.content || [];
    const availablePosInventories: IPosInventory[] = fromInventoryData?.content || [];

    if (isFromWarehouse) {
      return productList.map((p: IProduct) => ({
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        unit: p.unit || "Cái",
        stockQuantity:
          p.warehouseStock ??
          Math.max(0, (p.stockQuantity ?? 0) - (p.allocatedStock ?? 0)),
      }));
    } else {
      return availablePosInventories.map((pi: IPosInventory) => ({
        productId: pi.productId,
        productName: pi.productName || "",
        productSku: pi.productSku || "",
        unit: pi.unit || "Cái",
        stockQuantity: pi.stockQuantity ?? 0,
      }));
    }
  }, [isFromWarehouse, productsData?.content, fromInventoryData?.content]);

  // Map for fast stock lookups
  const productStockMap = useMemo(() => {
    const map = new Map<string, AvailableTransferItem>();
    availableItems.forEach((p) => {
      map.set(p.productId, p);
    });
    return map;
  }, [availableItems]);

  // Filter products for combobox search
  const normalizedSearch = productSearch.trim().toLocaleLowerCase("vi");
  const filteredProducts = useMemo(() => {
    if (!normalizedSearch) return availableItems.slice(0, 30);
    return availableItems
      .filter((item) =>
        [item.productName, item.productSku].some((val) =>
          (val || "").toLocaleLowerCase("vi").includes(normalizedSearch)
        )
      )
      .slice(0, 30);
  }, [availableItems, normalizedSearch]);

  // Close combobox when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!comboboxRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setActiveProductIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  if (!isOpen) return null;

  const handleSelectProduct = (product: AvailableTransferItem) => {
    // Không thêm vào danh sách nếu mặt hàng hết hàng
    if (product.stockQuantity <= 0) {
      return;
    }

    const existingIndex = items.findIndex((i) => i.productId === product.productId);

    if (existingIndex >= 0) {
      // Product already in list: increment quantity if within available stock
      setItems((prev) =>
        prev.map((item, idx) => {
          if (idx !== existingIndex) return item;
          const nextQty = Math.min(item.quantity + 1, product.stockQuantity);
          return { ...item, quantity: nextQty, maxStock: product.stockQuantity };
        })
      );
    } else {
      // Add new item with quantity 1
      setItems((prev) => [
        ...prev,
        {
          productId: product.productId,
          productName: product.productName,
          productSku: product.productSku,
          unit: product.unit,
          quantity: 1,
          maxStock: product.stockQuantity,
        },
      ]);
    }

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.items;
      return copy;
    });

    setProductSearch("");
    setIsDropdownOpen(false);
    setActiveProductIndex(-1);
    searchInputRef.current?.blur();
  };

  const handleQuantityChange = (index: number, rawQty: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const validQty = isNaN(rawQty) ? 0 : Math.max(0, Math.floor(rawQty));
        return { ...item, quantity: validQty };
      })
    );
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`item_${index}`];
      delete copy.items;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearAllItems = () => {
    setItems([]);
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (fromPosId === toPosId) {
      newErrors.toPosId = "Điểm gửi và điểm nhận không được trùng nhau";
    }

    if (items.length === 0) {
      newErrors.items = "Vui lòng chọn ít nhất 1 mặt hàng để chuyển";
    }

    items.forEach((item, idx) => {
      const currentStock = productStockMap.get(item.productId)?.stockQuantity ?? item.maxStock ?? 0;
      if (item.quantity <= 0) {
        newErrors[`item_${idx}`] = "Số lượng chuyển phải lớn hơn 0";
      } else if (item.quantity > currentStock) {
        newErrors[`item_${idx}`] = `Vượt quá tồn khả dụng (Hiện có: ${currentStock})`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    const payload: ICreatePosTransferRequest = {
      fromPointOfSaleId: isFromWarehouse ? null : fromPosId,
      toPointOfSaleId: toPosId === "WAREHOUSE" ? null : toPosId,
      notes: notes.trim() || undefined,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };

    await onSubmit(payload);
  };

  const isLoadingData = isFromWarehouse ? isLoadingProducts : isLoadingInventory;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-kv-blue-light text-kv-blue-primary">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Lập phiếu chuyển hàng giữa các điểm bán
              </h2>
              <p className="text-xs text-slate-500">
                Điều chuyển tồn kho từ Kho gốc hoặc giữa các chi nhánh điểm bán
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">
            {/* Sender & Receiver POS Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm gửi hàng (Kho xuất) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={fromPosId}
                  onChange={(e) => {
                    setFromPosId(e.target.value);
                    setItems([]);
                    setProductSearch("");
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:border-kv-blue-primary outline-none"
                  disabled={isLoading}
                >
                  <option value="WAREHOUSE">🏢 Kho gốc (Kho trung tâm)</option>
                  {posList.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      🏪 {pos.name} ({pos.posCode})
                    </option>
                  ))}
                </select>
                {errors.fromPosId && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.fromPosId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm nhận hàng (Kho nhập) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={toPosId}
                  onChange={(e) => setToPosId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:border-kv-blue-primary outline-none"
                  disabled={isLoading}
                >
                  {!isFromWarehouse && (
                    <option value="WAREHOUSE">🏢 Kho gốc (Thu hồi về kho trung tâm)</option>
                  )}
                  {posList
                    .filter((p) => p.id !== fromPosId)
                    .map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        🏪 {pos.name} ({pos.posCode})
                      </option>
                    ))}
                </select>
                {errors.toPosId && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.toPosId}</p>
                )}
              </div>
            </div>

            {/* Product Search & Combobox Section */}
            <div ref={comboboxRef} className="relative flex flex-col gap-1.5">
              <label
                htmlFor="transfer-product-search"
                className="flex items-center gap-1.5 font-bold text-slate-800 text-xs"
              >
                <Search className="w-3.5 h-3.5 text-kv-blue-primary" />
                Tìm kiếm & thêm hàng hóa vào phiếu chuyển <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <input
                  ref={searchInputRef}
                  id="transfer-product-search"
                  type="text"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isDropdownOpen}
                  aria-controls="transfer-product-options"
                  disabled={isLoading}
                  value={productSearch}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setIsDropdownOpen(true);
                    setActiveProductIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setIsDropdownOpen(true);
                      setActiveProductIndex((current) =>
                        Math.min(current + 1, filteredProducts.length - 1)
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveProductIndex((current) => Math.max(current - 1, 0));
                    } else if (e.key === "Enter" && activeProductIndex >= 0) {
                      e.preventDefault();
                      const selected = filteredProducts[activeProductIndex];
                      if (selected && selected.stockQuantity > 0) {
                        handleSelectProduct(selected);
                      }
                    } else if (e.key === "Escape") {
                      e.stopPropagation();
                      setIsDropdownOpen(false);
                    }
                  }}
                  placeholder="Gõ tên hàng hóa hoặc mã SKU để tìm kiếm và thêm vào phiếu..."
                  className="w-full border border-slate-300 h-10 pl-3.5 pr-20 rounded-xl focus:outline-none focus:border-kv-blue-primary font-normal shadow-xs text-xs"
                />

                {productSearch && !isLoading && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearch("");
                      setIsDropdownOpen(true);
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Xóa từ khóa tìm kiếm"
                    className="absolute inset-y-0 right-8 px-2 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  disabled={isLoading}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setIsDropdownOpen((current) => !current);
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Mở danh sách hàng hóa"
                  className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ▾
                </button>
              </div>

              {/* Autocomplete Dropdown List */}
              {isDropdownOpen && (
                <div
                  id="transfer-product-options"
                  role="listbox"
                  className="absolute z-30 top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl animate-fade-in"
                >
                  {isLoadingData ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                      Đang tải danh sách tồn kho điểm gửi...
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => {
                      const selectedItem = items.find(
                        (item) => item.productId === product.productId
                      );
                      const isOutOfStock = product.stockQuantity <= 0;

                      return (
                        <button
                          key={product.productId}
                          type="button"
                          role="option"
                          disabled={isOutOfStock}
                          aria-disabled={isOutOfStock}
                          title={
                            isOutOfStock
                              ? "Mặt hàng này hiện đã hết hàng tại điểm gửi"
                              : undefined
                          }
                          aria-selected={activeProductIndex === index}
                          onMouseEnter={() => !isOutOfStock && setActiveProductIndex(index)}
                          onClick={() => handleSelectProduct(product)}
                          className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors ${
                            isOutOfStock
                              ? "opacity-50 bg-slate-50/80 cursor-not-allowed text-slate-400"
                              : activeProductIndex === index
                              ? "bg-blue-50/80 text-kv-blue-primary cursor-pointer"
                              : "hover:bg-slate-50 text-slate-700 cursor-pointer"
                          }`}
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-bold text-xs truncate ${
                                  isOutOfStock ? "text-slate-500" : "text-slate-900"
                                }`}
                              >
                                {product.productName}
                              </span>
                              {selectedItem && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                                  Đã chọn (SL: {selectedItem.quantity})
                                </span>
                              )}
                              {isOutOfStock && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-600 border border-rose-200/60 font-bold">
                                  Hết hàng
                                </span>
                              )}
                            </div>
                            <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                              Mã SKU:{" "}
                              <span className="font-mono font-bold text-slate-700">
                                {product.productSku}
                              </span>{" "}
                              · ĐVT: {product.unit}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 block font-normal">
                              Tồn khả dụng
                            </span>
                            <span
                              className={`text-xs font-black ${
                                isOutOfStock ? "text-rose-500" : "text-emerald-700"
                              }`}
                            >
                              {formatNumber(product.stockQuantity)} {product.unit}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-6 text-center text-xs text-slate-400 font-normal">
                      Không tìm thấy mặt hàng nào phù hợp với &quot;{productSearch}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transfer Items Table Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Danh sách mặt hàng chuyển ({items.length})
                </h3>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllItems}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {errors.items && (
                <p className="text-xs text-rose-500 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errors.items}
                </p>
              )}

              {isLoadingData ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-slate-200/60">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-kv-blue-primary" />
                  Đang tải dữ liệu tồn kho điểm gửi...
                </div>
              ) : items.length === 0 ? (
                <div className="p-6 bg-slate-50/70 border border-dashed border-slate-300 rounded-2xl text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Package className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Chưa có mặt hàng nào trong phiếu chuyển
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sử dụng thanh tìm kiếm phía trên để chọn mặt hàng cần điều chuyển
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3 min-w-[200px]">Mặt hàng & SKU</th>
                        <th className="p-3 text-center w-20">ĐVT</th>
                        <th className="p-3 text-center w-28">Tồn kho gửi</th>
                        <th className="p-3 text-center w-36">Số lượng chuyển</th>
                        <th className="p-3 w-12 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {items.map((item, idx) => {
                        const currentStock =
                          productStockMap.get(item.productId)?.stockQuantity ??
                          item.maxStock ??
                          0;
                        const errorMsg = errors[`item_${idx}`];
                        const isOverStock = item.quantity > currentStock;

                        return (
                          <tr
                            key={item.productId}
                            className={`hover:bg-slate-50/60 transition-colors ${
                              isOverStock || errorMsg ? "bg-rose-50/30" : ""
                            }`}
                          >
                            {/* STT */}
                            <td className="p-3 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>

                            {/* Product & SKU */}
                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">
                                {item.productName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                                  {item.productSku}
                                </span>
                              </div>
                              {errorMsg && (
                                <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 shrink-0" /> {errorMsg}
                                </p>
                              )}
                            </td>

                            {/* Unit */}
                            <td className="p-3 text-center text-slate-600 font-normal">
                              {item.unit}
                            </td>

                            {/* Available Stock */}
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  currentStock <= 0
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {formatNumber(currentStock)}
                              </span>
                            </td>

                            {/* Transfer Quantity Stepper */}
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  disabled={isLoading || item.quantity <= 1}
                                  onClick={() =>
                                    handleQuantityChange(idx, item.quantity - 1)
                                  }
                                  className="w-7 h-7 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors"
                                  title="Giảm số lượng"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={currentStock}
                                  step="1"
                                  disabled={isLoading}
                                  value={item.quantity === 0 ? "" : item.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      idx,
                                      parseInt(e.target.value, 10) || 0
                                    )
                                  }
                                  className={`w-16 h-7 border rounded-lg text-center font-bold focus:outline-none focus:border-kv-blue-primary ${
                                    isOverStock
                                      ? "border-rose-400 text-rose-600 bg-rose-50/50"
                                      : "border-slate-300 text-slate-800"
                                  }`}
                                />
                                <button
                                  type="button"
                                  disabled={isLoading || item.quantity >= currentStock}
                                  onClick={() =>
                                    handleQuantityChange(idx, item.quantity + 1)
                                  }
                                  className="w-7 h-7 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors"
                                  title="Tăng số lượng"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Remove Action */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                title="Xóa mặt hàng"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú điều chuyển
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Điều hàng sang chi nhánh 2 để chuẩn bị đợt khuyến mãi cuối tuần..."
                rows={2}
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:border-kv-blue-primary outline-none transition-all resize-none"
              />
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed">
              <strong>Quy tắc tồn kho:</strong> Ngay khi lập phiếu, hệ thống sẽ tự động trừ tồn kho tại điểm gửi (hoặc giữ chỗ tồn khả dụng tại Kho gốc). Hàng sẽ ở trạng thái <em>Đang chuyển</em> và chỉ cộng vào tồn kho điểm nhận khi người nhận xác nhận đủ hàng.
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
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
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-xl shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Lập phiếu chuyển hàng
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
