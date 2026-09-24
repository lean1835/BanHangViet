import { useState, Suspense, lazy } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { DashboardNavigation } from "./DashboardNavigation";
import { PageLoadingFallback } from "@/components/common/PageLoadingFallback";
import { useOfflineSync } from "@/modules/sync/hooks/useOfflineSync";
import { OfflineSyncBanner } from "@/modules/sync/components/OfflineSyncBanner";
import { ConflictResolutionModal } from "@/modules/sync/components/ConflictResolutionModal";
import { useAuthExpiration } from "@/hooks/useAuthExpiration";
import {
  ScreenGuideProvider,
  ScreenGuideDrawer,
  ScreenGuideHighlightOverlay,
  ScreenGuideDirectoryModal,
} from "@/modules/screen_guide";

const ChatbotWidget = lazy(() =>
  import("@/modules/chatbot").then((m) => ({ default: m.ChatbotWidget }))
);

export const AuthenticatedAppLayout = () => {
  useAuthExpiration();

  const location = useLocation();
  const {
    currentRole,
    isOnline,
    simConflict,
    refetchOrders,
  } = useDashboardDemo();

  const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);

  const isPosScreen =
    location.pathname === APP_ROUTES.POS ||
    location.pathname.startsWith(APP_ROUTES.POS);

  const {
    pendingCount,
    conflictingOrders,
    warnings,
    isSyncing,
    unissuedOrderIds,
    clearUnissuedOrderIds,
    triggerSync,
    resolveOrderConflict,
  } = useOfflineSync({
    isOnline,
    simConflict,
    userRole: currentRole,
    onSyncSuccess: refetchOrders,
  });

  return (
    <ScreenGuideProvider>
      <div className="h-screen max-h-screen flex flex-col overflow-hidden bg-slate-100 text-slate-800 text-xs font-sans select-none">
        <div className="shrink-0 z-30">
          {/* Blue Navigation Menu is hidden when on POS screen */}
          {!isPosScreen &&
            currentRole !== USER_ROLES.PLATFORM_ADMIN &&
            currentRole !== USER_ROLES.TAX_AUTHORITY && (
              <DashboardNavigation
                currentRole={currentRole}
                pendingCount={pendingCount}
                onSync={triggerSync}
              />
            )}
          <OfflineSyncBanner
            isOnline={isOnline}
            pendingCount={pendingCount}
            conflictingOrdersCount={conflictingOrders.length}
            warnings={warnings}
            isSyncing={isSyncing}
            unissuedOrderIds={unissuedOrderIds}
            userRole={currentRole}
            onSync={triggerSync}
            onClearUnissuedOrders={clearUnissuedOrderIds}
            onOpenConflictModal={() => setIsConflictModalOpen(true)}
          />
        </div>

        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          <Suspense
            fallback={
              <div className="p-4 flex-1 overflow-y-auto bg-slate-100">
                <PageLoadingFallback />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>

        <ConflictResolutionModal
          isOpen={isConflictModalOpen || conflictingOrders.length > 0}
          conflictingOrders={conflictingOrders}
          currentRole={currentRole}
          isSyncing={isSyncing}
          onResolve={resolveOrderConflict}
          onClose={() => setIsConflictModalOpen(false)}
        />

        <ScreenGuideDrawer />
        <ScreenGuideHighlightOverlay />
        <ScreenGuideDirectoryModal />

        {currentRole !== USER_ROLES.PLATFORM_ADMIN &&
          currentRole !== USER_ROLES.TAX_AUTHORITY && (
            <Suspense fallback={null}>
              <ChatbotWidget />
            </Suspense>
          )}
      </div>
    </ScreenGuideProvider>
  );
};

export default AuthenticatedAppLayout;
