import { useOutletContext } from "react-router-dom";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { SupplierList } from "@/modules/supplier/components/SupplierList";
import type { IProductOutletContext } from "@/modules/product/pages/ProductsLayout";

export const SupplierManagementPage = () => {
  const { currentRole } = useDashboardDemo();
  const { supplierFilters } = useOutletContext<IProductOutletContext>();

  return <SupplierList currentRole={currentRole} filters={supplierFilters} />;
};

export default SupplierManagementPage;
