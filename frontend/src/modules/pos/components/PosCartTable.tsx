import React from "react";
import { Tag, Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import type { IPosCartItem } from "../types/IPos";
import { formatCurrency } from "@/utils/formatCurrency";

interface IPosCartTableProps {
  items: IPosCartItem[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  canManage?: boolean;
  onToggleBypass?: (itemId: string) => void;
}

export const PosCartTable: React.FC<IPosCartTableProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  canManage = false,
  onToggleBypass,
}) => {
  if (items.length === 0) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center select-none">
        <div className="w-16 h-16 bg-blue-50 text-kv-blue-primary rounded-full flex items-center justify-center mb-4 shadow-inner">
          <ShoppingCart size={32} />
        </div>
        <h3 className="font-extrabold text-slate-700 text-sm mb-1">
          Đơn hàng chưa có sản phẩm nào
        </h3>
        <p className="text-slate-400 text-xs max-w-xs font-medium">
          Sử dụng thanh tìm kiếm phía trên <span className="font-bold text-kv-blue-primary">(F3)</span> để chọn sản phẩm vào đơn hàng.
        </p>
      </div>
    );
  }

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex-1 bg-white rounded-xl shadow-md border border-slate-200 flex flex-col overflow-hidden select-none">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <span>Danh sách hàng hóa ({items.length})</span>
          <span className="bg-blue-100 text-kv-blue-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
            Tổng SL: {totalQuantity}
          </span>
        </div>
        <button
          type="button"
          onClick={onClearCart}
          className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
        >
          <Trash2 size={13} />
          Xóa tất cả
        </button>
      </div>

      {/* Cart Items Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
              <th className="py-2.5 px-3 text-center w-12">STT</th>
              <th className="py-2.5 px-3">Tên sản phẩm</th>
              <th className="py-2.5 px-3 text-center w-16">ĐVT</th>
              <th className="py-2.5 px-3 text-center w-28">Số lượng</th>
              <th className="py-2.5 px-3 text-right w-28">Đơn giá</th>
              <th className="py-2.5 px-3 text-center w-20">Thuế VAT</th>
              <th className="py-2.5 px-3 text-right w-32">Thành tiền</th>
              <th className="py-2.5 px-3 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {items.map((item, idx) => {
              const taxPct = item.product.taxRatePercentage ?? 0;
              const hasActivePromotion =
                (item.hasPromotion || Boolean(item.promotionName)) &&
                !item.bypassPromotion;
              const lineDiscount = item.lineDiscount || 0;
              const effectiveUnitPrice =
                hasActivePromotion && lineDiscount > 0 && item.quantity > 0
                  ? (item.quantity * item.price - lineDiscount) / item.quantity
                  : item.price;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/40 transition-colors group"
                >
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-800">
                      {item.product.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Mã: {item.product.sku || "N/A"}
                    </div>

                    {/* Active Promotion Badge (TC-01 & QTN-26) */}
                    {hasActivePromotion && item.promotionName && (
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Tag size={11} className="text-emerald-600 shrink-0" />
                          <span>{item.promotionName}</span>
                          {lineDiscount > 0 && (
                            <span className="font-extrabold text-emerald-800">
                              (-{formatCurrency(lineDiscount)})
                            </span>
                          )}
                        </span>
                        {canManage && onToggleBypass && (
                          <button
                            type="button"
                            onClick={() => onToggleBypass(item.id)}
                            title="Bỏ áp dụng khuyến mại (bán giá gốc)"
                            className="text-[10px] text-slate-400 hover:text-rose-600 hover:underline transition-colors"
                          >
                            Bỏ KM
                          </button>
                        )}
                      </div>
                    )}

                    {/* Bypassed Promotion Badge */}
                    {item.bypassPromotion && (
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Đã bỏ khuyến mại (Bán giá gốc)
                        </span>
                        {canManage && onToggleBypass && (
                          <button
                            type="button"
                            onClick={() => onToggleBypass(item.id)}
                            title="Áp dụng lại khuyến mại"
                            className="text-[10px] font-bold text-kv-blue-primary hover:underline transition-colors"
                          >
                            Áp lại KM
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                    {item.product.unit || "Cái"}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(
                            item.id,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        className="w-6 h-6 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition-colors text-xs"
                      >
                        <Minus size={11} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) {
                            onUpdateQuantity(item.id, val);
                          }
                        }}
                        className="w-12 text-center bg-transparent font-bold text-slate-800 focus:outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-6 h-6 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition-colors text-xs"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {hasActivePromotion && lineDiscount > 0 ? (
                      <div>
                        <span className="line-through text-slate-400 text-[10px] block">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(effectiveUnitPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-medium text-slate-600">
                        {formatCurrency(item.price)}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                      {taxPct > 0 ? `${taxPct}%` : "0%"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {hasActivePromotion && lineDiscount > 0 && (
                      <span className="line-through text-slate-400 text-[10px] block font-normal">
                        {formatCurrency(item.quantity * item.price)}
                      </span>
                    )}
                    <span className="font-extrabold text-slate-800">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-1 rounded hover:bg-rose-50"
                      title="Xóa hàng hóa"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PosCartTable;
