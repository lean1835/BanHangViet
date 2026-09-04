import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { APP_ROUTES } from "@/constants/routes";
import { STORAGE_KEYS } from "@/constants/app";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { normalizeDateToYYYYMMDD } from "@/utils/dateFormatter";
import type { IInvoice, TInvoiceStatus } from "../types/IInvoice";
import { useGetInvoicesQuery } from "../services/eInvoiceApi";
import { useGetInvoiceTemplateQuery } from "@/modules/settings/services/settingsApi";
import { InvoiceSidebar, type TInvoiceVersionFilter } from "../components/InvoiceSidebar";
import { InvoiceList } from "../components/InvoiceList";

export const InvoiceManagementPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get("id");

  const {
    isOnline,
    invoices: mockInvoices,
    setInvoices: setMockInvoices,
  } = useDashboardDemo();

  // Filters State
  const [statusFilter, setStatusFilter] = useState<TInvoiceStatus[]>([]);
  const [versionFilter, setVersionFilter] = useState<TInvoiceVersionFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
      status: statusFilter.length === 1 ? statusFilter[0] : (statusFilter.length > 1 ? statusFilter.join(",") : undefined),
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
        // 5. Lọc theo Phân loại Mẫu Hóa đơn (Cũ < updatedAt mẫu hóa đơn, Hiện tại >= updatedAt mẫu hóa đơn)
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

  return (
    <DashboardWorkspaceLayout
      sidebar={
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
      }
    >
      <div className="grid grid-cols-1 gap-6 animate-page-fade">
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
    </DashboardWorkspaceLayout>
  );
};

export default InvoiceManagementPage;
