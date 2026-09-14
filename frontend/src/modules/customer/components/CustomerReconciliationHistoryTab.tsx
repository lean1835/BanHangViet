import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  FileCheck,
  Plus,
  Sliders,
  Printer,
  CheckCircle2,
  XCircle,
  Lock,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateOnly } from "@/utils/dateFormatter";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { CUSTOMER_LOG } from "@/constants/customer";
import { USER_ROLES } from "@/constants/roles";
import type { RootState } from "@/stores";
import {
  useGetDebtReconciliationsQuery,
  useConfirmDebtReconciliationMutation,
  useCancelDebtReconciliationMutation,
} from "../services/customerApi";
import type { ICustomer } from "../types/ICustomer";
import type { IDebtReconciliationResponse } from "../types/ICustomerDebtReconciliation";

interface CustomerReconciliationHistoryTabProps {
  customer: ICustomer;
  onOpenCreateReconciliation: () => void;
  onOpenAdjustment: () => void;
  onOpenPrint: (reconciliationId: string) => void;
}

export const CustomerReconciliationHistoryTab: React.FC<CustomerReconciliationHistoryTabProps> = ({
  customer,
  onOpenCreateReconciliation,
  onOpenAdjustment,
  onOpenPrint,
}) => {
  const { showSuccess, showError } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userRole = currentUser?.roleId || currentUser?.role?.code || currentUser?.role?.name || USER_ROLES.OWNER;
  const isOwner = userRole === USER_ROLES.OWNER;

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: pageData, isLoading, refetch } = useGetDebtReconciliationsQuery(
    { customerId: customer.id, size: 50 },
    { refetchOnMountOrArgChange: true },
  );

  const [confirmMutation, { isLoading: isConfirming }] = useConfirmDebtReconciliationMutation();
  const [cancelMutation, { isLoading: isCancelling }] = useCancelDebtReconciliationMutation();

  const reconciliations: IDebtReconciliationResponse[] = pageData?.content || [];

  const handleConfirmReconciliation = async (rec: IDebtReconciliationResponse) => {
    try {
      await confirmMutation({
        id: rec.id,
        notes: confirmNotes.trim() || undefined,
      }).unwrap();

      addLogEntry(
        CUSTOMER_LOG.RECONCILE_CONFIRM_ACTION,
        CUSTOMER_LOG.reconcileConfirmed(rec.code, formatDateOnly(rec.endDate)),
      );

      showSuccess(`Đã xác nhận và khóa sổ biên bản đối chiếu ${rec.code}.`);
      setConfirmingId(null);
      setConfirmNotes("");
      refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể xác nhận biên bản đối chiếu."));
    }
  };

  const handleCancelReconciliation = async (rec: IDebtReconciliationResponse) => {
    try {
      await cancelMutation(rec.id).unwrap();
      addLogEntry(
        CUSTOMER_LOG.RECONCILE_CANCEL_ACTION,
        `Đã hủy biên bản đối chiếu ${rec.code} của khách hàng ${customer.name}`,
      );
      showSuccess(`Đã hủy biên bản đối chiếu ${rec.code}.`);
      setCancellingId(null);
      refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể hủy biên bản đối chiếu."));
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
        <div>
          <h4 className="font-extrabold text-slate-800 text-xs">
            Lịch sử đối chiếu công nợ ({reconciliations.length} biên bản)
          </h4>
          <p className="text-[11px] text-slate-500">
            Quản lý các đợt đối chiếu, in giấy xác nhận và mốc khóa sổ chống sửa lùi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isOwner && (
            <button
              type="button"
              onClick={onOpenAdjustment}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-all shadow-2xs"
            >
              <Sliders size={13} />
              Bút toán điều chỉnh
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreateReconciliation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs transition-all shadow-2xs"
          >
            <Plus size={14} />
            Lập đối chiếu mới
          </button>
        </div>
      </div>

      {/* Confirm inline modal prompt */}
      {confirmingId && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col gap-2.5 animate-auth-fade-in">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Xác nhận đối chiếu và khóa sổ công nợ (Khách đã ký xác nhận)</span>
          </div>
          <p className="text-[11px] text-emerald-800">
            Hệ thống sẽ khóa toàn bộ các giao dịch nợ trước ngày kết thúc của kỳ này. Mọi thay đổi sau này bắt buộc phải lập bút toán điều chỉnh.
          </p>
          <input
            type="text"
            placeholder="Ghi chú xác nhận khi ký (tùy chọn)..."
            value={confirmNotes}
            onChange={(e) => setConfirmNotes(e.target.value)}
            className="h-8 rounded-lg border border-emerald-300 bg-white px-2.5 text-xs text-slate-800 focus:outline-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirmingId(null);
                setConfirmNotes("");
              }}
              disabled={isConfirming}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                const targetRec = reconciliations.find((r) => r.id === confirmingId);
                if (targetRec) handleConfirmReconciliation(targetRec);
              }}
              disabled={isConfirming}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs"
            >
              {isConfirming ? "Đang khóa sổ..." : "Xác nhận & Khóa sổ ngay"}
            </button>
          </div>
        </div>
      )}

      {/* Cancel inline modal prompt */}
      {cancellingId && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between flex-wrap gap-2.5 animate-auth-fade-in">
          <div className="flex items-center gap-2 text-rose-900 text-xs font-semibold">
            <AlertCircle size={16} className="text-rose-600" />
            <span>Bạn có chắc muốn hủy biên bản nháp này?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCancellingId(null)}
              disabled={isCancelling}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold"
            >
              Không
            </button>
            <button
              type="button"
              onClick={() => {
                const targetRec = reconciliations.find((r) => r.id === cancellingId);
                if (targetRec) handleCancelReconciliation(targetRec);
              }}
              disabled={isCancelling}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
            >
              {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
            </button>
          </div>
        </div>
      )}

      {/* Reconciliations Table */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Đang tải lịch sử đối chiếu...</div>
      ) : reconciliations.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
          <FileCheck size={28} className="text-slate-300" />
          <p className="text-xs font-bold text-slate-700">Khách hàng chưa có biên bản đối chiếu nào</p>
          <p className="text-[11px] text-slate-400 max-w-sm">
            Tạo biên bản đối chiếu để in cho khách ký xác nhận số dư công nợ và khóa sổ các giao dịch nợ cũ.
          </p>
          <button
            type="button"
            onClick={onOpenCreateReconciliation}
            className="mt-2 px-3.5 py-1.5 rounded-lg bg-kv-blue-primary text-white font-bold text-xs"
          >
            Lập biên bản đối chiếu đầu tiên
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
          {reconciliations.map((rec) => {
            const isDraft = rec.status === "DRAFT";
            const isConfirmed = rec.status === "CONFIRMED";

            return (
              <div
                key={rec.id}
                className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                {/* Left: Code, Period, Status */}
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isConfirmed
                        ? "bg-emerald-100 text-emerald-700"
                        : isDraft
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isConfirmed ? <Lock size={16} /> : isDraft ? <Clock size={16} /> : <XCircle size={16} />}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-slate-900 font-mono">{rec.code}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isConfirmed
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : isDraft
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isConfirmed ? "ĐÃ XÁC NHẬN & KHÓA SỔ" : isDraft ? "BẢN NHÁP (DRAFT)" : "ĐÃ HỦY"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 flex-wrap pt-0.5">
                      <span>
                        Kỳ: <strong>{formatDateOnly(rec.startDate)}</strong> &rarr;{" "}
                        <strong>{formatDateOnly(rec.endDate)}</strong>
                      </span>
                      {rec.confirmedAt && (
                        <span className="text-emerald-700 font-semibold">
                          &bull; Chốt ngày: {formatDateOnly(rec.confirmedAt)}
                        </span>
                      )}
                    </div>

                    {rec.notes && (
                      <p className="text-[11px] text-slate-600 italic mt-0.5">Ghi chú: {rec.notes}</p>
                    )}
                  </div>
                </div>

                {/* Right: Balance & Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Dư nợ cuối kỳ</span>
                    <span className="font-black text-xs text-rose-600 font-mono">
                      {formatCurrency(rec.closingDebtBalance)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Print statement button */}
                    <button
                      type="button"
                      onClick={() => onOpenPrint(rec.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition-all"
                      title="Xem và in giấy xác nhận công nợ"
                    >
                      <Printer size={13} />
                      In giấy
                    </button>

                    {/* Draft Actions for Owner */}
                    {isDraft && isOwner && (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(rec.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all"
                          title="Xác nhận khách đã ký và khóa sổ nợ"
                        >
                          <Lock size={12} />
                          Khóa sổ
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancellingId(rec.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Hủy bản nháp"
                        >
                          <XCircle size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default CustomerReconciliationHistoryTab;
