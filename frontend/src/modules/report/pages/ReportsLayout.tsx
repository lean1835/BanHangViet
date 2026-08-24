import { Outlet } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { ReportSidebar } from "../components/ReportSidebar";
import { AuditLogFilterProvider } from "@/modules/audit_log/context/AuditLogFilterContext";
import { ReportFilterProvider } from "../context/ReportFilterContext";
import { AnomalyAlertFilterProvider } from "@/modules/anomaly_alert/context/AnomalyAlertFilterContext";

export const ReportsLayout = () => (
  <ReportFilterProvider>
    <AuditLogFilterProvider>
      <AnomalyAlertFilterProvider>
        <DashboardWorkspaceLayout sidebar={<ReportSidebar />}>
          <Outlet />
        </DashboardWorkspaceLayout>
      </AnomalyAlertFilterProvider>
    </AuditLogFilterProvider>
  </ReportFilterProvider>
);

export default ReportsLayout;
