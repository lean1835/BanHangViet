import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { formatNumber } from "@/utils/formatCurrency";
import {
  INVENTORY_AUDIT_CONFIG,
  INVENTORY_AUDIT_COPY,
  INVENTORY_AUDIT_FILTER_STATUS,
  INVENTORY_AUDIT_MESSAGES,
} from "@/constants/inventoryAudit";
import type {
  ICreateInventoryAuditPayload,
  IInventoryAudit,
} from "../types/IInventoryAudit";
import {
  useCreateInventoryAuditMutation,
  useGetInventoryAuditsQuery,
} from "../services/inventoryAuditApi";
import { useGetProductsQuery } from "@/modules/product/services/productApi";
import { InventoryAuditTable } from "../components/InventoryAuditTable";
import { InventoryAuditModal } from "../components/InventoryAuditModal";
import { InventoryAuditDetailModal } from "../components/InventoryAuditDetailModal";
import type { IProductOutletContext } from "@/modules/product/pages/ProductsLayout";

export const InventoryAuditPage = () => {
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();
  const outletContext = useOutletContext<IProductOutletContext>();

  const isOwner = currentRole === USER_ROLES.OWNER;
  const isAccountant = currentRole === USER_ROLES.ACCOUNTANT;
  const canCreateAudit = isOwner;

  // Pagination & Search states
  const [page, setPage] = useState<number>(INVENTORY_AUDIT_CONFIG.INITIAL_PAGE);
  const PAGE_SIZE = INVENTORY_AUDIT_CONFIG.PAGE_SIZE;
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  // Queries
  const {
    data: auditsData,
    isLoading: isAuditsLoading,
    refetch,
  } = useGetInventoryAuditsQuery({
    page: 0,
    size: INVENTORY_AUDIT_CONFIG.BATCH_SIZE,
  });

  const { data: productsData } = useGetProductsQuery({
    size: INVENTORY_AUDIT_CONFIG.PRODUCT_QUERY_SIZE,
  });
  const products = productsData?.content || [];

  const [createInventoryAudit] = useCreateInventoryAuditMutation();

  const auditFilter = outletContext?.inventoryAuditFilter;

  // Reset page when search or filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, auditFilter]);

  // Filter audits
  const allAudits: IInventoryAudit[] = useMemo(
    () => auditsData?.content || [],
    [auditsData?.content]
  );

  const filteredAudits = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const statusFilter =
      auditFilter?.statusFilter || INVENTORY_AUDIT_FILTER_STATUS.ALL;
    const dateFrom = auditFilter?.dateFrom || "";
    const dateTo = auditFilter?.dateTo || "";

    return allAudits.filter((audit) => {
      // 1. Text Search
      if (term) {
        const matchesText =
          audit.auditNumber.toLowerCase().includes(term) ||
          (audit.createdByUserName &&
            audit.createdByUserName.toLowerCase().includes(term)) ||
          (audit.notes && audit.notes.toLowerCase().includes(term));
        if (!matchesText) return false;
      }

      // 2. Status / Difference filter
      if (statusFilter === INVENTORY_AUDIT_FILTER_STATUS.HAS_DIFFERENCE) {
        if (audit.totalDifferenceQty === 0) return false;
      } else if (statusFilter === INVENTORY_AUDIT_FILTER_STATUS.NO_DIFFERENCE) {
        if (audit.totalDifferenceQty !== 0) return false;
      }

      // 3. Date range filter
      if (dateFrom) {
        const auditDateStr = (audit.auditDate || audit.createdAt || "").slice(
          0,
          10
        );
        if (auditDateStr && auditDateStr < dateFrom) return false;
      }
      if (dateTo) {
        const auditDateStr = (audit.auditDate || audit.createdAt || "").slice(
          0,
          10
        );
        if (auditDateStr && auditDateStr > dateTo) return false;
      }

      return true;
    });
  }, [allAudits, searchTerm, auditFilter]);

  // Pagination slice
  const totalElements = filteredAudits.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE) || 1;
  const paginatedAudits = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredAudits.slice(start, start + PAGE_SIZE);
  }, [filteredAudits, page, PAGE_SIZE]);

  // Summary statistics calculated from all audits
  const stats = useMemo(() => {
    let differenceEvents = 0;
    let totalIncrease = 0;
    let totalDecrease = 0;

    for (const a of allAudits) {
      if (a.totalDifferenceQty > 0) {
        differenceEvents++;
        totalIncrease += a.totalDifferenceQty;
      } else if (a.totalDifferenceQty < 0) {
        differenceEvents++;
        totalDecrease += Math.abs(a.totalDifferenceQty);
      }
    }

    return {
      totalAudits: allAudits.length,
      differenceEvents,
      totalIncrease,
      totalDecrease,
    };
  }, [allAudits]);

  const handleSaveAudit = async (payload: ICreateInventoryAuditPayload) => {
    try {
      const createdAudit = await createInventoryAudit(payload).unwrap();
      showSuccess(INVENTORY_AUDIT_MESSAGES.CREATE_SUCCESS);

      addLogEntry(
        "KIỂM_KÊ_KHO",
        `Lập phiếu kiểm kê ${createdAudit.auditNumber} (${payload.details.length} mặt hàng, chênh lệch: ${createdAudit.totalDifferenceQty})`
      );

      refetch();
    } catch (err) {
      const errorMsg = getApiErrorMessage(
        err,
        INVENTORY_AUDIT_MESSAGES.CREATE_FAILED
      );
      showError(errorMsg);
      throw err;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full max-w-7xl mx-auto animate-fade-in">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {INVENTORY_AUDIT_COPY.PAGE_TITLE}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {INVENTORY_AUDIT_COPY.PAGE_SUBTITLE}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {canCreateAudit ? (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-10 px-5 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all transform active:scale-95"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              {INVENTORY_AUDIT_COPY.CREATE_BUTTON}
            </button>
          ) : isAccountant ? (
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 font-medium max-w-xs">
              {INVENTORY_AUDIT_COPY.ACCOUNTANT_READ_ONLY_WARNING}
            </div>
          ) : null}
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng số phiếu */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-50 text-kv-blue-primary">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">
              {INVENTORY_AUDIT_COPY.STATS.TOTAL_AUDITS}
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {formatNumber(stats.totalAudits)}
            </div>
          </div>
        </div>

        {/* Card 2: Lượt lệch tồn */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">
              {INVENTORY_AUDIT_COPY.STATS.TOTAL_DIFFERENCE_ITEMS}
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {formatNumber(stats.differenceEvents)} đợt
            </div>
          </div>
        </div>

        {/* Card 3: Lệch tăng */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">
              {INVENTORY_AUDIT_COPY.STATS.TOTAL_INCREASED_QTY}
            </div>
            <div className="text-lg sm:text-xl font-bold text-emerald-700 mt-0.5">
              +{formatNumber(stats.totalIncrease)}
            </div>
          </div>
        </div>

        {/* Card 4: Lệch giảm */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">
              {INVENTORY_AUDIT_COPY.STATS.TOTAL_DECREASED_QTY}
            </div>
            <div className="text-lg sm:text-xl font-bold text-rose-700 mt-0.5">
              -{formatNumber(stats.totalDecrease)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search Toolbar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder={INVENTORY_AUDIT_COPY.SEARCH_PLACEHOLDER}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-kv-blue-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-center">
          <span>Tìm thấy:</span>
          <strong className="text-slate-800">{totalElements}</strong>
          <span>phiếu</span>
        </div>
      </div>

      {/* Inventory Audits Table */}
      <InventoryAuditTable
        audits={paginatedAudits}
        isLoading={isAuditsLoading}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setPage}
        onSelectAudit={(id) => setSelectedAuditId(id)}
      />

      {/* Modal Lập Phiếu Kiểm Kê */}
      <InventoryAuditModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveAudit}
        products={products}
      />

      {/* Modal Chi Tiết & In Chứng Từ Phiếu Kiểm Kê */}
      <InventoryAuditDetailModal
        isOpen={Boolean(selectedAuditId)}
        onClose={() => setSelectedAuditId(null)}
        auditId={selectedAuditId}
      />
    </div>
  );
};

export default InventoryAuditPage;
