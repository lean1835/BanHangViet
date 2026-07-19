import { useMemo, useState } from "react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { DEFAULT_DASHBOARD_TIME_FILTER } from "@/constants/dashboard";
import { E_INVOICE_STATUS } from "@/constants/eInvoice";
import { MOCK_CLOCK } from "@/constants/mockData/clock";
import { USER_ROLES } from "@/constants/roles";
import { CashierShiftDashboard } from "@/modules/shift/components/CashierShiftDashboard";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { DashboardOverviewSidebar } from "../components/DashboardOverviewSidebar";
import { QuickAccessPanel } from "../components/QuickAccessPanel";
import { RecentActivityPanel } from "../components/RecentActivityPanel";
import { RevenueChart } from "../components/RevenueChart";
import { SalesKpiCards } from "../components/SalesKpiCards";

export const DashboardOverviewPage = () => {
  const { currentRole, invoices } = useDashboardDemo();
  const [dashTimeFilter, setDashTimeFilter] = useState<string>(DEFAULT_DASHBOARD_TIME_FILTER);

  const { totalRevenueToday, totalInvoiceCountToday } = useMemo(() => {
    const issuedToday = invoices.filter(
      (invoice) =>
        invoice.status === E_INVOICE_STATUS.ISSUED &&
        invoice.time.startsWith(MOCK_CLOCK.CURRENT_DATE)
    );

    return {
      totalRevenueToday: issuedToday.reduce((sum, invoice) => sum + invoice.finalAmount, 0),
      totalInvoiceCountToday: issuedToday.length,
    };
  }, [invoices]);

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <DashboardOverviewSidebar
          dashTimeFilter={dashTimeFilter}
          onTimeFilterChange={setDashTimeFilter}
        />
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 flex flex-col gap-6">
          {currentRole === USER_ROLES.CASHIER ? (
            <CashierShiftDashboard />
          ) : (
            <>
              <SalesKpiCards
                totalRevenueToday={totalRevenueToday}
                totalInvoiceCountToday={totalInvoiceCountToday}
              />
              <RevenueChart totalRevenueToday={totalRevenueToday} />
            </>
          )}
        </div>

        <div className="xl:col-span-1 flex flex-col gap-6 font-semibold">
          <QuickAccessPanel currentRole={currentRole} />
          <RecentActivityPanel />
        </div>
      </div>
    </DashboardWorkspaceLayout>
  );
};

export default DashboardOverviewPage;
