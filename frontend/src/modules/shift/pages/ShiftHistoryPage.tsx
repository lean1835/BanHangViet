import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { ShiftHistoryTable } from "@/modules/shift/components/ShiftHistoryTable";
import { ShiftSidebar } from "@/modules/shift/components/ShiftSidebar";

export const ShiftHistoryPage = () => {
  const { currentRole } = useDashboardDemo();

  return (
    <DashboardWorkspaceLayout sidebar={<ShiftSidebar />}>
      <div className="w-full animate-auth-fade-in">
        <ShiftHistoryTable currentRole={currentRole} />
      </div>
    </DashboardWorkspaceLayout>
  );
};

export default ShiftHistoryPage;
