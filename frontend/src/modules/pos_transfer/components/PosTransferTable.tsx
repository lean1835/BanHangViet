import React from "react";
import {
  Truck,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowRight,
} from "lucide-react";
import type { IPosTransfer, TPosTransferStatus } from "../types/IPosTransfer";
import type { IPointOfSale } from "@/modules/point_of_sale/types/IPointOfSale";
import { formatDate } from "@/utils/dateFormatter";
import { USER_ROLES } from "@/constants/roles";

interface PosTransferTableProps {
  data: IPosTransfer[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: "ALL" | TPosTransferStatus;
  onStatusFilterChange: (status: "ALL" | TPosTransferStatus) => void;
  fromPosFilter: string;
  onFromPosFilterChange: (posId: string) => void;
  toPosFilter: string;
  onToPosFilterChange: (posId: string) => void;
  posList: IPointOfSale[];
  isLoading: boolean;
  onViewDetail: (transfer: IPosTransfer) => void;
  onAddNew: () => void;
  userRole?: string;
}

export const PosTransferTable: React.FC<PosTransferTableProps> = ({
  data,
  totalElements,
  totalPages,
  currentPage,
  onPageChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  fromPosFilter,
  onFromPosFilterChange,
  toPosFilter,
  onToPosFilterChange,
  posList,
  isLoading,
  onViewDetail,
  onAddNew,
  userRole,
}) => {
  const isOwner = userRole === USER_ROLES.OWNER;

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã phiếu chuyển, ghi chú..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Điểm gửi */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-600 font-semibold">
            <span>Gửi từ:</span>
            <select
              value={fromPosFilter}
              onChange={(e) => onFromPosFilterChange(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="">Tất cả kho gửi</option>
              <option value="WAREHOUSE">🏢 Kho gốc</option>
              {posList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Điểm nhận */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-600 font-semibold">
            <span>Nhận tại:</span>
            <select
              value={toPosFilter}
              onChange={(e) => onToPosFilterChange(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="">Tất cả kho nhận</option>
              <option value="WAREHOUSE">🏢 Kho gốc</option>
              {posList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trạng thái */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-600 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                onStatusFilterChange(e.target.value as "ALL" | TPosTransferStatus)
              }
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả</option>
              <option value="IN_TRANSIT">Đang chuyển</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="CANCELED">Đã hủy</option>
            </select>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-xl shadow-sm shadow-blue-500/20 transition-all shrink-0"
            >
              + Lập phiếu chuyển
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã phiếu</th>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Kho xuất (Điểm gửi)</th>
                <th className="py-3.5 px-4">Kho nhập (Điểm nhận)</th>
                <th className="py-3.5 px-4 text-center">Số mặt hàng</th>
                <th className="py-3.5 px-4">Người lập</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-28"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-32"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-32"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded-md w-10 mx-auto"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-24"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded-full w-24 mx-auto"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded-md w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-3">
                        <Truck className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">
                        Chưa có phiếu chuyển hàng nào
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        {searchTerm || fromPosFilter || toPosFilter || statusFilter !== "ALL"
                          ? "Không tìm thấy phiếu chuyển hàng phù hợp với bộ lọc."
                          : "Điều chuyển hàng giữa các chi nhánh giúp cân bằng tồn kho nhanh chóng."}
                      </p>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={onAddNew}
                          className="px-4 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark rounded-xl shadow-xs transition-all"
                        >
                          + Lập phiếu chuyển đầu tiên
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {transfer.transferNumber || transfer.transferCode || "—"}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {transfer.transferredAt ? formatDate(transfer.transferredAt) : "—"}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {transfer.fromPointOfSaleName}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {transfer.toPointOfSaleName}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {transfer.totalItems ?? transfer.items?.length ?? 0} mặt hàng
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {transfer.createdByFullName || "Chủ hộ"}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {(transfer.status === "IN_TRANSIT" || (transfer.status as any) === "PENDING") && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Đang chuyển
                        </span>
                      )}
                      {transfer.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Đã nhận đủ
                        </span>
                      )}
                      {transfer.status === "CANCELED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-500" />
                          Đã hủy
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewDetail(transfer)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-kv-blue-primary hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-500 gap-2">
          <span>
            Hiển thị <strong>{data.length}</strong> trên tổng số{" "}
            <strong>{totalElements}</strong> phiếu chuyển
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-slate-700">
                Trang {currentPage + 1} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
