import { NavLink, useLocation } from "react-router-dom";
import { PRODUCT_SECTION_COPY } from "@/constants/product";
import { APP_ROUTES } from "@/constants/routes";
import type { TDemoRole } from "@/constants/roles";
import { ProductSidebar } from "@/modules/product/components/ProductSidebar";
import { SupplierSidebarFilter } from "@/modules/goods_receipt/components/SupplierSidebarFilter";
import type { TStockFilter } from "@/modules/product/types/TStockFilter";

interface ProductSectionSidebarProps {
  currentRole: TDemoRole;
  selectedGroup: string;
  onSelectedGroupChange: (groupId: string) => void;
  stockFilter: TStockFilter;
  onStockFilterChange: (filter: TStockFilter) => void;
  // Supplier filter props
  supplierSearchQuery: string;
  supplierGroup: string;
  onSupplierGroupChange: (g: string) => void;
  supplierMinDebt: number | "";
  onSupplierMinDebtChange: (v: number | "") => void;
  supplierMaxDebt: number | "";
  onSupplierMaxDebtChange: (v: number | "") => void;
  supplierStatusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onSupplierStatusFilterChange: (s: "ALL" | "ACTIVE" | "INACTIVE") => void;
  onResetSupplierFilter: () => void;
  supplierGroupsList?: string[];
  onOpenCreateSupplierGroupModal?: () => void;
}

const getNavLinkClass = (isActive: boolean): string =>
  `flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-xs font-bold transition-all lg:min-h-0 ${
    isActive
      ? "bg-kv-blue-light text-kv-blue-primary"
      : "hover:bg-slate-50 text-slate-600"
  }`;

export const ProductSectionSidebar = ({
  currentRole,
  selectedGroup,
  onSelectedGroupChange,
  stockFilter,
  onStockFilterChange,
  supplierSearchQuery,
  supplierGroup,
  onSupplierGroupChange,
  supplierMinDebt,
  onSupplierMinDebtChange,
  supplierMaxDebt,
  onSupplierMaxDebtChange,
  supplierStatusFilter,
  onSupplierStatusFilterChange,
  onResetSupplierFilter,
  supplierGroupsList,
  onOpenCreateSupplierGroupModal,
}: ProductSectionSidebarProps) => {
  const location = useLocation();
  const isProductListRoute = location.pathname === APP_ROUTES.PRODUCTS;
  const isSupplierListRoute = location.pathname === APP_ROUTES.PRODUCT_SUPPLIERS;

  return (
    <div className="flex flex-col gap-4">
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        {PRODUCT_SECTION_COPY.TITLE}
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          {PRODUCT_SECTION_COPY.FUNCTION_SECTION}
        </span>
        <div className="flex flex-col gap-1">
          <NavLink
            to={APP_ROUTES.PRODUCTS}
            end
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            {PRODUCT_SECTION_COPY.PRODUCT_LIST_ROUTE}
          </NavLink>
          <NavLink
            to={APP_ROUTES.PRODUCT_STOCK_ENTRY}
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            {PRODUCT_SECTION_COPY.STOCK_ENTRY_ROUTE}
          </NavLink>
          <NavLink
            to={APP_ROUTES.PRODUCT_SUPPLIERS}
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            {PRODUCT_SECTION_COPY.SUPPLIER_MANAGEMENT_ROUTE}
          </NavLink>
        </div>
      </div>

      {isProductListRoute && (
        <div className="border-t pt-4">
          <ProductSidebar
            selectedGroup={selectedGroup}
            setSelectedGroup={onSelectedGroupChange}
            stockFilter={stockFilter}
            setStockFilter={onStockFilterChange}
            userRole={currentRole}
          />
        </div>
      )}

      {isSupplierListRoute && (
        <div className="border-t pt-4">
          <SupplierSidebarFilter
            searchQuery={supplierSearchQuery}
            selectedGroup={supplierGroup}
            onGroupChange={onSupplierGroupChange}
            minDebt={supplierMinDebt}
            onMinDebtChange={onSupplierMinDebtChange}
            maxDebt={supplierMaxDebt}
            onMaxDebtChange={onSupplierMaxDebtChange}
            statusFilter={supplierStatusFilter}
            onStatusFilterChange={onSupplierStatusFilterChange}
            onReset={onResetSupplierFilter}
            groupsList={supplierGroupsList}
            onOpenCreateGroupModal={onOpenCreateSupplierGroupModal}
          />
        </div>
      )}
    </div>
  );
};
