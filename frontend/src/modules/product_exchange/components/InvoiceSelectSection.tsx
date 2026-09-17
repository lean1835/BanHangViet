import React, { useState, useMemo } from "react";
import { Search, Receipt, AlertTriangle, CheckCircle2, User, Phone, Calendar } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetInvoicesQuery } from "@/modules/e_invoice/services/eInvoiceApi";
import { formatDate } from "@/utils/dateFormatter";
import { formatCurrency } from "@/utils/formatCurrency";
import { getDaysSinceIssued } from "../utils/productExchangeHelpers";
import { PRODUCT_EXCHANGE_CONFIG } from "@/constants/productExchange";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";

interface InvoiceSelectSectionProps {
  selectedInvoice: IInvoice | null;
  onSelectInvoice: (invoice: IInvoice) => void;
  onClearInvoice: () => void;
}

export const InvoiceSelectSection: React.FC<InvoiceSelectSectionProps> = ({
  selectedInvoice,
  onSelectInvoice,
  onClearInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 350);

  const { data: invoicesData, isLoading } = useGetInvoicesQuery({
    status: "ISSUED",
    search: debouncedSearch.trim() || undefined,
    page: 0,
    size: 20,
  });

  const invoices = useMemo(() => {
    return invoicesData?.result?.content || [];
  }, [invoicesData]);

  const maxDays = PRODUCT_EXCHANGE_CONFIG.DEFAULT_MAX_DAYS;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
              1. Chọn Hóa Đơn Gốc
            </h3>
          </div>
        </div>

        {selectedInvoice && (
          <button
            type="button"
            onClick={onClearInvoice}
            className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline"
          >
            Đổi hóa đơn khác
          </button>
        )}
      </div>

      {!selectedInvoice ? (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập số hóa đơn (1C26...), mã tra cứu, tên khách hoặc số điện thoại..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-slate-400">
                Đang tìm kiếm danh sách hóa đơn...
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                Không tìm thấy hóa đơn phù hợp hoặc không đủ điều kiện đổi hàng
              </div>
            ) : (
              invoices.map((inv) => {
                const days = getDaysSinceIssued(inv.createdAt);
                const isOverdue = days > maxDays;

                return (
                  <div
                    key={inv.id}
                    onClick={() => !isOverdue && onSelectInvoice(inv)}
                    className={`p-3.5 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isOverdue
                        ? "border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20 opacity-75 cursor-not-allowed"
                        : "border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500/50 cursor-pointer shadow-sm hover:shadow"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-semibold">
                        {inv.invoiceNumber || inv.lookupCode || "HD-Chưa cấp số"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                            {inv.buyerName || "Khách lẻ tại quầy"}
                          </span>
                          {inv.buyerPhone && (
                            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Phone className="w-3 h-3" />
                              {inv.buyerPhone}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(inv.createdAt || "")}
                          </span>
                          <span>•</span>
                          <span>
                            {days === 0 ? "Hôm nay" : `Đã mua ${days} ngày`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 self-end md:self-center">
                      <div className="text-right">
                        <span className="block text-xs text-slate-400">Tổng hóa đơn</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {formatCurrency(inv.finalAmount || inv.amount || 0)}
                        </span>
                      </div>

                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3" /> Quá {maxDays} ngày
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Chọn hóa đơn
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-50 text-base">
                  Hóa đơn: {selectedInvoice.invoiceNumber || selectedInvoice.lookupCode}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Đủ điều kiện đổi hàng
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {selectedInvoice.buyerName || "Khách lẻ"}
                </span>
                {selectedInvoice.buyerPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedInvoice.buyerPhone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(selectedInvoice.createdAt || "")}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right border-t md:border-t-0 pt-2 md:pt-0 border-emerald-200/60 dark:border-emerald-800/60">
            <span className="block text-xs text-slate-500 dark:text-slate-400">Tổng giá trị gốc</span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
              {formatCurrency(selectedInvoice.finalAmount || selectedInvoice.amount || 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
