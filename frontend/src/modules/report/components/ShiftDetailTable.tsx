import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, AlertTriangle, Clock, MessageSquare } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import type { IShiftRevenueReportItem } from "../types/IReport";

interface ShiftDetailTableProps {
  shifts: IShiftRevenueReportItem[];
  isLoading?: boolean;
}

export const ShiftDetailTable: React.FC<ShiftDetailTableProps> = ({
  shifts,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyExceeded, setOnlyExceeded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedReason, setSelectedReason] = useState<{ shiftId: string; reason: string } | null>(null);
  const pageSize = 10;

  // Lọc dữ liệu
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const matchSearch =
        (s.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.shiftId || "").toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (onlyExceeded) {
        return s.isDifferenceExceeded || s.differenceExceeded || Math.abs(s.differenceAmount || 0) > 0;
      }
      return true;
    });
  }, [shifts, searchTerm, onlyExceeded]);

  const exceededCount = useMemo(() => {
    return shifts.filter((s) => s.isDifferenceExceeded || s.differenceExceeded).length;
  }, [shifts]);

  // Phân trang
  const totalPages = Math.ceil(filteredShifts.length / pageSize) || 1;
  const paginatedShifts = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredShifts.slice(start, start + pageSize);
  }, [filteredShifts, currentPage, pageSize]);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "---";
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ${d.toLocaleDateString("vi-VN")}`;
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-9 bg-slate-100 rounded-lg w-1/3" />
        <div className="h-64 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Tìm theo tên nhân viên hoặc mã ca..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-kv-blue-primary focus:ring-2 focus:ring-kv-blue-primary/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={onlyExceeded}
              onChange={(e) => {
                setOnlyExceeded(e.target.checked);
                setCurrentPage(0);
              }}
              className="rounded-xs border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className={onlyExceeded ? "text-rose-700" : "text-slate-700"}>
              ⚠️ Chỉ xem ca có chênh lệch ({exceededCount})
            </span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3.5">Mã ca</th>
              <th className="px-4 py-3.5">Thu ngân</th>
              <th className="px-4 py-3.5">Điểm bán</th>
              <th className="px-4 py-3.5">Thời gian đóng</th>
              <th className="px-4 py-3.5 text-right">Tiền đầu ca</th>
              <th className="px-4 py-3.5 text-right">DT Tiền mặt</th>
              <th className="px-4 py-3.5 text-right">DT Chuyển khoản</th>
              <th className="px-4 py-3.5 text-right">Tiền trong két</th>
              <th className="px-4 py-3.5 text-right">Chênh lệch</th>
              <th className="px-4 py-3.5 text-center">Ghi chú / Lý do</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedShifts.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">Không tìm thấy ca làm việc nào phù hợp</p>
                </td>
              </tr>
            ) : (
              paginatedShifts.map((s) => {
                const isExceeded = s.isDifferenceExceeded || s.differenceExceeded;
                const diff = s.differenceAmount || 0;

                return (
                  <tr
                    key={s.shiftId}
                    className={`transition-colors ${
                      isExceeded
                        ? "bg-rose-50/40 hover:bg-rose-50/70"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-600">
                      {s.shiftId.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {s.employeeName || s.username}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.pointOfSaleName || "Điểm bán chính"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateTime(s.closedAt || s.openedAt)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatCurrency(s.openingCash)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(s.cashRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(s.bankTransferRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(s.closingCashActual)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {diff === 0 ? (
                        <span className="text-emerald-600 font-bold">0 đ (Khớp)</span>
                      ) : (
                        <span
                          className={`font-black ${
                            isExceeded ? "text-rose-600" : "text-amber-600"
                          }`}
                        >
                          {diff > 0 ? "+" : ""}
                          {formatCurrency(diff)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.differenceReason ? (
                        <button
                          type="button"
                          onClick={() => setSelectedReason({ shiftId: s.shiftId, reason: s.differenceReason! })}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Xem lý do</span>
                        </button>
                      ) : isExceeded ? (
                        <span className="text-[10px] text-rose-500 italic">Chưa giải trình</span>
                      ) : (
                        <span className="text-slate-300 text-xs">---</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <TablePaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalElements={filteredShifts.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal View Difference Reason */}
      {selectedReason &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setSelectedReason(null)}
          >
            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="text-sm font-bold text-slate-900">
                  Giải trình chênh lệch tiền mặt
                </h4>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed italic">
                "{selectedReason.reason}"
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedReason(null)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
