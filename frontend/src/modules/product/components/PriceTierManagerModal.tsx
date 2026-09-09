import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, TrendingDown, Trash2 } from "lucide-react";
import type {
  IProductPriceTier,
  ICreatePriceTierRequest,
} from "@/modules/product/types/IProductPriceTier";
import {
  useGetPriceTiersQuery,
  useCreatePriceTierMutation,
  useUpdatePriceTierMutation,
  useDeletePriceTierMutation,
  useGetUnitConversionsQuery,
} from "@/modules/product/services/productApi";
import { PriceTierTable } from "./PriceTierTable";
import { PriceTierFormModal } from "./PriceTierFormModal";
import { PriceTierSimulator } from "./PriceTierSimulator";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { PRICE_TIER_COPY, PRICE_TIER_MESSAGES } from "@/constants/product";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface PriceTierManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productSku?: string;
  baseUnit: string;
  basePrice?: number;
  costPrice?: number;
}

export const PriceTierManagerModal: React.FC<PriceTierManagerModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  productSku,
  baseUnit,
  basePrice = 0,
  costPrice = 0,
}) => {
  const { currentRole } = useDashboardDemo();
  const isOwner = currentRole === USER_ROLES.OWNER;
  const { showSuccess, showError } = useNotification();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<IProductPriceTier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IProductPriceTier | null>(null);

  // Queries
  const {
    data: tiers = [],
    isLoading,
    refetch,
  } = useGetPriceTiersQuery(productId, {
    skip: !isOpen || !productId,
    refetchOnMountOrArgChange: true,
  });

  const { data: unitConversions = [] } = useGetUnitConversionsQuery(productId, {
    skip: !isOpen || !productId,
  });

  // Mutations
  const [createPriceTier] = useCreatePriceTierMutation();
  const [updatePriceTier] = useUpdatePriceTierMutation();
  const [deletePriceTier, { isLoading: isDeleting }] = useDeletePriceTierMutation();

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
  });

  const deleteDialogRef = useAccessibleDialog({
    isOpen: Boolean(deleteTarget),
    onClose: () => setDeleteTarget(null),
    canClose: !isDeleting,
  });

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    if (!isOwner) {
      showError(PRICE_TIER_MESSAGES.OWNER_ONLY);
      return;
    }
    setEditingTier(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tier: IProductPriceTier) => {
    if (!isOwner) {
      showError(PRICE_TIER_MESSAGES.OWNER_ONLY);
      return;
    }
    setEditingTier(tier);
    setIsFormOpen(true);
  };

  const handleSaveTier = async (data: ICreatePriceTierRequest) => {
    try {
      if (editingTier) {
        await updatePriceTier({
          productId,
          tierId: editingTier.id,
          data,
        }).unwrap();
        showSuccess(PRICE_TIER_MESSAGES.UPDATE_SUCCESS);
      } else {
        await createPriceTier({
          productId,
          data,
        }).unwrap();
        showSuccess(PRICE_TIER_MESSAGES.CREATE_SUCCESS);
      }
      setIsFormOpen(false);
      setEditingTier(null);
      refetch();
    } catch (error: any) {
      const msg = getApiErrorMessage(error, "Không thể lưu bậc giá");
      showError(msg);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePriceTier({
        productId,
        tierId: deleteTarget.id,
      }).unwrap();
      showSuccess(PRICE_TIER_MESSAGES.DELETE_SUCCESS);
      setDeleteTarget(null);
      refetch();
    } catch (error) {
      showError(getApiErrorMessage(error, "Không thể xóa bậc giá"));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-tier-manager-title"
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 text-kv-blue-primary">
              <TrendingDown size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="price-tier-manager-title"
                  className="text-base font-bold text-slate-800"
                >
                  {PRICE_TIER_COPY.TAB_TITLE}
                </h3>
                {productSku && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {productSku}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mặt hàng: <strong className="text-slate-700">{productName}</strong> (Đơn vị: {baseUnit})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Actions & Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-sky-100 bg-sky-50/40">
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                {PRICE_TIER_COPY.BANNER_TITLE}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xl">
                {PRICE_TIER_COPY.BANNER_DESC}
              </p>
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-white text-xs font-bold shadow-xs transition-all shrink-0 self-start sm:self-auto"
              >
                <Plus size={15} />
                <span>{PRICE_TIER_COPY.ADD_TIER_BUTTON}</span>
              </button>
            )}
          </div>

          {/* Table */}
          <PriceTierTable
            tiers={tiers}
            baseUnit={baseUnit}
            baseRetailPrice={basePrice}
            costPrice={costPrice}
            isOwner={isOwner}
            isLoading={isLoading}
            onEdit={handleOpenEdit}
            onDelete={(t) => setDeleteTarget(t)}
            onAddNew={handleOpenCreate}
          />

          {/* Simulator */}
          {tiers.length > 0 && (
            <PriceTierSimulator
              productId={productId}
              baseUnit={baseUnit}
              baseRetailPrice={basePrice}
              costPrice={costPrice}
              unitConversions={unitConversions}
              activeTiers={tiers}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <PriceTierFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTier(null);
          }}
          onSave={handleSaveTier}
          tier={editingTier}
          baseUnit={baseUnit}
          basePrice={basePrice}
          costPrice={costPrice}
          unitConversions={unitConversions}
          productName={productName}
          productId={productId}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            ref={deleteDialogRef}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                <Trash2 size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {PRICE_TIER_MESSAGES.DELETE_CONFIRM_TITLE}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xóa bậc giá <strong className="text-slate-700 font-bold">{deleteTarget.tierName}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              {PRICE_TIER_MESSAGES.DELETE_CONFIRM_DESC}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
