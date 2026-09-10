import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  X,
  Calendar,
  Layers,
  UserCheck,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useGetCanceledOrderStatisticsQuery } from "@/modules/order/services/orderApi";
import { useGetActiveShiftQuery } from "@/modules/shift/services/shiftApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";

interface ICanceledOrderStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialShiftId?: string;
}

export const CanceledOrderStatisticsModal: React.FC<ICanceledOrderStatisticsModalProps> = ({
  isOpen,
  onClose,
  initialShiftId,
}) => {
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>(
    initialShiftId || "ALL"
  );
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const { data: activeShiftData } = useGetActiveShiftQuery();
  const activeShift = activeShiftData?.result;

  const queryParams = {
    shiftId: selectedShiftFilter === "ALL" ? undefined : selectedShiftFilter,
    fromDate: fromDate ? `${fromDate}T00:00:00` : undefined,
    toDate: toDate ? `${toDate}T23:59:59` : undefined,
  };

  const { data: statsData, isLoading, isFetching } =
    useGetCanceledOrderStatisticsQuery(queryParams, { skip: !isOpen });

  if (!isOpen) return null;

  const stats = statsData?.result;
  const totalOrders = stats?.totalCanceledOrders ?? 0;
  const totalAmount = stats?.totalCanceledAmount ?? 0;
  const byReason = stats?.byReason || [];
  const byEmployee = stats?.byEmployee || [];
  const recentOrders = stats?.recentCanceledOrders || [];


  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 animate-backdrop-fade-in backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="canceled-stats-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-modal-bounce-in text-slate-800"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="canceled-stats-title"
                className="text-sm sm:text-base font-extrabold uppercase tracking-wide flex items-center gap-2"
              >
                <span>Thống Kê Đơn Hàng Hủy</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Theo ca & nhân viên
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Theo dõi chi tiết số liệu hủy đơn chưa thanh toán để kiểm soát hao hụt và rủi ro
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Shift filter */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-bold text-slate-600">Ca bán:</span>
              <select
                value={selectedShiftFilter}
                onChange={(e) => setSelectedShiftFilter(e.target.value)}
                className="border border-slate-300 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">-- Tất cả các ca --</option>
                {activeShift && (
                  <option value={activeShift.id}>
                    Ca hiện tại ({activeShift.fullName || activeShift.username || "Đang mở"})
                  </option>
                )}
              </select>
            </div>

            {/* Date range filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-bold text-slate-600">Từ:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-slate-300 rounded-lg bg-white px-2 py-1 text-xs font-semibold"
              />
              <span className="font-bold text-slate-600">Đến:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-slate-300 rounded-lg bg-white px-2 py-1 text-xs font-semibold"
              />
            </div>
          </div>

          {(fromDate || toDate || selectedShiftFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSelectedShiftFilter("ALL");
                setFromDate("");
                setToDate("");
              }}
              className="text-slate-500 hover:text-slate-800 font-bold underline"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {isLoading || isFetching ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-7 h-7 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
              <span className="font-semibold">Đang tổng hợp số liệu thống kê...</span>
            </div>
          ) : (
            <>
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    Tổng đơn đã hủy
                  </div>
                  <div className="text-2xl font-black text-rose-600 mt-1">
                    {totalOrders} <span className="text-xs font-bold text-rose-500">đơn</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Chưa phát sinh trừ tồn kho
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    Tổng giá trị đơn hủy
                  </div>
                  <div className="text-xl font-black text-amber-700 mt-1">
                    {formatCurrency(totalAmount)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Không ghi nhận doanh thu
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    Phạm vi thống kê
                  </div>
                  <div className="font-extrabold text-slate-800 mt-1 truncate">
                    {stats?.shiftName || (selectedShiftFilter === "ALL" ? "Toàn bộ ca" : "Ca làm việc")}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Cập nhật tự động thời gian thực
                  </div>
                </div>
              </div>

              {/* Breakdown by Reason Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span>Phân loại theo lý do hủy</span>
                </h3>

                {byReason.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 font-medium">
                    Chưa có ghi nhận đơn hủy nào trong phạm vi này.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {byReason.map((reason, idx) => (
                      <div key={reason.reasonCode} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">
                            {reason.reasonDescription || reason.reasonCode}
                          </span>
                          <span className="font-semibold text-slate-500">
                            <strong className="text-slate-800">{reason.count}</strong> đơn ({reason.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              idx === 0
                                ? "bg-blue-600"
                                : idx === 1
                                ? "bg-amber-500"
                                : idx === 2
                                ? "bg-orange-500"
                                : "bg-purple-600"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, reason.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Breakdown by Employee Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Thống kê theo nhân viên thực hiện</span>
                </h3>

                {byEmployee.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 font-medium">
                    Chưa có nhân viên nào phát sinh đơn hủy.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-3">Nhân viên</th>
                          <th className="py-2 px-3 text-center">Tài khoản</th>
                          <th className="py-2 px-3 text-center">Số đơn hủy</th>
                          <th className="py-2 px-3 text-right">Tổng giá trị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {byEmployee.map((emp) => (
                          <tr key={emp.employeeId} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-bold text-slate-800">
                              {emp.employeeFullName || "Không rõ tên"}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500 font-mono">
                              {emp.employeeUsername}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                                {emp.count}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800">
                              {formatCurrency(emp.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Canceled Orders List */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>Đơn hủy gần đây</span>
                </h3>

                {recentOrders.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 font-medium">
                    Không có đơn hủy gần đây.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-3">Mã đơn</th>
                          <th className="py-2 px-3">Thời gian</th>
                          <th className="py-2 px-3">Lý do hủy</th>
                          <th className="py-2 px-3">Người hủy</th>
                          <th className="py-2 px-3 text-right">Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {recentOrders.map((ord) => (
                          <tr key={ord.orderId} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">
                              {ord.orderNumber}
                            </td>
                            <td className="py-2 px-3 text-slate-500">
                              {formatDate(ord.canceledAt)}
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-bold text-rose-700">
                                {ord.cancelReasonDescription || ord.cancelReason}
                              </div>
                              {ord.cancelReasonNote && (
                                <div className="text-[10px] text-slate-400 truncate max-w-xs" title={ord.cancelReasonNote}>
                                  Ghi chú: {ord.cancelReasonNote}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-700 font-semibold">
                              {ord.canceledByFullName || "Hệ thống"}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800">
                              {formatCurrency(ord.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CanceledOrderStatisticsModal;
