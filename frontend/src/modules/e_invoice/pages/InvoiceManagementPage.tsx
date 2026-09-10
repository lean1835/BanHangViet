import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import { APP_ROUTES } from "@/constants/routes";
import { STORAGE_KEYS } from "@/constants/app";
import { USER_ROLES } from "@/constants/roles";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { normalizeDateToYYYYMMDD } from "@/utils/dateFormatter";
import type { IInvoice, TInvoiceStatus } from "../types/IInvoice";
import { useGetInvoicesQuery, exportInvoicesToExcel } from "../services/eInvoiceApi";
import { useGetInvoiceTemplateQuery } from "@/modules/settings/services/settingsApi";
import { InvoiceSidebar, type TInvoiceVersionFilter } from "../components/InvoiceSidebar";
import { ErrorNoticeSidebar } from "../components/ErrorNoticeSidebar";
import { InvoiceList } from "../components/InvoiceList";
import { InvoiceRepresentationModal } from "../components/InvoiceRepresentationModal";
import { CreateErrorNoticeModal } from "../components/CreateErrorNoticeModal";
import { ErrorNoticeDetailModal } from "../components/ErrorNoticeDetailModal";
import { ErrorNoticeTable } from "../components/ErrorNoticeTable";

export const InvoiceManagementPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get("id");
  const { showSuccess, showError, showWarning } = useNotification();

  const {
    isOnline,
    invoices: mockInvoices,
    setInvoices: setMockInvoices,
    currentRole,
  } = useDashboardDemo();

  const isOwnerOrAccountant =
    currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.ACCOUNTANT;

  // Active Tab
  const [activeTab, setActiveTab] = useState<"INVOICES" | "ERROR_NOTICES">("INVOICES");

  // Filters State (Invoices)
  const [statusFilter, setStatusFilter] = useState<TInvoiceStatus[]>([]);
  const [versionFilter, setVersionFilter] = useState<TInvoiceVersionFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Filters State (Notice 04/SS)
  const [noticeStatusFilter, setNoticeStatusFilter] = useState<string>("ALL");
  const [noticeHandlingTypeFilter, setNoticeHandlingTypeFilter] = useState<string>("ALL");
  const [noticeFromDate, setNoticeFromDate] = useState("");
  const [noticeToDate, setNoticeToDate] = useState("");
  const [noticeSearchQuery, setNoticeSearchQuery] = useState("");

  const handleResetNoticeFilters = () => {
    setNoticeStatusFilter("ALL");
    setNoticeHandlingTypeFilter("ALL");
    setNoticeFromDate("");
    setNoticeToDate("");
    setNoticeSearchQuery("");
  };

  // Modals state
  const [representationInvoiceId, setRepresentationInvoiceId] = useState<string | null>(null);
  const [showCreateNoticeModal, setShowCreateNoticeModal] = useState<boolean>(false);
  const [preSelectedInvoiceId, setPreSelectedInvoiceId] = useState<string | undefined>(undefined);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Invoice Template Query to get template updatedAt
  const { data: templateResponse } = useGetInvoiceTemplateQuery(undefined, { skip: !isOnline });
  const templateUpdatedAt = templateResponse?.result?.updatedAt;

  // Online RTK Query
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
  }, [isOnline, apiInvoicesData, mockInvoices, statusFilter, versionFilter, templateUpdatedAt, fromDate, toDate, searchQuery]);

  // Handle URL ID query param for highlighted invoice
  useEffect(() => {
    if (highlightedId) {
      navigate(APP_ROUTES.E_INVOICE_DETAIL(highlightedId), { replace: true });
    }
  }, [highlightedId, navigate]);

  const handleSelectInvoice = (invoice: IInvoice) => {
    navigate(APP_ROUTES.E_INVOICE_DETAIL(invoice.id));
  };

  const handleOpenRepresentation = (invoice: IInvoice) => {
    setRepresentationInvoiceId(invoice.id);
  };


  // NCL-05-CN-006: Xuất danh sách hóa đơn ra Excel
  const handleExportExcel = async () => {
    if (!isOnline) {
      showWarning("Chức năng xuất Excel yêu cầu kết nối mạng tới máy chủ.");
      return;
    }
    setIsExporting(true);
    try {
      await exportInvoicesToExcel({
        status: statusFilter.length === 1 ? statusFilter[0] : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: searchQuery.trim() || undefined,
      });
      showSuccess("Xuất danh sách hóa đơn ra tệp Excel thành công!");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Không thể xuất danh sách hóa đơn.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardWorkspaceLayout
      sidebar={
        activeTab === "INVOICES" ? (
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
        ) : (
          <ErrorNoticeSidebar
            statusFilter={noticeStatusFilter}
            setStatusFilter={setNoticeStatusFilter}
            handlingTypeFilter={noticeHandlingTypeFilter}
            setHandlingTypeFilter={setNoticeHandlingTypeFilter}
            fromDate={noticeFromDate}
            setFromDate={setNoticeFromDate}
            toDate={noticeToDate}
            setToDate={setNoticeToDate}
            searchQuery={noticeSearchQuery}
            setSearchQuery={setNoticeSearchQuery}
            onResetFilters={handleResetNoticeFilters}
          />
        )
      }
    >
      <div className="flex flex-col gap-4 animate-page-fade">
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("INVOICES")}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
              activeTab === "INVOICES"
                ? "bg-white text-kv-blue-primary border border-slate-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200/70"
            }`}
          >
            Hóa đơn điện tử
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ERROR_NOTICES")}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
              activeTab === "ERROR_NOTICES"
                ? "bg-white text-kv-blue-primary border border-slate-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200/70"
            }`}
          >
            Thông báo sai sót
          </button>
        </div>

        {/* Tab 1: Invoice Management */}
        {activeTab === "INVOICES" && (
          <div className="grid grid-cols-1 gap-6">
            {isOnline && apiError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-lg text-xs font-bold">
                {getApiErrorMessage(apiError, "Không thể đồng bộ danh sách hóa đơn từ máy chủ.")}
              </div>
            )}

            {isOnline && isApiLoading ? (
              <div className="bg-blue-50 border border-blue-100 text-blue-700 p-6 rounded-2xl text-center font-bold text-xs animate-pulse flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
                <span>Đang tải dữ liệu hóa đơn điện tử từ máy chủ...</span>
              </div>
            ) : (
              <InvoiceList
                invoices={displayedInvoices}
                onSelectInvoice={handleSelectInvoice}
                onViewRepresentation={handleOpenRepresentation}
                onExportExcel={handleExportExcel}
                isExporting={isExporting}
                canExport={isOwnerOrAccountant}
              />
            )}
          </div>
        )}

        {/* Tab 2: Error Notices (Mẫu 04/SS-HĐĐT) */}
        {activeTab === "ERROR_NOTICES" && (
          <div className="grid grid-cols-1 gap-6">
            <ErrorNoticeTable
              onCreateNew={() => {
                setPreSelectedInvoiceId(undefined);
                setShowCreateNoticeModal(true);
              }}
              onSelectNotice={(id) => setSelectedNoticeId(id)}
              statusFilter={noticeStatusFilter}
              handlingTypeFilter={noticeHandlingTypeFilter}
              searchQuery={noticeSearchQuery}
              fromDate={noticeFromDate}
              toDate={noticeToDate}
              onResetFilters={handleResetNoticeFilters}
            />
          </div>
        )}
      </div>

      {/* Modal Xem Bản Thể Hiện Hóa Đơn Điện Tử (NCL-05-CN-007) */}
      {representationInvoiceId && (
        <InvoiceRepresentationModal
          invoiceId={representationInvoiceId}
          isOpen={!!representationInvoiceId}
          onClose={() => setRepresentationInvoiceId(null)}
        />
      )}

      {/* Modal Lập Thông Báo Sai Sót Mẫu 04/SS (NCL-05-CN-005) */}
      {showCreateNoticeModal && (
        <CreateErrorNoticeModal
          isOpen={showCreateNoticeModal}
          onClose={() => {
            setShowCreateNoticeModal(false);
            setPreSelectedInvoiceId(undefined);
          }}
          preSelectedInvoiceId={preSelectedInvoiceId}
        />
      )}

      {/* Modal Xem Chi Tiết Thông Báo Sai Sót Mẫu 04/SS (NCL-05-CN-005) */}
      {selectedNoticeId && (
        <ErrorNoticeDetailModal
          noticeId={selectedNoticeId}
          isOpen={!!selectedNoticeId}
          onClose={() => setSelectedNoticeId(null)}
        />
      )}
    </DashboardWorkspaceLayout>
  );
};

export default InvoiceManagementPage;
