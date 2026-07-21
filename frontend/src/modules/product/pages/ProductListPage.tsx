import { useOutletContext } from "react-router-dom";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { ProductList } from "@/modules/product/components/ProductList";
import type { IProductOutletContext } from "@/modules/product/pages/ProductsLayout";

export const ProductListPage = () => {
  const { currentRole } = useDashboardDemo();
  const { selectedGroup, stockFilter } = useOutletContext<IProductOutletContext>();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <div className="xl:col-span-4 animate-auth-fade-in">
        <ProductList
          userRole={currentRole}
          selectedGroup={selectedGroup}
          stockFilter={stockFilter}
        />
      </div>
    </div>
  );
};

export default ProductListPage;
