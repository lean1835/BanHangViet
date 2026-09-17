import { useMemo } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateFormatter";
import { useGetSuppliersQuery } from "@/modules/supplier/services/supplierApi";
import { useGetSupplierReturnsQuery } from "@/modules/supplier_return/services/supplierReturnApi";
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
  const { data: allReturnsData } = useGetSupplierReturnsQuery({
    page: 0,
    size: 200,
  });

  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of suppliers) {
      if (s.id && s.name) {
        map.set(s.id, s.name);
      }
    }
    return map;
  }, [suppliers]);

  const returnsSummaryMap = useMemo(() => {
    const map = new Map<string, number>();
    (allReturnsData?.content || []).forEach((ret) => {
      if (ret.receiptId) {
        map.set(ret.receiptId, (map.get(ret.receiptId) || 0) + (ret.totalReturnAmount || 0));
      }
      if (ret.receiptNumber) {
        map.set(ret.receiptNumber, (map.get(ret.receiptNumber) || 0) + (ret.totalReturnAmount || 0));
      }
    });
    return map;
  }, [allReturnsData]);

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
                <th className="p-3">Mã phiếu / NCC</th>
                <th className="p-3">Thời gian nhập</th>
                <th className="p-3 text-right">Tổng tiền phiếu (đ)</th>
                <th className="p-3 text-center">Trạng thái trả</th>
                <th className="p-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
              {receipts.map((receipt, index) => {
                const supplierDisplayName =
                  receipt.supplierName ||
                  (receipt.supplierId ? supplierMap.get(receipt.supplierId) : undefined) ||
                  "— (Nhập lẻ)";

                const returnedFromSummary =
                  (receipt.id ? returnsSummaryMap.get(receipt.id) : 0) ||
                  (receipt.receiptNumber ? returnsSummaryMap.get(receipt.receiptNumber) : 0) ||
                  0;

                const totalReturned =
                  receipt.totalReturnedAmount && receipt.totalReturnedAmount > 0
                    ? receipt.totalReturnedAmount
                    : returnedFromSummary;

                const isFullyReturned =
                  receipt.returnStatus === "FULLY_RETURNED" ||
                  (Boolean(receipt.totalAmount) && totalReturned >= (receipt.totalAmount || 0) - 1);

                const isPartiallyReturned =
                  !isFullyReturned &&
                  (receipt.returnStatus === "PARTIALLY_RETURNED" || totalReturned > 0);

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

                    {/* 2. Mã phiếu / Nhà cung cấp */}
                    <td className="p-3">
                      <span className="font-extrabold text-blue-700 text-xs block group-hover:underline">
                        {receipt.receiptNumber}
                      </span>
                      <span className="block max-w-[220px] truncate text-slate-600 text-[11px] font-normal mt-0.5" title={supplierDisplayName}>
                        NCC: {supplierDisplayName}
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

                    {/* 5. Trạng thái trả hàng */}
                    <td className="p-3 text-center">
                      {isFullyReturned ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                          Đã trả toàn bộ
                        </span>
                      ) : isPartiallyReturned ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                          Đã trả 1 phần
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Chưa trả
                        </span>
                      )}
                    </td>

                    {/* 6. Ghi chú */}
                    <td className="p-3 text-slate-500 max-w-[200px] truncate font-normal" title={receipt.notes}>
                      {receipt.notes || "---"}
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
