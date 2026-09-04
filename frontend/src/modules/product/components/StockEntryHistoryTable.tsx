import { useMemo } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateFormatter";
import { useGetSuppliersQuery } from "@/modules/supplier/services/supplierApi";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import type { IGoodsReceipt } from "../types/IGoodsReceipt";

interface StockEntryHistoryTableProps {
  receipts: IGoodsReceipt[];
  onViewDetails: (id: string) => void;
  page?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
  onPageChange?: (newPage: number) => void;
}

export const StockEntryHistoryTable = ({
  receipts,
  onViewDetails,
  page = 0,
  pageSize = 8,
  totalElements = 0,
  totalPages = 0,
  onPageChange,
}: StockEntryHistoryTableProps) => {
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of suppliers) {
      if (s.id && s.name) {
        map.set(s.id, s.name);
      }
    }
    return map;
  }, [suppliers]);

  const displayTotal = totalElements || receipts.length;

  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-auth-fade-in flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">
              Lịch sử Phiếu nhập kho từ nhà cung cấp
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {displayTotal} phiếu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3">Nhà cung cấp</th>
                <th className="p-3">Thời gian nhập</th>
                <th className="p-3 text-right">Tổng tiền phiếu (đ)</th>
                <th className="p-3">Ghi chú</th>
                <th className="p-3 w-24 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
              {receipts.map((receipt, index) => {
                const supplierDisplayName =
                  receipt.supplierName ||
                  (receipt.supplierId ? supplierMap.get(receipt.supplierId) : undefined) ||
                  "— (Nhập lẻ)";

                return (
                  <tr
                    key={receipt.id}
                    onClick={() => onViewDetails(receipt.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-all duration-150 group"
                    title="Nhấp để xem chi tiết phiếu nhập"
                  >
                    {/* 1. STT */}
                    <td className="p-3 text-center text-slate-400 font-bold">
                      {page * pageSize + index + 1}
                    </td>

                    {/* 2. Nhà cung cấp */}
                    <td className="p-3 font-semibold text-slate-700">
                      <span className="block max-w-[240px] truncate" title={supplierDisplayName}>
                        {supplierDisplayName}
                      </span>
                    </td>

                    {/* 3. Thời gian nhập */}
                    <td className="p-3 text-slate-500 font-normal">
                      {formatDateShort(receipt.receivedAt)}
                    </td>

                    {/* 4. Tổng tiền */}
                    <td className="p-3 text-right font-extrabold text-rose-600">
                      {formatCurrency(receipt.totalAmount || 0)}
                    </td>

                    {/* 5. Ghi chú */}
                    <td className="p-3 text-slate-500 max-w-[220px] truncate font-normal" title={receipt.notes}>
                      {receipt.notes || "---"}
                    </td>

                    {/* 6. Action button */}
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onViewDetails(receipt.id)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-kv-blue-primary hover:text-white hover:border-kv-blue-primary text-slate-600 font-bold transition-all text-[11px] shadow-2xs"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}

              {receipts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-semibold">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span>Không tìm thấy phiếu nhập kho nào.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls attached seamlessly inside the card */}
      {totalPages > 1 && onPageChange && (
        <TablePaginationFooter
          currentPage={page}
          pageSize={pageSize}
          totalElements={displayTotal}
          totalPages={totalPages}
          onPageChange={onPageChange}
          recordUnit="phiếu"
        />
      )}
    </div>
  );
};
