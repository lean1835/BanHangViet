import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AutoRetrySettingsModal } from "./AutoRetrySettingsModal";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import { APP_ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/hooks/useRedux";
import {
  useGetManualProcessingInvoicesQuery,
  useGetInvoicesQuery,
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
export type TAutoRetrySubTab = "MANUAL" | "SCHEDULED";

export const AutoRetryQueuePanel: React.FC<AutoRetryQueuePanelProps> = ({
  searchQuery = "",
  errorCategoryFilter = "ALL",
  retryCountFilter = "ALL",
  onTotalCountChange,
}) => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const [activeSubTab, setActiveSubTab] = useState<TAutoRetrySubTab>("MANUAL");
  const [page, setPage] = useState(0);
  const [scheduledPage, setScheduledPage] = useState(0);
  const [batchSummary, setBatchSummary] = useState<IInvoiceAutoRetrySummaryResponse | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // RBAC check: Only VT-01 (Owner), VT-03 (Accountant), VT-04 (Admin) can trigger batch scan
  const authUser = useAppSelector((state) => state.auth?.user);
  const userRole = authUser?.roleId || "VT-01";
  const isCashier = userRole === "VT-02" || userRole === "CASHIER";
  const canTriggerBatch = !isCashier;

  // Query 1: Manual Processing Invoices
  const {
    data: manualData,
    isLoading: isManualLoading,
    isFetching: isManualFetching,
    refetch: refetchManual,
  } = useGetManualProcessingInvoicesQuery({ page, size: PAGE_SIZE });

  // Query 2: Scheduled Auto-Retry Queue (status: SEND_ERROR waiting for auto-retry)
  const {
    data: scheduledData,
    isLoading: isScheduledLoading,
    isFetching: isScheduledFetching,
    refetch: refetchScheduled,
  } = useGetInvoicesQuery({
    status: "SEND_ERROR",
    page: scheduledPage,
    size: PAGE_SIZE,
  });

  const [triggerRetry, { isLoading: isTriggering }] = useTriggerAutoRetryMutation();
  const [resendSingle, { isLoading: isResending }] = useResendAutoRetryInvoiceMutation();

  const manualInvoices = React.useMemo(
    () => manualData?.result?.content || [],
    [manualData?.result?.content]
  );
  const manualTotalElements = manualData?.result?.totalElements ?? manualInvoices.length;
  const manualTotalPages = manualData?.result?.totalPages ?? Math.ceil(manualTotalElements / PAGE_SIZE);

  const scheduledInvoices = React.useMemo(
    () => scheduledData?.result?.content || [],
    [scheduledData?.result?.content]
  );
  const scheduledTotalElements = scheduledData?.result?.totalElements ?? scheduledInvoices.length;
  const scheduledTotalPages = scheduledData?.result?.totalPages ?? Math.ceil(scheduledTotalElements / PAGE_SIZE);

  React.useEffect(() => {
    if (onTotalCountChange) {
      onTotalCountChange(manualTotalElements);
    }
  }, [manualTotalElements, onTotalCountChange]);

  const filterInvoices = React.useCallback(
    (list: typeof manualInvoices) => {
      return list.filter((inv) => {
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
    },
    [searchQuery, errorCategoryFilter, retryCountFilter]
  );

  const displayedManualInvoices = React.useMemo(
    () => filterInvoices(manualInvoices),
    [manualInvoices, filterInvoices]
  );

  const displayedScheduledInvoices = React.useMemo(
    () => filterInvoices(scheduledInvoices),
    [scheduledInvoices, filterInvoices]
  );

  const handleTriggerBatch = async () => {
    if (!canTriggerBatch) {
      showWarning("Chỉ Chủ hộ kinh doanh hoặc Kế toán mới có quyền kích hoạt quét toàn bộ hàng đợi.");
      return;
    }
    try {
      const res = await triggerRetry().unwrap();
      const summary = res.result;
      setBatchSummary(summary);
      if (summary.successCount > 0) {
        showSuccess(`Đã gửi lại và cấp mã thành công cho ${summary.successCount} hóa đơn.`);
      } else if (summary.totalProcessed === 0) {
        showInfo("Không có hóa đơn nào trong hàng đợi cần gửi lại lúc này.");
      } else {
        showInfo(`Đã quét ${summary.totalProcessed} hóa đơn. Các hóa đơn chưa được cấp mã tiếp tục nằm trong hàng đợi chờ chu kỳ gửi tiếp theo.`);
      }
      refetchManual();
      refetchScheduled();
    } catch (err) {
      showError(getApiErrorMessage(err, "Không thể kích hoạt tiến trình tự động gửi lại"));
    }
  };

  const handleResendSingle = async (invoiceId: string) => {
    try {
      await resendSingle(invoiceId).unwrap();
      showSuccess("Đã yêu cầu gửi lại hóa đơn lên Cơ quan Thuế thành công!");
      refetchManual();
      refetchScheduled();
    } catch (err) {
      showError(getApiErrorMessage(err, "Không thể gửi lại hóa đơn"));
    }
  };

  const handleRefresh = () => {
    if (activeSubTab === "MANUAL") {
      refetchManual();
    } else {
      refetchScheduled();
    }
  };

  const isCurrentFetching = activeSubTab === "MANUAL" ? isManualFetching : isScheduledFetching;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Action Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-800 text-base">
            Tự động gửi lại theo lịch & Xử lý thủ công
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Quét gửi lại các hóa đơn lỗi kết nối và gom các hóa đơn sai thông tin cần người xử lý
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerBatch}
            disabled={isTriggering || !canTriggerBatch}
            title={
              !canTriggerBatch
                ? "Chỉ Chủ hộ hoặc Kế toán mới có quyền kích hoạt quét toàn bộ hàng đợi"
                : "Kích hoạt quét và gửi lại ngay các hóa đơn trong hàng đợi"
            }
            className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-white font-bold text-xs transition-all shadow-xs ${
              !canTriggerBatch
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-kv-blue-primary hover:bg-kv-blue-dark cursor-pointer disabled:opacity-50"
            }`}
          >
            {isTriggering && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            <span>{isTriggering ? "Đang quét & gửi lại..." : "Quét & Gửi lại ngay"}</span>
          </button>

          {canTriggerBatch && (
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              title="Cấu hình tự động gửi lại hóa đơn"
              className="inline-flex items-center px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <span>Cấu hình gửi lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isCurrentFetching}
            title="Làm mới danh sách"
            className="px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isCurrentFetching ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {/* Batch Summary Result Callout */}
      {batchSummary && (
        <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 shadow-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-blue-900 text-sm">
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
              <div className="text-[11px] font-bold text-emerald-600">Đã cấp mã thành công</div>
              <div className="text-xl font-extrabold font-mono text-emerald-700 mt-0.5">
                {batchSummary.successCount}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-blue-100">
              <div className="text-[11px] font-bold text-blue-600">Chờ chu kỳ tiếp theo</div>
              <div className="text-xl font-extrabold font-mono text-blue-700 mt-0.5">
                {batchSummary.failedCount}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-blue-100">
              <div className="text-[11px] font-bold text-amber-600">Chuyển xử lý thủ công</div>
              <div className="text-xl font-extrabold font-mono text-amber-700 mt-0.5">
                {batchSummary.movedToManualCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab Navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col gap-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSubTab("MANUAL")}
              className={`pb-2 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeSubTab === "MANUAL"
                  ? "border-kv-blue-primary text-kv-blue-primary"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Cần xử lý thủ công</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                {manualTotalElements}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("SCHEDULED")}
              className={`pb-2 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeSubTab === "SCHEDULED"
                  ? "border-kv-blue-primary text-kv-blue-primary"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Hàng đợi tự động gửi lại theo lịch</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-kv-blue-primary font-bold">
                {scheduledTotalElements}
              </span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {activeSubTab === "MANUAL"
              ? "Hóa đơn sai thông tin hoặc đã chạm số lần thử tối đa"
              : "Hóa đơn lỗi kết nối đang chờ hệ thống tự gửi lại theo lịch giãn dần"}
          </span>
        </div>

        {/* SUB-TAB 1: MANUAL PROCESSING TABLE */}
        {activeSubTab === "MANUAL" && (
          <>
            {isManualLoading ? (
              <div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">
                Đang tải danh sách hóa đơn cần xử lý thủ công...
              </div>
            ) : displayedManualInvoices.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                <div className="font-extrabold text-slate-700 text-sm">
                  Không có hóa đơn nào cần xử lý thủ công
                </div>
                <p className="text-xs text-slate-400 max-w-sm text-center">
                  Tất cả hóa đơn đã được cấp mã hợp lệ hoặc đang nằm trong hàng đợi tự động.
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
                      <th className="p-3 text-center">Tiến độ thử</th>
                      <th className="p-3 text-center">Trạng thái</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {displayedManualInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono">
                          <span className="font-bold text-slate-800 block text-xs">
                            {inv.invoiceNumber || "(Chưa có số)"}
                          </span>
                          <span className="text-[11px] text-slate-400">{inv.lookupCode}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block text-xs">
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
                        <td className="p-3 text-rose-600 max-w-[260px]">
                          <span
                            className="font-semibold block text-xs leading-tight"
                            title={inv.taxAuthorityResponse || "-"}
                          >
                            {inv.taxAuthorityResponse || "Lỗi dữ liệu / CQT từ chối"}
                          </span>
                          {inv.errorCategory && (
                            <span className="text-[10px] text-slate-400 font-mono inline-block mt-0.5">
                              [{inv.errorCategory}]
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] inline-block border border-rose-100">
                            {inv.retryCount ?? 0} / {inv.maxRetryCount ?? 3} lần
                          </span>
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
                              className="px-2.5 py-1.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <span>{isResending ? "Đang gửi..." : "Gửi lại"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(APP_ROUTES.E_INVOICE_DETAIL(inv.id), {
                                  state: { fromTab: "AUTO_RETRY" },
                                })
                              }
                              title="Xem & sửa thông tin người mua rồi gửi lại"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                            >
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

            {manualTotalPages > 1 && (
              <TablePaginationFooter
                currentPage={page}
                pageSize={PAGE_SIZE}
                totalElements={manualTotalElements}
                totalPages={manualTotalPages}
                onPageChange={setPage}
                recordUnit="hóa đơn"
              />
            )}
          </>
        )}

        {/* SUB-TAB 2: SCHEDULED AUTO-RETRY QUEUE TABLE */}
        {activeSubTab === "SCHEDULED" && (
          <>
            {isScheduledLoading ? (
              <div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">
                Đang tải hàng đợi tự động gửi lại theo lịch...
              </div>
            ) : displayedScheduledInvoices.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                <div className="font-extrabold text-slate-700 text-sm">
                  Hàng đợi tự động đang trống
                </div>
                <p className="text-xs text-slate-400 max-w-sm text-center">
                  Hiện không có hóa đơn nào bị lỗi kết nối cần gửi lại theo lịch định kỳ.
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
                      <th className="p-3">Lý do kỹ thuật</th>
                      <th className="p-3 text-center">Tiến độ thử</th>
                      <th className="p-3">Lần gửi lại tiếp theo</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {displayedScheduledInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono">
                          <span className="font-bold text-slate-800 block text-xs">
                            {inv.invoiceNumber || "(Chưa có số)"}
                          </span>
                          <span className="text-[11px] text-slate-400">{inv.lookupCode}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block text-xs">
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
                        <td className="p-3 text-slate-600 max-w-[240px]">
                          <span className="font-semibold block text-xs leading-tight">
                            {inv.taxAuthorityResponse || "Lỗi mất kết nối CQT / Timeout"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            [{inv.errorCategory || "NETWORK_TIMEOUT"}]
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] inline-block border border-blue-100">
                            {inv.retryCount ?? 0} / {inv.maxRetryCount ?? 3} lần
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-mono">
                          {inv.nextRetryAt ? (
                            <span className="font-bold text-emerald-700 text-xs">
                              {formatDate(inv.nextRetryAt)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Quét chu kỳ tới (mỗi 15p)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleResendSingle(inv.id)}
                            disabled={isResending}
                            title="Bỏ qua lịch chờ và gửi lại ngay"
                            className="px-2.5 py-1.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <span>{isResending ? "Đang gửi..." : "Gửi ngay"}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {scheduledTotalPages > 1 && (
              <TablePaginationFooter
                currentPage={scheduledPage}
                pageSize={PAGE_SIZE}
                totalElements={scheduledTotalElements}
                totalPages={scheduledTotalPages}
                onPageChange={setScheduledPage}
                recordUnit="hóa đơn"
              />
            )}
          </>
        )}
      </div>

      {/* Modal Cài đặt mốc thời hạn tự động gửi lại (NCL-09-CN-008 & QTN-06) */}
      <AutoRetrySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};
