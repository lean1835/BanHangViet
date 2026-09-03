import React, { useState } from "react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { useGetReturnTicketStatisticsQuery } from "../services/returnTicketApi";

export interface ReturnTicketStatisticsProps {
  fromDate?: string;
  toDate?: string;
  topLimit?: number;
  onFromDateChange?: (val: string) => void;
  onToDateChange?: (val: string) => void;
}

export const ReturnTicketStatistics: React.FC<ReturnTicketStatisticsProps> = ({
  fromDate: controlledFromDate,
  toDate: controlledToDate,
  topLimit: controlledTopLimit = 10,
  onFromDateChange,
  onToDateChange,
}) => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const [localFromDate, setLocalFromDate] = useState<string>(formatDate(firstDay));
  const [localToDate, setLocalToDate] = useState<string>(formatDate(today));

  const fromDate = controlledFromDate ?? localFromDate;
  const toDate = controlledToDate ?? localToDate;
  const topLimit = controlledTopLimit;

  const handleFromDateChange = (val: string) => {
    if (onFromDateChange) {
      onFromDateChange(val);
    } else {
      setLocalFromDate(val);
    }
  };

  const handleToDateChange = (val: string) => {
    if (onToDateChange) {
      onToDateChange(val);
    } else {
      setLocalToDate(val);
    }
  };

  const { data: statsResponse, isLoading, isError } = useGetReturnTicketStatisticsQuery({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    topLimit,
  });

  const stats = statsResponse?.result;

  return (
    <div className="flex flex-col gap-6">
      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Thống kê hàng trả lại
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Theo dõi chỉ số mặt hàng bị trả nhiều nhất và doanh thu hoàn trả
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Từ:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => handleFromDateChange(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Đến:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => handleToDateChange(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-kv-blue-primary" />
          <span className="text-slate-500 font-bold text-xs">Đang tổng hợp số liệu trả hàng...</span>
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center text-rose-700 shadow-sm">
          <h4 className="font-extrabold text-sm mb-1">Không thể tải báo cáo thống kê</h4>
          <p className="text-xs font-semibold">Vui lòng kiểm tra lại kết nối hoặc phân quyền người dùng.</p>
        </div>
      ) : stats ? (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Tổng số phiếu trả hàng
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-slate-900">
                  {formatNumber(stats.totalTickets)}
                </span>
                <span className="text-[11px] font-bold text-slate-500">phiếu</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 mt-2">
                <span>Chờ duyệt: <strong className="text-amber-600 font-bold">{stats.pendingTicketsCount}</strong></span>
                <span>•</span>
                <span>Từ chối: <strong className="text-rose-600 font-bold">{stats.rejectedTicketsCount}</strong></span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Phiếu đã duyệt hoàn tiền
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-emerald-600">
                  {formatNumber(stats.approvedTicketsCount)}
                </span>
                <span className="text-[11px] font-bold text-emerald-600">đã duyệt</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-2">
                Tồn kho đã được hoàn vào hệ thống
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Tổng tiền đã hoàn trả
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-rose-600">
                  {formatCurrency(stats.totalRefundAmount)}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-2">
                Doanh thu bị giảm trừ do trả hàng
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Tổng số lượng hàng trả lại
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-slate-900">
                  {formatNumber(stats.totalReturnedQuantity)}
                </span>
                <span className="text-[11px] font-bold text-slate-500">sản phẩm</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-2">
                Số lượng đơn vị đã hoàn kho
              </span>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Phân loại theo hình thức hoàn tiền
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.paymentMethodSummaries?.map((pm) => (
                <div key={pm.paymentMethod} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{pm.paymentMethodName}</span>
                    <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {pm.ticketCount} phiếu
                    </span>
                  </div>
                  <span className="text-base font-bold text-rose-600 mt-1">
                    {formatCurrency(pm.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Returned Products Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Xếp hạng mặt hàng bị trả lại nhiều nhất (Top 10)
              </h4>
              <span className="text-[11px] text-slate-400 font-semibold">
                Giúp phát hiện sản phẩm lỗi/kém chất lượng
              </span>
            </div>

            {stats.topReturnedProducts?.length ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase">
                      <th className="p-3 text-center w-12">Hạng</th>
                      <th className="p-3">Tên sản phẩm</th>
                      <th className="p-3 text-center w-16">ĐVT</th>
                      <th className="p-3 text-right w-24">Số lần trả</th>
                      <th className="p-3 text-right w-28">Số lượng trả</th>
                      <th className="p-3 text-right w-32">Tổng tiền hoàn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {stats.topReturnedProducts.map((prod, idx) => {
                      const returnCount = prod.returnTicketCount ?? prod.returnCount ?? 0;
                      const returnedQuantity = prod.totalReturnedQuantity ?? prod.returnedQuantity ?? 0;
                      const returnedAmount = prod.totalReturnAmount ?? prod.returnedAmount ?? 0;

                      return (
                        <tr key={prod.productId || idx} className="hover:bg-slate-50/60">
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                                idx === 0
                                  ? "bg-amber-100 text-amber-800"
                                  : idx === 1
                                  ? "bg-slate-200 text-slate-800"
                                  : idx === 2
                                  ? "bg-amber-50 text-amber-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">{prod.productName}</td>
                          <td className="p-3 text-center">{prod.unit || "Cái"}</td>
                          <td className="p-3 text-right font-bold text-slate-700">
                            {formatNumber(returnCount)}
                          </td>
                          <td className="p-3 text-right font-bold text-rose-600">
                            {formatNumber(returnedQuantity)}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {formatCurrency(returnedAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                Chưa có mặt hàng nào bị trả lại trong khoảng thời gian này.
              </div>
            )}
          </div>

          {/* Daily Timeline Table */}
          {stats.dailyTimeline?.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Diễn biến trả hàng theo ngày
              </h4>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase">
                      <th className="p-3">Ngày</th>
                      <th className="p-3 text-right">Số phiếu trả</th>
                      <th className="p-3 text-right">Số lượng trả</th>
                      <th className="p-3 text-right">Tổng tiền hoàn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {stats.dailyTimeline.map((item) => (
                      <tr key={item.date} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">{item.date}</td>
                        <td className="p-3 text-right font-bold text-slate-700">{formatNumber(item.ticketCount)}</td>
                        <td className="p-3 text-right text-slate-700">{formatNumber(item.totalReturnedQuantity)}</td>
                        <td className="p-3 text-right font-bold text-rose-600">{formatCurrency(item.totalReturnAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
