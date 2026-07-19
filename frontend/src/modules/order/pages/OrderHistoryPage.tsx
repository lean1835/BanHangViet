import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { OrderHistoryTable } from "@/modules/order/components/OrderHistoryTable";
import { OrderSidebar } from "@/modules/order/components/OrderSidebar";

export const OrderHistoryPage = () => {
  const { currentRole } = useDashboardDemo();

  return (
    <DashboardWorkspaceLayout sidebar={<OrderSidebar />}>
      <OrderHistoryTable currentRole={currentRole} />
    </DashboardWorkspaceLayout>
  );
};

export default OrderHistoryPage;
