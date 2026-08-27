import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Loader2, Search, Check } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { IPointOfSale, IInitPosInventoryItemRequest } from "../types/IPointOfSale";
import { useGetProductsQuery } from "@/modules/product/services/productApi";

interface InitPosInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: IInitPosInventoryItemRequest[]) => Promise<void>;
  pointOfSale?: IPointOfSale | null;
  isLoading?: boolean;
}

export const InitPosInventoryModal: React.FC<InitPosInventoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  pointOfSale,
  isLoading = false,
}) => {
  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isLoading,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [quantities, setQuantities] = useState<Record<string, { stock: number; min: number }>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: productsData, isLoading: isLoadingProducts } = useGetProductsQuery(
    { page: 0, size: 200 },
    { skip: !isOpen }
  );

  const productList = productsData?.content || [];

  const filteredProducts = productList.filter((p) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.groupName?.toLowerCase().includes(query)
    );
  });

  if (!isOpen || !pointOfSale) return null;

  const getAvailableStock = (prod?: (typeof productList)[0]) => {
    if (!prod) return 0;
    const total = prod.stockQuantity ?? 0;
    const allocated =
      prod.allocatedStock ??
      (prod.posStocks || []).reduce((sum, ps) => sum + (ps.stockQuantity || 0), 0);
    return prod.warehouseStock !== undefined
      ? prod.warehouseStock
      : Math.max(0, total - allocated);
  };

  const handleToggleSelect = (productId: string) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        return prev.filter((id) => id !== productId);
      } else {
        const prod = productList.find((p) => p.id === productId);
        const available = getAvailableStock(prod);
        const defaultQty = Math.min(10, available);

        if (!quantities[productId]) {
          setQuantities((q) => ({ ...q, [productId]: { stock: defaultQty, min: 2 } }));
        }
        return [...prev, productId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      const allIds = filteredProducts.map((p) => p.id);
      setSelectedIds(allIds);
      const newQuantities = { ...quantities };
      filteredProducts.forEach((p) => {
        if (!newQuantities[p.id]) {
          const available = getAvailableStock(p);
          newQuantities[p.id] = { stock: Math.min(10, available), min: 2 };
        }
      });
      setQuantities(newQuantities);
    }
  };

  const handleStockChange = (productId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: {
        stock: val,
        min: prev[productId]?.min ?? 2,
      },
    }));
  };

  const handleMinChange = (productId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: {
        stock: prev[productId]?.stock ?? 0,
        min: val,
      },
    }));
  };

  // Check if any selected item exceeds available stock
  const hasInvalidStock = selectedIds.some((id) => {
    const prod = productList.find((p) => p.id === id);
    if (!prod) return false;
    const available = getAvailableStock(prod);
    const requested = quantities[id]?.stock ?? 0;
    return requested > available || requested < 0;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || isLoading || hasInvalidStock) return;

    const items: IInitPosInventoryItemRequest[] = selectedIds.map((id) => ({
      productId: id,
      stockQuantity: quantities[id]?.stock ?? 0,
      minStockQuantity: quantities[id]?.min ?? 0,
    }));

    await onSubmit(items);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Khởi tạo tồn kho ban đầu cho điểm bán
              </h2>
              <p className="text-xs text-slate-500">
                Điểm bán: <strong className="text-slate-700">{pointOfSale.name}</strong> ({pointOfSale.posCode})
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm mặt hàng để gán tồn kho..."
                  className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-2 text-xs font-bold text-kv-blue-primary hover:bg-blue-50 border border-blue-200 rounded-xl transition-all shrink-0"
              >
                {selectedIds.length === filteredProducts.length && filteredProducts.length > 0
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </button>
            </div>

            {isLoadingProducts ? (
              <div className="flex items-center justify-center py-10 text-xs text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang nạp danh mục hàng hóa...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400">
                Không tìm thấy mặt hàng nào phù hợp.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const totalStock = p.stockQuantity ?? 0;
                  const allocatedStock =
                    p.allocatedStock ??
                    (p.posStocks || []).reduce((sum, ps) => sum + (ps.stockQuantity || 0), 0);
                  const maxAvailable = getAvailableStock(p);

                  const itemStock = quantities[p.id]?.stock ?? Math.min(10, maxAvailable);
                  const itemMin = quantities[p.id]?.min ?? 2;
                  const isExceeded = isSelected && itemStock > maxAvailable;

                  return (
                    <div
                      key={p.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all gap-3 ${
                        isSelected
                          ? isExceeded
                            ? "border-red-300 bg-red-50/40"
                            : "border-kv-blue-primary bg-kv-blue-light/20"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div
                        onClick={() => handleToggleSelect(p.id)}
                        className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? isExceeded
                                ? "bg-red-500 border-red-500 text-white"
                                : "bg-kv-blue-primary border-kv-blue-primary text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-500">
                            Mã SKU: <span className="font-mono font-medium">{p.sku}</span> · ĐVT: {p.unit}
                            {" · "}
                            <span className="text-emerald-700 font-bold">
                              Khả dụng: {maxAvailable}
                            </span>
                            {" "}
                            <span className="text-slate-400">
                              (Tổng: {totalStock}{allocatedStock > 0 ? `, Đã vào các CS: ${allocatedStock}` : ""})
                            </span>
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-3 shrink-0 pl-7 sm:pl-0">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[11px] font-semibold text-slate-500">Tồn ban đầu:</span>
                              <input
                                type="number"
                                min="0"
                                max={maxAvailable}
                                value={itemStock}
                                onChange={(e) => handleStockChange(p.id, Number(e.target.value))}
                                className={`w-20 px-2 py-1 text-xs font-bold text-center border rounded-lg outline-none bg-white ${
                                  isExceeded
                                    ? "border-red-500 text-red-600 focus:ring-2 focus:ring-red-200"
                                    : "border-slate-300 focus:border-kv-blue-primary"
                                }`}
                              />
                            </div>
                            {isExceeded && (
                              <span className="text-[10px] text-red-500 font-semibold mt-0.5">
                                Vượt quá khả dụng ({maxAvailable})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[11px] font-semibold text-slate-500">Tồn tối thiểu:</span>
                            <input
                              type="number"
                              min="0"
                              value={itemMin}
                              onChange={(e) => handleMinChange(p.id, Number(e.target.value))}
                              className="w-16 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded-lg outline-none focus:border-kv-blue-primary bg-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <span className="text-xs font-bold text-slate-700">
              Đã chọn <strong>{selectedIds.length}</strong> mặt hàng
            </span>
            <div className="flex items-center gap-2">
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
                disabled={selectedIds.length === 0 || isLoading}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-xl shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Khởi tạo ({selectedIds.length}) mặt hàng
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
