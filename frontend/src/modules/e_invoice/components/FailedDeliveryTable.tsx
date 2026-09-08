import React, { useState, useMemo } from "react";
import {
  Send,
  Mail,
  MessageSquare,
  AlertTriangle,
  Search,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import {
  useGetFailedDeliveriesQuery,
} from "../services/invoiceDeliveryApi";
import type { IFailedDeliveryItem } from "../types/IInvoiceDelivery";
import { RetryDeliveryModal } from "./RetryDeliveryModal";

export const FailedDeliveryTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemForRetry, setSelectedItemForRetry] = useState<IFailedDeliveryItem | null>(null);
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);

  const { data: failedResponse, isLoading, refetch, isFetching } = useGetFailedDeliveriesQuery();
  const failedList: IFailedDeliveryItem[] = failedResponse?.result || [];

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return failedList;
    const term = searchTerm.toLowerCase().trim();
    return failedList.filter((item) => {
      return (
        item.lookupCode?.toLowerCase().includes(term) ||
        item.invoiceNumber?.toLowerCase().includes(term) ||
        item.customerName?.toLowerCase().includes(term) ||
        item.customerPhone?.toLowerCase().includes(term) ||
        item.recipientAddress?.toLowerCase().includes(term) ||
        item.failureReason?.toLowerCase().includes(term)
      );
    });
  }, [failedList, searchTerm]);

  const handleOpenRetry = (item: IFailedDeliveryItem) => {
    setSelectedItemForRetry(item);
    setIsRetryModalOpen(true);
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner & Quick Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                Danh Sách Hóa Đơn Giao Khách Thất Bại (NCL-06-CN-005)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-extrabold">
                {failedList.length} lỗi
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Hóa đơn đã được cấp mã hợp lệ nhưng gặp sự cố khi gửi tới Zalo hoặc Email của khách.
            </p>
          </div>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã HĐ, tên, SĐT..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-none focus:border-kv-blue-primary focus:ring-1 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-3 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main Table / Cards View */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-kv-blue-primary/30 border-t-kv-blue-primary rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Đang tải danh sách lỗi...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800">
              Không có hóa đơn nào bị lỗi giao khách
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-sm mx-auto">
              Tất cả các hóa đơn gửi qua Email hoặc Zalo đều đã được giao thành công tới người mua.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã tra cứu / Số HĐ</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Kênh & Địa chỉ</th>
                    <th className="py-3 px-4">Lý do thất bại</th>
                    <th className="py-3 px-4 text-center">Số lần thử</th>
                    <th className="py-3 px-4">Lần gửi cuối</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item, index) => (
                    <tr
                      key={item.id || index}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* STT */}
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Mã HĐ / Lookup code */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold font-mono text-slate-900">
                          {item.lookupCode}
                        </div>
                        {item.invoiceNumber && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            Số: {item.invoiceNumber}
                          </div>
                        )}
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {item.customerName || "Khách mua lẻ"}
                        </div>
                        {item.customerPhone && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {item.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Kênh & Địa chỉ */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          {item.channel === "EMAIL" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-extrabold border border-emerald-200/60">
                              <Mail className="w-3 h-3 text-emerald-600" />
                              <span>Email</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10.5px] font-extrabold border border-blue-200/60">
                              <MessageSquare className="w-3 h-3 text-blue-600" />
                              <span>Zalo</span>
                            </span>
                          )}
                        </div>
                        <div className="text-slate-700 font-medium text-[11px] max-w-[200px] truncate" title={item.recipientAddress}>
                          {item.recipientAddress}
                        </div>
                      </td>

                      {/* Lý do thất bại */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="p-2 rounded-lg bg-rose-50/80 border border-rose-200/60 text-rose-700 text-[11px] font-medium leading-relaxed">
                          {item.failureReason}
                        </div>
                      </td>

                      {/* Số lần thử */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700">
                          {item.attemptCount || 1} lần
                        </span>
                      </td>

                      {/* Lần gửi cuối */}
                      <td className="py-3 px-4 text-slate-500 font-medium text-[11px]">
                        {formatDateTime(item.lastAttemptAt)}
                      </td>

                      {/* Nút gửi lại */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenRetry(item)}
                          className="px-3.5 h-8 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi lại</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List (< 640px) */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredItems.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-extrabold font-mono text-slate-900 text-sm">
                      {item.lookupCode}
                    </div>
                    {item.customerName && (
                      <div className="text-xs font-bold text-slate-700 mt-0.5">
                        {item.customerName}
                      </div>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold">
                    Thử {item.attemptCount || 1} lần
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-semibold">Kênh:</span>
                  <span className="font-bold text-slate-800">
                    {item.channel} ({item.recipientAddress})
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {item.failureReason}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-[10.5px] text-slate-400">
                    {formatDateTime(item.lastAttemptAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenRetry(item)}
                    className="px-4 h-9 rounded-lg bg-kv-blue-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi lại</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Retry Modal Portal */}
      <RetryDeliveryModal
        isOpen={isRetryModalOpen}
        onClose={() => {
          setIsRetryModalOpen(false);
          setSelectedItemForRetry(null);
        }}
        item={selectedItemForRetry}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};
