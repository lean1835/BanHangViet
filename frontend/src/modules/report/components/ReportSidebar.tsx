import React, { useState, useEffect, useMemo, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { REPORT_GROUPS, REPORT_UI } from "@/constants/report";
import { APP_ROUTES } from "@/constants/routes";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
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

export const ReportSidebar: React.FC = () => {
  const location = useLocation();
  const { currentRole } = useDashboardDemo();

  const isItemActive = useCallback(
    (path: string): boolean => {
      if (path === APP_ROUTES.REPORT_REVENUE) {
        return (
          location.pathname === APP_ROUTES.REPORT_REVENUE ||
          location.pathname === APP_ROUTES.REPORTS ||
          location.pathname === "/reports"
        );
      }
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    },
    [location.pathname]
  );

  // Lọc danh sách nhóm và các báo cáo con theo phân quyền vai trò hiện tại
  const visibleGroups = useMemo(() => {
    return REPORT_GROUPS.map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (!item.allowedRoles) return true;
        return item.allowedRoles.includes(currentRole);
      });
      return {
        ...group,
        items: filteredItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [currentRole]);

  // Xác định nhóm nào đang chứa trang báo cáo hiện tại
  const activeGroupId = useMemo(() => {
    for (const group of visibleGroups) {
      if (group.items.some((item) => isItemActive(item.path))) {
        return group.id;
      }
    }
    return visibleGroups[0]?.id || "sales";
  }, [isItemActive, visibleGroups]);

  // Trạng thái mở/đóng từng nhóm (mặc định mở nhóm đang active)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    [activeGroupId]: true,
  });

  // Tự động mở nhóm khi người dùng chuyển trang sang nhóm khác
  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => ({
        ...prev,
        [activeGroupId]: true,
      }));
    }
  }, [activeGroupId]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

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

      {/* Danh mục phân nhóm có mũi tên xổ xuống basic */}
      <div className="flex flex-col gap-1">
        {visibleGroups.map((group) => {
          const isOpen = !!openGroups[group.id];
          const hasActiveItem = group.items.some((item) => isItemActive(item.path));

          return (
            <div key={group.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`flex min-h-10 w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-bold transition-all cursor-pointer ${
                  hasActiveItem
                    ? "text-kv-blue-primary bg-slate-50"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{group.label}</span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-300 ease-in-out ${
                    isOpen ? "rotate-180 text-slate-600" : ""
                  }`}
                />
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-0.5 pl-3 pt-0.5 pb-1.5">
                    {group.items.map((item) => {
                      const active = isItemActive(item.path);

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={`flex min-h-9 w-full items-center rounded-md px-3 py-1.5 text-left text-xs transition-all ${
                            active
                              ? "bg-kv-blue-light text-kv-blue-primary font-bold"
                              : "hover:bg-slate-50 text-slate-600 font-normal"
                          }`}
                        >
                          {item.label}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
