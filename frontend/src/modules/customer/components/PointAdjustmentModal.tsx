import React, { useState } from "react";
import { X, Award, AlertCircle, PlusCircle, MinusCircle } from "lucide-react";
import { useAdjustCustomerPointsMutation } from "../services/loyaltyApi";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  POINT_ADJUSTMENT_ACTION_TYPES,
  type TPointAdjustmentActionType,
  LOYALTY_UI,
} from "@/constants/loyalty";

interface IPointAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  currentPoints: number;
}

export const PointAdjustmentModal: React.FC<IPointAdjustmentModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  currentPoints,
}) => {
  const { showSuccess, showError } = useNotification();
  const [adjustmentType, setAdjustmentType] = useState<TPointAdjustmentActionType>(
    POINT_ADJUSTMENT_ACTION_TYPES.ADD
  );
  const [pointsValue, setPointsValue] = useState<number | "">("");
  const [reason, setReason] = useState<string>("");

  const [adjustCustomerPoints, { isLoading }] = useAdjustCustomerPointsMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pointsNum = typeof pointsValue === "number" ? pointsValue : 0;
    if (pointsNum <= 0) {
      showError("Số điểm điều chỉnh phải lớn hơn 0");
      return;
    }

    if (!reason.trim()) {
      showError("Vui lòng nhập lý do điều chỉnh điểm");
      return;
    }

    const calculatedChange =
      adjustmentType === POINT_ADJUSTMENT_ACTION_TYPES.ADD ? pointsNum : -pointsNum;

    try {
      await adjustCustomerPoints({
        customerId,
        body: {
          pointsChange: calculatedChange,
          reason: reason.trim(),
        },
      }).unwrap();

      showSuccess(
        adjustmentType === "ADD"
          ? `Đã cộng ${pointsNum} điểm cho khách hàng ${customerName}`
          : `Đã trừ ${pointsNum} điểm của khách hàng ${customerName}`
      );
      onClose();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Điều chỉnh điểm thất bại"));
    }
  };

  const newProjectedPoints =
    typeof pointsValue === "number"
      ? adjustmentType === POINT_ADJUSTMENT_ACTION_TYPES.ADD
        ? currentPoints + pointsValue
        : Math.max(0, currentPoints - pointsValue)
      : currentPoints;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {LOYALTY_UI.MODAL_ADJUST.TITLE}
              </h3>
              <p className="text-xs text-slate-500">{customerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current balance */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">{LOYALTY_UI.MODAL_ADJUST.CURRENT_POINTS_LABEL}</span>
            <span className="font-extrabold text-blue-600 text-sm">
              {currentPoints.toLocaleString("vi-VN")} {LOYALTY_UI.CARDS.UNIT}
            </span>
          </div>

          {/* Action selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Hình thức điều chỉnh <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setAdjustmentType(POINT_ADJUSTMENT_ACTION_TYPES.ADD)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  adjustmentType === POINT_ADJUSTMENT_ACTION_TYPES.ADD
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                {LOYALTY_UI.MODAL_ADJUST.ADD_POINTS} (+)
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType(POINT_ADJUSTMENT_ACTION_TYPES.DEDUCT)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  adjustmentType === POINT_ADJUSTMENT_ACTION_TYPES.DEDUCT
                    ? "border-red-500 bg-red-50 text-red-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <MinusCircle className="w-4 h-4 text-red-600" />
                {LOYALTY_UI.MODAL_ADJUST.DEDUCT_POINTS} (-)
              </button>
            </div>
          </div>

          {/* Points value */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Số điểm {adjustmentType === "ADD" ? "cộng thêm" : "cần trừ"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={pointsValue}
              onChange={(e) =>
                setPointsValue(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))
              }
              placeholder="Nhập số điểm (ví dụ: 50)"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              required
            />
          </div>

          {/* Projected balance preview */}
          {typeof pointsValue === "number" && pointsValue > 0 && (
            <div className="flex items-center justify-between text-xs px-1 text-slate-600">
              <span>Số dư sau điều chỉnh dự kiến:</span>
              <span className="font-bold text-slate-800">
                {newProjectedPoints.toLocaleString("vi-VN")} điểm
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lý do điều chỉnh <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do chi tiết (ví dụ: Bù điểm khuyến mãi sự kiện, điều chỉnh sai sót ca trực...)"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              required
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Lịch sử điều chỉnh điểm sẽ được lưu vết vĩnh viễn trong sổ cái điểm thưởng và nhật ký hoạt động của cửa hàng.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận điều chỉnh"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
