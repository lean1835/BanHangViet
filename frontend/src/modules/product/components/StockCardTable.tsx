import React from "react";
import { ExternalLink, FileText, Inbox } from "lucide-react";
import { formatNumber } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateFormatter";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import {
  STOCK_MOVEMENT_TYPE_COLORS,
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_CARD_MESSAGES,
} from "@/constants/product";
import type { IStockMovement } from "@/modules/product/types/IStockCard";

interface StockCardTableProps {
  movements: IStockMovement[];
  unit: string;
  isLoading?: boolean;
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenDocument?: (movement: IStockMovement) => void;
}

export const StockCardTable: React.FC<StockCardTableProps> = ({
  movements,
  unit,
  isLoading = false,
  page,
  pageSize,
  totalElements,
  totalPages,
  onPageChange,
  onOpenDocument,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-2xs text-slate-500">
        <div className="w-8 h-8 border-3 border-kv-blue-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-600">
          {STOCK_CARD_MESSAGES.LOADING}
        </span>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-2xs text-slate-400">
        <Inbox className="w-12 h-12 text-slate-300 stroke-[1.5] mb-2" />
        <span className="text-sm font-bold text-slate-600">
          {STOCK_CARD_MESSAGES.NO_DATA}
        </span>
        <span className="text-xs text-slate-400 mt-1">
          Hãy thử mở rộng khoảng thời gian tra cứu từ ngày - đến ngày.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 select-none">
              <th scope="col" className="py-3 px-3 w-12 text-center">
                STT
              </th>
              <th scope="col" className="py-3 px-3 w-36">
                Thời gian
              </th>
              <th scope="col" className="py-3 px-3 w-40">
                Loại chứng từ
              </th>
              <th scope="col" className="py-3 px-3 w-36">
                Số chứng từ
              </th>
              <th scope="col" className="py-3 px-3 w-36">
                Người thực hiện
              </th>
              <th scope="col" className="py-3 px-3 text-center w-28 text-emerald-700">
                Số lượng Nhập
              </th>
              <th scope="col" className="py-3 px-3 text-center w-28 text-rose-700">
                Số lượng Xuất
              </th>
              <th scope="col" className="py-3 px-3 text-right w-32 text-slate-700">
                Tồn sau biến động
              </th>
              <th scope="col" className="py-3 px-3 min-w-[180px]">
                Ghi chú / Quy đổi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {movements.map((movement, index) => {
              const rowNumber = page * pageSize + index + 1;
              const typeColor =
                STOCK_MOVEMENT_TYPE_COLORS[movement.documentType] || {
                  bg: "bg-slate-100",
                  text: "text-slate-700",
                  border: "border-slate-200",
                };
              const typeLabel =
                STOCK_MOVEMENT_TYPE_LABELS[movement.documentType] ||
                movement.documentTypeName ||
                movement.documentType;

              return (
                <tr
                  key={movement.id || `${movement.documentId}-${index}`}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* STT */}
                  <td className="py-3 px-3 text-center text-slate-400 font-semibold text-xs">
                    {rowNumber}
                  </td>

                  {/* Thời gian */}
                  <td className="py-3 px-3 text-slate-600 font-semibold text-[11px] whitespace-nowrap">
                    {formatDateShort(movement.timestamp)}
                  </td>

                  {/* Loại chứng từ */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}
                    >
                      {typeLabel}
                    </span>
                  </td>

                  {/* Số chứng từ - Clickable mở chứng từ gốc (TC-02) */}
                  <td className="py-3 px-3 font-mono font-bold">
                    <button
                      type="button"
                      onClick={() => onOpenDocument?.(movement)}
                      title={`Mở chứng từ gốc: ${movement.documentNumber || movement.documentId}`}
                      className="inline-flex items-center gap-1 text-kv-blue-primary hover:text-kv-blue-dark hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-blue-primary rounded text-xs font-bold"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span className="truncate max-w-[110px]">
                        {movement.documentNumber || movement.documentId}
                      </span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-50 group-hover:opacity-100" />
                    </button>
                  </td>

                  {/* Người thực hiện */}
                  <td className="py-3 px-3 text-slate-600 font-semibold truncate max-w-[130px]">
                    {movement.performedBy || "Hệ thống"}
                  </td>

                  {/* Số lượng Nhập */}
                  <td className="py-3 px-3 text-center text-xs">
                    {movement.quantityIn > 0 ? (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                        +{formatNumber(movement.quantityIn)}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-medium">-</span>
                    )}
                  </td>

                  {/* Số lượng Xuất */}
                  <td className="py-3 px-3 text-center text-xs">
                    {movement.quantityOut > 0 ? (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-bold">
                        -{formatNumber(movement.quantityOut)}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-medium">-</span>
                    )}
                  </td>

                  {/* Tồn sau biến động */}
                  <td className="py-3 px-3 text-right text-xs whitespace-nowrap">
                    <span className="font-bold text-slate-900">
                      {formatNumber(movement.balanceAfter)}
                    </span>
                    <span className="text-slate-400 font-normal ml-1">
                      {unit}
                    </span>
                  </td>

                  {/* Ghi chú / Quy đổi */}
                  <td className="py-3 px-3 text-slate-600 text-xs break-words">
                    {movement.notes || (
                      <span className="text-slate-300 italic text-[11px]">
                        Không có ghi chú
                      </span>
                    )}
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
        totalElements={totalElements}
        totalPages={totalPages}
        onPageChange={onPageChange}
        recordUnit="biến động"
      />
    </div>
  );
};

export default StockCardTable;
