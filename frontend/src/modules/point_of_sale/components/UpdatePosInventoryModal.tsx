import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Package, Loader2, AlertCircle } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { IPosInventory, IUpdatePosInventoryRequest } from "../types/IPointOfSale";

interface UpdatePosInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IUpdatePosInventoryRequest) => Promise<void>;
  inventory?: IPosInventory | null;
  isLoading?: boolean;
}

export const UpdatePosInventoryModal: React.FC<UpdatePosInventoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  inventory,
  isLoading = false,
}) => {
  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isLoading,
  });

  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [minStockQuantity, setMinStockQuantity] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inventory) {
      setStockQuantity(inventory.stockQuantity ?? 0);
      setMinStockQuantity(inventory.minStockQuantity ?? 0);
    }
    setError(null);
  }, [inventory, isOpen]);

  if (!isOpen || !inventory) return null;

  const maxAvailable = inventory.maxAvailableQuantity ?? inventory.stockQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stockQuantity < 0 || minStockQuantity < 0) {
      setError("Số lượng không được âm");
      return;
    }
    if (maxAvailable !== undefined && stockQuantity > maxAvailable) {
      setError(`Số lượng không được vượt quá tồn kho khả dụng (${maxAvailable})`);
      return;
    }
    await onSubmit({
      stockQuantity,
      minStockQuantity,
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-kv-blue-light text-kv-blue-primary">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Điều chỉnh tồn kho tại điểm bán
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-[260px]" title={inventory.productName}>
                {inventory.productName} ({inventory.productSku})
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

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <p>
                Điểm bán: <strong className="text-slate-900">{inventory.pointOfSaleName}</strong>
              </p>
              <p>
                Đơn vị tính: <strong>{inventory.unit || "Cái"}</strong> · Nhóm: <strong>{inventory.groupName || "Chung"}</strong>
              </p>
              {maxAvailable !== undefined && (
                <p className="text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                  Tồn khả dụng tối đa: {maxAvailable}{" "}
                  <span className="text-slate-400 font-normal">
                    (Tổng danh mục: {inventory.totalProductStock ?? 0})
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số lượng tồn thực tế tại điểm này <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={maxAvailable}
                step="any"
                value={stockQuantity}
                onChange={(e) => {
                  setStockQuantity(Number(e.target.value));
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngưỡng cảnh báo tồn tối thiểu
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={minStockQuantity}
                onChange={(e) => setMinStockQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                disabled={isLoading}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Hệ thống sẽ phát cảnh báo khi lượng tồn kho tại điểm này xuống thấp hơn ngưỡng
              </span>
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

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
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-xl shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
