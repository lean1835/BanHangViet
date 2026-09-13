import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Clock,
  UtensilsCrossed,
  Tag,
  AlertTriangle,
  RotateCw,
  ShoppingBag,
  ArrowRight,
  Trash2,
  Edit3,
  Search,
  User,
} from "lucide-react";
import { useGetHeldOrdersQuery } from "@/modules/order/services/orderApi";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IHeldOrderSummaryResponse } from "@/modules/order/types/IOrder";

interface IHeldOrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: IHeldOrderSummaryResponse) => void;
  onEditOrder: (order: IHeldOrderSummaryResponse) => void;
  onCancelOrder: (order: IHeldOrderSummaryResponse) => void;
}

export const HeldOrdersDrawer: React.FC<IHeldOrdersDrawerProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
  onEditOrder,
  onCancelOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterOverdueOnly, setFilterOverdueOnly] = useState<boolean>(false);

  const {
    data: heldOrdersData,
    isLoading,
    isFetching,
    refetch,
  } = useGetHeldOrdersQuery(undefined, { skip: !isOpen });

  if (!isOpen) return null;

  const orders: IHeldOrderSummaryResponse[] = heldOrdersData?.result || [];
  const overdueCount = orders.filter((o) => o.isOverdue).length;

  const filteredOrders = orders.filter((order) => {
    if (filterOverdueOnly && !order.isOverdue) return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    return (
      order.orderNumber.toLowerCase().includes(term) ||
      (order.orderLabel && order.orderLabel.toLowerCase().includes(term)) ||
      (order.diningTableName && order.diningTableName.toLowerCase().includes(term)) ||
      (order.customerName && order.customerName.toLowerCase().includes(term))
    );
  });

  const formatHoldingDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (remainingMins === 0) return `${hours} giờ`;
    return `${hours}h ${remainingMins}p`;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-backdrop-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 text-white shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Đơn Treo Trong Ca</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-xs">
                  {orders.length}
                </span>
                {overdueCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-xs animate-pulse">
                    {overdueCount} quá hạn
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100 font-medium">
                NCL-03-CN-010: Quản lý và khôi phục đơn treo theo bàn / khách
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg text-blue-100 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
              title="Làm mới danh sách"
            >
              <RotateCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-blue-100 hover:bg-white/20 hover:text-white transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo số HĐ, tên bàn, tên gợi nhớ, khách..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white placeholder:text-slate-400"
            />
          </div>

          {overdueCount > 0 && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterOverdueOnly}
                  onChange={(e) => setFilterOverdueOnly(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Chỉ hiện đơn quá hạn ({overdueCount})
                </span>
              </label>

              <span className="text-[11px] text-slate-500">
                (Đơn treo &gt; 4h cần xử lý trước khi đóng ca)
              </span>
            </div>
          )}
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400 font-semibold animate-pulse">
              Đang tải danh sách đơn treo từ máy chủ...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-xs font-semibold text-slate-600">
                {searchTerm || filterOverdueOnly
                  ? "Không tìm thấy đơn treo phù hợp"
                  : "Hiện không có đơn nào đang treo trong ca này"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Khi có khách gọi món nhưng chưa thanh toán, bạn có thể bấm "Treo đơn" để giữ giỏ hàng và mở đơn mới.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              return (
                <div
                  key={order.id}
                  className={`p-3.5 rounded-2xl border transition-all shadow-xs hover:shadow-md ${
                    order.isOverdue
                      ? "border-rose-300 bg-rose-50/40"
                      : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  {/* Card Header: Table / Label / Overdue Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {order.diningTableName ? (
                        <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center gap-1">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600" />
                          {order.diningTableName}
                          {order.diningTableArea && ` (${order.diningTableArea})`}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                          Đơn thường
                        </span>
                      )}

                      {order.orderLabel && (
                        <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1">
                          <Tag className="w-3 h-3 text-indigo-500" />
                          {order.orderLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {order.isOverdue ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-extrabold text-[10px] border border-rose-200 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Quá hạn ({formatHoldingDuration(order.holdingDurationMinutes)})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatHoldingDuration(order.holdingDurationMinutes)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Details: Customer, Items, Total */}
                  <div className="flex items-center justify-between text-xs py-1.5 border-y border-slate-100 mb-2.5">
                    <div className="flex items-center gap-1 text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{order.customerName || "Khách lẻ"}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-[11px]">
                        {order.itemCount} món
                      </span>
                      <span className="font-extrabold text-sm text-[#0070f4]">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditOrder(order)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                        title="Đổi bàn hoặc sửa tên nhận diện"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Đổi bàn</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onCancelOrder(order)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all flex items-center gap-1"
                        title="Hủy đơn chưa thanh toán kèm lý do (NCL-03-CN-009)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hủy</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectOrder(order);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-xs flex items-center gap-1"
                    >
                      <span>Mở đơn</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
