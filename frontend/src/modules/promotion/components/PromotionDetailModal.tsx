import React from "react";
import { createPortal } from "react-dom";
import { X, Tag, Calendar, User, Edit, Trash2, Layers } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-detail-modal-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-modal-bounce"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kv-blue-primary text-white shadow-md">
              <Tag size={20} />
            </div>
            <div>
              <h2
                id="promotion-detail-modal-title"
                className="text-base font-bold text-slate-800"
              >
                Chi tiết chương trình khuyến mại
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Mã định danh: <span className="font-mono text-slate-700">{promotionId}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isLoading || !promo ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Đang tải thông tin chi tiết khuyến mại...</p>
            </div>
          ) : (
            <>
              {/* Banner overview */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-800">
                      {promo.name}
                    </h3>
                    <PromotionStatusBadge state={promo.calculatedState} />
                  </div>
                  {promo.description && (
                    <p className="text-xs text-slate-600 font-medium">{promo.description}</p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                      Mức giảm
                    </div>
                    <div className="text-lg font-extrabold text-emerald-600">
                      {promo.discountType === DISCOUNT_TYPE.PERCENTAGE
                        ? `${Number(promo.discountValue).toLocaleString("vi-VN", {
                            maximumFractionDigits: 2,
                          })}%`
                        : formatCurrency(promo.discountValue)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin thời gian & Người tạo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-white">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Calendar size={14} className="text-kv-blue-primary" />
                    Thời gian hiệu lực
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bắt đầu:</span>
                      <span className="font-bold text-slate-800">
                        {formatDateTime(promo.startDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kết thúc:</span>
                      <span className="font-bold text-slate-800">
                        {formatDateTime(promo.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-white">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <User size={14} className="text-kv-blue-primary" />
                    Thông tin tạo lập
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Người tạo:</span>
                      <span className="font-bold text-slate-800">
                        {promo.createdByUserName || "Hệ thống"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ngày tạo:</span>
                      <span className="font-bold text-slate-800">
                        {formatDateTime(promo.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phạm vi & Danh sách đối tượng */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="font-bold text-xs text-slate-800 flex items-center gap-2">
                    <span>Phạm vi áp dụng:</span>
                    <span className="bg-kv-blue-primary/10 text-kv-blue-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {PROMOTION_APPLY_SCOPE_LABELS[promo.applyScope] ||
                        promo.applyScope}
                    </span>
                  </div>
                </div>

                {promo.applyScope === PROMOTION_APPLY_SCOPE.ALL && (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg font-medium">
                    Chương trình áp dụng tự động cho tất cả các sản phẩm và nhóm hàng khi bán.
                  </div>
                )}

                {promo.applyScope === PROMOTION_APPLY_SCOPE.PRODUCT && (
                  <div>
                    <div className="text-xs font-bold text-slate-700 mb-2">
                      Danh sách sản phẩm áp dụng ({promo.products?.length || 0}):
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                      {promo.products && promo.products.length > 0 ? (
                        promo.products.map((prod) => (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50"
                          >
                            <div>
                              <span className="font-bold text-slate-800">
                                {prod.name}
                              </span>
                              {prod.sku && (
                                <span className="ml-1.5 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
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
                        <div className="p-3 text-center text-xs text-slate-500">
                          Chưa có sản phẩm nào
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {promo.applyScope === PROMOTION_APPLY_SCOPE.PRODUCT_GROUP && (
                  <div>
                    <div className="text-xs font-bold text-slate-700 mb-2">
                      Danh sách nhóm hàng áp dụng ({promo.productGroups?.length || 0}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {promo.productGroups && promo.productGroups.length > 0 ? (
                        promo.productGroups.map((group) => (
                          <span
                            key={group.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200"
                          >
                            <Layers size={13} className="text-kv-blue-primary" />
                            {group.name}
                          </span>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-500 w-full">
                          Chưa có nhóm hàng nào
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <div>
            {canManage && promo && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete?.(promo);
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                Xóa chương trình
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-lg shadow-sm transition-all"
              >
                <Edit size={14} />
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
