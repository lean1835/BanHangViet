import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import {
  X,
  FileCheck,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateOnly } from "@/utils/dateFormatter";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { CUSTOMER_LOG, CUSTOMER_UI } from "@/constants/customer";
import { USER_ROLES } from "@/constants/roles";
import type { RootState } from "@/stores";
import {
  usePreviewDebtReconciliationMutation,
  useCreateDebtReconciliationMutation,
  useGetLatestDebtReconciliationQuery,
} from "../services/customerApi";
import type { ICustomer } from "../types/ICustomer";
import type { IDebtReconciliationResponse } from "../types/ICustomerDebtReconciliation";

interface DebtReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: ICustomer | null;
  onOpenPrintModal?: (reconciliationId: string) => void;
  onSuccess?: (reconciliation: IDebtReconciliationResponse) => void;
}

export const DebtReconciliationModal: React.FC<DebtReconciliationModalProps> = ({
  isOpen,
  onClose,
  customer,
  onOpenPrintModal,
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userRole = currentUser?.roleId || currentUser?.role?.code || currentUser?.role?.name || USER_ROLES.OWNER;
  const isOwner = userRole === USER_ROLES.OWNER;

  // Date range defaults
  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(firstDayThisMonth);
  const [endDate, setEndDate] = useState(todayStr);
  const [notes, setNotes] = useState("");
  const [confirmNow, setConfirmNow] = useState(false);
  const [previewData, setPreviewData] = useState<IDebtReconciliationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Latest reconciliation query for customer - use data with strict customerId validation
  const { data: latestRecData } = useGetLatestDebtReconciliationQuery(customer?.id || "", {
    skip: !isOpen || !customer?.id,
  });

  // Strict check: latestRec MUST belong to the currently selected customer
  const latestRec =
    latestRecData && latestRecData.customerId === customer?.id
      ? latestRecData
      : null;

  const [previewMutation, { isLoading: isPreviewing }] = usePreviewDebtReconciliationMutation();
  const [createMutation, { isLoading: isCreating }] = useCreateDebtReconciliationMutation();

  // Reset form when modal opens or customer changes
  useEffect(() => {
    if (isOpen && customer?.id) {
      if (latestRec && latestRec.customerId === customer.id && latestRec.reconciledToDate) {
        // Suggest start date right after last lock date
        const nextDay = new Date(latestRec.reconciledToDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split("T")[0];
        if (nextDayStr <= todayStr) {
          setStartDate(nextDayStr);
        } else {
          setStartDate(firstDayThisMonth);
        }
      } else {
        setStartDate(firstDayThisMonth);
      }
      setEndDate(todayStr);
      setNotes("");
      setConfirmNow(false);
      setPreviewData(null);
      setErrorMsg(null);
    }
  }, [isOpen, customer?.id, latestRec, firstDayThisMonth, todayStr]);

  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(customer),
    onClose,
    canClose: !isCreating && !isPreviewing,
  });

  if (!isOpen || !customer) return null;

  // Presets helper
  const handleSelectPreset = (preset: "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "FROM_LAST_LOCK") => {
    const now = new Date();
    if (preset === "THIS_MONTH") {
      setStartDate(firstDayThisMonth);
      setEndDate(todayStr);
    } else if (preset === "LAST_MONTH") {
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0];
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        .toISOString()
        .split("T")[0];
      setStartDate(firstDayPrevMonth);
      setEndDate(lastDayPrevMonth);
    } else if (preset === "THIS_QUARTER") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const firstDayQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1)
        .toISOString()
        .split("T")[0];
      setStartDate(firstDayQuarter);
      setEndDate(todayStr);
    } else if (preset === "FROM_LAST_LOCK" && latestRec?.reconciledToDate) {
      const nextDay = new Date(latestRec.reconciledToDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setStartDate(nextDay.toISOString().split("T")[0]);
      setEndDate(todayStr);
    }
    setPreviewData(null);
    setErrorMsg(null);
  };

  const isPeriodBeforeLock =
    Boolean(latestRec && latestRec.customerId === customer?.id && latestRec.reconciledToDate) &&
    Boolean(startDate) &&
    Boolean(latestRec?.reconciledToDate && startDate <= latestRec.reconciledToDate);

  // Handle Preview
  const handlePreview = async () => {
    setErrorMsg(null);
    if (!startDate || !endDate) {
      setErrorMsg("Vui lòng chọn đầy đủ từ ngày đến ngày");
      return;
    }
    if (startDate > endDate) {
      setErrorMsg("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }
    if (endDate > todayStr) {
      setErrorMsg("Ngày kết thúc không được vượt quá ngày hiện tại");
      return;
    }

    try {
      const res = await previewMutation({
        customerId: customer.id,
        startDate,
        endDate,
      }).unwrap();
      setPreviewData(res);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Không thể tải xem trước bảng đối chiếu công nợ.");
      setErrorMsg(msg);
      showError(msg);
    }
  };

  // Handle Submit (Create draft or confirm now)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!startDate || !endDate) {
      setErrorMsg("Vui lòng chọn đầy đủ từ ngày đến ngày");
      return;
    }
    if (startDate > endDate) {
      setErrorMsg("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }
    if (isPeriodBeforeLock) {
      setErrorMsg(
        `Kỳ đối chiếu không hợp lệ: Khách hàng đã được khóa sổ đối chiếu đến ngày ${formatDateOnly(
          latestRec?.reconciledToDate,
        )}. Vui lòng chọn ngày bắt đầu sau mốc này.`,
      );
      return;
    }

    try {
      const created = await createMutation({
        customerId: customer.id,
        startDate,
        endDate,
        notes: notes.trim() || undefined,
        confirmNow,
      }).unwrap();

      if (confirmNow) {
        addLogEntry(
          CUSTOMER_LOG.RECONCILE_CONFIRM_ACTION,
          CUSTOMER_LOG.reconcileConfirmed(created.code, formatDateOnly(endDate)),
        );
        showSuccess(
          `Đã chốt và khóa sổ biên bản đối chiếu ${created.code} đến ngày ${formatDateOnly(endDate)}.`,
        );
      } else {
        addLogEntry(
          CUSTOMER_LOG.RECONCILE_CREATE_ACTION,
          CUSTOMER_LOG.reconcileCreated(created.code, customer.name),
        );
        showSuccess(
          `Đã lập bản nháp biên bản đối chiếu ${created.code} cho khách hàng "${customer.name}".`,
        );
      }

      onSuccess?.(created);
      onClose();

      if (onOpenPrintModal && created.id) {
        onOpenPrintModal(created.id);
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Không thể lưu biên bản đối chiếu công nợ.");
      setErrorMsg(msg);
      showError(msg);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-5 backdrop-blur-xs animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reconciliation-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[95vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-modal-smooth-in"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kv-blue-primary/10 text-kv-blue-primary">
              <FileCheck size={18} />
            </div>
            <div>
              <h2 id="reconciliation-modal-title" className="text-sm font-extrabold text-slate-800">
                {CUSTOMER_UI.RECONCILIATION_MODAL.TITLE}
              </h2>
              <p className="text-[11px] text-slate-500">
                Khách hàng: <strong>{customer.name}</strong> • SĐT: {customer.phone || customer.phoneNumber || "---"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating || isPreviewing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Locked Status Notice if customer was reconciled previously */}
          {latestRec?.reconciledToDate && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[11px]">
                <Lock size={14} className="text-blue-600 shrink-0" />
                <span>
                  Kỳ đối chiếu gần nhất đã chốt: <strong>{latestRec.code}</strong> (đến ngày{" "}
                  <strong>{formatDateOnly(latestRec.reconciledToDate)}</strong>). Các khoản nợ trước mốc này đã khóa.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPreset("FROM_LAST_LOCK")}
                className="text-[11px] font-bold text-kv-blue-primary hover:underline"
              >
                Chọn tiếp từ mốc này &rarr;
              </button>
            </div>
          )}

          {/* Period Selection Controls */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-extrabold text-slate-700 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                <Calendar size={13} />
                Chọn khoảng thời gian đối chiếu
              </span>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSelectPreset("THIS_MONTH")}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold transition-all shadow-2xs"
                >
                  Tháng này
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("LAST_MONTH")}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold transition-all shadow-2xs"
                >
                  Tháng trước
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("THIS_QUARTER")}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold transition-all shadow-2xs"
                >
                  Quý này
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-4 flex flex-col gap-1">
                <label htmlFor="rec-start-date" className="font-bold text-slate-600 text-[11px]">
                  {CUSTOMER_UI.RECONCILIATION_MODAL.START_DATE_LABEL}
                </label>
                <input
                  id="rec-start-date"
                  type="date"
                  max={todayStr}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPreviewData(null);
                  }}
                  className={`h-9 rounded-lg border px-2.5 font-mono text-xs font-bold text-slate-700 focus:outline-none ${
                    isPeriodBeforeLock
                      ? "border-rose-300 bg-rose-50 text-rose-700"
                      : "border-slate-300 bg-white focus:border-kv-blue-primary"
                  }`}
                />
              </div>

              <div className="sm:col-span-1 flex justify-center text-slate-400 pt-5 hidden sm:flex">
                <ArrowRight size={16} />
              </div>

              <div className="sm:col-span-4 flex flex-col gap-1">
                <label htmlFor="rec-end-date" className="font-bold text-slate-600 text-[11px]">
                  {CUSTOMER_UI.RECONCILIATION_MODAL.END_DATE_LABEL}
                </label>
                <input
                  id="rec-end-date"
                  type="date"
                  max={todayStr}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreviewData(null);
                  }}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 font-mono text-xs font-bold text-slate-700 focus:border-kv-blue-primary focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3 pt-1 sm:pt-5">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isPreviewing}
                  className="w-full h-9 flex items-center justify-center gap-1.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 active:scale-98"
                >
                  <FileText size={14} />
                  {isPreviewing ? "Đang tính..." : CUSTOMER_UI.RECONCILIATION_MODAL.PREVIEW_BUTTON}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Calculated Statement */}
          {previewData && (
            <div className="flex flex-col gap-3 animate-auth-fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                  {CUSTOMER_UI.RECONCILIATION_MODAL.PREVIEW_TITLE}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {formatDateOnly(previewData.startDate)} &rarr; {formatDateOnly(previewData.endDate)}
                </span>
              </div>

              {/* 4 Balances KPI Cards - Large, clear for elderly users */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">1. Dư nợ đầu kỳ</span>
                  <span className="text-sm font-black text-slate-800 mt-1">
                    {formatCurrency(previewData.openingDebtBalance)}
                  </span>
                </div>

                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 flex flex-col">
                  <span className="text-[10px] font-bold text-rose-500 uppercase">2. Phát sinh tăng (Nợ)</span>
                  <span className="text-sm font-black text-rose-600 mt-1">
                    +{formatCurrency(previewData.totalDebtIncurred)}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">3. Phát sinh giảm (Trả)</span>
                  <span className="text-sm font-black text-emerald-600 mt-1">
                    -{formatCurrency(previewData.totalDebtPaid)}
                  </span>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-300 flex flex-col">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">4. Dư nợ cuối kỳ</span>
                  <span className="text-sm font-black text-amber-800 mt-1 font-mono">
                    {formatCurrency(previewData.closingDebtBalance)}
                  </span>
                </div>
              </div>

              {/* In Words Callout */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2">
                <Info size={15} className="text-kv-blue-primary shrink-0 mt-0.5" />
                <div className="flex-1 text-[11px]">
                  <span className="font-bold text-slate-600">Số dư nợ cuối kỳ bằng chữ: </span>
                  <strong className="text-slate-900 underline font-extrabold">
                    {previewData.closingDebtInWords || "Không đồng"}
                  </strong>
                </div>
              </div>

              {/* Empty transactions case (AC NCL-10-CN-007-TC-03) */}
              {!previewData.hasTransactions && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2 text-xs font-semibold">
                  <Info size={16} className="text-amber-600 shrink-0" />
                  <span>{CUSTOMER_UI.RECONCILIATION_MODAL.NO_TRANSACTIONS_BANNER}</span>
                </div>
              )}

              {/* Transactions Breakdown Table */}
              {previewData.items && previewData.items.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 sticky top-0">
                        <tr>
                          <th className="p-2.5 text-center w-10">STT</th>
                          <th className="p-2.5">Ngày phát sinh</th>
                          <th className="p-2.5">Nội dung</th>
                          <th className="p-2.5">Mã tham chiếu</th>
                          <th className="p-2.5 text-right">Phát sinh Tăng</th>
                          <th className="p-2.5 text-right">Phát sinh Giảm</th>
                          <th className="p-2.5 text-right">Dư nợ lũy kế</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {previewData.items.map((item, idx) => {
                          const isIncrease = item.type === "DEBT_CREATED";
                          return (
                            <tr key={item.id || idx} className="hover:bg-slate-50/70">
                              <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                              <td className="p-2.5 font-mono">{formatDateOnly(item.transactionDate)}</td>
                              <td className="p-2.5">
                                <span className="font-semibold">{item.typeDescription}</span>
                                {item.notes && <span className="text-slate-400 block text-[10px]">{item.notes}</span>}
                              </td>
                              <td className="p-2.5 font-mono font-bold text-slate-800">{item.referenceCode || "---"}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                                {isIncrease ? `+${formatCurrency(item.amount)}` : "-"}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                                {!isIncrease ? `-${formatCurrency(item.amount)}` : "-"}
                              </td>
                              <td className="p-2.5 text-right font-mono font-black text-slate-800">
                                {formatCurrency(item.runningBalance)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes input */}
              <div className="flex flex-col gap-1 mt-1">
                <label htmlFor="rec-notes-input" className="font-bold text-slate-600 text-[11px]">
                  {CUSTOMER_UI.RECONCILIATION_MODAL.NOTES_LABEL}
                </label>
                <textarea
                  id="rec-notes-input"
                  rows={2}
                  maxLength={1000}
                  placeholder={CUSTOMER_UI.RECONCILIATION_MODAL.NOTES_PLACEHOLDER}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-kv-blue-primary focus:outline-none"
                />
              </div>

              {/* Lock & Confirm Option (Owner VT-01 only) */}
              {isOwner && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-all">
                  <input
                    type="checkbox"
                    checked={confirmNow}
                    onChange={(e) => setConfirmNow(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary"
                  />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-kv-blue-primary" />
                      {CUSTOMER_UI.RECONCILIATION_MODAL.CONFIRM_NOW_LABEL}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Đánh dấu biên bản là <strong>ĐÃ XÁC NHẬN</strong> và <strong>khóa toàn bộ</strong> các khoản nợ
                      trước ngày {formatDateOnly(endDate)} không cho sửa lùi.
                    </span>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5 bg-slate-50 shrink-0 flex-wrap gap-2">
          <div className="text-[11px] text-slate-500 font-medium">
            {previewData ? (
              <span>Dư nợ cuối kỳ: <strong className="text-rose-600">{formatCurrency(previewData.closingDebtBalance)}</strong></span>
            ) : (
              <span>Bấm &ldquo;Xem trước số liệu&rdquo; để kiểm tra trước khi lưu</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-all text-xs"
            >
              {CUSTOMER_UI.RECONCILIATION_MODAL.CANCEL_BUTTON}
            </button>

            {previewData && isOwner && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isCreating}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-bold transition-all text-xs shadow-sm ${
                  confirmNow
                    ? "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                    : "bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95"
                }`}
              >
                {isCreating ? (
                  <span>Đang lưu...</span>
                ) : confirmNow ? (
                  <>
                    <Lock size={14} />
                    <span>{CUSTOMER_UI.RECONCILIATION_MODAL.CONFIRM_LOCK_BUTTON}</span>
                  </>
                ) : (
                  <>
                    <FileCheck size={14} />
                    <span>{CUSTOMER_UI.RECONCILIATION_MODAL.SAVE_DRAFT_BUTTON}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
export default DebtReconciliationModal;
