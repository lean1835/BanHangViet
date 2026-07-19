import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { CashierShiftDashboard } from "@/modules/shift/components/CashierShiftDashboard";
import { ShiftHistoryTable } from "@/modules/shift/components/ShiftHistoryTable";
import { ShiftSidebar } from "@/modules/shift/components/ShiftSidebar";

export const ShiftHistoryPage = () => {
  const { currentRole } = useDashboardDemo();

  return (
    <DashboardWorkspaceLayout sidebar={<ShiftSidebar />}>
      <div className="w-full animate-auth-fade-in">
        {currentRole === USER_ROLES.CASHIER ? (
          <CashierShiftDashboard />
        ) : (
          <ShiftHistoryTable currentRole={currentRole} />
        )}
      </div>
    </DashboardWorkspaceLayout>
  );
};

export default ShiftHistoryPage;
