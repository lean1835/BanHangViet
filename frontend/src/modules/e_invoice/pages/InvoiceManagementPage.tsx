import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  Zap,
  Layers,
} from "lucide-react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useAppSelector } from "@/hooks/useRedux";
import { APP_ROUTES } from "@/constants/routes";
import { STORAGE_KEYS } from "@/constants/app";
import { USER_ROLES } from "@/constants/roles";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { normalizeDateToYYYYMMDD } from "@/utils/dateFormatter";
import type { IInvoice, TInvoiceStatus } from "../types/IInvoice";
import { useGetInvoicesQuery } from "../services/eInvoiceApi";
import { useGetInvoiceTemplateQuery } from "@/modules/settings/services/settingsApi";
import { useGetActiveInvoiceRangeQuery } from "@/modules/settings/services/invoiceRangeApi";
import { InvoiceSidebar, type TInvoiceVersionFilter } from "../components/InvoiceSidebar";
import {
  DailyControlSidebar,
  type TDailyIssueType,
  type TDailyDurationFilter,
} from "../components/DailyControlSidebar";
import {
  AutoRetrySidebar,
  type TRetryErrorCategoryFilter,
  type TRetryCountFilter,
} from "../components/AutoRetrySidebar";
import {
  InvoiceRangeSidebar,
  type TRangeStatusFilter,
} from "../components/InvoiceRangeSidebar";
import { InvoiceList } from "../components/InvoiceList";
import { TaxConnectionWidget } from "../components/TaxConnectionWidget";
import { TaxConnectionDrawer } from "../components/TaxConnectionDrawer";
import { InvoiceRangeAlertBanner } from "../components/InvoiceRangeAlertBanner";
import { DailyInvoiceControlPanel } from "../components/DailyInvoiceControlPanel";
import { AutoRetryQueuePanel } from "../components/AutoRetryQueuePanel";
import { InvoiceRangeSection } from "@/modules/settings/components/InvoiceRangeSection";

export type TEInvoiceTab = "INVOICE_LIST" | "DAILY_CONTROL" | "AUTO_RETRY" | "INVOICE_RANGE";

