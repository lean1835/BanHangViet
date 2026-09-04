import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Play, Sliders, ShieldAlert } from "lucide-react";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES, ROLE_LABELS } from "@/constants/roles";
import {
  ANOMALY_UI,
  ANOMALY_ALERT_STATUSES,
  ANOMALY_SEVERITIES,
  type TAnomalyAlertStatus,
} from "@/constants/anomalyAlert";
import { useNotification } from "@/hooks/useNotification";
import {
  useGetAnomalyAlertsQuery,
  useGetSummaryQuery,
  useReviewAlertMutation,
} from "../services/anomalyAlertApi";
import { AnomalyAlertSummaryCards } from "../components/AnomalyAlertSummaryCards";
import { AnomalyAlertTable } from "../components/AnomalyAlertTable";
import { ReviewAnomalyAlertModal } from "../components/ReviewAnomalyAlertModal";
import { AnomalyRuleConfigModal } from "../components/AnomalyRuleConfigModal";
import { ScanAnomalyModal } from "../components/ScanAnomalyModal";
import {
  getLocalAnomalyAlerts,
  updateLocalAnomalyAlert,
} from "../utils/anomalyStorage";
import { useAnomalyAlertFilter } from "../context/AnomalyAlertFilterContext";
import type {
  IAnomalyAlert,
  IAnomalyAlertSummary,
} from "../types/IAnomalyAlert";

