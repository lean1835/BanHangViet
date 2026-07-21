import { useGetGoodsReceiptByIdQuery } from "../services/productApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateFormatter";

export interface IGoodsReceipt {
  id: string;
  receiptNumber: string;
  receivedAt: string; // ISO LocalDateTime string
  notes: string;
  createdByUserName: string;
}

interface StockEntryHistoryTableProps {
  receipts: IGoodsReceipt[];
  onViewDetails: (id: string) => void;
}

// Sub-component to fetch and render the total amount of a receipt
const GoodsReceiptTotal = ({ receiptId }: { receiptId: string }) => {
  const { data: detailData } = useGetGoodsReceiptByIdQuery(receiptId);
  if (!detailData) return <span className="text-slate-400 font-medium">...</span>;
  const details = detailData.details || [];
  const totalAmount = details.reduce(
    (sum: number, d: any) => sum + Number(d.quantity || 0) * Number(d.purchasePrice || 0),
    0
  );
  return <span className="font-extrabold text-rose-600">{formatCurrency(totalAmount)}</span>;
};

// Sub-component to fetch and render the total quantity of items in a receipt
const GoodsReceiptTotalQuantity = ({ receiptId }: { receiptId: string }) => {
  const { data: detailData } = useGetGoodsReceiptByIdQuery(receiptId);
  if (!detailData) return <span className="text-slate-400 font-medium">...</span>;
  const details = detailData.details || [];
  const totalQty = details.reduce(
    (sum: number, d: any) => sum + Number(d.quantity || 0),
    0
  );
  return <span className="font-extrabold text-indigo-600">{totalQty}</span>;
};

// Sub-component to fetch and render the summary of product names in a receipt
const GoodsReceiptProductsSummary = ({ receiptId }: { receiptId: string }) => {
  const { data: detailData } = useGetGoodsReceiptByIdQuery(receiptId);
  if (!detailData) return <span className="text-slate-400 font-medium">Đang tải...</span>;
  const details = detailData.details || [];
  if (details.length === 0) return <span className="text-slate-400">---</span>;
  const summaryStr = details.map((d: any) => d.productName).join(", ");
  return (
    <span className="text-slate-500 font-bold block max-w-[200px] truncate" title={summaryStr}>
      {summaryStr}
    </span>
  );
};

export const StockEntryHistoryTable = ({ receipts, onViewDetails }: StockEntryHistoryTableProps) => {
  return (
    <div className="w-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-auth-fade-in">
      <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
        Lịch sử Phiếu nhập kho (Từ Database)
      </h3>

      <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
              <th className="p-3">Mã phiếu</th>
              <th className="p-3">Thời gian nhập</th>
              <th className="p-3">Người lập</th>
              <th className="p-3">Sản phẩm</th>
              <th className="p-3 text-right">Số lượng</th>
              <th className="p-3 text-right">Tổng tiền</th>
              <th className="p-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
            {receipts.map((receipt) => (
              <tr
                key={receipt.id}
                onClick={() => onViewDetails(receipt.id)}
                className="hover:bg-slate-50/70 cursor-pointer transition-all duration-150"
                title="Nhấp để xem chi tiết phiếu nhập"
              >
                <td className="p-3 font-mono font-bold text-slate-600">
                  {receipt.receiptNumber.toUpperCase()}
                </td>
                <td className="p-3 text-slate-500">{formatDateShort(receipt.receivedAt)}</td>
                <td className="p-3 font-bold text-slate-700">{receipt.createdByUserName}</td>
                <td className="p-3">
                  <GoodsReceiptProductsSummary receiptId={receipt.id} />
                </td>
                <td className="p-3 text-right">
                  <GoodsReceiptTotalQuantity receiptId={receipt.id} />
                </td>
                <td className="p-3 text-right">
                  <GoodsReceiptTotal receiptId={receipt.id} />
                </td>
                <td className="p-3 text-slate-500 max-w-[200px] truncate" title={receipt.notes}>
                  {receipt.notes || "---"}
                </td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
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
