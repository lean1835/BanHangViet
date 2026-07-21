import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { PlatformAdminLayout } from "../components/PlatformAdminLayout";
import { PlatformAdminSidebar } from "../components/PlatformAdminSidebar";

export const PlatformAdminWorkspaceLayout = () => (
  <DashboardWorkspaceLayout sidebar={<PlatformAdminSidebar />}>
    <PlatformAdminLayout />
  </DashboardWorkspaceLayout>
);

export default PlatformAdminWorkspaceLayout;
