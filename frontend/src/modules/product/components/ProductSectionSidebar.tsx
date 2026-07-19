import { NavLink, useLocation } from "react-router-dom";
import { PRODUCT_SECTION_COPY } from "@/constants/product";
import { APP_ROUTES } from "@/constants/routes";
import type { TDemoRole } from "@/constants/roles";
import { ProductSidebar } from "@/modules/product/components/ProductSidebar";
import type { TStockFilter } from "@/modules/product/types/TStockFilter";

interface ProductSectionSidebarProps {
  currentRole: TDemoRole;
  selectedGroup: string;
  onSelectedGroupChange: (groupId: string) => void;
  stockFilter: TStockFilter;
  onStockFilterChange: (filter: TStockFilter) => void;
}

const getNavLinkClass = (isActive: boolean): string =>
  `w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
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
}: ProductSectionSidebarProps) => {
  const location = useLocation();
  const isProductListRoute = location.pathname === APP_ROUTES.PRODUCTS;

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
    </div>
  );
};
