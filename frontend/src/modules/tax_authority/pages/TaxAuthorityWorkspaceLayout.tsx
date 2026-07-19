import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { TaxAuthorityLayout } from "../components/TaxAuthorityLayout";
import { TaxAuthoritySidebar } from "../components/TaxAuthoritySidebar";

export const TaxAuthorityWorkspaceLayout = () => (
  <DashboardWorkspaceLayout sidebar={<TaxAuthoritySidebar />}>
    <TaxAuthorityLayout />
  </DashboardWorkspaceLayout>
);

export default TaxAuthorityWorkspaceLayout;
