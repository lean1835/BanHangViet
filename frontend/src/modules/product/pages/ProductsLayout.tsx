import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { PRODUCT_FILTER, PRODUCT_STOCK_FILTER } from "@/constants/product";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { ProductSectionSidebar } from "@/modules/product/components/ProductSectionSidebar";
import { CreateSupplierGroupModal } from "@/modules/goods_receipt/components/CreateSupplierGroupModal";
import type { TStockFilter } from "@/modules/product/types/TStockFilter";

const INITIAL_SUPPLIER_GROUPS = [
  "ALL",
  "Nông sản - Thực phẩm",
  "Bánh kẹo - Nước giải khát",
  "Hóa mỹ phẩm - Tiêu dùng",
  "Thiết bị - Gia dụng",
  "Nhà cung cấp khác",
];

export interface IProductOutletContext {
  selectedGroup: string;
  stockFilter: TStockFilter;
  // Supplier filter states
  supplierSearchQuery: string;
  setSupplierSearchQuery: (q: string) => void;
  supplierGroup: string;
  setSupplierGroup: (g: string) => void;
  supplierMinDebt: number | "";
  setSupplierMinDebt: (v: number | "") => void;
  supplierMaxDebt: number | "";
  setSupplierMaxDebt: (v: number | "") => void;
  supplierStatusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  setSupplierStatusFilter: (s: "ALL" | "ACTIVE" | "INACTIVE") => void;
  resetSupplierFilter: () => void;
  supplierGroupsList: string[];
  openCreateGroupModal: () => void;
}

export const ProductsLayout = () => {
  const { currentRole } = useDashboardDemo();
  const [selectedGroup, setSelectedGroup] = useState<string>(PRODUCT_FILTER.ALL);
  const [stockFilter, setStockFilter] = useState<TStockFilter>(
    PRODUCT_STOCK_FILTER.ALL,
  );

  // Supplier filter states
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [supplierGroup, setSupplierGroup] = useState("ALL");
  const [supplierMinDebt, setSupplierMinDebt] = useState<number | "">("");
  const [supplierMaxDebt, setSupplierMaxDebt] = useState<number | "">("");
  const [supplierStatusFilter, setSupplierStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [supplierGroupsList, setSupplierGroupsList] = useState<string[]>(INITIAL_SUPPLIER_GROUPS);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const resetSupplierFilter = () => {
    setSupplierSearchQuery("");
    setSupplierGroup("ALL");
    setSupplierMinDebt("");
    setSupplierMaxDebt("");
    setSupplierStatusFilter("ACTIVE");
  };

  const handleCreateSupplierGroup = (newGroup: string) => {
    if (!supplierGroupsList.includes(newGroup)) {
      setSupplierGroupsList((prev) => [...prev, newGroup]);
    }
    setSupplierGroup(newGroup);
  };

  const outletContext: IProductOutletContext = {
    selectedGroup,
    stockFilter,
    supplierSearchQuery,
    setSupplierSearchQuery,
    supplierGroup,
    setSupplierGroup,
    supplierMinDebt,
    setSupplierMinDebt,
    supplierMaxDebt,
    setSupplierMaxDebt,
    supplierStatusFilter,
    setSupplierStatusFilter,
    resetSupplierFilter,
    supplierGroupsList,
    openCreateGroupModal: () => setIsCreateGroupModalOpen(true),
  };

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <ProductSectionSidebar
          currentRole={currentRole}
          selectedGroup={selectedGroup}
          onSelectedGroupChange={setSelectedGroup}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          supplierSearchQuery={supplierSearchQuery}
          supplierGroup={supplierGroup}
          onSupplierGroupChange={setSupplierGroup}
          supplierMinDebt={supplierMinDebt}
          onSupplierMinDebtChange={setSupplierMinDebt}
          supplierMaxDebt={supplierMaxDebt}
          onSupplierMaxDebtChange={setSupplierMaxDebt}
          supplierStatusFilter={supplierStatusFilter}
          onSupplierStatusFilterChange={setSupplierStatusFilter}
          onResetSupplierFilter={resetSupplierFilter}
          supplierGroupsList={supplierGroupsList}
          onOpenCreateSupplierGroupModal={() => setIsCreateGroupModalOpen(true)}
        />
      }
    >
      <Outlet context={outletContext} />

      <CreateSupplierGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSaveGroup={handleCreateSupplierGroup}
      />
    </DashboardWorkspaceLayout>
  );
};

export default ProductsLayout;
