import React from "react";
import type { IPosCartItem } from "../types/IPos";
import { formatCurrency } from "@/utils/formatCurrency";

interface IPosCartTableProps {
  items: IPosCartItem[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
}

export const PosCartTable: React.FC<IPosCartTableProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  if (items.length === 0) {
    return (
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center select-none">
        <div className="w-16 h-16 bg-blue-50 text-[#0070f4] rounded-full flex items-center justify-center mb-4 shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
            />
          </svg>
        </div>
        <h3 className="font-extrabold text-slate-700 text-sm mb-1">
          Đơn hàng chưa có sản phẩm nào
        </h3>
        <p className="text-slate-400 text-xs max-w-xs font-medium">
          Sử dụng thanh tìm kiếm phía trên <span className="font-bold text-[#0070f4]">(F3)</span> để chọn sản phẩm vào đơn hàng.
        </p>
      </div>
    );
  }

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex-1 bg-white rounded-xl shadow-md border border-slate-200 flex flex-col overflow-hidden select-none">
      {/* Header bar */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <span>Danh sách hàng hóa ({items.length})</span>
          <span className="bg-blue-100 text-[#0070f4] text-[10px] px-2 py-0.5 rounded-full font-bold">
            Tổng SL: {totalQuantity}
          </span>
        </div>
        <button
          type="button"
          onClick={onClearCart}
          className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Xóa tất cả
        </button>
      </div>

      {/* Cart Items Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
              <th className="py-2 px-3 text-center w-12">STT</th>
              <th className="py-2 px-3">Tên sản phẩm</th>
              <th className="py-2 px-3 text-center w-16">ĐVT</th>
              <th className="py-2 px-3 text-center w-28">Số lượng</th>
              <th className="py-2 px-3 text-right w-28">Đơn giá</th>
              <th className="py-2 px-3 text-center w-20">Thuế VAT</th>
              <th className="py-2 px-3 text-right w-32">Thành tiền</th>
              <th className="py-2 px-3 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {items.map((item, idx) => {
              const taxPct = item.product.taxRatePercentage ?? 0;
              return (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/50 transition-colors group"
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
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                    {item.product.unit || "Cái"}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-1 bg-slate-50 border border-slate-200 rounded p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                        }
                        className="w-6 h-6 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition-colors text-xs"
                      >
                        -
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
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                      {taxPct > 0 ? `${taxPct}%` : "0%"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">
                    {formatCurrency(item.lineTotal)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-slate-300 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                      title="Xóa hàng hóa"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
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
