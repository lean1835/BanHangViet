import React from "react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateFormatter";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import type { ISupplierReturn } from "../types/ISupplierReturn";
import { RotateCcw, FileText, Printer } from "lucide-react";

interface SupplierReturnTableProps {
  returns: ISupplierReturn[];
  onViewDetails: (id: string) => void;
  page?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
  onPageChange?: (newPage: number) => void;
}

export const SupplierReturnTable: React.FC<SupplierReturnTableProps> = ({
  returns,
  onViewDetails,
  page = 0,
  pageSize = 10,
  totalElements = 0,
  totalPages = 0,
  onPageChange,
}) => {
  const displayTotal = totalElements || returns.length;

  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-auth-fade-in flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-rose-600" />
              <span>Danh sách Phiếu trả hàng cho nhà cung cấp</span>
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {displayTotal} phiếu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3">Mã phiếu trả</th>
                <th className="p-3">Phiếu nhập gốc</th>
                <th className="p-3">Nhà cung cấp</th>
                <th className="p-3">Thời gian trả</th>
                <th className="p-3">Lý do</th>
                <th className="p-3 text-center">Số món</th>
                <th className="p-3 text-right">Tổng tiền trả (đ)</th>
                <th className="p-3">Người lập</th>
                <th className="p-3 w-24 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
              {returns.map((ret, index) => {
                const supplierDisplayName = ret.supplierName || "— (Nhập lẻ)";

                return (
                  <tr
                    key={ret.id}
                    onClick={() => onViewDetails(ret.id)}
                    className="hover:bg-rose-50/40 cursor-pointer transition-all duration-150 group"
                    title="Nhấp để xem chi tiết phiếu trả hàng"
                  >
                    {/* 1. STT */}
                    <td className="p-3 text-center text-slate-400 font-bold">
                      {page * pageSize + index + 1}
                    </td>

                    {/* 2. Mã phiếu trả */}
                    <td className="p-3 font-extrabold text-slate-800">
                      <span className="text-rose-600 hover:underline">
                        {ret.returnNumber}
                      </span>
                    </td>

                    {/* 3. Mã phiếu nhập gốc */}
                    <td className="p-3 font-semibold text-slate-600">
                      {ret.receiptNumber || ret.receiptId || "—"}
                    </td>

                    {/* 4. Nhà cung cấp */}
                    <td className="p-3 font-semibold text-slate-700">
                      <span
                        className="block max-w-[200px] truncate"
                        title={supplierDisplayName}
                      >
                        {supplierDisplayName}
                      </span>
                    </td>

                    {/* 5. Thời gian trả */}
                    <td className="p-3 text-slate-500 font-normal">
                      {formatDateShort(ret.returnDate)}
                    </td>

                    {/* 6. Lý do */}
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {ret.reason}
                      </span>
                    </td>

                    {/* 7. Số món */}
                    <td className="p-3 text-center font-bold text-slate-600">
                      {formatNumber(ret.totalItems || 0)}
                    </td>

                    {/* 8. Tổng tiền trả */}
                    <td className="p-3 text-right font-extrabold text-rose-600">
                      {formatCurrency(ret.totalReturnAmount || 0)}
                    </td>

                    {/* 9. Người lập */}
                    <td className="p-3 text-slate-500">
                      {ret.createdByUserName || "—"}
                    </td>

                    {/* 10. Action */}
                    <td
                      className="p-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onViewDetails(ret.id)}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-slate-600 transition-all shadow-2xs group/btn inline-flex items-center justify-center"
                        title="Xem và in phiếu trả hàng nhà cung cấp"
                        aria-label="In phiếu"
                      >
                        <Printer className="h-4 w-4 text-slate-500 group-hover/btn:text-rose-600 transition-colors" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {returns.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="p-12 text-center text-slate-400 font-semibold"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-9 w-9 text-slate-300 stroke-[1.5]" />
                      <span>Không tìm thấy phiếu trả hàng nhà cung cấp nào.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

export default SupplierReturnTable;
