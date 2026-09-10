import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RotateCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Zap,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import { APP_ROUTES } from "@/constants/routes";
import {
  useGetManualProcessingInvoicesQuery,
  useTriggerAutoRetryMutation,
  useResendAutoRetryInvoiceMutation,
} from "../services/eInvoiceApi";
import { getStatusClassName, getStatusLabel } from "../utils/eInvoiceHelpers";
import type { IInvoiceAutoRetrySummaryResponse } from "../types/IAutoRetry";

import type { TRetryErrorCategoryFilter, TRetryCountFilter } from "./AutoRetrySidebar";

interface AutoRetryQueuePanelProps {
  searchQuery?: string;
  errorCategoryFilter?: TRetryErrorCategoryFilter;
  retryCountFilter?: TRetryCountFilter;
  onTotalCountChange?: (count: number) => void;
}

const PAGE_SIZE = 10;

export const AutoRetryQueuePanel: React.FC<AutoRetryQueuePanelProps> = ({
  searchQuery = "",
  errorCategoryFilter = "ALL",
  retryCountFilter = "ALL",
  onTotalCountChange,
}) => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useNotification();
  const [page, setPage] = useState(0);
  const [batchSummary, setBatchSummary] = useState<IInvoiceAutoRetrySummaryResponse | null>(null);

  // Queries & Mutations
  const {
    data: manualData,
    isLoading,
    isFetching,
    refetch,
  } = useGetManualProcessingInvoicesQuery({ page, size: PAGE_SIZE });

  const [triggerRetry, { isLoading: isTriggering }] = useTriggerAutoRetryMutation();
  const [resendSingle, { isLoading: isResending }] = useResendAutoRetryInvoiceMutation();

  const invoices = manualData?.result?.content || [];
  const totalElements = manualData?.result?.totalElements ?? invoices.length;
  const totalPages = manualData?.result?.totalPages ?? Math.ceil(totalElements / PAGE_SIZE);

  React.useEffect(() => {
    if (onTotalCountChange) {
      onTotalCountChange(totalElements);
    }
  }, [totalElements, onTotalCountChange]);

  const displayedInvoices = React.useMemo(() => {
    return invoices.filter((inv) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchLookup = (inv.lookupCode || "").toLowerCase().includes(q);
        const matchNum = (inv.invoiceNumber || "").toLowerCase().includes(q);
        const matchCust = (inv.buyerName || inv.customer || "").toLowerCase().includes(q);
        const matchTax = (inv.buyerTaxCode || "").toLowerCase().includes(q);
        if (!matchLookup && !matchNum && !matchCust && !matchTax) return false;
      }

      if (errorCategoryFilter !== "ALL") {
        const cat = (inv.errorCategory || "").toUpperCase();
        const msg = (inv.taxAuthorityResponse || "").toLowerCase();
        if (errorCategoryFilter === "INVALID_TAX_CODE") {
          if (!cat.includes("TAX_CODE") && !msg.includes("thuế") && !msg.includes("mst")) return false;
        } else if (errorCategoryFilter === "NETWORK_ERROR") {
          if (!cat.includes("NETWORK") && !cat.includes("GATEWAY") && !msg.includes("kết nối")) return false;
        } else if (errorCategoryFilter === "MAX_RETRY") {
          if ((inv.retryCount ?? 0) < 3) return false;
        }
      }

      if (retryCountFilter !== "ALL") {
        const count = inv.retryCount ?? 0;
        if (retryCountFilter === "HIGH" && count < 3) return false;
        if (retryCountFilter === "LOW" && count >= 3) return false;
      }

      return true;
    });
  }, [invoices, searchQuery, errorCategoryFilter, retryCountFilter]);

  const handleTriggerBatch = async () => {
    try {
      const res = await triggerRetry().unwrap();
      const summary = res.result;
      setBatchSummary(summary);
      if (summary.successCount > 0) {
        showSuccess(`Đã gửi lại thành công ${summary.successCount} hóa đơn!`);
      } else if (summary.totalProcessed === 0) {
        showWarning("Không có hóa đơn nào đủ điều kiện quét tự động gửi lại lúc này.");
      } else {
        showWarning(`Đã xử lý ${summary.totalProcessed} hóa đơn. Thất bại: ${summary.failedCount}.`);
      }
      refetch();
    } catch (err) {
      showError(getApiErrorMessage(err, "Không thể kích hoạt tiến trình tự động gửi lại"));
    }
  };

  const handleResendSingle = async (invoiceId: string) => {
    try {
      await resendSingle(invoiceId).unwrap();
      showSuccess("Đã yêu cầu gửi lại hóa đơn lên Cơ quan Thuế thành công!");
      refetch();
    } catch (err) {
      showError(getApiErrorMessage(err, "Không thể gửi lại hóa đơn"));
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Action Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Tự động gửi lại theo lịch & Xử lý thủ công (NCL-04-CN-007)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Quét gửi lại các hóa đơn lỗi kết nối và gom các hóa đơn sai thông tin cần người xử lý
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerBatch}
            disabled={isTriggering}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isTriggering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-amber-300" />
            )}
            <span>{isTriggering ? "Đang quét & gửi lại..." : "Quét & Gửi lại ngay"}</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Làm mới danh sách"
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isFetching ? "animate-spin text-kv-blue-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* Batch Summary Result Callout */}
      {batchSummary && (
        <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 shadow-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-blue-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Kết quả tiến trình quét tự động gửi lại gần nhất
            </h4>
            <button
              type="button"
              onClick={() => setBatchSummary(null)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Đóng thông báo
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-white p-3 rounded-xl border border-blue-100">
              <div className="text-[11px] font-bold text-slate-400">Tổng quét</div>
              <div className="text-xl font-extrabold font-mono text-slate-800 mt-0.5">
                {batchSummary.totalProcessed}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-blue-100">
              <div className="text-[11px] font-bold text-emerald-600">Thành công</div>
              <div className="text-xl font-extrabold font-mono text-emerald-700 mt-0.5">
                {batchSummary.successCount}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-blue-100">
              <div className="text-[11px] font-bold text-rose-500">Thất bại</div>
              <div className="text-xl font-extrabold font-mono text-rose-600 mt-0.5">
                {batchSummary.failedCount}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-blue-100">
              <div className="text-[11px] font-bold text-amber-600">Chuyển thủ công</div>
              <div className="text-xl font-extrabold font-mono text-amber-700 mt-0.5">
                {batchSummary.movedToManualCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Processing List Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-800 text-sm">
              Danh sách hóa đơn cần xử lý thủ công (MANUAL_PROCESSING)
            </h3>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
            {totalElements} hóa đơn
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">
            Đang tải danh sách hóa đơn cần xử lý...
          </div>
        ) : displayedInvoices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="font-extrabold text-slate-700 text-sm">
              Không có hóa đơn nào khớp bộ lọc!
            </div>
            <p className="text-xs text-slate-400 max-w-sm text-center">
              Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh nhóm lỗi để hiển thị kết quả.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="p-3">Số HĐ / Mã tra cứu</th>
                  <th className="p-3">Khách hàng & MST</th>
                  <th className="p-3">Thời gian lập</th>
                  <th className="p-3 text-right">Tổng thanh toán</th>
                  <th className="p-3">Lý do lỗi CQT</th>
                  <th className="p-3 text-center">Lần thử</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {displayedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono">
                      <span className="font-bold text-slate-800 block">
                        {inv.invoiceNumber || "(Chưa có số)"}
                      </span>
                      <span className="text-[11px] text-slate-400">{inv.lookupCode}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-800 block">
                        {inv.buyerName || inv.customer || "Khách lẻ"}
                      </span>
                      {inv.buyerTaxCode && (
                        <span className="text-[11px] font-mono text-slate-500">
                          MST: {inv.buyerTaxCode}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">{formatDate(inv.createdAt || inv.time)}</td>
                    <td className="p-3 text-right font-mono font-bold text-kv-blue-primary">
                      {formatCurrency(inv.finalAmount)}
                    </td>
                    <td className="p-3 text-rose-600 max-w-[200px]">
                      <span className="font-semibold block text-[11px] truncate" title={inv.taxAuthorityResponse || "-"}>
                        {inv.taxAuthorityResponse || "Lỗi dữ liệu / CQT từ chối"}
                      </span>
                      {inv.errorCategory && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          [{inv.errorCategory}]
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-600">
                      {inv.retryCount ?? 0}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${getStatusClassName(
                          inv.status
                        )}`}
                      >
                        {getStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleResendSingle(inv.id)}
                          disabled={isResending}
                          title="Gửi lại hóa đơn lên CQT"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Gửi lại</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(APP_ROUTES.E_INVOICE_DETAIL(inv.id))}
                          title="Xem & sửa thông tin người mua"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Sửa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <TablePaginationFooter
            currentPage={page}
            pageSize={PAGE_SIZE}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={setPage}
            recordUnit="hóa đơn"
          />
        )}
      </div>
    </div>
  );
};
