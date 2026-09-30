import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Banknote,
  ShieldCheck,
  RefreshCw,
  Package,
  Zap,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import {
  useGetHandoverSummaryQuery,
  usePerformShiftHandoverMutation,
} from "../services/shiftApi";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";

interface IShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHandoverSuccess?: () => void;
}

export const ShiftHandoverModal: React.FC<IShiftHandoverModalProps> = ({
  isOpen,
  onClose,
  onHandoverSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const [showPassword, setShowPassword] = useState(false);
  const [recipientUserId, setRecipientUserId] = useState<string>("");
  const [recipientPassword, setRecipientPassword] = useState<string>("");
  const [actualCashInput, setActualCashInput] = useState<number | "">("");
  const [differenceReason, setDifferenceReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDiscrepancyField, setShowDiscrepancyField] = useState(false);

  const {
    data: summaryResponse,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useGetHandoverSummaryQuery(undefined, {
    skip: !isOpen,
    refetchOnMountOrArgChange: true,
  });

  const [performHandover, { isLoading: isSubmitting }] =
    usePerformShiftHandoverMutation();

  const summary = summaryResponse?.result;

  // Expected Cash: Lấy giá trị chính xác do backend tính toán (đã tính Quỹ đầu + Doanh thu TM + Thu quỹ - Chi quỹ)
  const expectedCash = useMemo(() => {
    if (!summary) return 0;
    if (typeof summary.expectedCash === "number") {
      return summary.expectedCash;
    }
    return (
      (summary.openingCash ?? 0) +
      (summary.cashRevenue ?? summary.totalRevenue ?? 0) +
      (summary.stageIncome ?? 0) -
      (summary.stageExpense ?? 0)
    );
  }, [summary]);

  // Set default actual cash when summary loads
  useEffect(() => {
    if (summary) {
      setActualCashInput((prev) => (prev === "" || prev === 0 ? expectedCash : prev));
    }
  }, [summary, expectedCash]);

  // Refetch and reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      refetchSummary();
      setRecipientUserId("");
      setRecipientPassword("");
      setDifferenceReason("");
      setNotes("");
      setErrorMessage(null);
      setShowPassword(false);
      setShowDiscrepancyField(false);
    }
  }, [isOpen, refetchSummary]);

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSubmitting,
  });

  // Calculate difference
  const effectiveActualCash =
    typeof actualCashInput === "number" ? actualCashInput : 0;
  const differenceAmount = useMemo(() => {
    return effectiveActualCash - expectedCash;
  }, [effectiveActualCash, expectedCash]);

  const isMatched = Math.abs(differenceAmount) < 0.001;
  const isDiscrepancyError =
    Boolean(errorMessage?.includes("lệch")) ||
    Boolean(errorMessage?.includes("chênh lệch"));
  const shouldShowDiscrepancyReason =
    !isMatched ||
    showDiscrepancyField ||
    Boolean(differenceReason.trim()) ||
    isDiscrepancyError;

  // Validate eligible recipient
  const selectedRecipient = useMemo(() => {
    return summary?.eligibleRecipients.find((r) => r.userId === recipientUserId);
  }, [summary, recipientUserId]);

  const isRecipientBusy = selectedRecipient?.hasOpenShift ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!recipientUserId) {
      setErrorMessage("Vui lòng chọn nhân viên tiếp nhận ca!");
      return;
    }

    if (isRecipientBusy) {
      setErrorMessage(
        "Nhân viên được chọn hiện đang có một ca bán hàng mở khác. Vui lòng chọn nhân viên khác hoặc đóng ca cũ trước!"
      );
      return;
    }

    if (!recipientPassword.trim()) {
      setErrorMessage(
        "Nhân viên tiếp nhận phải nhập mật khẩu để xác thực bàn giao ca!"
      );
      return;
    }

    if (actualCashInput === "" || actualCashInput < 0) {
      setErrorMessage(
        "Vui lòng nhập số tiền mặt thực tế bàn giao tại két hợp lệ!"
      );
      return;
    }

    if ((!isMatched || isDiscrepancyError) && (!differenceReason || !differenceReason.trim())) {
      setErrorMessage(
        "Có chênh lệch tiền bàn giao. Bắt buộc phải nhập lý do chênh lệch!"
      );
      setShowDiscrepancyField(true);
      return;
    }

    setErrorMessage(null);

    try {
      await performHandover({
        shiftId: summary?.shiftId,
        recipientUserId,
        recipientPassword: recipientPassword.trim(),
        actualCash: actualCashInput,
        differenceReason: differenceReason.trim() || undefined,
        notes: notes.trim() || undefined,
      }).unwrap();

      showSuccess(
        `Bàn giao ca thành công cho ${selectedRecipient?.fullName || "nhân viên mới"}!`
      );
      onHandoverSuccess?.();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; code?: number } };
      let msg =
        apiErr?.data?.message || "Bàn giao ca thất bại. Vui lòng kiểm tra lại!";

      if (msg.includes("mật khẩu") || apiErr?.data?.code === 1003) {
        msg = "Mật khẩu xác nhận của người nhận không đúng. Vui lòng thử lại!";
      } else if (msg.includes("ca đang mở") || apiErr?.data?.code === 3004) {
        msg =
          "Người nhận hiện đang có một ca bán hàng mở khác. Vui lòng đóng ca cũ trước!";
      } else if (
        apiErr?.data?.code === 3065 ||
        msg.includes("chênh lệch") ||
        msg.includes("lệch")
      ) {
        msg =
          "Số tiền bàn giao thực tế lệch so với quỹ dự kiến. Bắt buộc phải nhập lý do chênh lệch!";
        setShowDiscrepancyField(true);
      }

      setErrorMessage(msg);
      showError(msg);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-handover-title"
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl shadow-indigo-950/20 w-full max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-modal-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-white dark:from-slate-800/80 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3
                  id="shift-handover-title"
                  className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-lg tracking-tight truncate"
                >
                  Bàn Giao Ca Bán Hàng
                </h3>
                {summary && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 shrink-0">
                    Chặng #{summary.currentStage}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                Chuyển giao quyền bán hàng & đối soát quỹ tiền mặt giữa hai nhân viên
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 pos-tabs-scrollbar">
          {isSummaryLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Đang đối soát số liệu chặng ca hiện tại...
              </span>
            </div>
          ) : summaryError || !summary ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-center space-y-3">
              <AlertTriangle className="w-6 h-6 mx-auto text-rose-500" />
              <p className="text-sm font-bold">Không thể tải thông tin đối soát bàn giao ca!</p>
              <button
                type="button"
                onClick={() => refetchSummary()}
                className="px-4 py-1.5 bg-white border border-rose-300 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors shadow-xs"
              >
                Thử tải lại
              </button>
            </div>
          ) : (
            <form id="shift-handover-form" onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Stage Info Ribbon (Spacious 3-column bar) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 truncate">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">
                    Bắt đầu: <strong className="text-slate-800 dark:text-slate-100 font-bold">{formatDate(summary.stageStartedAt)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-400 font-medium">Quầy/Điểm bán:</span>
                  <strong className="text-slate-800 dark:text-slate-100 font-bold truncate">
                    {summary.posName || summary.posCode || "Quầy POS-01"}
                  </strong>
                </div>
                <div className="flex items-center gap-2 truncate sm:justify-end">
                  <span className="text-slate-400 font-medium">Người bàn giao:</span>
                  <strong className="text-indigo-700 dark:text-indigo-400 font-bold truncate">
                    {summary.senderFullName}
                  </strong>
                </div>
              </div>

              {/* 2. KPI 4-Card Summary Grid (Spacious & Clean) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Opening Cash */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center flex flex-col justify-center min-w-0 transition-all hover:border-slate-300">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                    Quỹ đầu chặng
                  </span>
                  <span className="font-mono font-black text-slate-800 dark:text-slate-100 text-sm sm:text-base truncate">
                    {formatCurrency(summary.openingCash)}
                  </span>
                </div>

                {/* Revenue */}
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-center flex flex-col justify-center min-w-0 transition-all hover:border-indigo-200">
                  <span className="text-[11px] uppercase tracking-wider text-indigo-900 dark:text-indigo-300 font-bold block mb-1">
                    Doanh thu ca
                  </span>
                  <span className="font-mono font-black text-indigo-700 dark:text-indigo-400 text-sm sm:text-base truncate block">
                    {formatCurrency(summary.totalRevenue ?? summary.cashRevenue)}
                  </span>
                  <div className="text-[10px] text-indigo-800/80 dark:text-indigo-300/80 font-semibold truncate mt-0.5 flex items-center justify-center gap-1.5">
                    <span>TM: {formatCurrency(summary.cashRevenue)}</span>
                    <span>•</span>
                    <span>CK: {formatCurrency(summary.bankRevenue ?? 0)}</span>
                  </div>
                </div>

                {/* Cash Transactions (Thu / Chi) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center flex flex-col justify-center min-w-0 transition-all hover:border-slate-300">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                    Thu / Chi quỹ
                  </span>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap font-mono text-xs font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400" title="Tổng thu tiền mặt trong ca">
                      +{formatCurrency(summary.stageIncome ?? 0)}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="text-rose-600 dark:text-rose-400" title="Tổng chi tiền mặt trong ca">
                      -{formatCurrency(summary.stageExpense ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Orders */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center flex flex-col justify-center min-w-0 transition-all hover:border-slate-300">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                    Đơn hàng
                  </span>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                      {summary.completedOrdersCount} xong
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                      {summary.pendingOrdersCount} treo
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Expected Cash Highlight Box (FinTech Hero Card) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-50 dark:from-slate-800 dark:via-indigo-950/40 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                      Tiền kỳ vọng tại két (theo hệ thống):
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActualCashInput(expectedCash);
                      setDifferenceReason("");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Khớp tiền kỳ vọng</span>
                  </button>
                </div>

                <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-700 dark:text-indigo-300 tracking-tight">
                  {formatCurrency(expectedCash)}
                </div>

                {/* Clear formula pills */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1 border-t border-indigo-100/80 dark:border-indigo-900/60 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    = Quỹ đầu ({formatCurrency(summary.openingCash)})
                  </span>
                  <span>+ Doanh thu TM ({formatCurrency(summary.cashRevenue)})</span>
                  {Boolean(summary.stageIncome && summary.stageIncome > 0) && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200">
                      + Thu quỹ ({formatCurrency(summary.stageIncome)})
                    </span>
                  )}
                  {Boolean(summary.stageExpense && summary.stageExpense > 0) && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold border border-rose-200">
                      - Chi quỹ ({formatCurrency(summary.stageExpense)})
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Pending orders alert if any */}
              {summary.pendingOrdersCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 font-medium">
                  <Package className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    Có <strong>{summary.pendingOrdersCount} đơn hàng treo</strong> sẽ tự động chuyển sang tài khoản người nhận ca tiếp tục phục vụ.
                  </div>
                </div>
              )}

              {/* 5. Recipient & Password Form (Spacious 2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Select Recipient */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="recipient-select"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Người tiếp nhận ca <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="recipient-select"
                    value={recipientUserId}
                    onChange={(e) => {
                      setRecipientUserId(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                    required
                  >
                    <option value="">-- Chọn nhân viên nhận ca --</option>
                    {summary.eligibleRecipients.map((user) => (
                      <option
                        key={user.userId}
                        value={user.userId}
                        disabled={user.hasOpenShift}
                        className={user.hasOpenShift ? "text-slate-400 bg-slate-100" : "font-semibold"}
                      >
                        {user.fullName || user.username} ({user.roleName || user.roleCode})
                        {user.hasOpenShift ? " — [Đang có ca mở]" : ""}
                      </option>
                    ))}
                  </select>

                  {isRecipientBusy && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 pt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Nhân viên này đang có một ca mở khác. Vui lòng đóng ca cũ trước!</span>
                    </div>
                  )}
                </div>

                {/* Recipient Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="recipient-password"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Mật khẩu người nhận <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="recipient-password"
                      type={showPassword ? "text" : "password"}
                      value={recipientPassword}
                      onChange={(e) => {
                        setRecipientPassword(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="Nhập mật khẩu người nhận..."
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:font-normal placeholder:text-slate-400 shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Actual Cash Input Box (Spacious & High-End) */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label
                    htmlFor="actual-cash"
                    className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Tiền mặt thực tế bàn giao tại két (VNĐ) <span className="text-rose-500">*</span></span>
                  </label>

                  {/* Status Badge */}
                  {isMatched ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Khớp 100% (Không lệch)</span>
                    </span>
                  ) : differenceAmount < 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 shadow-2xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Thiếu: {formatCurrency(Math.abs(differenceAmount))}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 shadow-2xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Thừa: +{formatCurrency(differenceAmount)}</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    id="actual-cash"
                    type="text"
                    inputMode="numeric"
                    value={
                      actualCashInput === "" ? "" : formatNumber(actualCashInput)
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setActualCashInput(raw === "" ? "" : Number(raw));
                      setErrorMessage(null);
                    }}
                    placeholder="Nhập số tiền thực tế tại két..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-lg font-black tracking-tight focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                    VNĐ
                  </span>
                </div>

                {/* Discrepancy Reason Input */}
                {shouldShowDiscrepancyReason ? (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-1.5 animate-fadeIn">
                    <label
                      htmlFor="difference-reason"
                      className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between"
                    >
                      <span>
                        Lý do chênh lệch tiền bàn giao <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                        Ghi nhận giải trình: {summary.senderFullName}
                      </span>
                    </label>
                    <textarea
                      id="difference-reason"
                      rows={2}
                      value={differenceReason}
                      onChange={(e) => {
                        setDifferenceReason(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="Ghi rõ lý do thừa/thiếu tiền hoặc giải trình kiểm két để lưu hồ sơ ca..."
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400"
                      required={!isMatched || isDiscrepancyError}
                      autoFocus={isDiscrepancyError}
                    />
                  </div>
                ) : (
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowDiscrepancyField(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>+ Thêm ghi chú giải trình tiền mặt</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 7. Work Handover Notes */}
              <div className="space-y-1.5">
                <label
                  htmlFor="handover-notes"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Ghi chú & Dặn dò ca sau (tùy chọn):
                </label>
                <input
                  id="handover-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Dặn dò thêm cho nhân viên tiếp nhận ca (khách nợ, đơn hẹn, lưu ý tại quầy)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="submit"
            form="shift-handover-form"
            disabled={
              isSubmitting ||
              isSummaryLoading ||
              !summary ||
              !recipientUserId ||
              isRecipientBusy ||
              !recipientPassword.trim() ||
              (!isMatched && !differenceReason.trim())
            }
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang xử lý bàn giao...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Xác Nhận Bàn Giao Ca</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShiftHandoverModal;