export const InvoiceManagementPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const highlightedId = searchParams.get("id");

  const authUser = useAppSelector((state) => state.auth?.user);
  const userRole = authUser?.roleId || USER_ROLES.OWNER;
  const isManagerRole =
    userRole === USER_ROLES.OWNER ||
    userRole === USER_ROLES.ACCOUNTANT ||
    userRole === "VT-01" ||
    userRole === "VT-03";

  // Tab State
  const VALID_TABS = useMemo<TEInvoiceTab[]>(
    () => ["INVOICE_LIST", "DAILY_CONTROL", "AUTO_RETRY", "INVOICE_RANGE"],
    []
  );

  const getResolvedTab = useCallback((): TEInvoiceTab => {
    const tabFromUrl = searchParams.get("tab") as TEInvoiceTab | null;
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
      return tabFromUrl;
    }
    const tabFromState = (location.state as { fromTab?: TEInvoiceTab } | null)?.fromTab;
    if (tabFromState && VALID_TABS.includes(tabFromState)) {
      return tabFromState;
    }
    return "INVOICE_LIST";
  }, [searchParams, location.state, VALID_TABS]);

  const [activeTab, setActiveTab] = useState<TEInvoiceTab>(getResolvedTab);
  const [isTaxDrawerOpen, setIsTaxDrawerOpen] = useState(false);

  const handleTabChange = useCallback((tab: TEInvoiceTab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "INVOICE_LIST") {
        next.delete("tab");
      } else {
        next.set("tab", tab);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Sync activeTab when URL tab parameter or location state changes (e.g. Back button)
  useEffect(() => {
    const currentTab = getResolvedTab();
    setActiveTab(currentTab);
  }, [getResolvedTab]);

  const {
    isOnline,
    invoices: mockInvoices,
    setInvoices: setMockInvoices,
  } = useDashboardDemo();

  // Tab 1: Filters State (Danh sách hóa đơn)
  const [statusFilter, setStatusFilter] = useState<TInvoiceStatus[]>([]);
  const [versionFilter, setVersionFilter] = useState<TInvoiceVersionFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Tab 2: Filters State (Kiểm soát cuối ngày NCL-04-CN-008)
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [dailyDate, setDailyDate] = useState<string>(todayStr);
  const [dailyIssueType, setDailyIssueType] = useState<TDailyIssueType>("UNINVOICED_ORDERS");
  const [dailyDuration, setDailyDuration] = useState<TDailyDurationFilter>("ALL");
  const [dailySummary, setDailySummary] = useState<{
    isCleanDay: boolean;
    totalUninvoiced: number;
    totalPending: number;
    totalFailed: number;
  }>();

  // Tab 3: Filters State (Hàng đợi lỗi & Gửi lại NCL-04-CN-007)
  const [retrySearchQuery, setRetrySearchQuery] = useState<string>("");
  const [retryErrorCategory, setRetryErrorCategory] = useState<TRetryErrorCategoryFilter>("ALL");
  const [retryCountFilter, setRetryCountFilter] = useState<TRetryCountFilter>("ALL");



  // Tab 4: Filters State (Dải số hóa đơn NCL-04-CN-009)
  const [rangeStatusFilter, setRangeStatusFilter] = useState<TRangeStatusFilter>("ALL");
  const [rangeSearchQuery, setRangeSearchQuery] = useState<string>("");
  const [isRangeModalOpen, setIsRangeModalOpen] = useState<boolean>(false);

  const { data: activeRangeData } = useGetActiveInvoiceRangeQuery();
  const activeRange = activeRangeData?.result;

  // Invoice Template Query to get template updatedAt
  const { data: templateResponse } = useGetInvoiceTemplateQuery(undefined, { skip: !isOnline });
  const templateUpdatedAt = templateResponse?.result?.updatedAt;

  // Online RTK Query for Tab 1
  const {
    data: apiInvoicesData,
    isLoading: isApiLoading,
    error: apiError,
  } = useGetInvoicesQuery(
    {
      status:
        statusFilter.length === 1
          ? statusFilter[0]
          : statusFilter.length > 1
          ? statusFilter.join(",")
          : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      search: searchQuery.trim() || undefined,
      page: 0,
      size: 1000,
    },
    { skip: !isOnline }
  );

  // Synchronize API fetched invoices to local state and localStorage cache
  useEffect(() => {
    if (isOnline && apiInvoicesData?.result?.content) {
      const fetchedList = apiInvoicesData.result.content;
      setMockInvoices((prev) => {
        const map = new Map<string, IInvoice>();
        prev.forEach((inv) => map.set(inv.lookupCode || inv.id, inv));
        fetchedList.forEach((inv) => map.set(inv.lookupCode || inv.id, inv));
        const merged = Array.from(map.values()).sort((a, b) => {
          const timeA = new Date(a.createdAt || a.time || 0).getTime();
          const timeB = new Date(b.createdAt || b.time || 0).getTime();
          return timeB - timeA;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.POS_OFFLINE_INVOICES, JSON.stringify(merged));
        } catch {
          /* ignore storage error */
        }
        return merged;
      });
    }
  }, [isOnline, apiInvoicesData, setMockInvoices]);

  // Combine online/offline data với bộ lọc đa điều kiện chuẩn khớp Backend
  const displayedInvoices = useMemo(() => {
    let sourceList: IInvoice[] = [];
    if (isOnline && apiInvoicesData?.result?.content) {
      const map = new Map<string, IInvoice>();
      if (mockInvoices) {
        mockInvoices.forEach((inv) => map.set(inv.lookupCode || inv.id, inv));
      }
      apiInvoicesData.result.content.forEach((inv) => map.set(inv.lookupCode || inv.id, inv));
      sourceList = Array.from(map.values());
    } else {
      if (mockInvoices && mockInvoices.length > 0) {
        sourceList = mockInvoices;
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.POS_OFFLINE_INVOICES);
          if (raw) sourceList = JSON.parse(raw);
        } catch {
          /* ignore storage parse error */
        }
      }
    }

    return sourceList
      .filter((inv) => {
        // 1. Lọc theo danh sách trạng thái
        if (statusFilter.length > 0 && !statusFilter.includes(inv.status)) {
          return false;
        }
        // 2. Lọc theo Từ ngày
        const invDate = normalizeDateToYYYYMMDD(inv.createdAt || inv.time);
        if (fromDate) {
          if (!invDate || invDate < fromDate) return false;
        }
        // 3. Lọc theo Đến ngày
        if (toDate) {
          if (!invDate || invDate > toDate) return false;
        }
        // 4. Tìm kiếm từ khóa (mã tra cứu, số hóa đơn, người mua/khách hàng, mã CQT)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchLookup = (inv.lookupCode || "").toLowerCase().includes(query);
          const matchCustomer = (inv.buyerName || inv.customer || "").toLowerCase().includes(query);
          const matchNumber = (inv.invoiceNumber || "").toLowerCase().includes(query);
          const matchTaxAuth = (inv.taxAuthorityCode || "").toLowerCase().includes(query);
          if (!matchLookup && !matchCustomer && !matchNumber && !matchTaxAuth) return false;
        }
        // 5. Lọc theo Phân loại Mẫu Hóa đơn
        if (versionFilter !== "ALL") {
          const invTime = new Date(inv.createdAt || inv.time || 0).getTime();
          const templateTime = templateUpdatedAt ? new Date(templateUpdatedAt).getTime() : 0;

          if (versionFilter === "CURRENT") {
            if (templateTime > 0 && invTime < templateTime) return false;
          } else if (versionFilter === "OLD") {
            if (templateTime === 0 || invTime >= templateTime) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.time || 0).getTime();
        const timeB = new Date(b.createdAt || b.time || 0).getTime();
        return timeB - timeA;
      });
  }, [
    isOnline,
    apiInvoicesData,
    mockInvoices,
    statusFilter,
    versionFilter,
    templateUpdatedAt,
    fromDate,
    toDate,
    searchQuery,
  ]);

  // Handle URL ID query param for highlighted invoice
  useEffect(() => {
    if (highlightedId) {
      navigate(APP_ROUTES.E_INVOICE_DETAIL(highlightedId), { replace: true });
    }
  }, [highlightedId, navigate]);

  const handleSelectInvoice = (invoice: IInvoice) => {
    navigate(APP_ROUTES.E_INVOICE_DETAIL(invoice.id), {
      state: { fromTab: activeTab },
    });
  };

  // Switch sidebar adaptively based on active tab
  const sidebarContent = useMemo(() => {
    switch (activeTab) {
      case "INVOICE_LIST":
        return (
          <InvoiceSidebar
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            versionFilter={versionFilter}
            setVersionFilter={setVersionFilter}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case "DAILY_CONTROL":
        if (!isManagerRole) return undefined;
        return (
          <DailyControlSidebar
            selectedDate={dailyDate}
            setSelectedDate={setDailyDate}
            issueTypeFilter={dailyIssueType}
            setIssueTypeFilter={setDailyIssueType}
            durationFilter={dailyDuration}
            setDurationFilter={setDailyDuration}
            summary={dailySummary}
          />
        );
      case "AUTO_RETRY":
        return (
          <AutoRetrySidebar
            searchQuery={retrySearchQuery}
            setSearchQuery={setRetrySearchQuery}
            errorCategoryFilter={retryErrorCategory}
            setErrorCategoryFilter={setRetryErrorCategory}
            retryCountFilter={retryCountFilter}
            setRetryCountFilter={setRetryCountFilter}
          />
        );
      case "INVOICE_RANGE":
        return (
          <InvoiceRangeSidebar
            statusFilter={rangeStatusFilter}
            setStatusFilter={setRangeStatusFilter}
            searchQuery={rangeSearchQuery}
            setSearchQuery={setRangeSearchQuery}
            activeRange={activeRange}
          />
        );
      default:
        return undefined;
    }
  }, [
    activeTab,
    statusFilter,
    versionFilter,
    fromDate,
    toDate,
    searchQuery,
    isManagerRole,
    dailyDate,
    dailyIssueType,
    dailyDuration,
    dailySummary,
    retrySearchQuery,
    retryErrorCategory,
    retryCountFilter,
    rangeStatusFilter,
    rangeSearchQuery,
    activeRange,
  ]);

  return (
    <DashboardWorkspaceLayout sidebar={sidebarContent}>
      <div className="flex flex-col gap-5 animate-page-fade">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Quản lý hóa đơn điện tử
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Phát hành, theo dõi cấp mã, đối chiếu cuối ngày và quản lý dải số CQT
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TaxConnectionWidget onOpenDetails={() => setIsTaxDrawerOpen(true)} />
          </div>
        </div>

        {/* Cảnh báo dải số sắp hết / hết số (NCL-04-CN-009) */}
        <InvoiceRangeAlertBanner onNavigateToRangeTab={() => handleTabChange("INVOICE_RANGE")} />

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
          <button
            type="button"
            onClick={() => handleTabChange("INVOICE_LIST")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
              activeTab === "INVOICE_LIST"
                ? "border-kv-blue-primary text-kv-blue-primary bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Danh sách hóa đơn</span>
          </button>

          {isManagerRole && (
            <button
              type="button"
              onClick={() => handleTabChange("DAILY_CONTROL")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
                activeTab === "DAILY_CONTROL"
                  ? "border-kv-blue-primary text-kv-blue-primary bg-white shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Kiểm soát cuối ngày (NCL-04-CN-008)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleTabChange("AUTO_RETRY")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
              activeTab === "AUTO_RETRY"
                ? "border-kv-blue-primary text-kv-blue-primary bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Hàng đợi lỗi & Gửi lại (NCL-04-CN-007)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("INVOICE_RANGE")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
              activeTab === "INVOICE_RANGE"
                ? "border-kv-blue-primary text-kv-blue-primary bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Dải số hóa đơn (NCL-04-CN-009)</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === "INVOICE_LIST" && (
          <div className="grid grid-cols-1 gap-6 animate-fade-in">
            {isOnline && apiError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-lg text-xs font-bold">
                {getApiErrorMessage(apiError, "Không thể đồng bộ danh sách hóa đơn từ máy chủ.")}
              </div>
            )}

            {isOnline && isApiLoading ? (
              <div className="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-lg text-center font-bold text-xs animate-pulse">
                Đang tải dữ liệu hóa đơn điện tử từ máy chủ...
              </div>
            ) : (
              <InvoiceList invoices={displayedInvoices} onSelectInvoice={handleSelectInvoice} />
            )}
          </div>
        )}

        {activeTab === "DAILY_CONTROL" && isManagerRole && (
          <DailyInvoiceControlPanel
            userRole={userRole}
            selectedDate={dailyDate}
            setSelectedDate={setDailyDate}
            issueTypeFilter={dailyIssueType}
            durationFilter={dailyDuration}
            onSummaryChange={setDailySummary}
          />
        )}

        {activeTab === "AUTO_RETRY" && (
          <AutoRetryQueuePanel
            searchQuery={retrySearchQuery}
            errorCategoryFilter={retryErrorCategory}
            retryCountFilter={retryCountFilter}
          />
        )}

        {activeTab === "INVOICE_RANGE" && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs animate-fade-in">
            <InvoiceRangeSection
              currentPattern={templateResponse?.result?.invoicePattern}
              currentSymbol={templateResponse?.result?.invoiceSymbol}
              statusFilter={rangeStatusFilter}
              searchQuery={rangeSearchQuery}
              showDeclareButton={false}
              isOpenModalExternal={isRangeModalOpen}
              setIsOpenModalExternal={setIsRangeModalOpen}
            />
          </div>
        )}

        {/* Drawer xem chi tiết kết nối Cơ quan thuế 7 ngày (NCL-04-CN-010) */}
        <TaxConnectionDrawer
          isOpen={isTaxDrawerOpen}
          onClose={() => setIsTaxDrawerOpen(false)}
          onNavigateToRetryTab={() => {
            setIsTaxDrawerOpen(false);
            handleTabChange("AUTO_RETRY");
          }}
        />
      </div>
    </DashboardWorkspaceLayout>
  );
};

export default InvoiceManagementPage;
