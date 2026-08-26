import React, { useState, useMemo, useEffect } from "react";
import { Search, Plus, Tag } from "lucide-react";
import { USER_ROLES } from "@/constants/roles";
import {
  PROMOTION_CALCULATED_STATE,
  PROMOTION_CONFIG,
  PROMOTION_MESSAGES,
  type TPromotionApplyScope,
} from "@/constants/promotion";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { IPromotion, IPromotionDetail } from "../types/IPromotion";
import type {
  ICreatePromotionPayload,
  IUpdatePromotionPayload,
} from "../types/IPromotionPayload";
import {
  useGetPromotionsQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
  useTogglePromotionStatusMutation,
  useLazyGetPromotionByIdQuery,
} from "../services/promotionApi";
import { PromotionTable } from "../components/PromotionTable";
import {
  PromotionFilterSidebar,
  type PromotionFilterState,
} from "../components/PromotionFilterSidebar";
import { PromotionFormModal } from "../components/PromotionFormModal";
import { PromotionDetailModal } from "../components/PromotionDetailModal";
import { PromotionDeleteModal } from "../components/PromotionDeleteModal";

export const PromotionListPage: React.FC = () => {
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  const isOwner = currentRole === USER_ROLES.OWNER;
  const canManage = isOwner;

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const initialFilter: PromotionFilterState = {
    stateFilter: "ALL",
    scopeFilter: "ALL",
    startDate: "",
    endDate: "",
    activeNowOnly: false,
  };
  const [filter, setFilter] = useState<PromotionFilterState>(initialFilter);
  const [page, setPage] = useState<number>(PROMOTION_CONFIG.INITIAL_PAGE);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<IPromotion | null>(null);
  const [editingPromoDetail, setEditingPromoDetail] =
    useState<IPromotionDetail | null>(null);

  // Queries & Mutations
  const {
    data: promotionsData,
    isLoading,
    isError,
    error: fetchError,
    refetch,
  } = useGetPromotionsQuery({
    keyword: debouncedSearch || undefined,
    applyScope:
      filter.scopeFilter !== "ALL"
        ? (filter.scopeFilter as TPromotionApplyScope)
        : undefined,
    startDate: filter.startDate || undefined,
    endDate: filter.endDate || undefined,
    activeNowOnly: filter.activeNowOnly || undefined,
    page,
    size: PROMOTION_CONFIG.PAGE_SIZE,
  });

  const [triggerGetPromotionDetail] = useLazyGetPromotionByIdQuery();
  const [createPromotion, { isLoading: isCreating }] =
    useCreatePromotionMutation();
  const [updatePromotion, { isLoading: isUpdating }] =
    useUpdatePromotionMutation();
  const [deletePromotionMutation, { isLoading: isDeleting }] =
    useDeletePromotionMutation();
  const [toggleStatusMutation] = useTogglePromotionStatusMutation();

  // Reset page when search / filter changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, filter]);

  const rawPromotions = useMemo(
    () => promotionsData?.content || [],
    [promotionsData?.content]
  );
  const totalElements = promotionsData?.totalElements || 0;
  const totalPages = promotionsData?.totalPages || 0;

  // Filter client-side by calculated state if selected in sidebar
  const filteredPromotions = useMemo(() => {
    if (!filter.stateFilter || filter.stateFilter === "ALL") {
      return rawPromotions;
    }
    return rawPromotions.filter(
      (p) => p.calculatedState === filter.stateFilter
    );
  }, [rawPromotions, filter.stateFilter]);

  // Quick stats calculation
  const stats = useMemo(() => {
    let active = 0;
    let upcoming = 0;
    let expired = 0;
    let inactive = 0;

    rawPromotions.forEach((p) => {
      if (p.calculatedState === PROMOTION_CALCULATED_STATE.ACTIVE) active++;
      else if (p.calculatedState === PROMOTION_CALCULATED_STATE.UPCOMING) upcoming++;
      else if (p.calculatedState === PROMOTION_CALCULATED_STATE.EXPIRED) expired++;
      else if (p.calculatedState === PROMOTION_CALCULATED_STATE.INACTIVE) inactive++;
    });

    return {
      total: totalElements || rawPromotions.length,
      active,
      upcoming,
      inactive: inactive + expired,
    };
  }, [rawPromotions, totalElements]);

  // Handlers
  const handleOpenCreateModal = () => {
    setSelectedPromo(null);
    setEditingPromoDetail(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = async (promo: IPromotion) => {
    setSelectedPromo(promo);
    try {
      const res = await triggerGetPromotionDetail(promo.id).unwrap();
      setEditingPromoDetail(res);
    } catch {
      setEditingPromoDetail(null);
    }
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (promo: IPromotion) => {
    setSelectedPromo(promo);
    setIsDetailModalOpen(true);
  };

  const handleOpenDeleteModal = (promo: IPromotion) => {
    setSelectedPromo(promo);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (
    payload: ICreatePromotionPayload | IUpdatePromotionPayload
  ) => {
    try {
      if (selectedPromo?.id) {
        await updatePromotion({
          id: selectedPromo.id,
          body: payload as IUpdatePromotionPayload,
        }).unwrap();
        showSuccess(PROMOTION_MESSAGES.UPDATE_SUCCESS);
        addLogEntry?.(
          `Cập nhật chương trình khuyến mại: ${payload.name}`,
          "PROMOTION"
        );
      } else {
        await createPromotion(payload as ICreatePromotionPayload).unwrap();
        showSuccess(PROMOTION_MESSAGES.CREATE_SUCCESS);
        addLogEntry?.(
          `Tạo mới chương trình khuyến mại: ${payload.name}`,
          "PROMOTION"
        );
      }
      setIsFormModalOpen(false);
      refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể lưu chương trình khuyến mại"));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPromo) return;
    try {
      await deletePromotionMutation(selectedPromo.id).unwrap();
      showSuccess(PROMOTION_MESSAGES.DELETE_SUCCESS);
      addLogEntry?.(
        `Xóa chương trình khuyến mại: ${selectedPromo.name}`,
        "PROMOTION"
      );
      setIsDeleteModalOpen(false);
      setSelectedPromo(null);
      refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể xóa chương trình khuyến mại"));
    }
  };

  const handleToggleStatus = async (promo: IPromotion) => {
    try {
      await toggleStatusMutation(promo.id).unwrap();
      showSuccess(PROMOTION_MESSAGES.TOGGLE_STATUS_SUCCESS);
      addLogEntry?.(
        `Đổi trạng thái chương trình khuyến mại: ${promo.name}`,
        "PROMOTION"
      );
      refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể cập nhật trạng thái"));
    }
  };

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <PromotionFilterSidebar
          filter={filter}
          onFilterChange={setFilter}
          onResetFilter={() => setFilter(initialFilter)}
        />
      }
    >
      <div className="flex flex-col gap-4 w-full animate-auth-fade-in">
        {/* Top action row: Search bar and Create button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar input */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm chương trình khuyến mại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 text-xs font-semibold text-slate-700 shadow-sm transition-all focus:border-kv-blue-primary focus:outline-none lg:h-9"
            />
          </div>

          {/* Create button */}
          {canManage && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="flex h-11 items-center gap-1.5 rounded-lg bg-kv-blue-primary px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-kv-blue-dark lg:h-9 active:scale-95"
              >
                <Plus size={14} />
                Tạo khuyến mại
              </button>
            </div>
          )}
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Tổng chương trình
            </div>
            <div className="text-xl font-extrabold text-slate-800 mt-1">
              {stats.total}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
              Đang áp dụng
            </div>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">
              {stats.active}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-sky-200/80 bg-sky-50/20 shadow-sm">
            <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wide">
              Sắp diễn ra
            </div>
            <div className="text-xl font-extrabold text-sky-600 mt-1">
              {stats.upcoming}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Hết hạn
            </div>
            <div className="text-xl font-extrabold text-slate-600 mt-1">
              {stats.inactive}
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] w-full">
          <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag size={16} className="text-kv-blue-primary" />
              Danh sách chương trình khuyến mại ({filteredPromotions.length})
            </span>
          </h3>

          {isError ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex flex-col gap-3">
              <p>Không thể kết nối với dữ liệu khuyến mại từ máy chủ API.</p>
              <p className="text-[11px] text-rose-500">
                {getApiErrorMessage(fetchError, "Không thể lấy danh sách chương trình khuyến mại từ máy chủ.")}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="w-max px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <PromotionTable
              promotions={filteredPromotions}
              isLoading={isLoading}
              canManage={canManage}
              page={page}
              pageSize={PROMOTION_CONFIG.PAGE_SIZE}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={setPage}
              onViewDetail={handleOpenDetailModal}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </div>

        {/* Modals */}
        <PromotionFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedPromo(null);
            setEditingPromoDetail(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={editingPromoDetail || selectedPromo}
          isLoading={isCreating || isUpdating}
        />

        <PromotionDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedPromo(null);
          }}
          promotionId={selectedPromo?.id || null}
          onEdit={(promo) => {
            setIsDetailModalOpen(false);
            handleOpenEditModal(promo);
          }}
          onDelete={(promo) => {
            setIsDetailModalOpen(false);
            handleOpenDeleteModal(promo);
          }}
          canManage={canManage}
        />

        <PromotionDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedPromo(null);
          }}
          onConfirm={handleDeleteConfirm}
          promo={selectedPromo}
          isLoading={isDeleting}
        />
      </div>
    </DashboardWorkspaceLayout>
  );
};

export default PromotionListPage;
