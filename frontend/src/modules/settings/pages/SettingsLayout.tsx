import { Outlet } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { SettingsSidebar } from "../components/SettingsSidebar";

export const SettingsLayout = () => (
  <DashboardWorkspaceLayout sidebar={<SettingsSidebar />}>
    <Outlet />
  </DashboardWorkspaceLayout>
);

export default SettingsLayout;
