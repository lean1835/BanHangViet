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

export const DashboardOverviewPage = () => {
  const { currentRole, invoices, orders } = useDashboardDemo();
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
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
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
    </DashboardWorkspaceLayout>
  );
};

export default DashboardOverviewPage;
