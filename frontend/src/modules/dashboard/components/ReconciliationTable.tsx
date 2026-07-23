import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { useGetShiftsHistoryQuery } from "@/modules/shift/services/shiftApi";
import type { IShiftResponse } from "@/modules/shift/types/IShift";
import { useNotification } from "@/hooks/useNotification";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  useGetReconciliationQuery,
  useLockReconciliationMutation,
  useGetActivityLogsQuery,
} from "@/modules/report/services/reportApi";
import {
  useResendInvoiceMutation,
  useSubmitToTaxMutation,
  useCancelInvoiceMutation,
  useUpdateInvoiceMutation,
} from "@/modules/e_invoice/services/eInvoiceApi";
import { InvoiceDetailModal } from "@/modules/e_invoice/components/InvoiceDetailModal";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface ReconciliationTableProps {
  date: string;
  currentRole: string;
}

export const ReconciliationTable = ({ date, currentRole }: ReconciliationTableProps) => {
  const [activeTab, setActiveTab] = useState<"shifts" | "failedInvoices">("shifts");
  const { showSuccess, showError } = useNotification();
  const [selectedInvoice, setSelectedInvoice] = useState<IInvoice | null>(null);

  // Queries
  const { data: reconciliationData, isLoading: isReconLoading, refetch: refetchRecon } = useGetReconciliationQuery({ date });
  const { data: shiftsHistoryData, isLoading: isShiftsLoading } = useGetShiftsHistoryQuery();
  const [lockReconciliation, { isLoading: isLocking }] = useLockReconciliationMutation();
  const [resendInvoice] = useResendInvoiceMutation();
  const [submitToTax] = useSubmitToTaxMutation();
  const [cancelInvoice] = useCancelInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();

  const reconData = reconciliationData?.result;
  const dbShifts = shiftsHistoryData?.result;

  // Filter shifts strictly by selected date YYYY-MM-DD
  const shiftsList = useMemo(() => {
    if (!dbShifts || dbShifts.length === 0) return [];
    if (!date) return dbShifts;
    return dbShifts.filter((shift) => {
      const openDate = shift.openedAt ? shift.openedAt.substring(0, 10) : "";
      const createDate = shift.createdAt ? shift.createdAt.substring(0, 10) : "";
      const closeDate = shift.closedAt ? shift.closedAt.substring(0, 10) : "";
      return openDate === date || createDate === date || closeDate === date;
    });
  }, [dbShifts, date]);

  // Compute actual handed over cash, expected cash, and diff based on shifts or API reconData
  const closingCashActualSum = useMemo(() => {
    const shiftSum = shiftsList.reduce((sum: number, s: IShiftResponse) => {
      if (s.closingCashActual !== null && s.closingCashActual !== undefined) {
        return sum + s.closingCashActual;
      }
      return sum;
    }, 0);
    return shiftSum > 0 ? shiftSum : (reconData?.closingCashActual || 0);
  }, [shiftsList, reconData]);

  const closingCashExpectedSum = useMemo(() => {
    const shiftSum = shiftsList.reduce((sum: number, s: IShiftResponse) => {
      if (s.closingCashExpected !== null && s.closingCashExpected !== undefined) {
        return sum + s.closingCashExpected;
      }
      return sum;
    }, 0);
    return shiftSum > 0 ? shiftSum : (reconData?.closingCashExpected || 0);
  }, [shiftsList, reconData]);

  // Diff: sum shift difference amounts or closingCashActualSum - closingCashExpectedSum
  const diff = useMemo(() => {
    const shiftDiffSum = shiftsList.reduce((sum: number, s: IShiftResponse) => {
      if (s.differenceAmount !== null && s.differenceAmount !== undefined) {
        return sum + s.differenceAmount;
      }
      return sum;
    }, 0);
    if (shiftsList.length > 0) {
      return shiftDiffSum;
    }
    return closingCashActualSum - closingCashExpectedSum;
  }, [shiftsList, closingCashActualSum, closingCashExpectedSum]);

  // Failed invoices list from API
  const failedInvoices = useMemo(() => {
    if (reconData?.errorInvoices && reconData.errorInvoices.length > 0) {
      return reconData.errorInvoices.map((inv) => ({
        id: inv.id,
        lookupCode: inv.lookupCode || "-",
        symbol: inv.invoiceSymbol || inv.invoicePattern || "-",
        customer: inv.buyerName || "Khách mua lẻ",
        finalAmount: inv.finalAmount || 0,
        time: inv.createdAt ? new Date(inv.createdAt).toLocaleString("vi-VN") : "-",
        errorDetails: inv.taxAuthorityResponse || "Lỗi truyền nhận dữ liệu CQT",
        status: inv.status,
        raw: inv,
      }));
    }
    return [];
  }, [reconData]);

  const handleSendToTax = async (id: string) => {
    try {
      const response = await submitToTax(id).unwrap();
      showSuccess("Đã gửi hóa đơn điện tử chờ cơ quan thuế cấp mã.");
      if (response?.result) {
        setSelectedInvoice(response.result);
      }
      void refetchRecon();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể gửi hóa đơn điện tử."));
    }
  };

  const handleResendToTax = async (id: string) => {
    try {
      const response = await resendInvoice(id).unwrap();
      showSuccess("Đã gửi lại hóa đơn điện tử lên cơ quan thuế.");
      if (response?.result) {
        setSelectedInvoice(response.result);
      }
      void refetchRecon();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể gửi lại hóa đơn điện tử."));
    }
  };

  const handleCancelInvoice = async (id: string, reason: string) => {
    try {
      const response = await cancelInvoice({ invoiceId: id, cancelReason: reason }).unwrap();
      showSuccess("Hủy hóa đơn điện tử thành công.");
      if (response?.result) {
        setSelectedInvoice(response.result);
      }
      void refetchRecon();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể thực hiện hủy hóa đơn điện tử."));
    }
  };

  const handleUpdateInvoice = async (
    id: string,
    buyerInfo: {
      buyerName: string;
      buyerTaxCode: string;
      buyerAddress: string;
      buyerPhone: string;
      buyerEmail: string;
    }
  ) => {
    try {
      const response = await updateInvoice({ invoiceId: id, ...buyerInfo }).unwrap();
      if (response?.result) {
        setSelectedInvoice(response.result);
      }
      void refetchRecon();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể cập nhật thông tin hóa đơn."));
      throw err;
    }
  };

  const [showLockModal, setShowLockModal] = useState(false);
  const [lockNote, setLockNote] = useState("");

  const selectedLockDate = date || new Date().toISOString().split("T")[0];

  const { data: activityLogsRes } = useGetActivityLogsQuery({
    fromDate: selectedLockDate,
    toDate: selectedLockDate,
    size: 50,
  });

  const isAlreadyLocked = useMemo(() => {
    const logs = activityLogsRes?.result?.content || [];
    return logs.some(
      (l) => l.action?.toUpperCase().includes("CHOT_DOI_CHIEU") || l.action?.toUpperCase().includes("LOCK")
    );
  }, [activityLogsRes]);

  const handleLockDay = () => {
    if (isAlreadyLocked) return;
    setShowLockModal(true);
  };

  const handleConfirmLock = async () => {
    try {
      const lockDate = selectedLockDate;
      await lockReconciliation({ date: lockDate, notes: lockNote }).unwrap();

      const [y, m, d] = lockDate.split("-");
      showSuccess(`Đã chốt đối chiếu ngày ${d}/${m}/${y} thành công!`);
      setShowLockModal(false);
      setLockNote("");
      void refetchRecon();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể chốt đối chiếu ngày."));
    }
  };


  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
      {/* Tabs Header */}
      <div className="bg-slate-50 border-b border-slate-200 flex justify-between items-center px-4 shrink-0">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("shifts")}
            className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all ${
              activeTab === "shifts"
                ? "border-kv-blue-primary text-kv-blue-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Đối chiếu tiền cuối ngày
          </button>
          <button
            onClick={() => setActiveTab("failedInvoices")}
            className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "failedInvoices"
                ? "border-kv-blue-primary text-kv-blue-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Hóa đơn gửi lỗi
            {failedInvoices.length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                {failedInvoices.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-auto p-4 flex flex-col">
        {isReconLoading ? (
          <div className="text-center text-slate-400 py-10 text-xs font-medium">Đang tải dữ liệu đối chiếu ngày...</div>
        ) : activeTab === "shifts" ? (
          <div className="flex-1 flex flex-col gap-4">
            {/* Reconciliation Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Doanh thu dự kiến</span>
                <span className="text-xs font-extrabold text-slate-700">
                  {formatCurrency((reconData?.totalCash || 0) + (reconData?.totalTransfer || 0) + (reconData?.totalDebt || 0))}
                </span>
                <div className="text-[9px] text-slate-400 mt-1 font-medium">
                  TM: {formatCurrency(reconData?.totalCash || 0)} | CK: {formatCurrency(reconData?.totalTransfer || 0)} | Nợ: {formatCurrency(reconData?.totalDebt || 0)}
                </div>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Thực tế bàn giao (TM)</span>
                <span className="text-xs font-extrabold text-slate-700">
                  {formatCurrency(closingCashActualSum)}
                </span>
                <div className="text-[9px] text-slate-400 mt-1 font-medium">
                  Dự kiến (TM): {formatCurrency(closingCashExpectedSum)}
                </div>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Chênh lệch quỹ</span>
                  <span className={`text-xs font-black ${diff < 0 ? "text-rose-500" : diff > 0 ? "text-emerald-600 font-extrabold" : "text-slate-700"}`}>
                    {formatCurrency(diff)}
                  </span>
                </div>
                {isAlreadyLocked ? (
                  <button
                    disabled
                    className="bg-emerald-50 text-emerald-700 border border-emerald-300 py-1.5 px-3 text-[10px] font-black rounded flex items-center gap-1 cursor-not-allowed shrink-0 shadow-2xs"
                    title="Ngày này đã được chốt đối chiếu"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Đã chốt</span>
                  </button>
                ) : (
                  <button
                    onClick={handleLockDay}
                    disabled={isLocking}
                    className="bg-kv-blue-primary text-white border-none py-1.5 px-3 text-[10px] font-bold rounded hover:bg-kv-blue-dark transition-colors disabled:opacity-55 shrink-0"
                  >
                    Chốt ngày
                  </button>
                )}
              </div>
            </div>

            {/* Shift List Table */}
            <div className="flex-1 overflow-auto">
              {isShiftsLoading ? (
                <div className="text-center text-slate-400 py-10 text-xs font-medium">Đang tải ca làm việc...</div>
              ) : shiftsList.length === 0 ? (
                <div className="text-center text-slate-400 py-10 text-xs font-medium">
                  Chưa có ca làm việc nào trong ngày.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                      <th className="py-2 px-3">Nhân viên</th>
                      <th className="py-2 px-3 text-right">Tiền đầu ca</th>
                      <th className="py-2 px-3 text-right">Doanh thu dự kiến</th>
                      <th className="py-2 px-3 text-right">Thực tế bàn giao</th>
                      <th className="py-2 px-3 text-right">Chênh lệch</th>
                      <th className="py-2 px-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shiftsList.map((shift: IShiftResponse) => {
                      const diffVal = shift.differenceAmount ?? 0;
                      return (
                        <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {shift.fullName || shift.username}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">
                            {formatCurrency(shift.openingCash)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">
                            {shift.closingCashExpected !== null
                              ? formatCurrency(shift.closingCashExpected - shift.openingCash)
                              : "--"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">
                            {shift.closingCashActual !== null
                              ? formatCurrency(shift.closingCashActual)
                              : "--"}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-extrabold ${
                              diffVal < 0
                                ? "text-rose-500"
                                : diffVal > 0
                                ? "text-kv-green"
                                : "text-slate-600"
                            }`}
                          >
                            {diffVal !== 0 ? formatCurrency(diffVal) : "0 đ"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                shift.status === "OPEN"
                                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                                  : diffVal !== 0
                                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              }`}
                            >
                              {shift.status === "OPEN"
                                ? "Đang mở"
                                : diffVal !== 0
                                ? "Lệch tiền"
                                : "Khớp tiền"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {failedInvoices.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-xs font-semibold">
                Không có hóa đơn gửi lỗi nào cần xử lý.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2 px-3">Mã hóa đơn</th>
                    <th className="py-2 px-3">Khách hàng</th>
                    <th className="py-2 px-3 text-right">Tổng tiền</th>
                    <th className="py-2 px-3">Ngày tạo</th>
                    <th className="py-2 px-3">Chi tiết lỗi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {failedInvoices.map((inv: any) => (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv.raw)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{inv.lookupCode}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{inv.customer}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-bold">
                        {formatCurrency(inv.finalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-medium">{inv.time}</td>
                      <td className="py-2.5 px-3 text-rose-500 font-semibold truncate max-w-[200px]" title={inv.errorDetails}>
                        {inv.errorDetails || "Lỗi truyền nhận"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {selectedInvoice && (
        <InvoiceDetailModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          currentRole={currentRole}
          onSendToTax={handleSendToTax}
          onResendToTax={handleResendToTax}
          onCancelInvoice={handleCancelInvoice}
          onUpdateInvoice={handleUpdateInvoice}
        />
      )}

      {/* Lock Day Confirmation Modal */}
      {showLockModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 animate-backdrop-fade-in"
          onClick={() => setShowLockModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-modal-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-extrabold text-slate-800 mb-4">
              Chốt đối chiếu ngày {date}
            </h3>
            <p className="text-xs text-slate-500 mb-3 font-medium">
              Nhập ghi chú chốt đối chiếu ngày (nếu có):
            </p>
            <textarea
              rows={3}
              value={lockNote}
              onChange={(e) => setLockNote(e.target.value)}
              placeholder="Ghi chú chốt ngày..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 focus:border-kv-blue-primary resize-none"
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => { setShowLockModal(false); setLockNote(""); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmLock}
                disabled={isLocking}
                className="px-4 py-2 text-xs font-bold text-white bg-kv-blue-primary rounded-lg hover:bg-kv-blue-dark transition-colors disabled:opacity-50"
              >
                {isLocking ? "Đang xử lý..." : "Chốt ngày"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
