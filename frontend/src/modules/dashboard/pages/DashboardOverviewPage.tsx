import { useMemo, useState } from "react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { DEFAULT_DASHBOARD_TIME_FILTER } from "@/constants/dashboard";
import { E_INVOICE_STATUS } from "@/constants/eInvoice";
import { MOCK_CLOCK } from "@/constants/mockData/clock";
import { USER_ROLES } from "@/constants/roles";
import { ORDER_STATUS } from "@/constants/order";
import { CashierShiftDashboard } from "@/modules/shift/components/CashierShiftDashboard";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { DashboardOverviewSidebar } from "../components/DashboardOverviewSidebar";
import { QuickAccessPanel } from "../components/QuickAccessPanel";
import { RecentActivityPanel } from "../components/RecentActivityPanel";
import { RevenueChart } from "../components/RevenueChart";
import { SalesKpiCards } from "../components/SalesKpiCards";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

export const DashboardOverviewPage = () => {
  const {
    currentRole,
    invoices,
    orders,
    isOrdersLoading,
    isOrdersError,
    ordersError,
    refetchOrders,
  } = useDashboardDemo();
  const [dashTimeFilter, setDashTimeFilter] = useState<string>(DEFAULT_DASHBOARD_TIME_FILTER);

  const { totalRevenueToday, totalInvoiceCountToday } = useMemo(() => {
    const issuedToday = invoices.filter(
      (invoice) =>
        invoice.status === E_INVOICE_STATUS.ISSUED &&
        invoice.time.startsWith(MOCK_CLOCK.CURRENT_DATE)
    );

    const completedOrdersToday = orders.filter(
      (order) =>
        order.status === ORDER_STATUS.COMPLETED &&
        order.createdAt.startsWith(MOCK_CLOCK.CURRENT_DATE)
    );

    const invoiceRevenue = issuedToday.reduce((sum, invoice) => sum + invoice.finalAmount, 0);
    const orderRevenue = completedOrdersToday.reduce((sum, order) => sum + order.finalAmount, 0);

    return {
      totalRevenueToday: invoiceRevenue + orderRevenue,
      totalInvoiceCountToday: issuedToday.length + completedOrdersToday.length,
    };
  }, [invoices, orders]);

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <DashboardOverviewSidebar
          dashTimeFilter={dashTimeFilter}
          onTimeFilterChange={setDashTimeFilter}
        />
      }
    >
      {currentRole === USER_ROLES.CASHIER ? (
        <div className="w-full flex flex-col gap-6">
          <CashierShiftDashboard />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
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
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <div className="xl:col-span-3 flex flex-col gap-6">
            <SalesKpiCards
              totalRevenueToday={totalRevenueToday}
              totalInvoiceCountToday={totalInvoiceCountToday}
            />
            <RevenueChart totalRevenueToday={totalRevenueToday} />
          </div>

          <div className="xl:col-span-1 flex flex-col gap-6 font-semibold">
            <QuickAccessPanel currentRole={currentRole} />
            <RecentActivityPanel />
          </div>
          </div>
          )}
        </div>
      )}
    </DashboardWorkspaceLayout>
  );
};

export default DashboardOverviewPage;
