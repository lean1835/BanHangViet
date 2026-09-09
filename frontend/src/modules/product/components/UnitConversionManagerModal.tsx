import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Layers, Trash2 } from "lucide-react";
import type {
  IProductUnitConversion,
  ICreateUnitConversionRequest,
} from "@/modules/product/types/IProductUnitConversion";
import {
  useGetUnitConversionsQuery,
  useCreateUnitConversionMutation,
  useUpdateUnitConversionMutation,
  useDeleteUnitConversionMutation,
} from "@/modules/product/services/productApi";
import { UnitConversionTable } from "./UnitConversionTable";
import { UnitConversionFormModal } from "./UnitConversionFormModal";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  UNIT_CONVERSION_COPY,
  UNIT_CONVERSION_MESSAGES,
} from "@/constants/product";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface UnitConversionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productSku?: string;
  baseUnit: string;
  basePrice?: number;
}

export const UnitConversionManagerModal: React.FC<
  UnitConversionManagerModalProps
> = ({
  isOpen,
  onClose,
  productId,
  productName,
  productSku,
  baseUnit,
  basePrice = 0,
}) => {
  const { currentRole } = useDashboardDemo();
  const isOwner = currentRole === USER_ROLES.OWNER;
  const { showSuccess, showError } = useNotification();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConversion, setEditingConversion] =
    useState<IProductUnitConversion | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<IProductUnitConversion | null>(null);

  // Queries & Mutations
  const {
    data: conversions = [],
    isLoading,
    refetch,
  } = useGetUnitConversionsQuery(productId, {
    skip: !isOpen || !productId,
    refetchOnMountOrArgChange: true,
  });

  const [createUnitConversion] = useCreateUnitConversionMutation();
  const [updateUnitConversion] = useUpdateUnitConversionMutation();
  const [deleteUnitConversion, { isLoading: isDeleting }] =
    useDeleteUnitConversionMutation();

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
      showError(UNIT_CONVERSION_MESSAGES.OWNER_ONLY);
      return;
    }
    setEditingConversion(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (conv: IProductUnitConversion) => {
    if (!isOwner) {
      showError(UNIT_CONVERSION_MESSAGES.OWNER_ONLY);
      return;
    }
    setEditingConversion(conv);
    setIsFormOpen(true);
  };

  const handleSaveConversion = async (data: ICreateUnitConversionRequest) => {
    try {
      if (editingConversion) {
        await updateUnitConversion({
          productId,
          conversionId: editingConversion.id,
          data,
        }).unwrap();
        showSuccess(UNIT_CONVERSION_MESSAGES.UPDATE_SUCCESS);
      } else {
        await createUnitConversion({
          productId,
          data,
        }).unwrap();
        showSuccess(UNIT_CONVERSION_MESSAGES.CREATE_SUCCESS);
      }
      setIsFormOpen(false);
      setEditingConversion(null);
      refetch();
    } catch (error: unknown) {
      showError(getApiErrorMessage(error, "Lưu đơn vị quy đổi thất bại"));
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    try {
      await deleteUnitConversion({
        productId,
        conversionId: deleteTarget.id,
      }).unwrap();
      showSuccess(UNIT_CONVERSION_MESSAGES.DELETE_SUCCESS);
      setDeleteTarget(null);
      refetch();
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(
          error,
          UNIT_CONVERSION_MESSAGES.CANNOT_DELETE_IN_USE
        )
      );
    }
  };

  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unit-conversion-manager-title"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-backdrop-fade-in"
      >
        <div
          ref={dialogRef}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto flex flex-col max-h-[90vh] animate-modal-bounce-in"
        >
          {/* Header */}
          <div className="bg-kv-blue-primary text-white px-6 py-4 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 text-white">
                <Layers size={20} />
              </div>
              <div>
                <h3
                  id="unit-conversion-manager-title"
                  className="text-base sm:text-lg font-bold text-white flex items-center gap-2"
                >
                  <span>Quản lý đơn vị tính & Quy đổi mua bán</span>
                </h3>
                <p className="text-xs text-sky-100 font-medium">
                  Mặt hàng: <strong className="text-white">{productName}</strong>
                  {productSku && (
                    <>
                      {" "}• SKU: <strong className="text-white font-mono">{productSku}</strong>
                    </>
                  )}
                  {" "}• ĐVT cơ sở: <strong className="text-white underline">{baseUnit}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sub Header / Action bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Quy tắc tính toán: </span>
              Khi nhập hoặc bán bằng các đơn vị dưới đây, tồn kho và giá vốn sẽ tự động quy về đơn vị cơ sở (
              <strong className="text-kv-blue-primary">{baseUnit}</strong>).
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>{UNIT_CONVERSION_COPY.ADD_BUTTON}</span>
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="p-5 overflow-y-auto flex-1">
            <UnitConversionTable
              conversions={conversions}
              baseUnit={baseUnit}
              isOwner={isOwner}
              isLoading={isLoading}
              onEdit={handleOpenEdit}
              onDelete={(conv) => setDeleteTarget(conv)}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>
              Tổng số đơn vị quy đổi: <strong>{conversions.length}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form thêm / sửa quy đổi */}
      <UnitConversionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingConversion(null);
        }}
        onSave={handleSaveConversion}
        conversion={editingConversion}
        baseUnit={baseUnit}
        basePrice={basePrice}
        productName={productName}
        productId={productId}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-conversion-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 animate-backdrop-fade-in"
        >
          <div
            ref={deleteDialogRef}
            className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl text-center animate-modal-bounce-in"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-3 border border-rose-100">
              <Trash2 size={24} />
            </div>
            <h4
              id="delete-conversion-title"
              className="text-sm font-bold text-slate-900 mb-1"
            >
              {UNIT_CONVERSION_MESSAGES.DELETE_CONFIRM_TITLE}
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {UNIT_CONVERSION_MESSAGES.DELETE_CONFIRM_DESC(
                deleteTarget.unitName,
                baseUnit
              )}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex-1 transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex-1 shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                {isDeleting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};
