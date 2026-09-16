import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { REPORT_NAVIGATION_ITEMS, REPORT_UI } from "@/constants/report";
import { APP_ROUTES } from "@/constants/routes";
import { AuditLogSidebar } from "@/modules/audit_log/components/AuditLogSidebar";
import { useAuditLogFilter } from "@/modules/audit_log/context/AuditLogFilterContext";
import { AnomalyAlertSidebar } from "@/modules/anomaly_alert/components/AnomalyAlertSidebar";
import { PeakHoursSidebar } from "@/modules/sales_analytics/components/PeakHoursSidebar";
import { RevenueReportSidebar } from "./RevenueReportSidebar";
import { PosRevenueReportSidebar } from "./PosRevenueReportSidebar";
import { RevenueComparisonSidebar } from "./RevenueComparisonSidebar";
import { ActivityLogSidebar } from "./ActivityLogSidebar";
import { GrossProfitReportSidebar } from "./GrossProfitReportSidebar";
import { EmployeeShiftReportSidebar } from "./EmployeeShiftReportSidebar";
import { PaymentMethodReportSidebar } from "./PaymentMethodReportSidebar";
import { ProductGroupReportSidebar } from "./ProductGroupReportSidebar";
import { InventoryValuationSidebar } from "@/modules/inventory_valuation/components/InventoryValuationSidebar";

const getNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-xs font-bold transition-all lg:min-h-0 ${
    isActive
      ? "bg-kv-blue-light text-kv-blue-primary"
      : "hover:bg-slate-50 text-slate-600"
  }`;

export const ReportSidebar: React.FC = () => {
  const location = useLocation();

  const isRevenueRoute =
    location.pathname === APP_ROUTES.REPORT_REVENUE ||
    location.pathname === APP_ROUTES.REPORTS ||
    location.pathname === "/reports";

  const isGrossProfitRoute =
    location.pathname === APP_ROUTES.REPORT_GROSS_PROFIT ||
    location.pathname.startsWith("/reports/gross-profit");

  const isProductGroupRoute =
    location.pathname === APP_ROUTES.REPORT_PRODUCT_GROUPS ||
    location.pathname.startsWith("/reports/product-groups");

  const isPaymentMethodRoute =
    location.pathname === APP_ROUTES.REPORT_PAYMENT_METHODS ||
    location.pathname.startsWith("/reports/payment-methods");

  const isEmployeeShiftRoute =
    location.pathname === APP_ROUTES.REPORT_EMPLOYEE_SHIFTS ||
    location.pathname.startsWith("/reports/employee-shifts");

  const isPosRevenueRoute =
    location.pathname === APP_ROUTES.REPORT_POS_REVENUE ||
    location.pathname.startsWith("/reports/pos-revenue");

  const isPeakHoursRoute =
    location.pathname === APP_ROUTES.REPORT_PEAK_HOURS ||
    location.pathname.startsWith("/reports/peak-hours");

  const isComparisonRoute =
    location.pathname === APP_ROUTES.REPORT_COMPARISON ||
    location.pathname.startsWith("/reports/comparison");

  const isActivityLogRoute =
    location.pathname === APP_ROUTES.REPORT_ACTIVITY_LOGS ||
    location.pathname.startsWith("/reports/activity-logs");

  const isAuditLogRoute =
    location.pathname === APP_ROUTES.REPORT_AUDIT_LOGS ||
    location.pathname.startsWith("/reports/audit-logs");

  const isAnomalyAlertRoute =
    location.pathname === APP_ROUTES.REPORT_ANOMALY_ALERTS ||
    location.pathname.startsWith("/reports/anomaly-alerts");

  const isInventoryValuationRoute =
    location.pathname === APP_ROUTES.REPORT_INVENTORY_VALUATION ||
    location.pathname.startsWith("/reports/inventory-valuation");

  const { filter, handleFilterChange, handleResetFilter } = useAuditLogFilter();

  return (
    <div className="flex flex-col gap-4">
      {/* Sidebar Header Title */}
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        {REPORT_UI.SIDEBAR.TITLE}
      </div>

      {/* Primary Navigation Items */}
      <div className="flex flex-col gap-1">
        {REPORT_NAVIGATION_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={getNavLinkClassName}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* 1. Revenue Report Filter */}
      {isRevenueRoute && (
        <div className="pt-2 border-t border-slate-200">
          <RevenueReportSidebar />
        </div>
      )}

      {/* 1.1 Gross Profit Report Filter */}
      {isGrossProfitRoute && (
        <div className="pt-2 border-t border-slate-200">
          <GrossProfitReportSidebar />
        </div>
      )}

      {/* 1.2 Product Group Report Filter */}
      {isProductGroupRoute && (
        <div className="pt-2 border-t border-slate-200">
          <ProductGroupReportSidebar />
        </div>
      )}

      {/* 1.3 Payment Method Report Filter */}
      {isPaymentMethodRoute && (
        <div className="pt-2 border-t border-slate-200">
          <PaymentMethodReportSidebar />
        </div>
      )}

      {/* 1.4 Employee Shift Report Filter */}
      {isEmployeeShiftRoute && (
        <div className="pt-2 border-t border-slate-200">
          <EmployeeShiftReportSidebar />
        </div>
      )}

      {/* 2. POS Revenue Report Filter */}
      {isPosRevenueRoute && (
        <div className="pt-2 border-t border-slate-200">
          <PosRevenueReportSidebar />
        </div>
      )}

      {/* 3. Peak Hours Report Filter */}
      {isPeakHoursRoute && (
        <div className="pt-2 border-t border-slate-200">
          <PeakHoursSidebar />
        </div>
      )}

      {/* 3. Revenue Comparison Filter */}
      {isComparisonRoute && (
        <div className="pt-2 border-t border-slate-200">
          <RevenueComparisonSidebar />
        </div>
      )}

      {/* 3. Activity Log Filter */}
      {isActivityLogRoute && (
        <div className="pt-2 border-t border-slate-200">
          <ActivityLogSidebar />
        </div>
      )}

      {/* 4. Audit Log Filter */}
      {isAuditLogRoute && (
        <div className="pt-2 border-t border-slate-200">
          <AuditLogSidebar
            filter={filter}
            onFilterChange={handleFilterChange}
            onResetFilter={handleResetFilter}
            variant="sidebar"
          />
        </div>
      )}

      {/* 5. Anomaly Alert Filter */}
      {isAnomalyAlertRoute && (
        <div className="pt-2 border-t border-slate-200">
          <AnomalyAlertSidebar />
        </div>
      )}

      {/* 6. Inventory Valuation Filter */}
      {isInventoryValuationRoute && (
        <div className="pt-2 border-t border-slate-200">
          <InventoryValuationSidebar />
        </div>
      )}
    </div>
  );
};
