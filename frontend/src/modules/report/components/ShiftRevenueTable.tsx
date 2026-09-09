import React, { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Info,
  Clock,
  User,
  Building2,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import type { IShiftRevenueItem } from "../types/IShiftRevenueReport";

interface ShiftRevenueTableProps {
  shifts: IShiftRevenueItem[];
  threshold: number;
  isLoading?: boolean;
  onViewDetail: (shift: IShiftRevenueItem) => void;
}

export const ShiftRevenueTable: React.FC<ShiftRevenueTableProps> = ({
  shifts,
  threshold,
  isLoading,
  onViewDetail,
}) => {
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const totalPages = Math.ceil(shifts.length / pageSize) || 1;
  const paginatedShifts = useMemo(() => {
    const start = page * pageSize;
    return shifts.slice(start, start + pageSize);
  }, [shifts, page, pageSize]);

  // Đảm bảo reset trang nếu số trang thay đổi khi lọc
  useEffect(() => {
    if (page >= totalPages) {
      setPage(0);
    }
  }, [page, totalPages]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-700">Không có dữ liệu ca làm việc</h3>
        <p className="text-xs text-slate-400 mt-1">
          Không tìm thấy ca bán hàng nào đã đóng trong khoảng thời gian hoặc theo nhân viên đã chọn.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-slate-800 text-sm">
            Danh Sách Ca Bán Hàng Đã Đóng ({shifts.length} ca)
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold hidden md:inline">
            (Ngưỡng cảnh báo: {formatCurrency(threshold)})
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Khớp tiền
          </span>
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            Lệch tiền
          </span>
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            Vượt ngưỡng
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 justify-between">
        {/* Responsive Table for Desktop */}
        <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3">Mã ca / Điểm bán</th>
              <th className="p-3">Nhân viên</th>
              <th className="p-3">Thời gian ca</th>
              <th className="p-3 text-right">Doanh thu ca</th>
              <th className="p-3 text-center">Đơn (Xong/Hủy)</th>
              <th className="p-3 text-right">Tiền lý thuyết</th>
              <th className="p-3 text-right">Tiền thực đếm</th>
              <th className="p-3 text-right">Chênh lệch</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {paginatedShifts.map((shift) => {
              const hasDiff = shift.differenceAmount !== 0;
              const isOver = shift.isOverThreshold;
              const isPositive = shift.differenceAmount > 0;

              return (
                <tr
                  key={shift.shiftId}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {/* Mã ca & POS */}
                  <td className="p-3">
                    <span className="font-extrabold text-slate-900 block font-mono text-[11px]">
                      {shift.shiftCode}
                    </span>
                    {shift.posName && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[130px]">{shift.posName}</span>
                      </span>
                    )}
                  </td>

                  {/* Nhân viên */}
                  <td className="p-3">
                    <span className="font-bold text-slate-800 block">{shift.fullName}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <User className="w-2.5 h-2.5" />
                      {shift.username}
                    </span>
                  </td>

                  {/* Thời gian */}
                  <td className="p-3">
                    <div className="flex flex-col text-[11px]">
                      <span className="text-slate-700">
                        {shift.openedAt.substring(11, 16)} - {shift.closedAt.substring(11, 16)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {shift.openedAt.substring(0, 10)} ({Math.floor(shift.durationMinutes / 60)}h{shift.durationMinutes % 60}m)
                      </span>
                    </div>
                  </td>

                  {/* Doanh thu ca */}
                  <td className="p-3 text-right">
                    <span className="font-black text-slate-900 block text-xs">
                      {formatCurrency(shift.totalRevenue)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      TM: {formatCurrency(shift.cashRevenue)} | CK: {formatCurrency(shift.transferRevenue)}
                    </span>
                  </td>

                  {/* Đơn hàng */}
                  <td className="p-3 text-center">
                    <span className="font-bold text-slate-800">{shift.completedOrdersCount}</span>
                    {shift.canceledOrdersCount > 0 && (
                      <span className="text-[10px] font-bold text-rose-500 ml-1">
                        (-{shift.canceledOrdersCount})
                      </span>
                    )}
                  </td>

                  {/* Tiền lý thuyết */}
                  <td className="p-3 text-right font-medium text-slate-600">
                    {formatCurrency(shift.closingCashExpected)}
                  </td>

                  {/* Tiền thực đếm */}
                  <td className="p-3 text-right font-bold text-slate-800">
                    {formatCurrency(shift.closingCashActual)}
                  </td>

                  {/* Chênh lệch (TC-01, TC-02) */}
                  <td className="p-3 text-right">
                    {!hasDiff ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Khớp tiền
                      </span>
                    ) : (
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            isOver
                              ? "bg-rose-100 text-rose-700 border-rose-300"
                              : "bg-amber-100 text-amber-700 border-amber-300"
                          }`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {isPositive ? "+" : ""}
                          {formatCurrency(shift.differenceAmount)}
                        </span>
                        {/* TC-02: Hiển thị lý do ghi chép khi đóng ca */}
                        {shift.differenceReason && (
                          <span
                            className="text-[10px] text-slate-500 italic max-w-[170px] truncate text-right cursor-help flex items-center gap-0.5"
                            title={`Lý do đóng ca: ${shift.differenceReason}`}
                          >
                            <Info className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{shift.differenceReason}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Thao tác xem chi tiết */}
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => onViewDetail(shift)}
                      className="p-1.5 text-kv-blue-primary hover:bg-kv-blue-light rounded-lg transition-colors cursor-pointer"
                      title="Xem chi tiết ca làm việc"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <TablePaginationFooter
        currentPage={page}
        pageSize={pageSize}
        totalElements={shifts.length}
        totalPages={totalPages}
        onPageChange={setPage}
        recordUnit="ca làm việc"
      />
      </div>
    </div>
  );
};
