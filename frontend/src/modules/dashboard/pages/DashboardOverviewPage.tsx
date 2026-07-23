import { useMemo } from "react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { E_INVOICE_STATUS } from "@/constants/eInvoice";
import { USER_ROLES, ROLE_LABELS } from "@/constants/roles";
import { ORDER_STATUS } from "@/constants/order";
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

export const DashboardOverviewPage = () => {
  const {
    currentRole,
    invoices,
    setInvoices,
    orders,
    logs,
    addLogEntry,
    isOrdersLoading,
    isOrdersError,
    ordersError,
    refetchOrders,
  } = useDashboardDemo();

  // Compute stats dynamically
  const { totalRevenue, totalOrders, totalFailedInvoices } = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === ORDER_STATUS.COMPLETED);
    const orderRevenue = completedOrders.reduce((sum, o) => sum + o.finalAmount, 0);

    const failedInvoices = invoices.filter((inv) => inv.status === E_INVOICE_STATUS.SEND_ERROR);
    
    // Support realistic demo numbers if CSDL is empty
    const calculatedRevenue = orderRevenue || 3560000;
    const calculatedOrders = completedOrders.length || 128;
    const calculatedFailed = failedInvoices.length || 2;

    return {
      totalRevenue: calculatedRevenue,
      totalOrders: calculatedOrders,
      totalFailedInvoices: calculatedFailed,
    };
  }, [orders, invoices]);

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
            {/* Time range selection display matching mockup */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>12 Tháng 5 - 12 Tháng 6, 2026</span>
            </div>
          </div>

          {isOrdersLoading && (
            <div
              role="status"
              className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-sm font-semibold text-blue-700"
            >
              Đang tải dữ liệu doanh thu...
            </div>
          )}
          {isOrdersError && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                {getApiErrorMessage(
                  ordersError,
                  "Không thể tải dữ liệu đơn hàng nên doanh thu hiện chưa xác định.",
                )}
              </span>
              <button
                type="button"
                onClick={refetchOrders}
                className="min-h-11 shrink-0 rounded-lg border border-rose-300 bg-white px-4 font-bold transition-colors hover:bg-rose-100"
              >
                Thử lại
              </button>
            </div>
          )}

          {!isOrdersLoading && !isOrdersError && (
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
                  <RevenueChart totalRevenueToday={totalRevenue} />
                </div>

                {/* 2.2: Payment Method Donut Chart */}
                <div className="lg:col-span-1 flex">
                  <PaymentMethodChart orders={orders} />
                </div>

                {/* 2.3: Top Selling Products */}
                <div className="lg:col-span-1 flex">
                  <BestSellersWidget orders={orders} />
                </div>
              </div>

              {/* Row 3: Reconciliation and Audit Logs (2-column layout) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* 3.1: Reconciliation & Failed Invoices (Left 66%) */}
                <div className="xl:col-span-2">
                  <ReconciliationTable
                    invoices={invoices}
                    setInvoices={setInvoices}
                    addLogEntry={addLogEntry}
                  />
                </div>

                {/* 3.2: Recent Activity Audit Logs (Right 33%) */}
                <div className="xl:col-span-1">
                  <RecentActivityPanel logs={logs} />
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
