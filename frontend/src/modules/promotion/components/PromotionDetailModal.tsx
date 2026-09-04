import React from "react";
import { createPortal } from "react-dom";
import { X, Edit, Trash2, Layers, BarChart3, Tag } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import {
  DISCOUNT_TYPE,
  PROMOTION_APPLY_SCOPE,
  PROMOTION_APPLY_SCOPE_LABELS,
} from "@/constants/promotion";
import { useGetPromotionByIdQuery } from "../services/promotionApi";
import { PromotionStatusBadge } from "./PromotionStatusBadge";
import type { IPromotion } from "../types/IPromotion";

interface PromotionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotionId: string | null;
  onEdit?: (promo: IPromotion) => void;
  onDelete?: (promo: IPromotion) => void;
  onOpenReport?: (promoId: string) => void;
  canManage: boolean;
}

const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const PromotionDetailModal: React.FC<PromotionDetailModalProps> = ({
  isOpen,
  onClose,
  promotionId,
  onEdit,
  onDelete,
  onOpenReport,
  canManage,
}) => {
  const dialogRef = useAccessibleDialog<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const { data: promo, isLoading } = useGetPromotionByIdQuery(
    promotionId || "",
    {
      skip: !isOpen || !promotionId,
    }
  );

  if (!isOpen || !promotionId) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-detail-modal-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-modal-bounce"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-kv-blue-primary" />
            <h2
              id="promotion-detail-modal-title"
              className="text-sm sm:text-base font-bold text-slate-800"
            >
              Chi tiết chương trình khuyến mại
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            title="Đóng"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {isLoading || !promo ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2.5">
              <div className="w-6 h-6 border-2 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Đang tải thông tin chi tiết...</p>
            </div>
          ) : (
            <>
              {/* Campaign Title & Badge strip */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-extrabold text-slate-900 leading-snug">
                      {promo.name}
                    </span>
                    <PromotionStatusBadge state={promo.calculatedState} />
                  </div>
                  {promo.description && (
                    <p className="text-slate-500 font-medium leading-relaxed">{promo.description}</p>
                  )}
                </div>

                <div className="shrink-0 inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-bold text-emerald-700">
                  <span className="text-[11px] font-medium text-emerald-600">Mức giảm:</span>
                  <span className="font-extrabold text-emerald-800">
                    {promo.discountType === DISCOUNT_TYPE.PERCENTAGE
                      ? `${Number(promo.discountValue).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`
                      : formatCurrency(promo.discountValue)}
                  </span>
                </div>
              </div>

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-slate-50/60 p-3.5 rounded-lg border border-slate-200/80">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Phạm vi:</span>
                  <span className="font-bold text-slate-800">
                    {PROMOTION_APPLY_SCOPE_LABELS[promo.applyScope] || promo.applyScope}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Người tạo:</span>
                  <span className="font-bold text-slate-800">
                    {promo.createdByUserName || "Hệ thống"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Bắt đầu:</span>
                  <span className="font-bold text-slate-800">
                    {formatDateTime(promo.startDate)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Kết thúc:</span>
                  <span className="font-bold text-slate-800">
                    {formatDateTime(promo.endDate)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5 col-span-1 sm:col-span-2 border-t border-slate-200/60 pt-2 text-[11px]">
                  <span className="text-slate-400">Thời gian tạo:</span>
                  <span className="text-slate-600 font-medium">
                    {formatDateTime(promo.createdAt)}
                  </span>
                </div>
              </div>

              {/* Applicable Scope Target Details */}
              <div className="space-y-2 pt-1">
                <div className="font-bold text-slate-700 flex items-center justify-between">
                  <span>
                    {promo.applyScope === PROMOTION_APPLY_SCOPE.PRODUCT
                      ? `Sản phẩm áp dụng (${promo.products?.length || 0})`
                      : promo.applyScope === PROMOTION_APPLY_SCOPE.PRODUCT_GROUP
                      ? `Nhóm hàng áp dụng (${promo.productGroups?.length || 0})`
                      : "Đối tượng áp dụng"}
                  </span>
                </div>

                {promo.applyScope === PROMOTION_APPLY_SCOPE.ALL && (
                  <div className="p-3 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200 font-medium">
                    Chương trình tự động áp dụng cho tất cả sản phẩm khi bán hàng.
                  </div>
                )}

                {promo.applyScope === PROMOTION_APPLY_SCOPE.PRODUCT && (
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {promo.products && promo.products.length > 0 ? (
                      promo.products.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {prod.name}
                            </span>
                            {prod.sku && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold">
                                {prod.sku}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-slate-700">
                            {formatCurrency(prod.price)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-400">
                        Chưa có sản phẩm nào
                      </div>
                    )}
                  </div>
                )}

                {promo.applyScope === PROMOTION_APPLY_SCOPE.PRODUCT_GROUP && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-slate-200 bg-slate-50/50">
                    {promo.productGroups && promo.productGroups.length > 0 ? (
                      promo.productGroups.map((group) => (
                        <span
                          key={group.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs"
                        >
                          <Layers size={12} className="text-kv-blue-primary" />
                          {group.name}
                        </span>
                      ))
                    ) : (
                      <div className="p-2 text-center text-slate-400 w-full">
                        Chưa có nhóm hàng nào
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-5 py-3 shrink-0">
          <div>
            {canManage && promo && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete?.(promo);
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Trash2 size={14} />
                <span>Xóa chương trình</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onOpenReport && promotionId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReport(promotionId);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
              >
                <BarChart3 size={14} />
                <span>Báo cáo hiệu quả</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shadow-2xs"
            >
              Đóng
            </button>
            {canManage && promo && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit?.(promo);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-lg shadow-sm transition-all"
              >
                <Edit size={14} />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
