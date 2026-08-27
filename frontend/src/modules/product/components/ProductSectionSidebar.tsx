import { NavLink, useLocation } from "react-router-dom";
import { PRODUCT_SECTION_COPY } from "@/constants/product";
import { APP_ROUTES } from "@/constants/routes";
import type { TDemoRole } from "@/constants/roles";
import { ProductSidebar } from "@/modules/product/components/ProductSidebar";
import type { TStockFilter } from "@/modules/product/types/TStockFilter";
import {
  SupplierSidebar,
  type SupplierFilterState,
} from "@/modules/supplier/components/SupplierSidebar";
import {
  InventoryAuditSidebar,
} from "@/modules/inventory_audit/components/InventoryAuditSidebar";
import type { IInventoryAuditFilterState } from "@/modules/inventory_audit/types/IInventoryAudit";
import {
  InventoryWarningSidebar,
} from "@/modules/product/components/InventoryWarningSidebar";
import type { IInventoryWarningFilterState } from "@/modules/product/types/IInventoryWarning";

interface ProductSectionSidebarProps {
  currentRole: TDemoRole;
  selectedGroup: string;
  onSelectedGroupChange: (groupId: string) => void;
  stockFilter: TStockFilter;
  onStockFilterChange: (filter: TStockFilter) => void;
  supplierFilter?: SupplierFilterState;
  onSupplierFilterChange?: (filter: SupplierFilterState) => void;
  inventoryAuditFilter?: IInventoryAuditFilterState;
  onInventoryAuditFilterChange?: (filter: IInventoryAuditFilterState) => void;
  inventoryWarningFilter?: IInventoryWarningFilterState;
  onInventoryWarningFilterChange?: (filter: IInventoryWarningFilterState) => void;
}

const getNavLinkClass = (isActive: boolean): string =>
  `flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-bold transition-all lg:min-h-0 ${
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
  supplierFilter,
  onSupplierFilterChange,
  inventoryAuditFilter,
  onInventoryAuditFilterChange,
  inventoryWarningFilter,
  onInventoryWarningFilterChange,
}: ProductSectionSidebarProps) => {
  const location = useLocation();
  const isProductListRoute = location.pathname === APP_ROUTES.PRODUCTS;
  const isInventoryAuditRoute =
    location.pathname === APP_ROUTES.PRODUCT_INVENTORY_AUDITS ||
    location.pathname.startsWith("/products/inventory-audits");
  const isInventoryWarningRoute =
    location.pathname === APP_ROUTES.PRODUCT_INVENTORY_WARNINGS ||
    location.pathname.startsWith("/products/inventory-warnings");
  const isSupplierRoute =
    location.pathname === APP_ROUTES.PRODUCT_SUPPLIERS ||
    location.pathname === APP_ROUTES.SUPPLIERS ||
    location.pathname.startsWith("/products/suppliers");

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
            <span>{PRODUCT_SECTION_COPY.PRODUCT_LIST_ROUTE}</span>
          </NavLink>
          <NavLink
            to={APP_ROUTES.PRODUCT_STOCK_ENTRY}
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <span>{PRODUCT_SECTION_COPY.STOCK_ENTRY_ROUTE}</span>
          </NavLink>
          <NavLink
            to={APP_ROUTES.PRODUCT_INVENTORY_AUDITS}
            className={({ isActive }) =>
              getNavLinkClass(isActive || isInventoryAuditRoute)
            }
          >
            <span>Kiểm kê kho</span>
          </NavLink>
          <NavLink
            to={APP_ROUTES.PRODUCT_INVENTORY_WARNINGS}
            className={({ isActive }) =>
              getNavLinkClass(isActive || isInventoryWarningRoute)
            }
          >
            <span className="truncate">Cảnh báo tồn kho</span>
          </NavLink>
          <NavLink
            to={APP_ROUTES.PRODUCT_POS_INVENTORIES}
            className={({ isActive }) =>
              getNavLinkClass(isActive || location.pathname.startsWith("/products/pos-inventories"))
            }
          >
            <span>Tồn kho điểm bán</span>
          </NavLink>
          <NavLink
            to={APP_ROUTES.PRODUCT_POS_TRANSFERS}
            className={({ isActive }) =>
              getNavLinkClass(isActive || location.pathname.startsWith("/products/pos-transfers"))
            }
          >
            <span>Chuyển hàng điểm bán</span>
          </NavLink>
          <NavLink
            to={APP_ROUTES.PRODUCT_SUPPLIERS}
            className={({ isActive }) =>
              getNavLinkClass(isActive || isSupplierRoute)
            }
          >
            <span>{PRODUCT_SECTION_COPY.SUPPLIER_ROUTE}</span>
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

      {isInventoryWarningRoute &&
        inventoryWarningFilter &&
        onInventoryWarningFilterChange && (
          <div className="border-t pt-4">
            <InventoryWarningSidebar
              filter={inventoryWarningFilter}
              onFilterChange={onInventoryWarningFilterChange}
            />
          </div>
        )}

      {isInventoryAuditRoute &&
        inventoryAuditFilter &&
        onInventoryAuditFilterChange && (
          <div className="border-t pt-4">
            <InventoryAuditSidebar
              filter={inventoryAuditFilter}
              onFilterChange={onInventoryAuditFilterChange}
            />
          </div>
        )}

      {isSupplierRoute && supplierFilter && onSupplierFilterChange && (
        <div className="border-t pt-4">
          <SupplierSidebar
            filter={supplierFilter}
            onFilterChange={onSupplierFilterChange}
          />
        </div>
      )}
    </div>
  );
};
