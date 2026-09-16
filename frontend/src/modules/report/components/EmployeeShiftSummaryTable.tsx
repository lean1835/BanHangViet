import React from "react";
import { User, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IEmployeeRevenueSummary } from "../types/IReport";

interface EmployeeShiftSummaryTableProps {
  summaries: IEmployeeRevenueSummary[];
  isLoading?: boolean;
}

export const EmployeeShiftSummaryTable: React.FC<EmployeeShiftSummaryTableProps> = ({
  summaries,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/4" />
        <div className="h-48 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  if (!summaries || summaries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
        <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-xs font-medium">Chưa có dữ liệu ca của nhân viên trong khoảng thời gian này</p>
      </div>
    );
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-base" title="Top 1 doanh thu">🥇</span>;
    if (index === 1) return <span className="text-base" title="Top 2 doanh thu">🥈</span>;
    if (index === 2) return <span className="text-base" title="Top 3 doanh thu">🥉</span>;
    return <span className="text-xs font-bold text-slate-400">#{index + 1}</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Hiệu suất bán hàng theo nhân viên
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Xếp hạng theo tổng doanh thu bán hàng trong kỳ đối soát
          </p>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
          {summaries.length} nhân viên
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3.5 text-center w-12">Hạng</th>
              <th className="px-4 py-3.5">Nhân viên</th>
              <th className="px-4 py-3.5 text-center">Số ca</th>
              <th className="px-4 py-3.5 text-right">DT Tiền mặt</th>
              <th className="px-4 py-3.5 text-right">DT Chuyển khoản</th>
              <th className="px-4 py-3.5 text-right">Tổng doanh thu</th>
              <th className="px-4 py-3.5 text-center">Đơn thành công</th>
              <th className="px-4 py-3.5 text-right">TB / ca</th>
              <th className="px-4 py-3.5 text-center">Ca lệch tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summaries.map((emp, index) => (
              <tr key={emp.userId || emp.username} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3.5 text-center font-bold">
                  {getRankBadge(index)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-bold text-slate-900">
                    {emp.employeeName || emp.username}
                  </div>
                  <div className="text-[11px] text-slate-400">@{emp.username}</div>
                </td>
                <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                  {emp.totalShifts}
                </td>
                <td className="px-4 py-3.5 text-right text-slate-600">
                  {formatCurrency(emp.totalCashRevenue)}
                </td>
                <td className="px-4 py-3.5 text-right text-slate-600">
                  {formatCurrency(emp.totalBankTransferRevenue)}
                </td>
                <td className="px-4 py-3.5 text-right font-black text-slate-900">
                  {formatCurrency(emp.totalRevenue)}
                </td>
                <td className="px-4 py-3.5 text-center font-medium">
                  <span className="text-slate-800">{emp.totalOrders} đơn</span>
                  {emp.totalCanceledOrders > 0 && (
                    <span className="text-rose-500 text-[10px] block">
                      ({emp.totalCanceledOrders} hủy)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="font-bold text-slate-800">
                    {formatCurrency(emp.averageRevenuePerShift)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ~{emp.averageOrdersPerShift} đơn/ca
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center">
                  {emp.exceededShiftsCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                      <AlertCircle className="w-3 h-3" />
                      <span>{emp.exceededShiftsCount} ca</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
