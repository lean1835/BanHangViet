import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  User,
  FileText,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  useCreateCashTransactionMutation,
  useGetCashCategoriesQuery,
} from "../services/cashTransactionApi";
import type { CashTransactionType } from "../types/ICashTransaction";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useNotification } from "@/hooks/useNotification";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface CreateCashTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId?: string;
  isOwner?: boolean;
  defaultType?: CashTransactionType;
  initialType?: CashTransactionType;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];
const DEFAULT_EXPENSE_THRESHOLD = 500000;

export const CreateCashTransactionModal: React.FC<CreateCashTransactionModalProps> = ({
  isOpen,
  onClose,
  shiftId,
  isOwner = false,
  defaultType = "EXPENSE",
  initialType,
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const [type, setType] = useState<CashTransactionType>(initialType || defaultType);
  const [categoryId, setCategoryId] = useState<string>("");
  const [categoryName, setCategoryName] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [personName, setPersonName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);

  const { data: categoriesData, isLoading: isCategoriesLoading } = useGetCashCategoriesQuery(
    { type },
    { skip: !isOpen }
  );
  const categories = useMemo(() => categoriesData?.result || [], [categoriesData?.result]);

  const [createTransaction, { isLoading: isSubmitting }] = useCreateCashTransactionMutation();

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setAmount(0);
      setPersonName("");
      setNotes("");
      setIsCustomCategory(false);
    }
  }, [isOpen, defaultType]);

  // Set default category when categories change
  useEffect(() => {
    if (categories.length > 0 && !isCustomCategory) {
      setCategoryId(categories[0].id);
      setCategoryName(categories[0].name);
    } else if (categories.length === 0) {
      setCategoryId("");
      setCategoryName("");
      setIsCustomCategory(true);
    }
  }, [categories, isCustomCategory, type]);

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSubmitting,
  });

  if (!isOpen) return null;

  const isIncome = type === "INCOME";
  const isPendingApprovalExpected = !isOwner && !isIncome && amount > DEFAULT_EXPENSE_THRESHOLD;

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__custom__") {
      setIsCustomCategory(true);
      setCategoryId("");
      setCategoryName("");
    } else {
      setIsCustomCategory(false);
      setCategoryId(val);
      const found = categories.find((c) => c.id === val);
      setCategoryName(found?.name || "");
    }
  };

  const handleQuickAdd = (val: number) => {
    setAmount((prev) => prev + val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!categoryName.trim()) {
      showError("Vui lòng chọn hoặc nhập tên loại thu chi");
      return;
    }

    if (amount <= 0) {
      showError("Số tiền phải lớn hơn 0 (tối thiểu 1.000 VNĐ)");
      return;
    }

    try {
      const res = await createTransaction({
        type,
        shiftId: shiftId || undefined,
        categoryId: categoryId || undefined,
        categoryName: categoryName.trim(),
        amount,
        personName: personName.trim() || undefined,
        notes: notes.trim() || undefined,
      }).unwrap();

      const created = res.result;
      if (created?.status === "PENDING_APPROVAL") {
        showSuccess(
          `Đã tạo phiếu chi ${created.code} (${formatCurrency(amount)}). Khoản chi này vượt hạn mức và đang CHỜ CHỦ HỘ DUYỆT!`
        );
      } else {
        showSuccess(
          `Lập phiếu ${isIncome ? "thu" : "chi"} ${created?.code || ""} (${formatCurrency(amount)}) thành công!`
        );
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể lập phiếu thu chi"));
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cash-modal-title"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
      >
        {/* Header with Type Selector */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isIncome
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-rose-100 text-rose-600"
              }`}
            >
              {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="cash-modal-title" className="text-base font-extrabold text-slate-800">
                Ghi thu chi tiền mặt ngoài bán hàng
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold">
                Không tính vào doanh thu bán hàng & không xuất hóa đơn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: THU TIỀN vs CHI TIỀN */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType("INCOME");
              setIsCustomCategory(false);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isIncome
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Phiếu Thu tiền (+)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType("EXPENSE");
              setIsCustomCategory(false);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              !isIncome
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Phiếu Chi tiền (-)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Category Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Loại khoản {isIncome ? "thu" : "chi"} <span className="text-rose-500">*</span>
            </label>
            {!isCustomCategory ? (
              <div className="space-y-1.5">
                <select
                  value={categoryId}
                  onChange={handleCategorySelect}
                  disabled={isCategoriesLoading || isSubmitting}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-kv-blue-primary text-xs"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="__custom__">+ Nhập tên loại khác...</option>
                </select>
                {isCategoriesLoading && (
                  <span className="text-[10px] text-slate-400">Đang tải danh mục...</span>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder={`Ví dụ: ${isIncome ? "Thu hoàn ứng lẻ" : "Mua đồ dùng vệ sinh..."}`}
                  disabled={isSubmitting}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-kv-blue-primary text-xs"
                  required
                />
                {categories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(false)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs shrink-0"
                  >
                    Chọn từ danh mục
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-700 font-bold">
                Số tiền ({isIncome ? "Thu vào" : "Chi ra"}) <span className="text-rose-500">*</span>
              </label>
              {amount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(0)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  Xóa số tiền
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amount ? formatNumber(amount) : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setAmount(raw ? parseInt(raw, 10) : 0);
                }}
                placeholder="0"
                disabled={isSubmitting}
                className={`w-full bg-white border rounded-xl pl-4 pr-12 py-3 text-lg font-black tabular-nums focus:outline-hidden focus:ring-2 ${
                  isIncome
                    ? "text-emerald-700 border-emerald-300 focus:ring-emerald-500"
                    : "text-rose-700 border-rose-300 focus:ring-rose-500"
                }`}
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                VNĐ
              </span>
            </div>

            {/* Quick Add Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors"
                >
                  +{formatCurrency(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Pending Approval Warning (TC-02) */}
          {isPendingApprovalExpected && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-800 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs">Khoản chi cần Chủ hộ phê duyệt</div>
                <div className="text-[11px] text-amber-700 leading-relaxed font-medium">
                  Khoản chi này vượt hạn mức tự duyệt ({formatCurrency(DEFAULT_EXPENSE_THRESHOLD)}).
                  Phiếu sẽ được tạo ở trạng thái <b>CHỜ DUYỆT</b> và bắt buộc Chủ hộ duyệt trước khi đóng ca.
                </div>
              </div>
            </div>
          )}

          {/* Person Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{isIncome ? "Người nộp tiền" : "Người nhận tiền"}</span>
            </label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder={isIncome ? "Họ tên người nộp tiền..." : "Họ tên shipper, người giao hàng..."}
              disabled={isSubmitting}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-kv-blue-primary text-xs"
            />
          </div>

          {/* Notes / Reason */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Lý do / Ghi chú</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú chi tiết mục đích thu chi..."
              disabled={isSubmitting}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-kv-blue-primary text-xs resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isIncome
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
              }`}
            >
              {isSubmitting ? (
                <span>Đang xử lý...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận lập phiếu</span>
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

export default CreateCashTransactionModal;