export const AnomalyAlertPage: React.FC = () => {
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  // RBAC Guard (TC-03: VT-01 & VT-04 only)
  const isAuthorized =
    currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.PLATFORM_ADMIN;

  const { filter, setFilter } = useAnomalyAlertFilter();

  // Local storage alerts state
  const [localAlerts, setLocalAlerts] = useState<IAnomalyAlert[]>(() =>
    getLocalAnomalyAlerts()
  );

  const refreshLocalAlerts = useCallback(() => {
    setLocalAlerts(getLocalAnomalyAlerts());
  }, []);

  useEffect(() => {
    refreshLocalAlerts();
    const handleStorageChange = () => {
      refreshLocalAlerts();
    };
    window.addEventListener("local-anomaly-updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);
    return () => {
      window.removeEventListener("local-anomaly-updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, [refreshLocalAlerts]);

  // Modals state
  const [selectedAlert, setSelectedAlert] = useState<IAnomalyAlert | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);

  // Queries - Lấy danh sách từ Server để hợp nhất chính xác với Local alerts và phân trang đồng nhất
  const {
    data: alertsData,
    isLoading: isAlertsLoading,
    refetch: refetchAlerts,
  } = useGetAnomalyAlertsQuery(
    {
      page: 0,
      size: 500,
      keyword: filter.keyword || undefined,
      severity: filter.severity || undefined,
      status: filter.status || undefined,
      alertType: filter.alertType || undefined,
      startDate: filter.startDate ? `${filter.startDate}T00:00:00` : undefined,
      endDate: filter.endDate ? `${filter.endDate}T23:59:59` : undefined,
    },
    {
      skip: !isAuthorized,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );

  // Summary độc lập từ Backend (không đổi khi chuyển trang)
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useGetSummaryQuery(undefined, {
    skip: !isAuthorized,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Mutations
  const [reviewAlert, { isLoading: isReviewing }] = useReviewAlertMutation();

  // Hợp nhất dữ liệu Server và local alerts, sau đó phân trang đồng nhất
  const { totalElements, totalPages, pagedAlerts, mergedSummary } =
    useMemo(() => {
      const serverAlerts = alertsData?.result?.content || [];
      const pageSize = filter.size || ANOMALY_UI.TABLE.PAGE_SIZE || 8;
      const pageIndex = filter.page || 0;

      // Lọc các cảnh báo local theo filter hiện tại
      const filteredLocal = localAlerts.filter((a) => {
        if (filter.keyword && filter.keyword.trim()) {
          const kw = filter.keyword.trim().toLowerCase();
          const titleMatch = (a.title || "").toLowerCase().includes(kw);
          const descMatch = (a.description || "").toLowerCase().includes(kw);
          const userMatch = (a.actorUsername || "").toLowerCase().includes(kw);
          if (!titleMatch && !descMatch && !userMatch) return false;
        }
        if (filter.severity && filter.severity.trim()) {
          if (a.severity !== filter.severity) return false;
        }
        if (filter.status && filter.status.trim()) {
          if (a.status !== filter.status) return false;
        }
        if (filter.alertType && filter.alertType.trim()) {
          if (a.alertType !== filter.alertType) return false;
        }
        if (filter.startDate && filter.startDate.trim()) {
          const itemDate = (a.detectedAt || a.createdAt || "").substring(0, 10);
          if (itemDate && itemDate < filter.startDate) return false;
        }
        if (filter.endDate && filter.endDate.trim()) {
          const itemDate = (a.detectedAt || a.createdAt || "").substring(0, 10);
          if (itemDate && itemDate > filter.endDate) return false;
        }
        return true;
      });

      // Tránh trùng lặp ID hoặc title giữa server page và local alerts
      const serverIds = new Set(serverAlerts.map((item) => item.id));
      const serverTitles = new Set(
        serverAlerts.map((item) => (item.title || "").trim().toLowerCase())
      );
      const uniqueLocal = filteredLocal.filter((local) => {
        if (serverIds.has(local.id)) return false;
        const normTitle = (local.title || "").trim().toLowerCase();
        if (normTitle && serverTitles.has(normTitle)) return false;
        return true;
      });

      // Hợp nhất toàn bộ danh sách và sắp xếp theo thời gian mới nhất
      const allMerged = [...uniqueLocal, ...serverAlerts];
      allMerged.sort((a, b) => {
        const timeA = new Date(a.detectedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.detectedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      const totalCount = allMerged.length;
      const totalPagesCount = Math.max(1, Math.ceil(totalCount / pageSize));
      const safePageIndex = Math.min(pageIndex, Math.max(0, totalPagesCount - 1));

      // Cắt trang dữ liệu chính xác cho trang hiện tại
      const startIndex = safePageIndex * pageSize;
      const currentDisplayList = allMerged.slice(
        startIndex,
        startIndex + pageSize
      );

      // Tính toán KPIs summary tổng thể
      const baseSummary = summaryData?.result || {
        totalAlerts: totalCount,
        pendingAlerts: 0,
        reviewedAlerts: 0,
        dismissedAlerts: 0,
        criticalAlerts: 0,
        warningAlerts: 0,
        infoAlerts: 0,
        isCleanDay: totalCount === 0,
      };

      const localPending = uniqueLocal.filter((a) => a.status === ANOMALY_ALERT_STATUSES.PENDING).length;
      const localReviewed = uniqueLocal.filter((a) => a.status === ANOMALY_ALERT_STATUSES.REVIEWED).length;
      const localDismissed = uniqueLocal.filter((a) => a.status === ANOMALY_ALERT_STATUSES.DISMISSED).length;
      const localCritical = uniqueLocal.filter((a) => a.severity === ANOMALY_SEVERITIES.CRITICAL).length;
      const localWarning = uniqueLocal.filter((a) => a.severity === ANOMALY_SEVERITIES.WARNING).length;
      const localInfo = uniqueLocal.filter((a) => a.severity === ANOMALY_SEVERITIES.INFO).length;

      const summary: IAnomalyAlertSummary = {
        totalAlerts: (baseSummary.totalAlerts || 0) + uniqueLocal.length,
        pendingAlerts: (baseSummary.pendingAlerts || 0) + localPending,
        reviewedAlerts: (baseSummary.reviewedAlerts || 0) + localReviewed,
        dismissedAlerts: (baseSummary.dismissedAlerts || 0) + localDismissed,
        criticalAlerts: (baseSummary.criticalAlerts || 0) + localCritical,
        warningAlerts: (baseSummary.warningAlerts || 0) + localWarning,
        infoAlerts: (baseSummary.infoAlerts || 0) + localInfo,
        isCleanDay: ((baseSummary.totalAlerts || 0) + uniqueLocal.length) === 0,
        evaluatedDate: baseSummary.evaluatedDate,
        lastScannedAt: baseSummary.lastScannedAt,
      };

      return {
        mergedAlerts: currentDisplayList,
        totalElements: totalCount,
        totalPages: totalPagesCount,
        pagedAlerts: currentDisplayList,
        mergedSummary: summary,
      };
    }, [alertsData?.result, localAlerts, filter, summaryData?.result]);

  // Tự động điều chỉnh trang nếu trang hiện tại vượt quá totalPages
  useEffect(() => {
    if (filter.page !== undefined && totalPages > 0 && filter.page >= totalPages) {
      setFilter((prev) => ({ ...prev, page: Math.max(0, totalPages - 1) }));
    }
  }, [filter.page, totalPages, setFilter]);

  const handleViewAlert = (alert: IAnomalyAlert) => {
    setSelectedAlert(alert);
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (
    alertId: string,
    status: TAnomalyAlertStatus,
    reviewNotes: string
  ) => {
    try {
      updateLocalAnomalyAlert(alertId, status, reviewNotes);
      refreshLocalAlerts();

      try {
        await reviewAlert({
          id: alertId,
          body: { status, reviewNotes },
        }).unwrap();
        refetchAlerts();
        refetchSummary();
      } catch {
        // Đồng bộ cục bộ ngay cả khi backend offline
      }

      showSuccess("Cập nhật trạng thái xử lý cảnh báo thành công!");
      addLogEntry(
        "REVIEW_ANOMALY_ALERT",
        `Đánh giá cảnh báo #${alertId.substring(0, 8)} sang trạng thái: ${status}`
      );
      setIsReviewModalOpen(false);
      setSelectedAlert(null);
    } catch {
      showError("Không thể cập nhật trạng thái cảnh báo. Vui lòng thử lại!");
    }
  };

  const handleScanComplete = () => {
    refreshLocalAlerts();
    refetchAlerts();
    refetchSummary();
  };

  // RBAC Guard Warning Screen (TC-03)
  if (!isAuthorized) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center max-w-lg mx-auto my-6">
        <div className="p-3 bg-rose-50 text-rose-500 rounded-full mb-3">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-slate-800 text-base mb-1">
          {ANOMALY_UI.RBAC_WARNING.TITLE}
        </h3>
        <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">
          {ANOMALY_UI.RBAC_WARNING.DESCRIPTION} (Vai trò hiện tại:{" "}
          <strong>{ROLE_LABELS[currentRole]}</strong>)
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-auth-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
            {ANOMALY_UI.PAGE_TITLE}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {ANOMALY_UI.PAGE_SUBTITLE}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 text-kv-blue-primary" />
            <span>{ANOMALY_UI.OVERVIEW.RULES_CONFIG_BTN}</span>
          </button>
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="px-3.5 py-1.5 bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{ANOMALY_UI.OVERVIEW.SCAN_NOW_BTN}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards & Clean Day Banner */}
      <AnomalyAlertSummaryCards
        summary={mergedSummary}
        isLoading={isSummaryLoading}
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
      />

      {/* Alerts Table */}
      <AnomalyAlertTable
        alerts={pagedAlerts}
        isLoading={isAlertsLoading}
        page={filter.page || 0}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={(newPage) =>
          setFilter((prev) => ({ ...prev, page: newPage }))
        }
        onViewDetail={handleViewAlert}
      />

      {/* Review Modal */}
      <ReviewAnomalyAlertModal
        alert={selectedAlert}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedAlert(null);
        }}
        isSubmitting={isReviewing}
        onSubmitReview={handleSubmitReview}
      />

      {/* Rules Config Modal */}
      <AnomalyRuleConfigModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Scan Modal */}
      <ScanAnomalyModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanComplete={handleScanComplete}
      />
    </div>
  );
};

export default AnomalyAlertPage;
