import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { PRODUCT_FILTER, PRODUCT_STOCK_FILTER } from "@/constants/product";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { ProductSectionSidebar } from "@/modules/product/components/ProductSectionSidebar";
import type { TStockFilter } from "@/modules/product/types/TStockFilter";
import type { SupplierFilterState } from "@/modules/supplier/components/SupplierSidebar";
import type { IInventoryAuditFilterState } from "@/modules/inventory_audit/types/IInventoryAudit";
import { INVENTORY_AUDIT_FILTER_STATUS } from "@/constants/inventoryAudit";

export interface IProductOutletContext {
  selectedGroup: string;
  stockFilter: TStockFilter;
  supplierFilter: SupplierFilterState;
  setSupplierFilter: React.Dispatch<React.SetStateAction<SupplierFilterState>>;
  inventoryAuditFilter: IInventoryAuditFilterState;
  setInventoryAuditFilter: React.Dispatch<
    React.SetStateAction<IInventoryAuditFilterState>
  >;
}

export const ProductsLayout = () => {
  const { currentRole } = useDashboardDemo();
  const [selectedGroup, setSelectedGroup] = useState<string>(PRODUCT_FILTER.ALL);
  const [stockFilter, setStockFilter] = useState<TStockFilter>(
    PRODUCT_STOCK_FILTER.ALL,
  );

  // Supplier filter states
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilterState>({
    debtFrom: "",
    debtTo: "",
    status: "ACTIVE",
  });

  // Inventory Audit filter states
  const [inventoryAuditFilter, setInventoryAuditFilter] =
    useState<IInventoryAuditFilterState>({
      search: "",
      statusFilter: INVENTORY_AUDIT_FILTER_STATUS.ALL,
      dateFrom: "",
      dateTo: "",
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
          supplierFilter={supplierFilter}
          onSupplierFilterChange={setSupplierFilter}
          inventoryAuditFilter={inventoryAuditFilter}
          onInventoryAuditFilterChange={setInventoryAuditFilter}
        />
      }
    >
      <Outlet
        context={
          {
            selectedGroup,
            stockFilter,
            supplierFilter,
            setSupplierFilter,
            inventoryAuditFilter,
            setInventoryAuditFilter,
          } satisfies IProductOutletContext
        }
      />
    </DashboardWorkspaceLayout>
  );
};

export default ProductsLayout;
