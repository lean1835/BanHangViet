import { Outlet } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { ReportSidebar } from "../components/ReportSidebar";

export const ReportsLayout = () => (
  <DashboardWorkspaceLayout sidebar={<ReportSidebar />}>
    <Outlet />
  </DashboardWorkspaceLayout>
);

export default ReportsLayout;
