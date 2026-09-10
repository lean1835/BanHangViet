import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  FileText,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  DollarSign,
  Percent,
  Layers,
  Calendar,
  Filter,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, getLocalDateString } from "@/utils/dateFormatter";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { APP_ROUTES } from "@/constants/routes";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import {
  useGetDailyInvoiceControlQuery,
  useCreateInvoiceDraftMutation,
  useResendInvoiceMutation,
} from "../services/eInvoiceApi";
import { getStatusClassName, getStatusLabel } from "../utils/eInvoiceHelpers";
import type { TInvoiceStatus } from "../types/IInvoice";

import type { TDailyIssueType, TDailyDurationFilter } from "./DailyControlSidebar";

const PAGE_SIZE = 8;

interface DailyInvoiceControlPanelProps {
  userRole?: string;
  selectedDate?: string;
  setSelectedDate?: (date: string) => void;
  issueTypeFilter?: TDailyIssueType;
  durationFilter?: TDailyDurationFilter;
  onSummaryChange?: (summary: {
    isCleanDay: boolean;
    totalUninvoiced: number;
    totalPending: number;
    totalFailed: number;
  }) => void;
}

export const DailyInvoiceControlPanel: React.FC<DailyInvoiceControlPanelProps> = ({
  userRole = "VT-01",
  selectedDate: propDate,
  setSelectedDate: _propSetDate,
  issueTypeFilter = "ALL",
  durationFilter = "ALL",
  onSummaryChange,
}) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  // Mặc định chọn ngày hiện tại (YYYY-MM-DD) theo múi giờ địa phương
  const todayStr = React.useMemo(() => getLocalDateString(new Date()), []);
  const selectedDate = propDate || todayStr;

  // Queries & Mutations
  const {
    data: controlResponse,
    isLoading,
    error,
    refetch,
  } = useGetDailyInvoiceControlQuery({ date: selectedDate });

  const [createDraft, { isLoading: isCreatingDraft }] = useCreateInvoiceDraftMutation();
  const [resendInvoice, { isLoading: isResending }] = useResendInvoiceMutation();

  const report = controlResponse?.result;
  const isCleanDay = report?.isCleanDay ?? false;
  const uninvoicedOrders = React.useMemo(
    () => report?.uninvoicedOrders || [],
    [report?.uninvoicedOrders]
  );
  const pendingInvoices = React.useMemo(
    () => report?.pendingInvoices || [],
    [report?.pendingInvoices]
  );
  const failedInvoices = React.useMemo(
    () => report?.failedInvoices || [],
    [report?.failedInvoices]
  );

  // Notify parent of summary metrics
  React.useEffect(() => {
    if (report && onSummaryChange) {
      onSummaryChange({
        isCleanDay: report.isCleanDay ?? false,
        totalUninvoiced: report.totalUninvoicedOrders ?? 0,
        totalPending: report.totalPendingInvoices ?? 0,
        totalFailed: report.totalFailedInvoices ?? 0,
      });
    }
  }, [report, onSummaryChange]);

  // Giá trị doanh thu & thuế trong ngày: lấy chuẩn xác từ API report theo ngày đang chọn
  const totalTaxableRevenue = report?.totalTaxableRevenue ?? 0;
  const totalTaxAmount =
    report?.totalTaxAmount ??
    (totalTaxableRevenue > 0 ? totalTaxableRevenue * 0.015 : 0);
  const validInvoicesCount = report?.validInvoicesCount ?? 0;

  // Tính thuế GTGT (1%) và TNCN (0.5%) ước tính cho hộ kinh doanh phương pháp kê khai
  // Theo Thông tư 40/2021/TT-BTC: GTGT = 1%, TNCN = 0.5%
  const vatAmountEstimated = totalTaxAmount > 0 ? totalTaxAmount * (1.0 / 1.5) : 0;
  const pitAmountEstimated = totalTaxAmount > 0 ? totalTaxAmount * (0.5 / 1.5) : 0;

  const isCriticalDuration = (days?: number, hours?: number) => (days ?? 0) > 0 || (hours ?? 0) > 24;

  const filteredUninvoicedOrders = React.useMemo(() => {
    if (issueTypeFilter !== "ALL" && issueTypeFilter !== "UNINVOICED_ORDERS") return [];
    return uninvoicedOrders
      .filter((item) => {
        if (durationFilter === "CRITICAL") return isCriticalDuration(item.pendingDurationDays, item.pendingDurationHours);
        if (durationFilter === "IN_DAY") return !isCriticalDuration(item.pendingDurationDays, item.pendingDurationHours);
        return true;
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [uninvoicedOrders, issueTypeFilter, durationFilter]);

  const filteredPendingInvoices = React.useMemo(() => {
    if (issueTypeFilter !== "ALL" && issueTypeFilter !== "PENDING_INVOICES") return [];
    return pendingInvoices
      .filter((item) => {
        if (durationFilter === "CRITICAL") return isCriticalDuration(item.pendingDurationDays, item.pendingDurationHours);
        if (durationFilter === "IN_DAY") return !isCriticalDuration(item.pendingDurationDays, item.pendingDurationHours);
        return true;
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [pendingInvoices, issueTypeFilter, durationFilter]);

  const filteredFailedInvoices = React.useMemo(() => {
    if (issueTypeFilter !== "ALL" && issueTypeFilter !== "FAILED_INVOICES") return [];
    return failedInvoices
      .filter((item) => {
        if (durationFilter === "CRITICAL") return isCriticalDuration(item.pendingDurationDays, item.pendingDurationHours);
        if (durationFilter === "IN_DAY") return !isCriticalDuration(item.pendingDurationDays, item.pendingDurationHours);
        return true;
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [failedInvoices, issueTypeFilter, durationFilter]);

  // Phân trang 8 bản ghi cho từng danh sách
  const [pageUninvoiced, setPageUninvoiced] = React.useState(0);
  const [pagePending, setPagePending] = React.useState(0);
  const [pageFailed, setPageFailed] = React.useState(0);

  React.useEffect(() => {
    setPageUninvoiced(0);
    setPagePending(0);
    setPageFailed(0);
  }, [selectedDate, issueTypeFilter, durationFilter]);

  React.useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredUninvoicedOrders.length / PAGE_SIZE) - 1);
    if (pageUninvoiced > maxPage) {
      setPageUninvoiced(maxPage);
    }
  }, [filteredUninvoicedOrders.length, pageUninvoiced]);

  React.useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredPendingInvoices.length / PAGE_SIZE) - 1);
    if (pagePending > maxPage) {
      setPagePending(maxPage);
    }
  }, [filteredPendingInvoices.length, pagePending]);

  React.useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredFailedInvoices.length / PAGE_SIZE) - 1);
    if (pageFailed > maxPage) {
      setPageFailed(maxPage);
    }
  }, [filteredFailedInvoices.length, pageFailed]);

  const totalPagesUninvoiced = Math.ceil(filteredUninvoicedOrders.length / PAGE_SIZE);
  const totalPagesPending = Math.ceil(filteredPendingInvoices.length / PAGE_SIZE);
  const totalPagesFailed = Math.ceil(filteredFailedInvoices.length / PAGE_SIZE);

  const paginatedUninvoicedOrders = React.useMemo(() => {
    const start = pageUninvoiced * PAGE_SIZE;
    return filteredUninvoicedOrders.slice(start, start + PAGE_SIZE);
  }, [filteredUninvoicedOrders, pageUninvoiced]);

  const paginatedPendingInvoices = React.useMemo(() => {
    const start = pagePending * PAGE_SIZE;
    return filteredPendingInvoices.slice(start, start + PAGE_SIZE);
  }, [filteredPendingInvoices, pagePending]);

  const paginatedFailedInvoices = React.useMemo(() => {
    const start = pageFailed * PAGE_SIZE;
    return filteredFailedInvoices.slice(start, start + PAGE_SIZE);
  }, [filteredFailedInvoices, pageFailed]);

  // Quyền hạn kiểm tra: Chỉ VT-01 (Chủ hộ) và VT-03 (Kế toán)
  const isAllowed = userRole === "VT-01" || userRole === "VT-03";

  if (!isAllowed) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-extrabold text-slate-800 text-base">Truy cập bị từ chối</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Chức năng Kiểm soát cuối ngày (NCL-04-CN-008) chỉ dành cho <strong>Chủ hộ kinh doanh (VT-01)</strong> và{" "}
          <strong>Kế toán (VT-03)</strong>. Nhân viên bán hàng không được phép truy cập theo quy định QTN-10.
        </p>
      </div>
    );
  }

  const handleCreateInvoiceForOrder = async (orderId: string) => {
    try {
      const res = await createDraft({ orderId }).unwrap();
      showSuccess("Đã tạo nháp hóa đơn từ đơn hàng thành công!");
      refetch();
      if (res?.result?.id) {
        navigate(APP_ROUTES.E_INVOICE_DETAIL(res.result.id), {
          state: { fromTab: "DAILY_CONTROL" },
        });
      }
    } catch (err) {
      showError(getApiErrorMessage(err, "Không thể tạo hóa đơn cho đơn hàng này"));
    }
  };

  const handleResendFailedInvoice = async (invoiceId: string) => {
    try {
      await resendInvoice(invoiceId).unwrap();
      showSuccess("Đã yêu cầu gửi lại hóa đơn lên Cơ quan Thuế thành công!");
      refetch();
    } catch (err) {
      showError(getApiErrorMessage(err, "Không thể gửi lại hóa đơn"));
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-kv-blue-primary" />
            Kiểm soát hóa đơn cuối ngày (NCL-04-CN-008)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Đối chiếu toàn bộ đơn đã thu tiền và phát hiện các hóa đơn treo chưa được cấp mã
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-kv-blue-primary border border-blue-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-kv-blue-primary" />
            <span>Ngày kiểm soát: {selectedDate}</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
          {getApiErrorMessage(error, "Không thể tải dữ liệu kiểm soát cuối ngày.")}
        </div>
      )}

      {/* 4 Thẻ KPI Doanh thu & Thuế trong ngày (Chỉ xuất hiện viền màu khi hover) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Doanh thu chịu thuế */}
        <div className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-blue-500 hover:ring-1 hover:ring-blue-400/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              Tổng doanh thu chịu thuế
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-2xs">
              <DollarSign className="w-4 h-4 shrink-0 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {isLoading ? (
              <div className="h-7 w-28 bg-slate-200/80 animate-pulse rounded-md" />
            ) : (
              formatCurrency(totalTaxableRevenue)
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            {validInvoicesCount} HĐ hợp lệ trong kỳ
          </div>
        </div>

        {/* KPI 2: Thuế GTGT phát sinh */}
        <div className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-emerald-500 hover:ring-1 hover:ring-emerald-400/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              Thuế GTGT phát sinh
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-2xs">
              <Percent className="w-4 h-4 shrink-0 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 tracking-tight">
            {isLoading ? (
              <div className="h-7 w-24 bg-slate-200/80 animate-pulse rounded-md" />
            ) : (
              formatCurrency(vatAmountEstimated)
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Tỷ lệ 1% trên doanh thu bán buôn/bán lẻ
          </div>
        </div>

        {/* KPI 3: Thuế TNCN phát sinh */}
        <div className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-indigo-500 hover:ring-1 hover:ring-indigo-400/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              Thuế TNCN phát sinh
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-2xs">
              <Layers className="w-4 h-4 shrink-0 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-600 tracking-tight">
            {isLoading ? (
              <div className="h-7 w-24 bg-slate-200/80 animate-pulse rounded-md" />
            ) : (
              formatCurrency(pitAmountEstimated)
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Tỷ lệ 0.5% trên doanh thu bán hàng hóa
          </div>
        </div>

        {/* KPI 4: Tổng số thuế phải nộp */}
        <div className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-rose-500 hover:ring-1 hover:ring-rose-400/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700">
              Tổng số thuế phải nộp
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-2xs">
              <FileText className="w-4 h-4 shrink-0 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 tracking-tight">
            {isLoading ? (
              <div className="h-7 w-28 bg-slate-200/80 animate-pulse rounded-md" />
            ) : (
              formatCurrency(totalTaxAmount)
            )}
          </div>
          <div className="mt-2 text-[11px] text-rose-500 font-semibold">
            Tổng nghĩa vụ thuế vào NSNN
          </div>
        </div>
      </div>

      {/* Trạng thái ngày sạch (Clean Day Banner) */}
      {isCleanDay && !isLoading && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-4 shadow-xs animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-emerald-800 text-base">
              Ngày kiểm soát {selectedDate} hoàn tất sạch sẽ!
            </h4>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              Mọi đơn hàng đã thanh toán đều có hóa đơn điện tử hợp lệ được cấp mã. Không có đơn bị bỏ quên hay hóa đơn treo tồn đọng.
            </p>
          </div>
        </div>
      )}

      {/* DANH SÁCH CHI TIẾT 3 NHÓM (KHI CÓ DỮ LIỆU) */}
      {!isCleanDay && !isLoading && (
        <div className="space-y-6">
          {/* Nhóm 1: Đơn đã thanh toán nhưng chưa có hóa đơn */}
          {filteredUninvoicedOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    1. Đơn đã thu tiền nhưng chưa phát hành hóa đơn ({filteredUninvoicedOrders.length} đơn)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                  Cần xuất HĐ
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3">Mã đơn hàng</th>
                      <th className="p-3">Thời gian tạo</th>
                      <th className="p-3">Người bán</th>
                      <th className="p-3 text-right">Tổng tiền</th>
                      <th className="p-3 text-center">Thời gian treo</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedUninvoicedOrders.map((order) => (
                      <tr key={order.orderId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-800">
                          {order.orderNumber}
                        </td>
                        <td className="p-3 text-slate-500">{formatDate(order.createdAt)}</td>
                        <td className="p-3 text-slate-700 font-bold">
                          {order.createdByFullName || order.createdByUsername}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-kv-blue-primary">
                          {formatCurrency(order.finalAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1 ${
                              (order.pendingDurationDays ?? 0) > 0
                                ? "bg-rose-100 text-rose-700 font-extrabold"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {(order.pendingDurationDays ?? 0) > 0
                              ? `${order.pendingDurationDays} ngày`
                              : `${order.pendingDurationHours ?? 0} giờ`}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCreateInvoiceForOrder(order.orderId)}
                            disabled={isCreatingDraft}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            {isCreatingDraft ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )}
                            <span>Lập hóa đơn</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phân trang 8 bản ghi */}
              {totalPagesUninvoiced > 1 && (
                <div className="px-4 pb-4 bg-white">
                  <TablePaginationFooter
                    currentPage={pageUninvoiced}
                    pageSize={PAGE_SIZE}
                    totalElements={filteredUninvoicedOrders.length}
                    totalPages={totalPagesUninvoiced}
                    onPageChange={setPageUninvoiced}
                    recordUnit="đơn hàng"
                  />
                </div>
              )}
            </div>
          )}

          {/* Khi chọn riêng nhóm 1 nhưng không có bản ghi */}
          {issueTypeFilter === "UNINVOICED_ORDERS" && filteredUninvoicedOrders.length === 0 && (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">
                Không có đơn hàng nào chưa xuất hóa đơn
              </h4>
              <p className="text-xs text-slate-500">
                Toàn bộ đơn hàng đã thanh toán trong ngày kiểm soát {selectedDate} đều đã được phát hành hóa đơn hoặc không có phát sinh.
              </p>
            </div>
          )}

          {/* Nhóm 2: Hóa đơn chưa cấp mã */}
          {filteredPendingInvoices.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    2. Hóa đơn đã phát hành chưa được cấp mã ({filteredPendingInvoices.length} hóa đơn)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  Đang xử lý
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3">Số HĐ / Mã đơn</th>
                      <th className="p-3">Thời gian lập</th>
                      <th className="p-3">Người lập</th>
                      <th className="p-3 text-right">Tổng tiền</th>
                      <th className="p-3 text-center">Trạng thái</th>
                      <th className="p-3 text-center">Thời gian treo</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedPendingInvoices.map((inv) => (
                      <tr key={inv.invoiceId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono">
                          <span className="font-bold text-slate-800 block">
                            {inv.invoiceNumber || "(Chưa có số)"}
                          </span>
                          <span className="text-[11px] text-slate-400">Đơn: {inv.orderNumber}</span>
                        </td>
                        <td className="p-3 text-slate-500">{formatDate(inv.createdAt)}</td>
                        <td className="p-3 text-slate-700 font-bold">
                          {inv.createdByFullName || inv.createdByUsername}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-kv-blue-primary">
                          {formatCurrency(inv.finalAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${getStatusClassName(
                              inv.status as TInvoiceStatus
                            )}`}
                          >
                            {getStatusLabel(inv.status as TInvoiceStatus)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-600">
                            {(inv.pendingDurationDays ?? 0) > 0
                              ? `${inv.pendingDurationDays} ngày`
                              : `${inv.pendingDurationHours ?? 0} giờ`}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(APP_ROUTES.E_INVOICE_DETAIL(inv.invoiceId), {
                                state: { fromTab: "DAILY_CONTROL" },
                              })
                            }
                            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phân trang 8 bản ghi */}
              {totalPagesPending > 1 && (
                <div className="px-4 pb-4 bg-white">
                  <TablePaginationFooter
                    currentPage={pagePending}
                    pageSize={PAGE_SIZE}
                    totalElements={filteredPendingInvoices.length}
                    totalPages={totalPagesPending}
                    onPageChange={setPagePending}
                    recordUnit="hóa đơn"
                  />
                </div>
              )}
            </div>
          )}

          {/* Khi chọn riêng nhóm 2 nhưng không có bản ghi */}
          {issueTypeFilter === "PENDING_INVOICES" && filteredPendingInvoices.length === 0 && (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">
                Không có hóa đơn nào đang chờ cấp mã
              </h4>
              <p className="text-xs text-slate-500">
                Toàn bộ hóa đơn phát hành trong ngày kiểm soát {selectedDate} đều đã được cấp mã hợp lệ hoặc không có hóa đơn treo.
              </p>
            </div>
          )}

          {/* Nhóm 3: Hóa đơn gửi lỗi chưa xử lý */}
          {filteredFailedInvoices.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    3. Hóa đơn gửi lỗi & cần xử lý ({filteredFailedInvoices.length} hóa đơn)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                  Khẩn cấp
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3">Số HĐ</th>
                      <th className="p-3">Thời gian lập</th>
                      <th className="p-3">Lý do lỗi CQT</th>
                      <th className="p-3 text-center">Đã thử</th>
                      <th className="p-3 text-right">Tổng tiền</th>
                      <th className="p-3 text-center">Treo</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedFailedInvoices.map((inv) => (
                      <tr key={inv.invoiceId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono">
                          <span className="font-bold text-slate-800 block">
                            {inv.invoiceNumber || "(Chưa có số)"}
                          </span>
                          <span className="text-[11px] text-slate-400">Đơn: {inv.orderNumber}</span>
                        </td>
                        <td className="p-3 text-slate-500">{formatDate(inv.createdAt)}</td>
                        <td className="p-3 text-rose-600 max-w-[220px]">
                          <span className="font-semibold block text-[11px] truncate" title={inv.taxAuthorityResponse || "-"}>
                            {inv.taxAuthorityResponse || "Lỗi gửi Cơ quan Thuế"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                            {inv.retryCount ?? 0} lần
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-kv-blue-primary">
                          {formatCurrency(inv.finalAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-600">
                            {(inv.pendingDurationDays ?? 0) > 0
                              ? `${inv.pendingDurationDays} ngày`
                              : `${inv.pendingDurationHours ?? 0} giờ`}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleResendFailedInvoice(inv.invoiceId)}
                            disabled={isResending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            {isResending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>Gửi lại CQT</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phân trang 8 bản ghi */}
              {totalPagesFailed > 1 && (
                <div className="px-4 pb-4 bg-white">
                  <TablePaginationFooter
                    currentPage={pageFailed}
                    pageSize={PAGE_SIZE}
                    totalElements={filteredFailedInvoices.length}
                    totalPages={totalPagesFailed}
                    onPageChange={setPageFailed}
                    recordUnit="hóa đơn"
                  />
                </div>
              )}
            </div>
          )}

          {/* Khi chọn riêng nhóm 3 nhưng không có bản ghi */}
          {issueTypeFilter === "FAILED_INVOICES" && filteredFailedInvoices.length === 0 && (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">
                Không có hóa đơn nào bị gửi lỗi hoặc treo
              </h4>
              <p className="text-xs text-slate-500">
                Không phát sinh lỗi kết nối với CQT hay sai sót dữ liệu cần xử lý trong ngày kiểm soát {selectedDate}.
              </p>
            </div>
          )}

          {/* Khi chọn Tất cả vấn đề nhưng tất cả nhóm đều rỗng do lọc mức độ thời gian treo */}
          {issueTypeFilter === "ALL" &&
            filteredUninvoicedOrders.length === 0 &&
            filteredPendingInvoices.length === 0 &&
            filteredFailedInvoices.length === 0 && (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Filter className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">
                  Không tìm thấy dữ liệu phù hợp với bộ lọc thời gian treo
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Không có đơn hàng hoặc hóa đơn nào thỏa mãn tiêu chí mức độ thời gian treo đã chọn (
                  {durationFilter === "CRITICAL" ? "Treo nguy cấp > 24 giờ" : "Trong ngày ≤ 24 giờ"}).
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
