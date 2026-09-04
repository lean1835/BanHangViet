import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useAppSelector } from "@/hooks/useRedux";
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
import {
  recordInventoryAdjustment,
  resolveActorInfo,
} from "@/modules/anomaly_alert/utils/anomalyStorage";
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

  const authUser = useAppSelector((state) => state.auth.user);

  const handleSaveAudit = async (payload: ICreateInventoryAuditPayload) => {
    const { username: actorUsername, fullName: actorFullName } = resolveActorInfo(
      authUser?.username || currentRole,
      authUser?.fullName
    );

    try {
      const createdAudit = await createInventoryAudit(payload).unwrap();
      showSuccess(INVENTORY_AUDIT_MESSAGES.CREATE_SUCCESS);

      if (createdAudit && payload.details) {
        for (const d of payload.details) {
          const product = products.find((p) => p.id === d.productId);
          const systemQty = product?.stockQuantity ?? 0;
          const diff = (d.actualQuantity || 0) - systemQty;
          if (Math.abs(diff) >= 50) {
            recordInventoryAdjustment({
              auditNumber: createdAudit.auditNumber || "PKK-DEMO",
              productName: product?.name || `Sản phẩm #${d.productId}`,
              systemQty,
              actualQty: d.actualQuantity || 0,
              diffQty: diff,
              actorUsername,
              actorFullName,
            });
          }
        }
      }

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
    <div className="flex flex-col gap-4 w-full animate-auth-fade-in">
      {/* Page Title Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {INVENTORY_AUDIT_COPY.PAGE_TITLE}
        </h1>
        <p className="text-xs text-slate-500 max-w-2xl">
          {INVENTORY_AUDIT_COPY.PAGE_SUBTITLE}
        </p>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng số phiếu */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-kv-blue-primary flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
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
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {INVENTORY_AUDIT_COPY.STATS.TOTAL_AUDITS}
            </div>
            <div className="text-lg font-black text-slate-800 mt-0.5">
              {formatNumber(stats.totalAudits)} <span className="text-xs font-semibold text-slate-400">phiếu</span>
            </div>
          </div>
        </div>

        {/* Card 2: Lượt lệch tồn */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
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
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {INVENTORY_AUDIT_COPY.STATS.TOTAL_DIFFERENCE_ITEMS}
            </div>
            <div className="text-lg font-black text-amber-600 mt-0.5">
              {formatNumber(stats.differenceEvents)} <span className="text-xs font-semibold text-slate-400">đợt lệch</span>
            </div>
          </div>
        </div>

        {/* Card 3: Lệch tăng */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
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
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {INVENTORY_AUDIT_COPY.STATS.TOTAL_INCREASED_QTY}
            </div>
            <div className="text-lg font-black text-emerald-700 mt-0.5">
              +{formatNumber(stats.totalIncrease)} <span className="text-xs font-semibold text-slate-400">sản phẩm</span>
            </div>
          </div>
        </div>

        {/* Card 4: Lệch giảm */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
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
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {INVENTORY_AUDIT_COPY.STATS.TOTAL_DECREASED_QTY}
            </div>
            <div className="text-lg font-black text-rose-700 mt-0.5">
              -{formatNumber(stats.totalDecrease)} <span className="text-xs font-semibold text-slate-400">sản phẩm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action row (Search and Create Button) below statistics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search bar input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <svg
              width="14"
              height="14"
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
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 text-xs font-semibold text-slate-700 shadow-sm transition-all focus:border-kv-blue-primary focus:outline-none lg:h-9"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canCreateAudit ? (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex h-11 items-center gap-1.5 rounded-lg bg-kv-blue-primary px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-kv-blue-dark lg:h-9"
            >
              <svg
                width="14"
                height="14"
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
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 font-medium">
              {INVENTORY_AUDIT_COPY.ACCOUNTANT_READ_ONLY_WARNING}
            </div>
          ) : null}
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
