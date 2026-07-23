import React, { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { APP_ROUTES, ROUTE_SEGMENTS } from "@/constants/routes";
import { APP_MESSAGES } from "@/constants/app";
import { ROLE_GROUPS } from "@/constants/roles";
import { DashboardDemoProvider } from "@/providers/DashboardDemoProvider";
import { PrivateRoute } from "./guards/PrivateRoute";
import { PublicRoute } from "./guards/PublicRoute";
import { RoleRoute } from "./guards/RoleRoute";

import AuthPage from "@/pages/AuthPage";
import LoginPage from "@/modules/auth/pages/LoginPage";
const RegisterPage = React.lazy(() => import("@/modules/auth/pages/RegisterPage"));
const AuthenticatedAppLayout = React.lazy(
  () => import("@/components/layouts/AuthenticatedAppLayout")
);
const DashboardOverviewPage = React.lazy(
  () => import("@/modules/dashboard/pages/DashboardOverviewPage")
);
const ProductsLayout = React.lazy(() => import("@/modules/product/pages/ProductsLayout"));
const ProductListPage = React.lazy(() => import("@/modules/product/pages/ProductListPage"));
const StockEntryPage = React.lazy(() => import("@/modules/product/pages/StockEntryPage"));
const ShiftHistoryPage = React.lazy(() => import("@/modules/shift/pages/ShiftHistoryPage"));
const OrderHistoryPage = React.lazy(() => import("@/modules/order/pages/OrderHistoryPage"));
const InvoiceManagementPage = React.lazy(
  () => import("@/modules/e_invoice/pages/InvoiceManagementPage")
);
const AdjustInvoicePage = React.lazy(
  () => import("@/modules/e_invoice/pages/AdjustInvoicePage")
);
const CustomerPage = React.lazy(() => import("@/modules/customer/pages/CustomerPage"));
const EmployeePage = React.lazy(() => import("@/modules/employee/pages/EmployeePage"));
const ReportsLayout = React.lazy(() => import("@/modules/report/pages/ReportsLayout"));
const RevenueReportPage = React.lazy(
  () => import("@/modules/report/pages/RevenueReportPage")
);
const RevenueComparisonPage = React.lazy(
  () => import("@/modules/report/pages/RevenueComparisonPage")
);
const ActivityLogPage = React.lazy(() => import("@/modules/report/pages/ActivityLogPage"));
const SettingsLayout = React.lazy(() => import("@/modules/settings/pages/SettingsLayout"));
const BusinessInfoPage = React.lazy(
  () => import("@/modules/settings/pages/BusinessInfoPage")
);
const TaxRateSettingsPage = React.lazy(
  () => import("@/modules/settings/pages/TaxRateSettingsPage")
);
const PrinterSettingsPage = React.lazy(
  () => import("@/modules/settings/pages/PrinterSettingsPage")
);
const PlatformAdminWorkspaceLayout = React.lazy(
  () => import("@/modules/platform_admin/pages/PlatformAdminWorkspaceLayout")
);
const PlatformAdminOverviewPage = React.lazy(
  () => import("@/modules/platform_admin/pages/PlatformAdminOverviewPage")
);
const HouseholdManagementPage = React.lazy(
  () => import("@/modules/platform_admin/pages/HouseholdManagementPage")
);
const PlatformAdminLogsPage = React.lazy(
  () => import("@/modules/platform_admin/pages/PlatformAdminLogsPage")
);
const TaxAuthorityWorkspaceLayout = React.lazy(
  () => import("@/modules/tax_authority/pages/TaxAuthorityWorkspaceLayout")
);
const TaxInvoiceApprovalRoutePage = React.lazy(
  () => import("@/modules/tax_authority/pages/TaxInvoiceApprovalRoutePage")
);
const PosPage = React.lazy(() => import("@/modules/pos/pages/PosPage"));
const LookupInvoicePage = React.lazy(() => import("@/pages/LookupInvoicePage"));

const loadingFallback = (
  <div className="flex justify-center items-center h-screen">{APP_MESSAGES.LOADING}</div>
);

export const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={loadingFallback}>
      <Routes>
        <Route
          path={APP_ROUTES.LOOKUP_INVOICE}
          element={<LookupInvoicePage />}
        />
        <Route
          path={APP_ROUTES.AUTH}
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        >
          <Route index element={<Navigate to={ROUTE_SEGMENTS.LOGIN} replace />} />
          <Route path={ROUTE_SEGMENTS.LOGIN} element={<LoginPage />} />
          <Route path={ROUTE_SEGMENTS.REGISTER} element={<RegisterPage />} />
        </Route>

        <Route path={APP_ROUTES.ROOT} element={<Navigate to={APP_ROUTES.DASHBOARD} replace />} />

        <Route
          element={
            <PrivateRoute>
              <DashboardDemoProvider>
                <AuthenticatedAppLayout />
              </DashboardDemoProvider>
            </PrivateRoute>
          }
        >
          <Route
            path={ROUTE_SEGMENTS.DASHBOARD}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.NORMAL_MANAGEMENT}>
                <DashboardOverviewPage />
              </RoleRoute>
            }
          />

          <Route
            path={ROUTE_SEGMENTS.PRODUCTS}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.PRODUCT_MANAGEMENT}>
                <ProductsLayout />
              </RoleRoute>
            }
          >
            <Route index element={<ProductListPage />} />
            <Route path={ROUTE_SEGMENTS.STOCK_ENTRY} element={<StockEntryPage />} />
          </Route>

          <Route
            path={ROUTE_SEGMENTS.SHIFTS}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.SHIFT_MANAGEMENT}>
                <ShiftHistoryPage />
              </RoleRoute>
            }
          />
          <Route
            path={ROUTE_SEGMENTS.ORDERS}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.NORMAL_MANAGEMENT}>
                <OrderHistoryPage />
              </RoleRoute>
            }
          />
          <Route
            path={ROUTE_SEGMENTS.E_INVOICES}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.NORMAL_MANAGEMENT}>
                <InvoiceManagementPage />
              </RoleRoute>
            }
          />
          <Route
            path={`${ROUTE_SEGMENTS.E_INVOICES}/:id/adjust`}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.PRODUCT_MANAGEMENT}>
                <AdjustInvoicePage />
              </RoleRoute>
            }
          />
          <Route
            path={ROUTE_SEGMENTS.CUSTOMERS}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.NORMAL_MANAGEMENT}>
                <CustomerPage />
              </RoleRoute>
            }
          />
          <Route
            path={ROUTE_SEGMENTS.EMPLOYEES}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.PRODUCT_MANAGEMENT}>
                <EmployeePage />
              </RoleRoute>
            }
          />

          <Route
            path={ROUTE_SEGMENTS.REPORTS}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.PRODUCT_MANAGEMENT}>
                <ReportsLayout />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to={ROUTE_SEGMENTS.REVENUE} replace />} />
            <Route path={ROUTE_SEGMENTS.REVENUE} element={<RevenueReportPage />} />
            <Route path={ROUTE_SEGMENTS.COMPARISON} element={<RevenueComparisonPage />} />
            <Route path={ROUTE_SEGMENTS.ACTIVITY_LOGS} element={<ActivityLogPage />} />
          </Route>

          <Route
            path={ROUTE_SEGMENTS.SETTINGS}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.PRODUCT_MANAGEMENT}>
                <SettingsLayout />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to={ROUTE_SEGMENTS.BUSINESS_INFO} replace />} />
            <Route path={ROUTE_SEGMENTS.BUSINESS_INFO} element={<BusinessInfoPage />} />
            <Route path={ROUTE_SEGMENTS.TAX_RATES} element={<TaxRateSettingsPage />} />
            <Route path={ROUTE_SEGMENTS.PRINTER} element={<PrinterSettingsPage />} />
          </Route>

          <Route
            path={ROUTE_SEGMENTS.POS}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.POINT_OF_SALE}>
                <PosPage />
              </RoleRoute>
            }
          />

          <Route
            path={ROUTE_SEGMENTS.ADMIN}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.PLATFORM_ADMIN}>
                <PlatformAdminWorkspaceLayout />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to={ROUTE_SEGMENTS.OVERVIEW} replace />} />
            <Route path={ROUTE_SEGMENTS.OVERVIEW} element={<PlatformAdminOverviewPage />} />
            <Route path={ROUTE_SEGMENTS.HOUSEHOLDS} element={<HouseholdManagementPage />} />
            <Route path={ROUTE_SEGMENTS.LOGS} element={<PlatformAdminLogsPage />} />
          </Route>

          <Route
            path={ROUTE_SEGMENTS.TAX_AUTHORITY}
            element={
              <RoleRoute allowedRoles={ROLE_GROUPS.TAX_AUTHORITY}>
                <TaxAuthorityWorkspaceLayout />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to={ROUTE_SEGMENTS.INVOICES} replace />} />
            <Route path={ROUTE_SEGMENTS.INVOICES} element={<TaxInvoiceApprovalRoutePage />} />
          </Route>

          <Route
            path={ROUTE_SEGMENTS.WILDCARD}
            element={<Navigate to={APP_ROUTES.DASHBOARD} replace />}
          />
        </Route>

        <Route
          path={ROUTE_SEGMENTS.WILDCARD}
          element={<Navigate to={APP_ROUTES.DASHBOARD} replace />}
        />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;
