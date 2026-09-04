import React from "react";
import type {
  EInvoiceType,
  ITaxSalesRegisterItem,
} from "../types/salesInvoiceListing.types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";

interface ISalesInvoiceListingTableProps {
  items: ITaxSalesRegisterItem[];
  isLoading?: boolean;
  page?: number; // 0-indexed
  size?: number;
  totalElements?: number;
  totalPages?: number;
  onPageChange?: (newPage: number) => void;
}

export const SalesInvoiceListingTable: React.FC<ISalesInvoiceListingTableProps> = ({
  items,
  isLoading = false,
  page = 0,
  size = 8,
  totalElements = 0,
  totalPages = 1,
  onPageChange,
}) => {
  const getTaxRateBadgeStyle = (percentage: number) => {
    switch (percentage) {
      case 10:
        return "bg-rose-50 text-rose-700 border-rose-200";
      case 8:
        return "bg-blue-50 text-blue-700 border-blue-200";
      case 5:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case 3:
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case 1:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case 0:
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-teal-50 text-teal-700 border-teal-200";
    }
  };

  const renderInvoiceTypeBadge = (type: EInvoiceType) => {
    switch (type) {
      case "ORIGINAL":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            HĐ Gốc
          </span>
        );
      case "ADJUSTMENT_DECREASE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            ĐC Giảm (-)
          </span>
        );
      case "ADJUSTMENT_INCREASE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            ĐC Tăng (+)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Kỳ chưa có hóa đơn hợp lệ
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Không tìm thấy hóa đơn được Cơ quan thuế cấp mã trong kỳ đã chọn. Hệ thống không tạo bảng kê rỗng.
        </p>
      </div>
    );
  }

  const pageTotalRevenue = items.reduce((acc, curr) => acc + curr.revenueAmount, 0);
  const pageTotalTax = items.reduce((acc, curr) => acc + curr.taxAmount, 0);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] w-full">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm">
            Bảng kê chi tiết Hóa đơn bán ra theo kỳ
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {totalElements} hóa đơn
        </span>
      </div>

      <div className="flex flex-col flex-1 justify-between">
        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                <th className="p-3 text-center w-12">STT</th>
                <th className="p-3">Ký hiệu HĐ</th>
                <th className="p-3">Số HĐ</th>
                <th className="p-3">Ngày lập</th>
                <th className="p-3 min-w-[160px]">Tên người mua</th>
                <th className="p-3 text-right">Doanh thu</th>
                <th className="p-3 text-center">Thuế %</th>
                <th className="p-3 text-right bg-indigo-50/80 text-indigo-900 border-x border-indigo-100 font-bold">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                    <span>Tiền thuế</span>
                  </div>
                </th>
                <th className="p-3 text-center">Loại HĐ</th>
                <th className="p-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
              {items.map((item, index) => {
                const rowStt = page * size + index + 1;
                const isAdjustmentDecrease = item.invoiceType === "ADJUSTMENT_DECREASE";

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/50 group transition-all ${
                      isAdjustmentDecrease ? "bg-amber-50/30" : ""
                    }`}
                  >
                    <td className="p-3 text-center font-mono font-bold text-slate-400">
                      {rowStt}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {item.invoiceSymbol}
                    </td>
                    <td className="p-3 font-bold text-blue-600 font-mono">
                      {item.invoiceNumber}
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-600 font-medium">
                      {formatDate(item.issueDate)}
                    </td>
                    <td className="p-3 max-w-[200px] truncate font-semibold text-slate-800" title={item.buyerName || "Khách hàng lẻ"}>
                      {item.buyerName || "Khách hàng lẻ"}
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${
                        isAdjustmentDecrease ? "text-amber-700" : "text-slate-800"
                      }`}
                    >
                      {formatCurrency(item.revenueAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded font-bold text-xs border shrink-0 ${getTaxRateBadgeStyle(
                          item.taxRatePercentage
                        )}`}
                      >
                        {item.taxRatePercentage}%
                      </span>
                    </td>
                    {/* Nổi bật cột Tiền thuế */}
                    <td
                      className={`p-3 text-right font-bold border-x border-indigo-100/60 text-xs ${
                        isAdjustmentDecrease ? "text-amber-700 bg-amber-50/40" : "text-indigo-700 bg-indigo-50/40"
                      }`}
                    >
                      {formatCurrency(item.taxAmount)}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {renderInvoiceTypeBadge(item.invoiceType)}
                    </td>
                    <td className="p-3 text-slate-500 max-w-[150px] truncate" title={item.notes || "-"}>
                      {item.notes || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Footer Total Row */}
            {items.length > 0 && (
              <tfoot className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
                <tr>
                  <td colSpan={5} className="p-3 text-right uppercase tracking-wider text-xs font-bold text-slate-700">
                    Tổng cộng trang này ({items.length} HĐ):
                  </td>
                  <td className="p-3 text-right text-blue-700 text-xs font-bold">
                    {formatCurrency(pageTotalRevenue)}
                  </td>
                  <td className="p-3 text-center text-xs text-slate-400">-</td>
                  {/* Nổi bật Tổng tiền thuế */}
                  <td className="p-3 text-right bg-indigo-100/80 border-x border-indigo-200">
                    <span className="inline-block bg-indigo-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-xs">
                      {formatCurrency(pageTotalTax)}
                    </span>
                  </td>
                  <td colSpan={2} className="p-3 text-xs text-slate-500 font-normal">
                    (Đã loại HĐ hủy, trừ HĐ giảm)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Footer */}
        {onPageChange && (
          <TablePaginationFooter
            currentPage={page}
            pageSize={size}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={onPageChange}
            recordUnit="hóa đơn"
          />
        )}
      </div>
    </div>
  );
};
