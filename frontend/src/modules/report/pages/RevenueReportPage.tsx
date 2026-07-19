import { useMemo } from "react";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { REVENUE_REPORT_FILTER } from "@/constants/report";
import { RevenueReport } from "../components/RevenueReport";

export const RevenueReportPage = () => {
  const { invoices } = useDashboardDemo();
  const totalRevenueToday = useMemo(
    () =>
      invoices
        .filter(
          (invoice) =>
            invoice.status === REVENUE_REPORT_FILTER.INVOICE_STATUS &&
            invoice.time.startsWith(REVENUE_REPORT_FILTER.DATE_PREFIX),
        )
        .reduce((sum, invoice) => sum + invoice.finalAmount, 0),
    [invoices],
  );

  return <RevenueReport totalRevenueToday={totalRevenueToday} />;
};

export default RevenueReportPage;
