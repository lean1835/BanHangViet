import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { REPORT_NAVIGATION_ITEMS, REPORT_UI } from "@/constants/report";
import { APP_ROUTES } from "@/constants/routes";
import { AuditLogSidebar } from "@/modules/audit_log/components/AuditLogSidebar";
import { useAuditLogFilter } from "@/modules/audit_log/context/AuditLogFilterContext";
import { AnomalyAlertSidebar } from "@/modules/anomaly_alert/components/AnomalyAlertSidebar";
import { RevenueReportSidebar } from "./RevenueReportSidebar";
import { RevenueComparisonSidebar } from "./RevenueComparisonSidebar";
import { ActivityLogSidebar } from "./ActivityLogSidebar";

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

  const { filter, handleFilterChange, handleResetFilter } = useAuditLogFilter();

  return (
    <div className="flex flex-col gap-4">
      {/* Sidebar Header Title */}
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        {REPORT_UI.SIDEBAR.TITLE}
      </div>

      {/* Primary Navigation Items */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          {REPORT_UI.SIDEBAR.SECTION_LABEL}
        </span>
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
      </div>

      {/* 1. Revenue Report Filter */}
      {isRevenueRoute && (
        <div className="pt-2 border-t border-slate-200">
          <RevenueReportSidebar />
        </div>
      )}

      {/* 2. Revenue Comparison Filter */}
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
    </div>
  );
};
