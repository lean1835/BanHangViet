import React, { useState } from "react";
import {
  History,
  Eye,
  Undo2,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  BATCH_STATUS,
  BATCH_STATUS_LABELS,
  ADJUSTMENT_TYPE_LABELS,
  PRICE_ROUNDING_LABELS,
  PRICE_ADJUSTMENT_COPY,
  type TBatchStatus,
} from "@/constants/priceAdjustment";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import { useGetPriceAdjustmentBatchesQuery } from "../services/priceAdjustmentApi";
import type { IPriceAdjustmentBatch } from "../types/IPriceAdjustment";

interface PriceAdjustmentBatchListTableProps {
  onOpenDetail: (batchId: string) => void;
  onOpenRevert: (batch: IPriceAdjustmentBatch) => void;
}

export const PriceAdjustmentBatchListTable: React.FC<
  PriceAdjustmentBatchListTableProps
> = ({ onOpenDetail, onOpenRevert }) => {
  const [statusFilter, setStatusFilter] = useState<TBatchStatus | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 8;

  const {
    data: batchesResponse,
    isLoading,
    isError,
    refetch,
  } = useGetPriceAdjustmentBatchesQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page: currentPage,
    size: pageSize,
  });

  const batches = batchesResponse?.result?.content || [];
  const totalElements = batchesResponse?.result?.totalElements || 0;
  const totalPages = batchesResponse?.result?.totalPages || 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5 animate-auth-fade-in">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-kv-blue-primary" />
          <h3 className="font-extrabold text-slate-800 text-sm md:text-base">
            Nhật ký các đợt đổi giá đã thực hiện
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter buttons */}
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setCurrentPage(0);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === "ALL"
                  ? "bg-white text-kv-blue-primary shadow-2xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Tất cả ({totalElements})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter(BATCH_STATUS.APPLIED);
                setCurrentPage(0);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === BATCH_STATUS.APPLIED
                  ? "bg-white text-emerald-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Đang áp dụng
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter(BATCH_STATUS.REVERTED);
                setCurrentPage(0);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === BATCH_STATUS.REVERTED
                  ? "bg-white text-slate-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Đã hoàn tác
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 text-slate-500 hover:text-kv-blue-primary hover:bg-slate-100 rounded-xl transition-colors"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="w-8 h-8 border-2 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold">Đang tải lịch sử điều chỉnh...</span>
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-xs font-bold text-rose-500 flex flex-col items-center gap-2">
          <span>Không thể tải lịch sử điều chỉnh giá.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
          >
            Thử lại
          </button>
        </div>
      ) : batches.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400 font-medium">
          Chưa có đợt điều chỉnh giá nào trong hệ thống
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Mã đợt</th>
                    <th className="p-3">Tên đợt</th>
                    <th className="p-3">Cơ chế áp dụng</th>
                    <th className="p-3">Phạm vi nhóm</th>
                    <th className="p-3 text-center">Mặt hàng</th>
                    <th className="p-3">Người áp dụng</th>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {batches.map((batch) => {
                    const isReverted = batch.status === BATCH_STATUS.REVERTED;
                    const canRevert = batch.canRevert && !isReverted;

                    return (
                      <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-kv-blue-primary">
                          {batch.batchCode}
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {batch.name}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span>{ADJUSTMENT_TYPE_LABELS[batch.adjustmentType]}</span>
                            <span className="text-[11px] font-bold text-kv-blue-primary">
                              {batch.adjustmentValue > 0
                                ? `+${batch.adjustmentValue}`
                                : batch.adjustmentValue}{" "}
                              ({PRICE_ROUNDING_LABELS[batch.roundingMethod]})
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">
                          {batch.targetGroupName || "Chọn lẻ"}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1 font-bold">
                            <span>{batch.totalItems}</span>
                            {batch.belowCostItems > 0 && (
                              <span
                                className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full"
                                title={`${batch.belowCostItems} mặt hàng bán dưới giá vốn`}
                              >
                                {batch.belowCostItems} dưới vốn
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">
                          {batch.appliedByName || batch.appliedBy}
                        </td>
                        <td className="p-3 text-[11px] font-mono text-slate-500">
                          {new Date(batch.appliedAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="p-3 text-center">
                          {isReverted ? (
                            <span className="inline-flex items-center gap-1 font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                              <Clock className="w-3 h-3" /> {BATCH_STATUS_LABELS[batch.status]}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                              <CheckCircle className="w-3 h-3" /> {BATCH_STATUS_LABELS[batch.status]}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenDetail(batch.id)}
                              className="p-1.5 text-slate-500 hover:text-kv-blue-primary hover:bg-slate-100 rounded-lg transition-colors"
                              title={PRICE_ADJUSTMENT_COPY.VIEW_DETAIL_BUTTON}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {canRevert ? (
                              <button
                                type="button"
                                onClick={() => onOpenRevert(batch)}
                                className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                title={PRICE_ADJUSTMENT_COPY.CAN_REVERT_TOOLTIP}
                              >
                                <Undo2 className="w-4 h-4" />
                              </button>
                            ) : isReverted ? (
                              <span
                                className="p-1.5 text-slate-300 cursor-not-allowed"
                                title={PRICE_ADJUSTMENT_COPY.ALREADY_REVERTED_TOOLTIP}
                              >
                                <Undo2 className="w-4 h-4" />
                              </span>
                            ) : (
                              <span
                                className="p-1.5 text-slate-300 cursor-not-allowed"
                                title={PRICE_ADJUSTMENT_COPY.EXPIRED_REVERT_TOOLTIP}
                              >
                                <Undo2 className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <TablePaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
