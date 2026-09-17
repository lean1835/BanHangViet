import React from "react";
import { ArrowDownLeft, Plus, Minus, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

export interface SelectedReturnItemRow {
  invoiceItemId: string;
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  availableQuantity: number;
  returnQuantity: number;
  isSelected: boolean;
  error?: string | null;
}

interface ReturnItemsSectionProps {
  items: SelectedReturnItemRow[];
  onToggleSelect: (invoiceItemId: string) => void;
  onUpdateQuantity: (invoiceItemId: string, newQty: number) => void;
}

export const ReturnItemsSection: React.FC<ReturnItemsSectionProps> = ({
  items,
  onToggleSelect,
  onUpdateQuantity,
}) => {
  const selectedCount = items.filter((i) => i.isSelected).length;
  const totalReturnAmount = items
    .filter((i) => i.isSelected)
    .reduce((sum, i) => sum + i.unitPrice * i.returnQuantity, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
              2. Chọn Món Khách Trả Lại
            </h3>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Đã chọn: {selectedCount} món
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
          <p className="text-sm">Vui lòng chọn hóa đơn gốc ở bước 1</p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">
          {items.map((item) => {
            const isSelectable = item.availableQuantity > 0;
            const subtotal = item.unitPrice * (item.isSelected ? item.returnQuantity : 0);

            return (
              <div
                key={item.invoiceItemId}
                className={`p-3.5 rounded-lg border transition-all ${
                  item.isSelected
                    ? "border-amber-400 bg-amber-50/25 dark:border-amber-600 dark:bg-amber-950/20 shadow-sm"
                    : isSelectable
                    ? "border-slate-200 hover:border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                    : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.isSelected}
                    disabled={!isSelectable}
                    onChange={() => onToggleSelect(item.invoiceItemId)}
                    className="mt-1 w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
                        {item.productName}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(item.unitPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>ĐVT: {item.unit || "Cái"}</span>
                      <span>Khả dụng để trả: <strong>{item.availableQuantity}</strong></span>
                    </div>

                    {item.isSelected && (
                      <div className="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.invoiceItemId, item.returnQuantity - 1)
                            }
                            disabled={item.returnQuantity <= 1}
                            className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="1"
                            max={item.availableQuantity}
                            value={item.returnQuantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              onUpdateQuantity(item.invoiceItemId, val);
                            }}
                            className="w-16 h-8 text-center text-sm font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.invoiceItemId, item.returnQuantity + 1)
                            }
                            disabled={item.returnQuantity >= item.availableQuantity}
                            className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Thành tiền trả</span>
                          <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>
                      </div>
                    )}

                    {item.error && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{item.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Tổng giá trị hàng trả lại (A):
        </span>
        <span className="text-base font-black text-amber-600 dark:text-amber-400">
          {formatCurrency(totalReturnAmount)}
        </span>
      </div>
    </div>
  );
};
