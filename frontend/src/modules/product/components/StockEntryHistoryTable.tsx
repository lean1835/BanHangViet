import { useMemo } from "react";
import { useGetGoodsReceiptByIdQuery } from "../services/productApi";
import { useGetSuppliersQuery } from "@/modules/supplier/services/supplierApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateFormatter";
import type { IGoodsReceipt } from "../types/IGoodsReceipt";

interface StockEntryHistoryTableProps {
  receipts: IGoodsReceipt[];
  onViewDetails: (id: string) => void;
}

const StockEntryHistoryRow = ({
  receipt,
  supplierMap,
  onClick,
}: {
  receipt: IGoodsReceipt;
  supplierMap: Map<string, string>;
  onClick: () => void;
}) => {
  const { data: detailData, isLoading } = useGetGoodsReceiptByIdQuery(receipt.id);

  const details = detailData?.details || [];
  const totalAmount =
    receipt.totalAmount ??
    details.reduce(
      (sum: number, d) => sum + Number(d.quantity || 0) * Number(d.purchasePrice || 0),
      0
    );
  const totalQty = details.reduce(
    (sum: number, d) => sum + Number(d.quantity || 0),
    0
  );
  const summaryStr = details.map((d) => d.productName).join(", ");
  
  // Resolve supplier name from multiple sources (direct, detail data, or supplier catalog map)
  const supplierDisplayName =
    receipt.supplierName ||
    (receipt.supplierId ? supplierMap.get(receipt.supplierId) : undefined) ||
    detailData?.supplierName ||
    (detailData?.supplierId ? supplierMap.get(detailData.supplierId) : undefined);

  return (
    <tr
      onClick={onClick}
      className="hover:bg-slate-50/70 cursor-pointer transition-all duration-150 group"
      title="Nhấp để xem chi tiết phiếu nhập"
    >
      {/* 1. Tên Sản phẩm (Cột đầu tiên) */}
      <td className="p-3 font-bold text-slate-800 group-hover:text-kv-blue-primary transition-colors">
        {isLoading ? (
          <span className="text-slate-400 font-medium">Đang tải...</span>
        ) : details.length === 0 ? (
          <span className="text-slate-400">---</span>
        ) : (
          <span className="block max-w-[220px] truncate" title={summaryStr}>
            {summaryStr}
          </span>
        )}
      </td>

      {/* 2. Thời gian nhập */}
      <td className="p-3 text-slate-500 font-normal">{formatDateShort(receipt.receivedAt)}</td>

      {/* 3. Nhà cung cấp (Thay cho Người lập) */}
      <td className="p-3">
        {supplierDisplayName ? (
          <span className="font-semibold text-slate-800 max-w-[180px] truncate block" title={supplierDisplayName}>
            {supplierDisplayName}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>

      {/* 4. Số lượng */}
      <td className="p-3 text-right">
        {isLoading ? (
          <span className="text-slate-400 font-medium">...</span>
        ) : (
          <span className="font-extrabold text-indigo-600">{totalQty}</span>
        )}
      </td>

      {/* 5. Tổng tiền */}
      <td className="p-3 text-right">
        {isLoading ? (
          <span className="text-slate-400 font-medium">...</span>
        ) : (
          <span className="font-extrabold text-rose-600">{formatCurrency(totalAmount)}</span>
        )}
      </td>

      {/* 6. Ghi chú */}
      <td className="p-3 text-slate-500 max-w-[180px] truncate font-normal" title={receipt.notes}>
        {receipt.notes || "---"}
      </td>
    </tr>
  );
};

export const StockEntryHistoryTable = ({ receipts, onViewDetails }: StockEntryHistoryTableProps) => {
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

  return (
    <div className="w-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-auth-fade-in">
      <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
        Lịch sử Phiếu nhập kho
      </h3>

      <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
              <th className="p-3">Sản phẩm</th>
              <th className="p-3">Thời gian nhập</th>
              <th className="p-3">Nhà cung cấp</th>
              <th className="p-3 text-right">Số lượng</th>
              <th className="p-3 text-right">Tổng tiền</th>
              <th className="p-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
            {receipts.map((receipt) => (
              <StockEntryHistoryRow
                key={receipt.id}
                receipt={receipt}
                supplierMap={supplierMap}
                onClick={() => onViewDetails(receipt.id)}
              />
            ))}
            {receipts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                  Không tìm thấy phiếu nhập kho nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
