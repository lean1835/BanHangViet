import { useState, useMemo } from "react";
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
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { Calendar, AlertTriangle } from "lucide-react";
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
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // API Queries
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useGetDashboardOverviewQuery({ fromDate, toDate });

  const {
    data: topSellingData,
    isLoading: isTopSellingLoading,
  } = useGetTopSellingProductsQuery({ fromDate, toDate, limit: 5 });

  const {
    data: logsData,
    isLoading: isLogsLoading,
  } = useGetActivityLogsQuery({ fromDate, toDate, page: 0, size: 5 });

  const {
    data: failedInvoicesData,
    isLoading: isFailedInvoicesLoading,
  } = useGetInvoicesQuery({ status: "SEND_ERROR", fromDate, toDate, page: 0, size: 10 });

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
      return {
        id: log.id,
        time: timeStr,
        user: log.fullName || log.username || "Nhân viên",
        action: log.action || "Thao tác",
        target: `${log.targetTable || ""}${log.targetId ? ` (ID: ${log.targetId})` : ""}`,
      };
    });
  }, [logsData]);

  const isLoading = isOverviewLoading || isTopSellingLoading || isLogsLoading || isFailedInvoicesLoading;

  return (
    <DashboardWorkspaceLayout>
      {currentRole === USER_ROLES.CASHIER ? (
        <div className="max-w-[1200px] mx-auto w-full px-4 py-6 flex flex-col gap-6 animate-auth-fade-in">
          <CashierShiftDashboard />
        </div>
      ) : currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.ACCOUNTANT ? (
        <div className="flex flex-col gap-6 max-w-[1280px] mx-auto p-4 md:p-6 bg-slate-50/50 min-h-screen animate-auth-fade-in">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard</h1>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Chào mừng trở lại, <span className="text-kv-blue-primary font-bold">{ROLE_LABELS[currentRole]}</span>! Dưới đây là thông tin tổng quan về hoạt động kinh doanh của Hộ Bán Hàng Việt.
              </p>
            </div>
            {/* Time range selection inputs */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-700 shrink-0">
              <Calendar className="w-4 h-4 text-slate-400" />
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
                <div className="lg:col-span-1 flex">
                  <RevenueChart totalRevenueToday={totalRevenue} dailyRevenues={dailyRevenues} />
                </div>

                {/* 2.2: Payment Method Donut Chart */}
                <div className="lg:col-span-1 flex">
                  <PaymentMethodChart dailyRevenues={dailyRevenues} />
                </div>

                {/* 2.3: Top Selling Products */}
                <div className="lg:col-span-1 flex">
                  <BestSellersWidget topSellingProducts={topSellingProducts} />
                </div>
              </div>

              {/* Row 3: Reconciliation and Audit Logs (2-column layout) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* 3.1: Reconciliation & Failed Invoices (Left 66%) */}
                <div className="xl:col-span-2">
                  <ReconciliationTable date={toDate} currentRole={currentRole} />
                </div>

                {/* 3.2: Recent Activity Audit Logs (Right 33%) */}
                <div className="xl:col-span-1">
                  <RecentActivityPanel logs={mappedLogs} />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center m-6">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-base font-bold text-slate-800 mb-2">Quyền truy cập bị giới hạn</h2>
          <p className="text-xs text-slate-400 font-semibold mb-6">
            Giao diện Báo cáo Doanh thu Tổng quan không khả dụng cho vai trò của bạn ({ROLE_LABELS[currentRole]}).
          </p>
          <a
            href={
              currentRole === USER_ROLES.PLATFORM_ADMIN
                ? "/admin"
                : currentRole === USER_ROLES.TAX_AUTHORITY
                ? "/tax-authority"
                : "/"
            }
            className="bg-kv-blue-primary text-white border-none py-2 px-6 text-xs font-bold rounded hover:bg-kv-blue-dark transition-colors"
          >
            Đi tới trang làm việc phù hợp
          </a>
        </div>
      )}
    </DashboardWorkspaceLayout>
  );
};

export default DashboardOverviewPage;
