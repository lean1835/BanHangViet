import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Tag,
  UtensilsCrossed,
  Check,
  AlertTriangle,
  ArrowRightLeft,
  Users,
} from "lucide-react";
import { useGetDiningTablesQuery } from "@/modules/dining_table/services/diningTableApi";
import {
  useHoldOrderMutation,
  useUpdateOrderLabelMutation,
  useSwitchDiningTableMutation,
} from "@/modules/order/services/orderApi";
import { ORDER_HOLD_MESSAGES } from "@/constants/order";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { IOrderResponse } from "@/modules/order/types/IOrder";
import type { IDiningTable } from "@/modules/dining_table/types/IDiningTable";

interface IHoldOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  currentOrderLabel?: string | null;
  currentDiningTableId?: string | null;
  currentDiningTableName?: string | null;
  onSuccess: (updatedOrder: IOrderResponse) => void;
}

const LABEL_SUGGESTIONS = [
  "Mang về",
  "Uống tại quán",
  "Khách quen",
  "Khách gọi điện",
  "Giao tận nơi",
];

export const HoldOrderModal: React.FC<IHoldOrderModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  currentOrderLabel,
  currentDiningTableId,
  currentDiningTableName,
  onSuccess,
}) => {
  const [orderLabel, setOrderLabel] = useState<string>("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // RTK Query hooks
  const { data: tablesData, isLoading: isLoadingTables } = useGetDiningTablesQuery(
    undefined,
    { skip: !isOpen }
  );
  const [holdOrderApi, { isLoading: isHolding }] = useHoldOrderMutation();
  const [updateLabelApi, { isLoading: isUpdatingLabel }] = useUpdateOrderLabelMutation();
  const [switchTableApi, { isLoading: isSwitchingTable }] = useSwitchDiningTableMutation();

  const isSubmitting = isHolding || isUpdatingLabel || isSwitchingTable;

  // Sync state with props when modal opens
  useEffect(() => {
    if (isOpen) {
      setOrderLabel(currentOrderLabel || "");
      setSelectedTableId(currentDiningTableId || null);
      setSelectedArea("ALL");
      setErrorMessage(null);
    }
  }, [isOpen, currentOrderLabel, currentDiningTableId]);

  if (!isOpen) return null;

  const tables: IDiningTable[] = tablesData?.result || [];

  // Extract distinct areas
  const areas = Array.from(
    new Set(
      tables
        .map((t) => t.area?.trim())
        .filter((a): a is string => Boolean(a && a.length > 0))
    )
  );

  const filteredTables = tables.filter((t) => {
    if (selectedArea === "ALL") return true;
    return (t.area?.trim() || "Mặc định") === selectedArea;
  });

  const isSwitchTableMode =
    Boolean(currentDiningTableId) &&
    Boolean(selectedTableId) &&
    selectedTableId !== currentDiningTableId;

  const handleSelectSuggestion = (suggestion: string) => {
    setOrderLabel((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return suggestion;
      if (trimmed.includes(suggestion)) return trimmed;
      return `${trimmed} - ${suggestion}`;
    });
  };

  const handleTableClick = (table: IDiningTable) => {
    // If table is occupied by another order, cannot select
    if (table.isOccupied && table.currentOrderId !== orderId) {
      setErrorMessage(
        `Bàn "${table.name}" đang có đơn phục vụ (${table.currentOrderLabel || "Đang có khách"}). Vui lòng chọn bàn khác!`
      );
      return;
    }
    setErrorMessage(null);
    if (selectedTableId === table.id) {
      // Toggle unselect table
      setSelectedTableId(null);
    } else {
      setSelectedTableId(table.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedLabel = orderLabel.trim();

    // Ràng buộc nghiệp vụ TC-01: Bắt buộc có ít nhất tên nhận diện hoặc bàn ăn
    if (!trimmedLabel && !selectedTableId) {
      setErrorMessage(ORDER_HOLD_MESSAGES.LABEL_OR_TABLE_REQUIRED);
      return;
    }

    try {
      let res: { result: IOrderResponse };

      // Case 1: Đổi bàn khi đơn đã gắn bàn trước đó
      if (isSwitchTableMode && selectedTableId) {
        res = await switchTableApi({
          orderId,
          data: { newDiningTableId: selectedTableId },
        }).unwrap();

        // Nếu có đổi luôn tên nhận diện
        if (trimmedLabel !== (currentOrderLabel || "").trim() && trimmedLabel) {
          res = await updateLabelApi({
            orderId,
            data: { orderLabel: trimmedLabel },
          }).unwrap();
        }
      }
      // Case 2: Chỉ cập nhật tên nhận diện khi bàn không đổi
      else if (
        currentDiningTableId === selectedTableId &&
        currentDiningTableId !== null &&
        trimmedLabel !== (currentOrderLabel || "").trim() &&
        trimmedLabel
      ) {
        res = await updateLabelApi({
          orderId,
          data: { orderLabel: trimmedLabel },
        }).unwrap();
      }
      // Case 3: Gắn bàn lần đầu hoặc gán tên nhận diện mới
      else {
        res = await holdOrderApi({
          orderId,
          data: {
            orderLabel: trimmedLabel || undefined,
            diningTableId: selectedTableId || undefined,
          },
        }).unwrap();
      }

      onSuccess(res.result);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        getApiErrorMessage(err, "Không thể lưu thông tin treo đơn. Vui lòng thử lại!")
      );
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 animate-backdrop-fade-in backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 text-white shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {ORDER_HOLD_MESSAGES.MODAL_TITLE}
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Đơn hàng: <span className="font-extrabold text-white">{orderNumber}</span>
                {currentDiningTableName && (
                  <span className="ml-2 px-2 py-0.5 rounded-md bg-white/20 text-white font-semibold">
                    Đang ở {currentDiningTableName}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-100 hover:bg-white/20 hover:text-white transition-colors"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Section 1: Tên Nhận Diện Gợi Nhớ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-600" />
                {ORDER_HOLD_MESSAGES.LABEL_FIELD}
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Tùy chọn hoặc kết hợp với bàn
              </span>
            </div>
            <input
              type="text"
              value={orderLabel}
              onChange={(e) => {
                setOrderLabel(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              maxLength={100}
              placeholder={ORDER_HOLD_MESSAGES.LABEL_PLACEHOLDER}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
            />

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 font-semibold mr-1">
                Gợi ý nhanh:
              </span>
              {LABEL_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSelectSuggestion(sug)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-600 border border-slate-200 text-xs font-semibold transition-all"
                >
                  +{sug}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Chọn Bàn Ăn Phục Vụ Tại Chỗ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-blue-600" />
                {ORDER_HOLD_MESSAGES.TABLE_LABEL}
              </label>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Bàn trống
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Có khách
                </span>
              </div>
            </div>

            {/* Area Filter Tabs */}
            {areas.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedArea("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    selectedArea === "ALL"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Tất cả ({tables.length})
                </button>
                {areas.map((area) => {
                  const countInArea = tables.filter((t) => t.area?.trim() === area).length;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setSelectedArea(area)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        selectedArea === area
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {area} ({countInArea})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tables Grid */}
            {isLoadingTables ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold animate-pulse">
                Đang tải danh sách bàn ăn...
              </div>
            ) : tables.length === 0 ? (
              <div className="py-6 px-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 font-medium">
                Chưa có danh mục bàn ăn nào được tạo. Bạn vẫn có thể đặt tên nhận diện ở ô bên trên.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                {filteredTables.map((table) => {
                  const isCurrentThisOrder =
                    table.isOccupied && table.currentOrderId === orderId;
                  const isOccupiedByOther =
                    table.isOccupied && table.currentOrderId !== orderId;
                  const isSelected = selectedTableId === table.id;

                  return (
                    <div
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-400/50"
                          : isCurrentThisOrder
                          ? "border-indigo-400 bg-indigo-50/70"
                          : isOccupiedByOther
                          ? "border-amber-200 bg-amber-50/60 opacity-80"
                          : "border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30"
                      }`}
                    >
                      {/* Check Badge if Selected */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`font-extrabold text-xs sm:text-sm truncate ${
                              isSelected
                                ? "text-blue-900"
                                : isOccupiedByOther
                                ? "text-amber-900"
                                : "text-slate-800"
                            }`}
                          >
                            {table.name}
                          </span>
                        </div>

                        {table.area && (
                          <div className="text-[10px] text-slate-400 font-medium truncate mb-1">
                            {table.area}
                          </div>
                        )}
                      </div>

                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-semibold flex items-center gap-0.5">
                          <Users className="w-3 h-3 text-slate-400" />
                          {table.seatCapacity} chỗ
                        </span>

                        {isCurrentThisOrder ? (
                          <span className="px-1.5 py-0.2 rounded font-bold bg-indigo-100 text-indigo-700">
                            Đơn này
                          </span>
                        ) : isOccupiedByOther ? (
                          <span className="px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 truncate max-w-[80px]">
                            {table.currentOrderLabel || "Có khách"}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-700">
                            Trống
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Switch Table Notice if applicable */}
          {isSwitchTableMode && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Đơn hàng sẽ được chuyển từ <b>{currentDiningTableName}</b> sang bàn mới đã chọn.
              </span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : isSwitchTableMode ? (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Chuyển Bàn & Lưu</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{ORDER_HOLD_MESSAGES.CONFIRM_BUTTON}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
