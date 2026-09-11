import React from "react";
import { User, Award, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IEmployeeRevenueSummary } from "../types/IShiftRevenueReport";

interface EmployeeShiftAggregateTableProps {
  summaries: IEmployeeRevenueSummary[];
  isLoading?: boolean;
}

export const EmployeeShiftAggregateTable: React.FC<EmployeeShiftAggregateTableProps> = ({
  summaries,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-700">Không có dữ liệu tổng hợp nhân viên</h3>
        <p className="text-xs text-slate-400 mt-1">
          Chưa có ca làm việc nào được hoàn thành bởi nhân viên trong khoảng thời gian này.
        </p>
      </div>
    );
  }

  // Sort by total revenue descending
  const sortedSummaries = [...summaries].sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Table Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <h3 className="font-extrabold text-slate-800 text-sm">
            Bảng Hiệu Quả Bán Hàng & Độ Chuẩn Xác Tiền Két Theo Nhân Viên ({summaries.length} nhân sự)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-semibold">
          Xếp hạng theo tổng doanh thu thuần
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3 w-10 text-center">Hạng</th>
              <th className="p-3">Nhân viên</th>
              <th className="p-3 text-center">Số ca trực</th>
              <th className="p-3 text-right">Tổng doanh thu</th>
              <th className="p-3 text-right">TB / Ca</th>
              <th className="p-3 text-center">Đơn hàng (Hủy)</th>
              <th className="p-3 text-center">Số ca lệch (Vượt ngưỡng)</th>
              <th className="p-3 text-right">Tổng chênh lệch két</th>
              <th className="p-3 text-center">Độ tin cậy két tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {sortedSummaries.map((emp, index) => {
              const hasDiff = emp.totalDiscrepancyAmount !== 0;
              const isPositive = emp.totalDiscrepancyAmount > 0;

              return (
                <tr key={emp.userId} className="hover:bg-slate-50/80 transition-colors">
                  {/* Hạng */}
                  <td className="p-3 text-center">
                    <span
                      className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-black ${
                        index === 0
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : index === 1
                          ? "bg-slate-200 text-slate-700"
                          : index === 2
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>

                  {/* Nhân viên */}
                  <td className="p-3">
                    <span className="font-bold text-slate-800 block text-xs">{emp.fullName}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <User className="w-2.5 h-2.5" />
                      {emp.username}
                    </span>
                  </td>

                  {/* Số ca trực */}
                  <td className="p-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                      {emp.shiftsCount} ca
                    </span>
                  </td>

                  {/* Tổng doanh thu */}
                  <td className="p-3 text-right">
                    <span className="font-black text-slate-900 block text-xs">
                      {formatCurrency(emp.totalRevenue)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      TM: {formatCurrency(emp.cashRevenue)} | CK: {formatCurrency(emp.transferRevenue)}
                    </span>
                  </td>

                  {/* TB / Ca */}
                  <td className="p-3 text-right font-bold text-kv-blue-primary">
                    {formatCurrency(emp.avgRevenuePerShift)}
                  </td>

                  {/* Đơn hàng */}
                  <td className="p-3 text-center">
                    <span className="font-bold text-slate-800">{emp.totalOrdersCount}</span>
                    {emp.totalCanceledOrdersCount > 0 && (
                      <span className="text-[10px] text-rose-500 font-medium ml-1">
                        ({emp.totalCanceledOrdersCount} hủy)
                      </span>
                    )}
                  </td>

                  {/* Số ca lệch */}
                  <td className="p-3 text-center">
                    {emp.discrepancyShiftsCount === 0 ? (
                      <span className="text-emerald-600 font-bold text-[11px]">0 ca</span>
                    ) : (
                      <span className="font-bold text-amber-600">
                        {emp.discrepancyShiftsCount} ca
                        {emp.overThresholdShiftsCount > 0 && (
                          <span className="text-rose-600 ml-1 font-black">
                            ({emp.overThresholdShiftsCount} vượt ngưỡng)
                          </span>
                        )}
                      </span>
                    )}
                  </td>

                  {/* Tổng chênh lệch tích lũy */}
                  <td className="p-3 text-right">
                    {!hasDiff ? (
                      <span className="text-emerald-600 font-bold">0 đ</span>
                    ) : (
                      <span
                        className={`font-black ${
                          emp.overThresholdShiftsCount > 0
                            ? "text-rose-600"
                            : isPositive
                            ? "text-amber-600"
                            : "text-rose-500"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {formatCurrency(emp.totalDiscrepancyAmount)}
                      </span>
                    )}
                  </td>

                  {/* Độ tin cậy két tiền */}
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        {emp.reliabilityRate >= 90 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className="font-black text-slate-800">
                          {emp.reliabilityRate}%
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            emp.reliabilityRate >= 90
                              ? "bg-emerald-500"
                              : emp.reliabilityRate >= 70
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${emp.reliabilityRate}%` }}
                        ></div>
                      </div>
                    </div>
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
