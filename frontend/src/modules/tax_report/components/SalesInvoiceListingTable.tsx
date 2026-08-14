import React from "react";
import type {
  EInvoiceTaxListingStatus,
  ISalesInvoiceListingItem,
} from "../types/salesInvoiceListing.types";

interface ISalesInvoiceListingTableProps {
  items: ISalesInvoiceListingItem[];
  isLoading?: boolean;
  page?: number;
  limit?: number;
  totalElements?: number;
  totalPages?: number;
  onPageChange?: (newPage: number) => void;
}

export const SalesInvoiceListingTable: React.FC<ISalesInvoiceListingTableProps> = ({
  items,
  isLoading = false,
  page = 1,
  limit = 20,
  totalElements = 0,
  totalPages = 1,
  onPageChange,
}) => {
  const formatVnd = (val: number) =>
    new Intl.NumberFormat("vi-VN").format(val);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("vi-VN");
    } catch {
      return isoStr;
    }
  };

  const renderStatusBadge = (status: EInvoiceTaxListingStatus) => {
    switch (status) {
      case "GRANTED_CODE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Đã cấp mã
          </span>
        );
      case "CANCELED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            Đã hủy
          </span>
        );
      case "ADJUSTED_REDUCED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            ĐC Giảm
          </span>
        );
      case "ADJUSTED_INCREASED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            ĐC Tăng
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mx-auto mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-3 text-center w-12">STT</th>
              <th className="py-3 px-3">Ký hiệu HĐ</th>
              <th className="py-3 px-3">Số HĐ</th>
              <th className="py-3 px-3">Ngày lập</th>
              <th className="py-3 px-4">Tên người mua</th>
              <th className="py-3 px-3">MST người mua</th>
              <th className="py-3 px-4 text-right">Doanh thu (VND)</th>
              <th className="py-3 px-2 text-center">Thuế %</th>
              <th className="py-3 px-4 text-right">Tiền thuế (VND)</th>
              <th className="py-3 px-4 text-right">Tổng tiền (VND)</th>
              <th className="py-3 px-3">Mã CQT cấp</th>
              <th className="py-3 px-3 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
            {items.map((item, index) => {
              const rowStt = (page - 1) * limit + index + 1;
              const isCanceled = item.status === "CANCELED";

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    isCanceled ? "bg-rose-50/40 text-slate-400 line-through opacity-70" : ""
                  }`}
                >
                  <td className="py-3 px-3 text-center font-bold text-slate-500">
                    {rowStt}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {item.invoiceSymbol}
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-600">
                    {item.invoiceNumber}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {formatDate(item.issuedDate)}
                  </td>
                  <td className="py-3 px-4 max-w-[200px] truncate font-medium text-slate-800">
                    {item.customerName || "Khách hàng lẻ"}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]">
                    {item.customerTaxCode || "-"}
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${isCanceled ? "text-slate-400" : "text-slate-800"}`}>
                    {formatVnd(item.revenue)}
                  </td>
                  <td className="py-3 px-2 text-center font-semibold">
                    {item.taxRate}%
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${isCanceled ? "text-slate-400" : "text-indigo-600"}`}>
                    {formatVnd(item.taxAmount)}
                  </td>
                  <td className={`py-3 px-4 text-right font-extrabold ${isCanceled ? "text-slate-400" : "text-emerald-700"}`}>
                    {formatVnd(item.totalAmount)}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600 max-w-[140px] truncate" title={item.taxAuthorityCode}>
                    {item.taxAuthorityCode || "-"}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {renderStatusBadge(item.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 font-medium">
          Hiển thị dòng <strong className="text-slate-700">{(page - 1) * limit + 1}</strong> đến{" "}
          <strong className="text-slate-700">{Math.min(page * limit, totalElements)}</strong> trong tổng số{" "}
          <strong className="text-slate-700">{totalElements}</strong> hóa đơn
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="px-3 py-1 font-bold text-slate-700">
            {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};
