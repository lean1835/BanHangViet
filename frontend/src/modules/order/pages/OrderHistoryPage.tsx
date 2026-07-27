import { useState } from "react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { OrderHistoryTable } from "@/modules/order/components/OrderHistoryTable";
import { OrderSidebar } from "@/modules/order/components/OrderSidebar";

export const OrderHistoryPage = () => {
  const { currentRole } = useDashboardDemo();

  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <OrderSidebar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      }
    >
      <OrderHistoryTable
        currentRole={currentRole}
        statusFilter={statusFilter}
        fromDate={fromDate}
        toDate={toDate}
        searchQuery={searchQuery}
      />
    </DashboardWorkspaceLayout>
  );
};

export default OrderHistoryPage;
