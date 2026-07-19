import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { PRODUCT_FILTER, PRODUCT_STOCK_FILTER } from "@/constants/product";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { ProductSectionSidebar } from "@/modules/product/components/ProductSectionSidebar";
import type { TStockFilter } from "@/modules/product/types/TStockFilter";

export interface IProductOutletContext {
  selectedGroup: string;
  stockFilter: TStockFilter;
}

export const ProductsLayout = () => {
  const { currentRole } = useDashboardDemo();
  const [selectedGroup, setSelectedGroup] = useState<string>(PRODUCT_FILTER.ALL);
  const [stockFilter, setStockFilter] = useState<TStockFilter>(
    PRODUCT_STOCK_FILTER.ALL,
  );

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <ProductSectionSidebar
          currentRole={currentRole}
          selectedGroup={selectedGroup}
          onSelectedGroupChange={setSelectedGroup}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
        />
      }
    >
      <Outlet context={{ selectedGroup, stockFilter } satisfies IProductOutletContext} />
    </DashboardWorkspaceLayout>
  );
};

export default ProductsLayout;
