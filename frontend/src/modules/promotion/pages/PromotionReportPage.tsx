import React from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Receipt,
  ShieldAlert,
  Printer,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateOnly } from "@/utils/dateFormatter";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import {
  DISCOUNT_TYPE,
  PROMOTION_APPLY_SCOPE_LABELS,
  PROMOTION_STATE_LABELS,
  getPromotionCalculatedState,
  type TPromotionApplyScope,
} from "@/constants/promotion";
import { PromotionStatusBadge } from "../components/PromotionStatusBadge";
import {
  PromotionFilterSidebar,
  type PromotionFilterState,
} from "../components/PromotionFilterSidebar";
import { useGetPromotionReportQuery } from "../services/promotionApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useGetMyHouseholdQuery } from "@/modules/settings/services/settingsApi";

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

export const PromotionReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRole } = useDashboardDemo();

  const canViewReport =
    currentRole === USER_ROLES.OWNER ||
    currentRole === USER_ROLES.ACCOUNTANT ||
    !currentRole;

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetPromotionReportQuery(id || "", {
    skip: !id || !canViewReport,
    refetchOnMountOrArgChange: true,
  });

  const { data: householdResponse } = useGetMyHouseholdQuery();
  const household = householdResponse?.result;

  const initialFilter: PromotionFilterState = {
    stateFilter: "ALL",
    scopeFilter: "ALL",
    startDate: "",
    endDate: "",
    activeNowOnly: false,
  };
  const [filter, setFilter] = React.useState<PromotionFilterState>(initialFilter);

  const handleFilterChange = (newFilter: PromotionFilterState) => {
    setFilter(newFilter);
    navigate(APP_ROUTES.PROMOTIONS);
  };

  const handleResetFilter = () => {
    setFilter(initialFilter);
    navigate(APP_ROUTES.PROMOTIONS);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <PromotionFilterSidebar
          filter={filter}
          onFilterChange={handleFilterChange}
          onResetFilter={handleResetFilter}
        />
      }
    >
      <div className="flex flex-col gap-5 w-full animate-page-enter pb-16">
        {/* ─── PRINT CSS STYLES ─── */}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 8mm 10mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
            }
            #root, .screen-only, .no-print, header, aside, nav {
              display: none !important;
            }
            #printable-promotion-page-report {
              display: block !important;
              position: relative !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
              font-size: 8.5pt !important;
              line-height: 1.25 !important;
            }
            #printable-promotion-page-report table {
              width: 100% !important;
              border-collapse: collapse !important;
              border: 1px solid #000000 !important;
              page-break-inside: avoid !important;
            }
            #printable-promotion-page-report th {
              border: 1px solid #000000 !important;
              color: #000000 !important;
              background-color: #f1f5f9 !important;
              padding: 4px 5px !important;
              font-weight: bold !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-promotion-page-report td {
              border: 1px solid #000000 !important;
              color: #000000 !important;
              padding: 3px 5px !important;
            }
          }
        `}</style>

        {/* ─── SCREEN-ONLY PAGE LAYOUT ─── */}
        <div className="screen-only flex flex-col gap-5 w-full flex-1">
          {/* Top Header Navigation */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(APP_ROUTES.PROMOTIONS)}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 active:scale-95 rounded-lg text-slate-700 text-xs font-bold transition-all shadow-sm shrink-0"
              >
                <ArrowLeft size={16} />
                <span>Quay lại</span>
              </button>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                    Báo Cáo Hiệu Quả Khuyến Mại
                  </h1>
                  {report && (
                    <PromotionStatusBadge
                      state={getPromotionCalculatedState(report)}
                    />
                  )}
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {report?.promotionName ? (
                    <span>
                      Chương trình: <strong className="text-slate-800">{report.promotionName}</strong>
                    </span>
                  ) : (
                    "Đo lường doanh thu tăng thêm, chi phí giảm giá và hiệu quả tài chính ròng"
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {canViewReport && report?.hasData && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-xs font-bold text-white shadow-sm transition-all"
                  title="In báo cáo hiệu quả khuyến mại"
                >
                  <Printer size={14} />
                  <span>In báo cáo</span>
                </button>
              )}
            </div>
          </div>

          {/* Page Content Body */}
          {!canViewReport ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-900 uppercase tracking-wide">
                    Truy cập bị từ chối (403 Forbidden - NCL-15-CN-004-TC-03)
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
                  onClick={() => navigate(APP_ROUTES.PROMOTIONS)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all"
                >
                  Quay lại danh sách
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[350px] gap-3 text-slate-500">
              <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-700">
                Đang tổng hợp số liệu hiệu quả chương trình khuyến mại...
              </p>
            </div>
          ) : isError ? (
            <div className="p-6 bg-white rounded-xl border border-rose-200 shadow-sm text-rose-700 text-xs font-semibold flex flex-col gap-3">
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
            <div className="p-8 bg-white rounded-xl border border-slate-200 shadow-sm text-center text-slate-400 text-xs font-semibold">
              Không tìm thấy thông tin chương trình khuyến mại.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Case 1: No Transactions (hasData === false) - NCL-15-CN-004-TC-02 */}
              {!report.hasData ? (
                <div className="p-8 rounded-2xl bg-white border border-sky-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
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
                  <div className="mt-2 text-[11px] font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    💡 Lưu ý: Hệ thống không hiển thị số 0 nhằm tránh hiểu lầm chiến dịch đang chịu thua lỗ (NCL-15-CN-004-TC-02).
                  </div>
                </div>
              ) : (
                /* Case 2: Has Transactions (hasData === true) - NCL-15-CN-004-TC-01 */
                <div className="space-y-5">
                  {/* 4 Main KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1: Promotion Revenue */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Doanh thu trong đợt
                        </span>
                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                          <DollarSign size={15} />
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <div className="text-lg sm:text-xl font-black text-slate-900">
                          {formatCurrency(report.promotionRevenue || 0)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          Kỳ cơ sở: {formatCurrency(report.baselineRevenue || 0)}
                        </div>
                      </div>
                    </div>

                    {/* KPI 2: Incremental Revenue */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-sm transition-shadow">
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
                            <ArrowUpRight size={15} />
                          ) : (
                            <ArrowDownRight size={15} />
                          )}
                        </div>
                      </div>
                      <div className="mt-2.5">
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
                    <div className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-2xs flex flex-col justify-between hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between text-amber-900">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Tổng tiền giảm giá
                        </span>
                        <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                          <Receipt size={15} />
                        </div>
                      </div>
                      <div className="mt-2.5">
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
                      className={`p-4 rounded-xl border shadow-2xs flex flex-col justify-between hover:shadow-sm transition-shadow ${
                        (report.netResult || 0) >= 0
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          : "bg-rose-50/70 border-rose-200 text-rose-950"
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
                          <TrendingUp size={15} />
                        </div>
                      </div>
                      <div className="mt-2.5">
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
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-semibold">
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
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
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
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                              <th className="p-2.5 w-10 text-center">STT</th>
                              <th className="p-2.5">Sản phẩm</th>
                              <th className="p-2.5 text-center w-28">Số lượng bán</th>
                              <th className="p-2.5 text-right w-36">Doanh thu ghi nhận</th>
                              <th className="p-2.5 text-right w-36">Tổng tiền giảm giá</th>
                              <th className="p-2.5 text-right w-36">Doanh thu thực thu</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {report.productStats.map((stat, idx) => {
                              const netRevenue = stat.revenue || 0;
                              const grossRevenue = netRevenue + (stat.discountAmount || 0);

                              return (
                                <tr
                                  key={stat.productId || idx}
                                  className="hover:bg-slate-50/60 transition-colors"
                                >
                                  <td className="p-2.5 text-center text-slate-400 font-semibold">
                                    {idx + 1}
                                  </td>
                                  <td className="p-2.5 font-bold text-slate-900">
                                    {stat.productName}
                                  </td>
                                  <td className="p-2.5 text-center font-bold text-slate-800">
                                    {stat.quantitySold}
                                  </td>
                                  <td className="p-2.5 text-right font-semibold text-slate-700">
                                    {formatCurrency(grossRevenue)}
                                  </td>
                                  <td className="p-2.5 text-right font-bold text-rose-600">
                                    {stat.discountAmount && stat.discountAmount > 0
                                      ? `-${formatCurrency(stat.discountAmount)}`
                                      : "0 đ"}
                                  </td>
                                  <td className="p-2.5 text-right font-bold text-emerald-700">
                                    {formatCurrency(netRevenue)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {report.productStats.length > 1 && (
                            <tfoot>
                              <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800 text-xs">
                                <td colSpan={2} className="p-2.5 text-center uppercase">
                                  Tổng cộng
                                </td>
                                <td className="p-2.5 text-center">
                                  {report.productStats.reduce((sum, item) => sum + (item.quantitySold || 0), 0)}
                                </td>
                                <td className="p-2.5 text-right font-semibold">
                                  {formatCurrency(
                                    report.productStats.reduce(
                                      (sum, item) => sum + (item.revenue || 0) + (item.discountAmount || 0),
                                      0
                                    )
                                  )}
                                </td>
                                <td className="p-2.5 text-right text-rose-600">
                                  -{formatCurrency(
                                    report.productStats.reduce((sum, item) => sum + (item.discountAmount || 0), 0)
                                  )}
                                </td>
                                <td className="p-2.5 text-right text-emerald-700">
                                  {formatCurrency(
                                    report.productStats.reduce((sum, item) => sum + (item.revenue || 0), 0)
                                  )}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Không có số liệu chi tiết từng mặt hàng.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── PRINT-ONLY FORMAL BUSINESS REPORT TEMPLATE (PORTAL TO BODY) ─── */}
        {report && report.hasData && typeof document !== "undefined" && createPortal(
          <div id="printable-promotion-page-report" className="hidden print:block p-2 bg-white text-black font-sans">
            {/* 1. Header: Enterprise Info & National Motto */}
            <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-3">
              <div>
                <div className="font-extrabold uppercase text-[11px]">
                  {household?.name || "HỘ KINH DOANH BÁN HÀNG VIỆT"}
                </div>
                <div className="text-[9.5px] text-gray-700">
                  Địa chỉ: {household?.address || "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM"}
                </div>
                <div className="text-[9.5px] text-gray-700">
                  Điện thoại: {household?.phoneNumber || "0901234567"} • MST: {household?.taxCode || "0123456789"}
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold uppercase text-[9.5px] tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="text-[8.5px] font-semibold italic">Độc lập - Tự do - Hạnh phúc</div>
                <div className="w-20 h-0.5 bg-black mx-auto mt-0.5"></div>
              </div>
            </div>

            {/* 2. Report Title */}
            <div className="text-center my-2.5">
              <h1 className="text-sm font-black uppercase tracking-wider">
                BÁO CÁO HIỆU QUẢ CHƯƠNG TRÌNH KHUYẾN MẠI
              </h1>
              <p className="text-[9.5px] italic text-gray-600 mt-0.5">
                (Đo lường doanh thu tăng thêm, chi phí ưu đãi và hiệu quả tài chính ròng)
              </p>
              <p className="text-[8.5px] text-gray-500 mt-0.5">
                Thời điểm lập báo cáo: {new Date().toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}
              </p>
            </div>

            {/* 3. Promotion Campaign Metadata */}
            <div className="border border-black p-2.5 mb-3 rounded-xs text-[9.5px] space-y-0.5 bg-slate-50/20">
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
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
            <div className="mb-3">
              <div className="font-bold text-[11px] uppercase mb-1 flex items-center gap-1">
                I. CHỈ TIÊU ĐO LƯỜNG HIỆU QUẢ TÀI CHÍNH (4 KPI CỐT LÕI)
              </div>
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="w-8 text-center">STT</th>
                    <th>Chỉ tiêu hiệu quả (KPI)</th>
                    <th className="text-right w-28">Kỳ khuyến mại</th>
                    <th className="text-right w-28">Kỳ cơ sở so sánh</th>
                    <th className="text-right w-28">Chênh lệch tăng/giảm</th>
                    <th className="w-44 text-left">Đánh giá kết quả</th>
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
              <div className="mt-1 text-[8.5px] italic text-gray-600 flex justify-between">
                <span>* Tổng số đơn hàng áp dụng: <strong>{report.totalOrdersCount ?? 0} đơn hàng</strong></span>
                <span>* Tổng số lượng sản phẩm bán: <strong>{report.totalQuantitySold ?? 0} sản phẩm</strong></span>
              </div>
            </div>

            {/* 5. Product Breakdown Table */}
            {report.productStats && report.productStats.length > 0 && (
              <div className="mb-4">
                <div className="font-bold text-[11px] uppercase mb-1">
                  II. CHI TIẾT HIỆU QUẢ THEO TỪNG MẶT HÀNG
                </div>
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="w-8 text-center">STT</th>
                      <th>Tên sản phẩm</th>
                      <th className="text-center w-20">Số lượng bán</th>
                      <th className="text-right w-28">Doanh thu ghi nhận</th>
                      <th className="text-right w-28">Tổng tiền giảm giá</th>
                      <th className="text-right w-28">Doanh thu thực thu</th>
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
            <div className="grid grid-cols-3 text-center text-[9.5px] mt-6 pt-2 page-break-inside-avoid">
              <div>
                <div className="font-bold uppercase">Người lập báo cáo</div>
                <div className="text-[8.5px] italic text-gray-500">(Ký, ghi rõ họ tên)</div>
                <div className="h-12"></div>
              </div>
              <div>
                <div className="font-bold uppercase">Kế toán trưởng</div>
                <div className="text-[8.5px] italic text-gray-500">(Ký, ghi rõ họ tên)</div>
                <div className="h-12"></div>
              </div>
              <div>
                <div className="font-bold uppercase">Chủ hộ kinh doanh</div>
                <div className="text-[8.5px] italic text-gray-500">(Ký, đóng dấu)</div>
                <div className="h-12"></div>
                <div className="font-bold">{household?.representativeName || ""}</div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </DashboardWorkspaceLayout>
  );
};

export default PromotionReportPage;
