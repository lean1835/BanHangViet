import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  TrendingUp,
  BarChart3,
  Calendar,
  ShoppingBag,
  DollarSign,
  Receipt,
  Percent,
  ShieldAlert,
  Layers,
  Printer,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateOnly } from "@/utils/dateFormatter";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import {
  DISCOUNT_TYPE,
  PROMOTION_APPLY_SCOPE_LABELS,
  PROMOTION_STATE_LABELS,
  getPromotionCalculatedState,
  type TPromotionApplyScope,
} from "@/constants/promotion";
import { PromotionStatusBadge } from "./PromotionStatusBadge";
import { useGetPromotionReportQuery } from "../services/promotionApi";
import type { IPromotionProductStat } from "../types/IPromotion";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useGetMyHouseholdQuery } from "@/modules/settings/services/settingsApi";

interface PromotionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotionId: string | null;
}

const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const PromotionReportModal: React.FC<PromotionReportModalProps> = ({
  isOpen,
  onClose,
  promotionId,
}) => {
  const { currentRole } = useDashboardDemo();
  const canViewReport =
    currentRole === USER_ROLES.OWNER ||
    currentRole === USER_ROLES.ACCOUNTANT ||
    !currentRole;

  const dialogRef = useAccessibleDialog<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetPromotionReportQuery(promotionId || "", {
    skip: !isOpen || !promotionId || !canViewReport,
    refetchOnMountOrArgChange: true,
  });

  const { data: householdResponse } = useGetMyHouseholdQuery();
  const household = householdResponse?.result;


  if (!isOpen || !promotionId) return null;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      id="promotion-report-modal-portal"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-backdrop-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-report-modal-title"
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-promotion-report, #printable-promotion-report * {
            visibility: visible !important;
          }
          #printable-promotion-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            font-size: 9.5pt !important;
            line-height: 1.35 !important;
          }
          #promotion-report-modal-portal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
          #promotion-report-modal-panel {
            position: static !important;
            left: auto !important;
            top: auto !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            max-height: none !important;
            height: auto !important;
          }
          #printable-promotion-report {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            font-size: 9.5pt !important;
            line-height: 1.35 !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
          }
          #printable-promotion-report table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1px solid #000000 !important;
            page-break-inside: avoid !important;
          }
          #printable-promotion-report th {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            background-color: #f1f5f9 !important;
            padding: 5px 6px !important;
            font-weight: bold !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-promotion-report td {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            padding: 4px 6px !important;
          }
        }
      `}</style>

      <div
        id="promotion-report-modal-panel"
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-modal-bounce-in"
      >
        {/* ─── SCREEN-ONLY MODAL VIEW ─── */}
        <div className="screen-only flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-4 text-white shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan-300 shadow-inner backdrop-blur-md border border-white/20">
              <BarChart3 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="promotion-report-modal-title"
                  className="text-base sm:text-lg font-black tracking-tight"
                >
                  Báo Cáo Hiệu Quả Khuyến Mại
                </h2>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Đo lường doanh thu tăng thêm, chi phí giảm giá và hiệu quả tài chính ròng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canViewReport && report?.hasData && (
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15"
                title="In báo cáo hiệu quả khuyến mại"
              >
                <Printer size={14} />
                <span>In báo cáo</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Đóng modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* RBAC Violation Guard */}
          {!canViewReport ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-900 uppercase tracking-wide">
                    Truy cập bị từ chối (403 Forbidden)
                  </h3>
                  <p className="text-xs text-rose-700 font-medium mt-0.5">
                    Bạn đang đăng nhập với vai trò <strong>Nhân viên bán hàng (VT-02)</strong>.
                  </p>
                </div>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed bg-white/70 p-3.5 rounded-xl border border-rose-200/60 font-medium">
                Báo cáo hiệu quả tài chính của chương trình khuyến mại bao gồm doanh thu tổng, chi phí giảm giá và kết quả kinh doanh ròng. Theo quy chuẩn phân quyền hệ thống, chức năng này chỉ được phép truy cập bởi <strong>Chủ hộ kinh doanh (VT-01)</strong> và <strong>Kế toán (VT-03)</strong>.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <div className="w-9 h-9 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-700">
                Đang tổng hợp dữ liệu hiệu quả chương trình khuyến mại...
              </p>
            </div>
          ) : isError ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex flex-col gap-3">
              <p className="font-bold text-sm">Không thể tải dữ liệu báo cáo hiệu quả.</p>
              <p className="text-rose-600 font-normal">
                {getApiErrorMessage(error, "Lỗi kết nối máy chủ khi truy xuất báo cáo khuyến mại.")}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="w-max px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all"
              >
                Thử lại
              </button>
            </div>
          ) : !report ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              Không tìm thấy thông tin chương trình khuyến mại.
            </div>
          ) : (
            <>
              {/* Campaign Overview Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {report.promotionName}
                    </h3>
                    <PromotionStatusBadge
                      state={getPromotionCalculatedState(report)}
                    />
                  </div>
                  {report.description && (
                    <p className="text-xs text-slate-500 font-medium">
                      {report.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-600 font-semibold pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Thời gian:</span>{" "}
                      <strong className="text-slate-800">
                        {formatDateTime(report.startDate)}
                      </strong>{" "}
                      đến{" "}
                      <strong className="text-slate-800">
                        {formatDateTime(report.endDate)}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers size={13} className="text-slate-400" />
                      <span>Phạm vi:</span>{" "}
                      <strong className="text-slate-800">
                        {PROMOTION_APPLY_SCOPE_LABELS[report.applyScope as TPromotionApplyScope] || report.applyScope}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Percent size={13} className="text-slate-400" />
                      <span>Mức giảm:</span>{" "}
                      <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {report.discountType === DISCOUNT_TYPE.PERCENTAGE
                           ? `${report.discountValue}%`
                          : formatCurrency(report.discountValue)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Case 1: No Transactions (hasData === false) */}
              {!report.hasData ? (
                <div className="p-8 rounded-2xl bg-gradient-to-b from-sky-50/60 to-slate-50 border border-sky-200/80 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-inner">
                    <Sparkles size={28} />
                  </div>
                  <h4 className="text-base font-black text-slate-800">
                    Chưa có giao dịch trong đợt khuyến mại này
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md font-medium leading-relaxed">
                    {report.message ||
                      "Chương trình khuyến mại chưa phát sinh giao dịch bán hàng nào trong thời gian diễn ra. Khi có đơn hàng được thanh toán, hệ thống sẽ tự động đo lường doanh thu tăng thêm và hiệu quả tài chính ròng tại đây."}
                  </p>
                  <div className="mt-2 text-[11px] font-semibold text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                    💡 Lưu ý: Hệ thống không hiển thị số 0 nhằm tránh hiểu lầm chiến dịch đang chịu thua lỗ.
                  </div>
                </div>
              ) : (
                /* Case 2: Has Transactions (hasData === true) */
                <div className="space-y-6">
                  {/* 4 Main KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* KPI 1: Promotion Revenue */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Doanh thu trong đợt
                        </span>
                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                          <DollarSign size={16} />
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-lg sm:text-xl font-black text-slate-900">
                          {formatCurrency(report.promotionRevenue || 0)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          Kỳ cơ sở: {formatCurrency(report.baselineRevenue || 0)}
                        </div>
                      </div>
                    </div>

                    {/* KPI 2: Incremental Revenue */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Doanh thu tăng thêm
                        </span>
                        <div
                          className={`p-1.5 rounded-lg ${
                            (report.incrementalRevenue || 0) >= 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {(report.incrementalRevenue || 0) >= 0 ? (
                            <ArrowUpRight size={16} />
                          ) : (
                            <ArrowDownRight size={16} />
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div
                          className={`text-lg sm:text-xl font-black ${
                            (report.incrementalRevenue || 0) >= 0
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          {(report.incrementalRevenue || 0) >= 0 ? "+" : ""}
                          {formatCurrency(report.incrementalRevenue || 0)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          So với doanh thu cùng kỳ trước
                        </div>
                      </div>
                    </div>

                    {/* KPI 3: Total Discount Amount */}
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col justify-between hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between text-amber-900">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Tổng tiền giảm giá
                        </span>
                        <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                          <Receipt size={16} />
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-lg sm:text-xl font-black text-amber-800">
                          {formatCurrency(report.totalDiscountAmount || 0)}
                        </div>
                        <div className="text-[11px] text-amber-700/80 font-medium mt-1">
                          Khoản ưu đãi trao cho khách
                        </div>
                      </div>
                    </div>

                    {/* KPI 4: Net Result */}
                    <div
                      className={`p-4 rounded-xl border flex flex-col justify-between hover:shadow-sm transition-shadow ${
                        (report.netResult || 0) >= 0
                          ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                          : "bg-rose-50/80 border-rose-200 text-rose-950"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Hiệu quả ròng (Net)
                        </span>
                        <div
                          className={`p-1.5 rounded-lg ${
                            (report.netResult || 0) >= 0
                              ? "bg-emerald-200 text-emerald-800"
                              : "bg-rose-200 text-rose-800"
                          }`}
                        >
                          <TrendingUp size={16} />
                        </div>
                      </div>
                      <div className="mt-2">
                        <div
                          className={`text-lg sm:text-xl font-black ${
                            (report.netResult || 0) >= 0
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          {(report.netResult || 0) >= 0 ? "+" : ""}
                          {formatCurrency(report.netResult || 0)}
                        </div>
                        <div
                          className={`text-[11px] font-bold mt-1 ${
                            (report.netResult || 0) >= 0
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          {(report.netResult || 0) >= 0
                            ? "✓ Đợt KM đạt lợi nhuận ròng dương"
                            : "⚠️ Chi phí giảm giá cao hơn doanh thu tăng"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-semibold">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-slate-400" />
                        <span>Tổng số đơn áp dụng KM:</span>{" "}
                        <strong className="text-slate-900 font-bold">
                          {report.totalOrdersCount ?? 0} đơn hàng
                        </strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Package size={14} className="text-slate-400" />
                        <span>Tổng số lượng sản phẩm bán:</span>{" "}
                        <strong className="text-slate-900 font-bold">
                          {report.totalQuantitySold ?? 0}
                        </strong>
                      </span>
                    </div>

                    {report.baselineStartDate && report.baselineEndDate && (
                      <div className="text-[11px] text-slate-500 font-normal">
                        Kỳ cơ sở so sánh: {formatDateOnly(report.baselineStartDate)} –{" "}
                        {formatDateOnly(report.baselineEndDate)}
                      </div>
                    )}
                  </div>

                  {/* Product Stats Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Package size={14} className="text-kv-blue-primary" />
                        <span>Chi tiết hiệu quả theo từng mặt hàng</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        {report.productStats?.length || 0} sản phẩm ghi nhận
                      </span>
                    </div>

                    {report.productStats && report.productStats.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                              <th className="p-3">Sản phẩm</th>
                              <th className="p-3 text-right">Số lượng bán</th>
                              <th className="p-3 text-right">Doanh thu ghi nhận</th>
                              <th className="p-3 text-right">Tổng tiền giảm giá</th>
                              <th className="p-3 text-right">Doanh thu thực thu</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {report.productStats.map((prod: IPromotionProductStat, idx: number) => {
                              const netRevenue = prod.revenue || 0;
                              const grossRevenue = netRevenue + (prod.discountAmount || 0);

                              return (
                                <tr key={prod.productId || idx} className="hover:bg-slate-50/60">
                                  <td className="p-3 font-semibold text-slate-900">
                                    {prod.productName || prod.productId}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold">
                                    {prod.quantitySold}
                                  </td>
                                  <td className="p-3 text-right font-semibold">
                                    {formatCurrency(grossRevenue)}
                                  </td>
                                  <td className="p-3 text-right font-bold text-rose-600">
                                    {prod.discountAmount && prod.discountAmount > 0
                                      ? `-${formatCurrency(prod.discountAmount)}`
                                      : "0 đ"}
                                  </td>
                                  <td className="p-3 text-right font-bold text-emerald-700">
                                    {formatCurrency(netRevenue)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Không có số liệu chi tiết từng mặt hàng.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5 shrink-0 no-print">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* ─── PRINT-ONLY FORMAL BUSINESS REPORT TEMPLATE ─── */}
        {report && report.hasData && (
          <div id="printable-promotion-report" className="hidden print:block p-4 bg-white text-black font-sans">
            {/* 1. Header: Enterprise Info & National Motto */}
            <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
              <div>
                <div className="font-extrabold uppercase text-xs">
                  {household?.name || "HỘ KINH DOANH BÁN HÀNG VIỆT"}
                </div>
                <div className="text-[10px] text-gray-700">
                  Địa chỉ: {household?.address || "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM"}
                </div>
                <div className="text-[10px] text-gray-700">
                  Điện thoại: {household?.phoneNumber || "0901234567"} • MST: {household?.taxCode || "0123456789"}
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold uppercase text-[10px] tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="text-[9px] font-semibold italic">Độc lập - Tự do - Hạnh phúc</div>
                <div className="w-24 h-0.5 bg-black mx-auto mt-1"></div>
              </div>
            </div>

            {/* 2. Report Title */}
            <div className="text-center my-4">
              <h1 className="text-base font-black uppercase tracking-wider">
                BÁO CÁO HIỆU QUẢ CHƯƠNG TRÌNH KHUYẾN MẠI
              </h1>
              <p className="text-[10px] italic text-gray-600 mt-0.5">
                (Đo lường doanh thu tăng thêm, chi phí ưu đãi và hiệu quả tài chính ròng)
              </p>
              <p className="text-[9px] text-gray-500 mt-1">
                Thời điểm lập báo cáo: {new Date().toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}
              </p>
            </div>

            {/* 3. Promotion Campaign Metadata */}
            <div className="border border-black p-3 mb-4 rounded-xs text-[10px] space-y-1 bg-slate-50/20">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <strong>Tên chương trình:</strong> <span className="font-bold uppercase">{report.promotionName}</span>
                </div>
                <div>
                  <strong>Trạng thái:</strong> <span>{PROMOTION_STATE_LABELS[getPromotionCalculatedState(report)] || report.status}</span>
                </div>
                <div>
                  <strong>Thời gian diễn ra:</strong> <span>{formatDateTime(report.startDate)} – {formatDateTime(report.endDate)}</span>
                </div>
                <div>
                  <strong>Mức giảm giá:</strong> <span>{report.discountType === DISCOUNT_TYPE.PERCENTAGE ? `${report.discountValue}%` : formatCurrency(report.discountValue)}</span>
                </div>
                <div>
                  <strong>Phạm vi áp dụng:</strong> <span>{PROMOTION_APPLY_SCOPE_LABELS[report.applyScope as TPromotionApplyScope] || report.applyScope}</span>
                </div>
                <div>
                  <strong>Kỳ cơ sở so sánh:</strong> <span>{formatDateOnly(report.baselineStartDate)} – {formatDateOnly(report.baselineEndDate)}</span>
                </div>
              </div>
            </div>

            {/* 4. Financial KPIs Table */}
            <div className="mb-4">
              <div className="font-bold text-xs uppercase mb-1.5 flex items-center gap-1">
                I. CHỈ TIÊU ĐO LƯỜNG HIỆU QUẢ TÀI CHÍNH (4 KPI CỐT LÕI)
              </div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="w-10 text-center">STT</th>
                    <th>Chỉ tiêu hiệu quả (KPI)</th>
                    <th className="text-right w-32">Kỳ khuyến mại</th>
                    <th className="text-right w-32">Kỳ cơ sở so sánh</th>
                    <th className="text-right w-32">Chênh lệch tăng/giảm</th>
                    <th className="w-48 text-left">Đánh giá kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center font-bold">1</td>
                    <td className="font-bold">Doanh thu trong đợt</td>
                    <td className="text-right font-bold">{formatCurrency(report.promotionRevenue || 0)}</td>
                    <td className="text-right text-gray-600">{formatCurrency(report.baselineRevenue || 0)}</td>
                    <td className="text-right font-bold">
                      {(report.incrementalRevenue || 0) >= 0 ? "+" : ""}{formatCurrency(report.incrementalRevenue || 0)}
                    </td>
                    <td>Doanh thu phát sinh thực tế</td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">2</td>
                    <td className="font-bold">Doanh thu tăng thêm</td>
                    <td className="text-right font-bold">
                      {(report.incrementalRevenue || 0) >= 0 ? "+" : ""}{formatCurrency(report.incrementalRevenue || 0)}
                    </td>
                    <td className="text-right text-gray-500">-</td>
                    <td className="text-right font-bold">
                      {(report.incrementalRevenue || 0) >= 0 ? "+" : ""}{formatCurrency(report.incrementalRevenue || 0)}
                    </td>
                    <td>So với doanh thu cùng kỳ trước</td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">3</td>
                    <td className="font-bold">Tổng chi phí giảm giá</td>
                    <td className="text-right font-bold">
                      {formatCurrency(report.totalDiscountAmount || 0)}
                    </td>
                    <td className="text-right text-gray-500">-</td>
                    <td className="text-right">
                      -{formatCurrency(report.totalDiscountAmount || 0)}
                    </td>
                    <td>Tổng ngân sách ưu đãi trao cho khách</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="text-center">4</td>
                    <td>HIỆU QUẢ TÀI CHÍNH RÒNG (NET IMPACT)</td>
                    <td className="text-right">
                      {(report.netResult || 0) >= 0 ? "+" : ""}{formatCurrency(report.netResult || 0)}
                    </td>
                    <td className="text-right text-gray-500">-</td>
                    <td className="text-right">
                      {(report.netResult || 0) >= 0 ? "+" : ""}{formatCurrency(report.netResult || 0)}
                    </td>
                    <td>
                      {(report.netResult || 0) >= 0
                        ? "✓ Đợt KM đạt lợi nhuận ròng dương"
                        : "⚠️ Chi phí giảm giá cao hơn doanh thu tăng"}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-1.5 text-[9px] italic text-gray-600 flex justify-between">
                <span>* Tổng số đơn hàng áp dụng: <strong>{report.totalOrdersCount ?? 0} đơn hàng</strong></span>
                <span>* Tổng số lượng sản phẩm bán: <strong>{report.totalQuantitySold ?? 0} sản phẩm</strong></span>
              </div>
            </div>

            {/* 5. Product Breakdown Table */}
            {report.productStats && report.productStats.length > 0 && (
              <div className="mb-6">
                <div className="font-bold text-xs uppercase mb-1.5">
                  II. CHI TIẾT HIỆU QUẢ THEO TỪNG MẶT HÀNG
                </div>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="w-10 text-center">STT</th>
                      <th>Tên sản phẩm</th>
                      <th className="text-center w-24">Số lượng bán</th>
                      <th className="text-right w-32">Doanh thu ghi nhận</th>
                      <th className="text-right w-32">Tổng tiền giảm giá</th>
                      <th className="text-right w-32">Doanh thu thực thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.productStats.map((item, idx) => {
                      const netRev = item.revenue || 0;
                      const grossRev = netRev + (item.discountAmount || 0);

                      return (
                        <tr key={idx}>
                          <td className="text-center font-bold">{idx + 1}</td>
                          <td className="font-bold">{item.productName}</td>
                          <td className="text-center font-bold">{item.quantitySold}</td>
                          <td className="text-right">{formatCurrency(grossRev)}</td>
                          <td className="text-right">
                            {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount)}` : "0 đ"}
                          </td>
                          <td className="text-right font-bold">{formatCurrency(netRev)}</td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold bg-slate-100">
                      <td colSpan={2} className="text-center uppercase">Tổng cộng</td>
                      <td className="text-center">
                        {report.productStats.reduce((sum, item) => sum + (item.quantitySold || 0), 0)}
                      </td>
                      <td className="text-right">
                        {formatCurrency(
                          report.productStats.reduce((sum, item) => sum + (item.revenue || 0) + (item.discountAmount || 0), 0)
                        )}
                      </td>
                      <td className="text-right">
                        -{formatCurrency(report.productStats.reduce((sum, item) => sum + (item.discountAmount || 0), 0))}
                      </td>
                      <td className="text-right">
                        {formatCurrency(report.productStats.reduce((sum, item) => sum + (item.revenue || 0), 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Signatures */}
            <div className="grid grid-cols-3 text-center text-[10px] mt-8 pt-4 page-break-inside-avoid">
              <div>
                <div className="font-bold uppercase">Người lập báo cáo</div>
                <div className="text-[9px] italic text-gray-500">(Ký, ghi rõ họ tên)</div>
                <div className="h-16"></div>
              </div>
              <div>
                <div className="font-bold uppercase">Kế toán trưởng</div>
                <div className="text-[9px] italic text-gray-500">(Ký, ghi rõ họ tên)</div>
                <div className="h-16"></div>
              </div>
              <div>
                <div className="font-bold uppercase">Chủ hộ kinh doanh</div>
                <div className="text-[9px] italic text-gray-500">(Ký, đóng dấu)</div>
                <div className="h-16"></div>
                <div className="font-bold">{household?.representativeName || ""}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
