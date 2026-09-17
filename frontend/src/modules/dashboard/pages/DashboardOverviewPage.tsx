import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { USER_ROLES, ROLE_LABELS } from "@/constants/roles";
import { CashierShiftDashboard } from "@/modules/shift/components/CashierShiftDashboard";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { SalesKpiCards } from "../components/SalesKpiCards";
import { RevenueChart } from "../components/RevenueChart";
import { PaymentMethodChart } from "../components/PaymentMethodChart";
import { BestSellersWidget } from "../components/BestSellersWidget";
import { ReconciliationTable } from "../components/ReconciliationTable";
import { RecentActivityPanel } from "../components/RecentActivityPanel";
import { SetupGuideBanner } from "../components/SetupGuideBanner";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getLocalDateString } from "@/utils/dateFormatter";
// Native SVG Icons
interface SvgIconProps {
  size?: number;
  className?: string;
}

const CalendarIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const AlertTriangleIcon: React.FC<SvgIconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);
import { useGetInvoicesQuery } from "@/modules/e_invoice/services/eInvoiceApi";
import {
  useGetDashboardOverviewQuery,
  useGetTopSellingProductsQuery,
  useGetActivityLogsQuery,
} from "@/modules/report/services/reportApi";

export const DashboardOverviewPage = () => {
  const { currentRole } = useDashboardDemo();

  // Date Filter States - defaults to last 30 days
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getLocalDateString(d); // YYYY-MM-DD
  });
  const [toDate, setToDate] = useState(() => {
    return getLocalDateString(); // YYYY-MM-DD
  });

  // Role Permission check for reports & overview metrics
  const canFetchDashboardReports =
    currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.ACCOUNTANT;

  // API Queries
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useGetDashboardOverviewQuery({ fromDate, toDate }, { skip: !canFetchDashboardReports });

  const {
    data: topSellingData,
    isLoading: isTopSellingLoading,
  } = useGetTopSellingProductsQuery({ fromDate, toDate, limit: 5 }, { skip: !canFetchDashboardReports });

  const {
    data: logsData,
    isLoading: isLogsLoading,
  } = useGetActivityLogsQuery({ fromDate: toDate, toDate, page: 0, size: 1000 }, { skip: !canFetchDashboardReports });

  const {
    data: failedInvoicesData,
    isLoading: isFailedInvoicesLoading,
  } = useGetInvoicesQuery({ status: "SEND_ERROR", page: 0, size: 50 }, { skip: !canFetchDashboardReports });

  // Map Stats
  const totalRevenue = overviewData?.result?.totalRevenue || 0;
  const totalOrders = overviewData?.result?.orderCount || 0;
  const totalFailedInvoices = failedInvoicesData?.result?.totalElements || 0;
  const dailyRevenues = overviewData?.result?.dailyRevenues || [];
  const topSellingProducts = topSellingData?.result || [];

  // Map Activity Logs to match the frontend shape
  const mappedLogs = useMemo(() => {
    if (!logsData?.result?.content) return [];
    return logsData.result.content.map((log) => {
      const timeStr = log.createdAt
        ? new Date(log.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        : "-";

      let cleanTargetName = "";
      const rawVal = log.newValue || log.oldValue;
      if (rawVal) {
        try {
          const parsed = JSON.parse(rawVal);
          cleanTargetName =
            parsed.name ||
            parsed.customerName ||
            parsed.orderNumber ||
            parsed.orderCode ||
            parsed.receiptCode ||
            parsed.groupName ||
            parsed.fullName ||
            "";
        } catch {
          // Ignore JSON parse error
        }
      }

      const tableLower = (log.targetTable || "").toLowerCase();
      let tableLabel = log.targetTable || "Hệ thống";
      if (tableLower === "orders") tableLabel = "Đơn hàng";
      else if (tableLower === "customers") tableLabel = "Khách hàng";
      else if (tableLower === "products") tableLabel = "Sản phẩm";
      else if (tableLower === "product_groups") tableLabel = "Nhóm hàng";
      else if (tableLower === "shifts") tableLabel = "Ca làm việc";
      else if (tableLower === "invoices") tableLabel = "Hóa đơn HĐĐT";
      else if (tableLower === "goods_receipts") tableLabel = "Phiếu nhập hàng";
      else if (tableLower === "users" || tableLower === "employees") tableLabel = "Nhân viên";

      let targetStr = tableLabel;
      if (cleanTargetName) {
        targetStr = `${tableLabel}: ${cleanTargetName}`;
      } else if (log.targetId) {
        const idDisplay = log.targetId.length > 15 ? `#${log.targetId.slice(-6).toUpperCase()}` : log.targetId;
        targetStr = `${tableLabel} (${idDisplay})`;
      }

      return {
        id: log.id,
        time: timeStr,
        user: log.fullName || log.username || "Nhân viên",
        action: log.action || "Thao tác",
        target: targetStr,
      };
    });
  }, [logsData]);

  const isLoading =
    canFetchDashboardReports &&
    (isOverviewLoading || isTopSellingLoading || isLogsLoading || isFailedInvoicesLoading);

  return (
    <DashboardWorkspaceLayout>
      {currentRole === USER_ROLES.CASHIER ? (
        <div className="w-full max-w-[1520px] mx-auto px-4 py-6 flex flex-col gap-6 animate-auth-fade-in">
          <CashierShiftDashboard />
        </div>
      ) : currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.ACCOUNTANT ? (
        <div className="flex flex-col gap-6 w-full max-w-[1520px] mx-auto p-4 md:p-6 bg-slate-50/50 min-h-screen animate-auth-fade-in">
          {/* First-time Setup Wizard & Reminder Banner (NCL-09-CN-007) */}
          {currentRole === USER_ROLES.OWNER && <SetupGuideBanner />}

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard</h1>
            </div>
            {/* Time range selection inputs */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-700 shrink-0">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border-none outline-none text-slate-700 bg-transparent text-[11px] font-bold"
              />
              <span className="text-slate-300 px-1">—</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border-none outline-none text-slate-700 bg-transparent text-[11px] font-bold"
              />
            </div>
          </div>

          {isLoading && (
            <div
              role="status"
              className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-sm font-semibold text-blue-700"
            >
              Đang tải dữ liệu doanh thu...
            </div>
          )}

          {isOverviewError && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                {getApiErrorMessage(
                  overviewError,
                  "Không thể tải dữ liệu báo cáo nên doanh thu hiện chưa xác định.",
                )}
              </span>
              <button
                type="button"
                onClick={refetchOverview}
                className="min-h-11 shrink-0 rounded-lg border border-rose-300 bg-white px-4 font-bold transition-colors hover:bg-rose-100"
              >
                Thử lại
              </button>
            </div>
          )}

          {!isLoading && !isOverviewError && (
            <div className="flex flex-col gap-6">
              {/* Row 1: KPI Cards */}
              <SalesKpiCards
                totalRevenue={totalRevenue}
                totalOrders={totalOrders}
                totalFailedInvoices={totalFailedInvoices}
              />

              {/* Row 2: Charts and Rankings (3-column layout) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2.1: Revenue Line Chart */}
                <div className="lg:col-span-1 flex animate-fade-in-up" style={{ animationDelay: "180ms" }}>
                  <RevenueChart totalRevenueToday={totalRevenue} dailyRevenues={dailyRevenues} />
                </div>

                {/* 2.2: Payment Method Donut Chart */}
                <div className="lg:col-span-1 flex animate-fade-in-up" style={{ animationDelay: "240ms" }}>
                  <PaymentMethodChart dailyRevenues={dailyRevenues} />
                </div>

                {/* 2.3: Top Selling Products */}
                <div className="lg:col-span-1 flex animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                  <BestSellersWidget topSellingProducts={topSellingProducts} />
                </div>
              </div>

              {/* Row 3: Reconciliation and Audit Logs (2-column layout) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
                {/* 3.1: Reconciliation & Failed Invoices (Left 66%) */}
                <div className="xl:col-span-2 flex flex-col min-h-0 animate-fade-in-up" style={{ animationDelay: "360ms" }}>
                  <ReconciliationTable date={toDate} currentRole={currentRole} />
                </div>

                {/* 3.2: Recent Activity Audit Logs (Right 33%) */}
                <div className="xl:col-span-1 flex flex-col min-h-0 animate-fade-in-up" style={{ animationDelay: "420ms" }}>
                  <RecentActivityPanel logs={mappedLogs} />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center m-6">
          <AlertTriangleIcon size={48} className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-base font-bold text-slate-800 mb-2">Quyền truy cập bị giới hạn</h2>
          <p className="text-xs text-slate-400 font-semibold mb-6">
            Giao diện Báo cáo Doanh thu Tổng quan không khả dụng cho vai trò của bạn ({ROLE_LABELS[currentRole]}).
          </p>
          <Link
            to={
              currentRole === USER_ROLES.PLATFORM_ADMIN
                ? "/admin"
                : currentRole === USER_ROLES.TAX_AUTHORITY
                ? "/tax-authority"
                : "/"
            }
            className="bg-kv-blue-primary text-white border-none py-2 px-6 text-xs font-bold rounded hover:bg-kv-blue-dark transition-colors"
          >
            Đi tới trang làm việc phù hợp
          </Link>
        </div>
      )}
    </DashboardWorkspaceLayout>
  );
};

export default DashboardOverviewPage;
