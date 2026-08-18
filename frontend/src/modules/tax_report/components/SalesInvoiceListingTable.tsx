import React from "react";
import type {
  EInvoiceType,
  ITaxSalesRegisterItem,
} from "../types/salesInvoiceListing.types";

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
  size = 20,
  totalElements = 0,
  totalPages = 1,
  onPageChange,
}) => {
  const formatVnd = (val: number) =>
    new Intl.NumberFormat("vi-VN").format(val);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            HĐ Gốc
          </span>
        );
      case "ADJUSTMENT_DECREASE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
            ĐC Giảm (-)
          </span>
        );
      case "ADJUSTMENT_INCREASE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
            ĐC Tăng (+)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Title Bar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Bảng kê chi tiết Hóa đơn bán ra theo kỳ (NCL-12-CN-001)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh sách toàn bộ hóa đơn đã được cấp mã hợp lệ phát sinh trong kỳ kê khai
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
          Tổng số hóa đơn: <strong className="text-slate-800">{totalElements}</strong>
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3.5 px-3 text-center w-12">STT</th>
              <th className="py-3.5 px-3">Mẫu số</th>
              <th className="py-3.5 px-3">Ký hiệu HĐ</th>
              <th className="py-3.5 px-3">Số HĐ</th>
              <th className="py-3.5 px-3">Ngày lập</th>
              <th className="py-3.5 px-4 min-w-[160px]">Tên người mua</th>
              <th className="py-3.5 px-3">MST người mua</th>
              <th className="py-3.5 px-4 text-right">Doanh thu (VND)</th>
              <th className="py-3.5 px-3 text-center">Thuế %</th>
              <th className="py-3.5 px-4 text-right bg-indigo-50/80 text-indigo-900 border-x border-indigo-100 font-black">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span>Tiền thuế (VND)</span>
                </div>
              </th>
              <th className="py-3.5 px-3 text-center">Loại HĐ</th>
              <th className="py-3.5 px-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {items.map((item, index) => {
              const rowStt = page * size + index + 1;
              const isAdjustmentDecrease = item.invoiceType === "ADJUSTMENT_DECREASE";

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isAdjustmentDecrease ? "bg-amber-50/30" : ""
                  }`}
                >
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400">
                    {rowStt}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-600">
                    {item.invoicePattern}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-800">
                    {item.invoiceSymbol}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-blue-600 font-mono">
                    {item.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                    {formatDate(item.issueDate)}
                  </td>
                  <td className="py-3.5 px-4 max-w-[200px] truncate font-semibold text-slate-800" title={item.buyerName || "Khách hàng lẻ"}>
                    {item.buyerName || "Khách hàng lẻ"}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                    {item.buyerTaxCode || "-"}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-mono font-bold ${
                      isAdjustmentDecrease ? "text-amber-700 font-extrabold" : "text-slate-800"
                    }`}
                  >
                    {formatVnd(item.revenueAmount)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-mono font-black text-xs border shrink-0 ${getTaxRateBadgeStyle(
                        item.taxRatePercentage
                      )}`}
                    >
                      {item.taxRatePercentage}%
                    </span>
                  </td>
                  {/* Nổi bật cột Tiền thuế */}
                  <td
                    className={`py-3.5 px-4 text-right font-mono font-black border-x border-indigo-100/60 text-[13px] ${
                      isAdjustmentDecrease ? "text-amber-700 bg-amber-50/40" : "text-indigo-700 bg-indigo-50/40"
                    }`}
                  >
                    {formatVnd(item.taxAmount)}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    {renderInvoiceTypeBadge(item.invoiceType)}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500 max-w-[150px] truncate" title={item.notes || "-"}>
                    {item.notes || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer Total Row */}
          {items.length > 0 && (
            <tfoot className="bg-slate-100 text-slate-900 font-extrabold border-t-2 border-slate-300">
              <tr>
                <td colSpan={7} className="py-3.5 px-4 text-right uppercase tracking-wider text-xs font-black text-slate-700">
                  Tổng cộng trang này ({items.length} HĐ):
                </td>
                <td className="py-3.5 px-4 text-right text-blue-700 font-mono text-sm font-bold">
                  {formatVnd(pageTotalRevenue)}
                </td>
                <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-400">-</td>
                {/* Nổi bật Tổng tiền thuế */}
                <td className="py-3.5 px-4 text-right bg-indigo-100/80 border-x border-indigo-200">
                  <span className="inline-block bg-indigo-600 text-white font-mono font-black text-xs px-2.5 py-1 rounded-lg shadow-xs">
                    {formatVnd(pageTotalTax)}
                  </span>
                </td>
                <td colSpan={2} className="py-3.5 px-4 text-xs text-slate-500 font-normal">
                  (Đã loại HĐ hủy, trừ HĐ giảm)
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3.5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 font-medium">
          Hiển thị dòng <strong className="text-slate-700">{totalElements === 0 ? 0 : page * size + 1}</strong> đến{" "}
          <strong className="text-slate-700">{Math.min((page + 1) * size, totalElements)}</strong> trong tổng số{" "}
          <strong className="text-slate-700">{totalElements}</strong> dòng hóa đơn
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 0}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
          >
            Trang trước
          </button>
          <span className="px-3 py-1 font-bold text-slate-700 font-mono">
            {page + 1} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
          >
            Trang sau
          </button>
        </div>
      </div>
    </div>
  );
};
