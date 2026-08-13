import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { PRODUCT_FILTER, PRODUCT_STOCK_FILTER } from "@/constants/product";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { ProductSectionSidebar } from "@/modules/product/components/ProductSectionSidebar";
import type { TStockFilter } from "@/modules/product/types/TStockFilter";
import { SUPPLIER_FILTER_DEFAULTS } from "@/constants/supplier";
import type { ISupplierFilters } from "@/modules/supplier/types/ISupplier";

export interface IProductOutletContext {
  selectedGroup: string;
  stockFilter: TStockFilter;
  supplierFilters: ISupplierFilters;
}

export const ProductsLayout = () => {
  const { currentRole } = useDashboardDemo();
  const [selectedGroup, setSelectedGroup] = useState<string>(PRODUCT_FILTER.ALL);
  const [stockFilter, setStockFilter] = useState<TStockFilter>(
    PRODUCT_STOCK_FILTER.ALL,
  );
  const [supplierFilters, setSupplierFilters] = useState<ISupplierFilters>({
    ...SUPPLIER_FILTER_DEFAULTS,
  });

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <ProductSectionSidebar
          currentRole={currentRole}
          selectedGroup={selectedGroup}
          onSelectedGroupChange={setSelectedGroup}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          supplierFilters={supplierFilters}
          onSupplierFiltersChange={setSupplierFilters}
        />
      }
    >
      <Outlet
        context={{
          selectedGroup,
          stockFilter,
          supplierFilters,
        } satisfies IProductOutletContext}
      />
    </DashboardWorkspaceLayout>
  );
};

export default ProductsLayout;
