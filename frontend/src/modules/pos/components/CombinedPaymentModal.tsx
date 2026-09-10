import React, { useState, useMemo, useEffect } from "react";
import {
  Banknote,
  CreditCard,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  QrCode,
  Calendar,
  User,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import type { ICustomer } from "@/modules/customer/types/ICustomer";
import type { IOrderPaymentRequest } from "@/modules/order/types/IOrder";
import { useConfirmBankTransferMutation } from "@/modules/order/services/orderApi";

interface ICombinedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  finalTotal: number;
  orderNumber?: string;
  orderId?: string;
  qrCodeUrl?: string | null;
  customer?: ICustomer | null;
  initialPayments?: IOrderPaymentRequest[];
  initialDueDate?: string;
  onConfirmAndComplete: (payments: IOrderPaymentRequest[], dueDate?: string) => Promise<void>;
  isCompleting?: boolean;
}

interface IActivePaymentRow {
  paymentMethod: "CASH" | "BANK_TRANSFER" | "DEBT";
  amount: number;
  amountGiven?: number;
  transactionCode?: string;
  isConfirmed?: boolean;
  notes?: string;
}

export const CombinedPaymentModal: React.FC<ICombinedPaymentModalProps> = ({
  isOpen,
  onClose,
  finalTotal,
  orderNumber,
  orderId,
  qrCodeUrl,
  customer,
  initialPayments,
  initialDueDate,
  onConfirmAndComplete,
  isCompleting = false,
}) => {
  // Confirm bank transfer mutation from RTK Query
  const [confirmBankTransferApi, { isLoading: isConfirmingBank }] = useConfirmBankTransferMutation();

  // Due date state for DEBT (default 7 days from now)
  const [dueDate, setDueDate] = useState<string>(() => {
    if (initialDueDate) return initialDueDate.split("T")[0];
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });

  // Active payment rows
  const [paymentRows, setPaymentRows] = useState<IActivePaymentRow[]>(() => {
    if (initialPayments && initialPayments.length > 0) {
      return initialPayments.map((p) => ({
        paymentMethod: p.paymentMethod,
        amount: p.amount,
        amountGiven: p.amountGiven ?? p.amount,
        transactionCode: p.transactionCode || "",
        isConfirmed: Boolean(p.isConfirmed),
        notes: p.notes || "",
      }));
    }
    const half = Math.floor(finalTotal / 2);
    return [
      {
        paymentMethod: "CASH",
        amount: half,
        amountGiven: half,
        isConfirmed: true,
      },
      {
        paymentMethod: "BANK_TRANSFER",
        amount: Math.max(0, finalTotal - half),
        isConfirmed: false,
        transactionCode: "",
      },
    ];
  });

  // Synchronize initial state when modal opens or finalTotal changes
  useEffect(() => {
    if (isOpen) {
      if (initialPayments && initialPayments.length > 0) {
        setPaymentRows(
          initialPayments.map((p) => ({
            paymentMethod: p.paymentMethod,
            amount: p.amount,
            amountGiven: p.amountGiven ?? p.amount,
            transactionCode: p.transactionCode || "",
            isConfirmed: Boolean(p.isConfirmed),
            notes: p.notes || "",
          }))
        );
      } else {
        const half = Math.floor(finalTotal / 2);
        setPaymentRows([
          {
            paymentMethod: "CASH",
            amount: half,
            amountGiven: half,
            isConfirmed: true,
          },
          {
            paymentMethod: "BANK_TRANSFER",
            amount: Math.max(0, finalTotal - half),
            isConfirmed: false,
            transactionCode: "",
          },
        ]);
      }
    }
  }, [isOpen, finalTotal, initialPayments]);

  // QR Modal toggle inside bank row
  const [showQrForTransfer, setShowQrForTransfer] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Calculations
  const sumAllocated = useMemo(() => {
    return paymentRows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  }, [paymentRows]);

  const difference = useMemo(() => {
    return finalTotal - sumAllocated;
  }, [finalTotal, sumAllocated]);

  const isMatched = Math.abs(difference) === 0;

  function getMethodLabel(method: "CASH" | "BANK_TRANSFER" | "DEBT"): string {
    switch (method) {
      case "CASH":
        return "Tiền mặt";
      case "BANK_TRANSFER":
        return "Chuyển khoản";
      case "DEBT":
        return "Ghi nợ";
    }
  }

  // Check validation rules
  const validationIssues = useMemo(() => {
    const issues: string[] = [];

    if (paymentRows.length === 0) {
      issues.push("Cần ít nhất một phương thức thanh toán.");
    }

    if (difference > 0) {
      issues.push(`Còn thiếu ${formatCurrency(difference)} chưa được phân bổ (QTN-03).`);
    } else if (difference < 0) {
      issues.push(`Đã phân bổ vượt quá ${formatCurrency(Math.abs(difference))} so với tổng tiền phải trả (QTN-07).`);
    }

    for (const row of paymentRows) {
      if (!row.amount || row.amount <= 0) {
        issues.push(`Số tiền thanh toán cho dòng ${getMethodLabel(row.paymentMethod)} phải lớn hơn 0.`);
      }

      if (row.paymentMethod === "CASH") {
        const given = row.amountGiven ?? row.amount;
        if (given < row.amount) {
          issues.push(`Tiền mặt khách đưa (${formatCurrency(given)}) nhỏ hơn số tiền thanh toán (${formatCurrency(row.amount)}).`);
        }
      }

      if (row.paymentMethod === "BANK_TRANSFER") {
        if (!row.isConfirmed) {
          issues.push("Phần chuyển khoản ngân hàng chưa được xác nhận đã nhận tiền (NCL-03-CN-012).");
        }
      }

      if (row.paymentMethod === "DEBT") {
        if (!customer) {
          issues.push("Cần chọn khách hàng tại màn hình POS trước khi áp dụng ghi nợ (QTN-13).");
        } else {
          const currentDebt = customer.debt || 0;
          const limit = customer.creditLimit || 5000000;
          if (currentDebt + row.amount > limit) {
            issues.push(
              `Khách hàng "${customer.name}" sẽ vượt hạn mức nợ (${formatCurrency(currentDebt + row.amount)} / ${formatCurrency(limit)}).`
            );
          }
        }
      }
    }

    return issues;
  }, [paymentRows, difference, customer]);

  const canSubmit = validationIssues.length === 0 && !isCompleting;

  // Row operations
  const handleAmountChange = (index: number, newAmount: number) => {
    setPaymentRows((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const sanitized = Math.max(0, newAmount);
      updated[index] = {
        ...target,
        amount: sanitized,
        amountGiven: target.paymentMethod === "CASH" && (target.amountGiven || 0) < sanitized
          ? sanitized
          : target.amountGiven,
      };
      return updated;
    });
  };

  const handleFillRemainder = (index: number) => {
    setPaymentRows((prev) => {
      const otherSum = prev.reduce((acc, r, i) => (i === index ? acc : acc + (r.amount || 0)), 0);
      const remainder = Math.max(0, finalTotal - otherSum);
      const updated = [...prev];
      const target = updated[index];
      updated[index] = {
        ...target,
        amount: remainder,
        amountGiven: target.paymentMethod === "CASH" ? Math.max(target.amountGiven || 0, remainder) : target.amountGiven,
      };
      return updated;
    });
  };

  const handleAddMethod = (method: "CASH" | "BANK_TRANSFER" | "DEBT") => {
    if (paymentRows.some((r) => r.paymentMethod === method)) return;

    const remaining = Math.max(0, finalTotal - sumAllocated);
    const newRow: IActivePaymentRow = {
      paymentMethod: method,
      amount: remaining,
      amountGiven: method === "CASH" ? remaining : undefined,
      isConfirmed: method !== "BANK_TRANSFER",
      transactionCode: "",
    };

    setPaymentRows((prev) => [...prev, newRow]);
  };

  const handleRemoveMethod = (index: number) => {
    if (paymentRows.length <= 1) return;
    setPaymentRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Confirm Bank Transfer via Backend API (NCL-03-CN-012)
  const handleConfirmBankTransfer = async (index: number) => {
    const row = paymentRows[index];
    if (!row.transactionCode || !row.transactionCode.trim()) {
      setConfirmError("Vui lòng nhập Mã giao dịch ngân hàng để xác nhận đối soát!");
      return;
    }

    if (!orderId) {
      setConfirmError("Đơn hàng chưa có mã trên hệ thống. Vui lòng lưu nháp đơn trước!");
      return;
    }

    setConfirmError(null);
    try {
      await confirmBankTransferApi({
        orderId,
        data: {
          transactionCode: row.transactionCode.trim(),
          notes: row.notes?.trim() || "Xác nhận chuyển khoản tại POS (NCL-03-CN-012)",
        },
      }).unwrap();

      setPaymentRows((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          isConfirmed: true,
        };
        return updated;
      });
    } catch (err: unknown) {
      const errorMsg = (err as { data?: { message?: string } })?.data?.message || "Xác nhận chuyển khoản thất bại. Vui lòng thử lại!";
      setConfirmError(errorMsg);
    }
  };

  // Submit complete order
  const handleSubmit = async () => {
    if (!canSubmit) return;

    const payloadPayments: IOrderPaymentRequest[] = paymentRows.map((r) => ({
      paymentMethod: r.paymentMethod,
      amount: r.amount,
      amountGiven: r.paymentMethod === "CASH" ? (r.amountGiven ?? r.amount) : undefined,
      transactionCode: r.paymentMethod === "BANK_TRANSFER" ? r.transactionCode?.trim() : undefined,
      isConfirmed: r.paymentMethod === "BANK_TRANSFER" ? true : true,
      notes: r.notes?.trim() || undefined,
    }));

    const hasDebt = paymentRows.some((r) => r.paymentMethod === "DEBT");
    const effectiveDueDate = hasDebt && dueDate ? `${dueDate}T23:59:59` : undefined;

    await onConfirmAndComplete(payloadPayments, effectiveDueDate);
  };

  if (!isOpen) return null;

  const availableMethods: Array<"CASH" | "BANK_TRANSFER" | "DEBT"> = ["CASH", "BANK_TRANSFER", "DEBT"];
  const unselectedMethods = availableMethods.filter((m) => !paymentRows.some((r) => r.paymentMethod === m));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCompleting) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-modal-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Compact) */}
        <div className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                  Thanh Toán Kết Hợp Nhiều Hình Thức
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                  NCL-03-CN-011
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {orderNumber ? `Đơn hàng ${orderNumber}` : "Tách thanh toán linh hoạt"}
                {customer ? ` • Khách: ${customer.name}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isCompleting}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Compact spacing) */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
          {/* Target Amount & Status Bar */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Cần thanh toán:
                </span>
                <span className="text-base sm:text-lg font-black text-[#0070f4] dark:text-blue-400">
                  {formatCurrency(finalTotal)}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <div className="flex items-baseline gap-1">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Đã phân bổ:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {formatCurrency(sumAllocated)}
                  </span>
                </div>

                <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-600" />

                {isMatched ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã đủ 100%
                  </span>
                ) : difference > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                    Thiếu: -{formatCurrency(difference)}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                    Thừa: +{formatCurrency(Math.abs(difference))}
                  </span>
                )}
              </div>
            </div>

            {/* Slim Allocation Progress Bar */}
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              {paymentRows.map((row, idx) => {
                const pct = finalTotal > 0 ? Math.min(100, ((row.amount || 0) / finalTotal) * 100) : 0;
                const colors = {
                  CASH: "bg-emerald-500",
                  BANK_TRANSFER: "bg-blue-500",
                  DEBT: "bg-amber-500",
                };
                return (
                  <div
                    key={`${row.paymentMethod}-${idx}`}
                    style={{ width: `${pct}%` }}
                    className={`${colors[row.paymentMethod]} transition-all duration-300`}
                    title={`${getMethodLabel(row.paymentMethod)}: ${formatCurrency(row.amount)}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Unified Payment Form (1 ô Tiền mặt, 1 ô Chuyển khoản, cực kỳ gọn gàng) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-3.5 space-y-3">
            {paymentRows.map((row, index) => {
              const isCash = row.paymentMethod === "CASH";
              const isBank = row.paymentMethod === "BANK_TRANSFER";
              const isDebt = row.paymentMethod === "DEBT";

              return (
                <div
                  key={`${row.paymentMethod}-${index}`}
                  className="space-y-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-700/80 last:border-b-0 last:pb-0"
                >
                  {/* Main Input Row: Label on Left, 1 Single Input + [Điền còn lại] on Right */}
                  <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2 min-w-[130px]">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isCash
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : isBank
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {isCash ? (
                          <Banknote className="w-4 h-4" />
                        ) : isBank ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                          {getMethodLabel(row.paymentMethod)}
                        </span>
                        {isBank && (
                          <span
                            className={`ml-1.5 text-[9px] font-black px-1.5 py-0.2 rounded border ${
                              row.isConfirmed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                            }`}
                          >
                            {row.isConfirmed ? "Đã đối soát" : "Chờ xác nhận"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <div className="relative w-full max-w-[220px]">
                        <input
                          type="text"
                          inputMode="numeric"
                          role="spinbutton"
                          aria-valuenow={row.amount || 0}
                          value={row.amount ? formatNumber(row.amount) : "0"}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const rawVal = e.target.value.replace(/\D/g, "");
                            handleAmountChange(index, rawVal ? Number(rawVal) : 0);
                          }}
                          className={`w-full h-9 bg-white dark:bg-slate-900 border rounded-lg pl-6 pr-2.5 text-sm font-extrabold text-slate-800 dark:text-slate-100 text-right focus:outline-none focus:ring-2 shadow-xs ${
                            isCash
                              ? "border-emerald-300 focus:ring-emerald-400 dark:border-emerald-700"
                              : isBank
                              ? "border-blue-300 focus:ring-blue-400 dark:border-blue-700"
                              : "border-amber-300 focus:ring-amber-400 dark:border-amber-700"
                          }`}
                        />
                        <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">₫</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFillRemainder(index)}
                        className="h-9 px-2.5 rounded-lg bg-slate-200/70 hover:bg-blue-100 hover:text-blue-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 text-xs font-bold transition-all whitespace-nowrap shrink-0"
                        title="Điền toàn bộ số tiền còn thiếu vào dòng này"
                      >
                        Điền số còn lại
                      </button>

                      {isDebt && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMethod(index)}
                          className="h-9 w-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors shrink-0"
                          title="Xóa ghi nợ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bank Transfer Subline: Mã GD & Xác nhận (khi số tiền CK > 0) */}
                  {isBank && row.amount > 0 && (
                    <div className="pt-1.5 pl-9 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-1 shrink-0">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            Mã GD <span className="text-rose-500">*</span>:
                          </label>
                          {qrCodeUrl && (
                            <button
                              type="button"
                              onClick={() => setShowQrForTransfer((prev) => !prev)}
                              className="text-[10px] font-bold text-[#0070f4] hover:underline inline-flex items-center gap-0.5 ml-1"
                            >
                              <QrCode className="w-3 h-3" />
                              <span>{showQrForTransfer ? "Ẩn QR" : "Hiện QR"}</span>
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          disabled={row.isConfirmed}
                          value={row.transactionCode || ""}
                          onChange={(e) => {
                            const code = e.target.value;
                            setPaymentRows((prev) => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], transactionCode: code };
                              return updated;
                            });
                          }}
                          placeholder="Ví dụ: VCB123456 hoặc FT987654"
                          className="flex-1 min-w-[160px] h-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 shadow-2xs"
                        />

                        {!row.isConfirmed ? (
                          <button
                            type="button"
                            disabled={isConfirmingBank || !row.transactionCode?.trim()}
                            onClick={() => handleConfirmBankTransfer(index)}
                            className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs transition-all shadow-2xs disabled:opacity-40 whitespace-nowrap shrink-0"
                          >
                            {isConfirmingBank ? "Đang lưu..." : "Xác nhận nhận tiền"}
                          </button>
                        ) : (
                          <div className="h-8 px-2.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-bold inline-flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã xác nhận tiền</span>
                          </div>
                        )}
                      </div>

                      {/* Bank QR Code Preview (Compact) */}
                      {showQrForTransfer && qrCodeUrl && (
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 flex items-center gap-3 mt-1">
                          <img src={qrCodeUrl} alt="VietQR" className="w-20 h-20 object-contain bg-white p-1 rounded border border-slate-200" />
                          <div className="text-xs space-y-0.5 text-slate-600 dark:text-slate-300">
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">Mã VietQR chuyển khoản</p>
                            <p className="text-[11px]">Số tiền: <strong className="text-[#0070f4]">{formatCurrency(row.amount)}</strong></p>
                            <p className="text-[10px] text-slate-400">Kiểm tra thông báo số dư trước khi bấm xác nhận.</p>
                          </div>
                        </div>
                      )}

                      {confirmError && (
                        <p className="text-[11px] font-semibold text-rose-600">{confirmError}</p>
                      )}
                    </div>
                  )}

                  {/* Debt Subline: Hạn trả & Hồ sơ khách */}
                  {isDebt && (
                    <div className="pt-1.5 pl-9 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          Hạn trả nợ:
                        </label>
                        <div className="relative max-w-[180px] w-full">
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full h-7.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <Calendar className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {customer ? (
                        <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Khách: <strong>{customer.name}</strong> • Nợ cũ: <strong>{formatCurrency(customer.debt || 0)}</strong> • Hạn mức: <strong>{formatCurrency(customer.creditLimit || 5000000)}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-800 font-bold">
                          Chưa chọn khách hàng! Ghi nợ yêu cầu có hồ sơ khách hàng (QTN-13).
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Optional Debt Toggle Button */}
            {unselectedMethods.includes("DEBT") && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleAddMethod("DEBT")}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-amber-600" />
                  <span>Ghi nợ</span>
                </button>
              </div>
            )}
          </div>



          {/* Validation Warnings Box (Compact) */}
          {validationIssues.length > 0 && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-0.5">
              <div className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-100">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Ràng buộc thanh toán chưa thỏa mãn:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 font-medium text-[11px] pl-1">
                {validationIssues.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {canSubmit && (
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-bold text-[11px]">
                Đã khớp 100% số tiền đơn hàng ({formatCurrency(finalTotal)}). Sẵn sàng chốt đơn!
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer (Compact) */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            Nhấn <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded text-[10px]">F9</kbd> hoặc bấm Hoàn tất để chốt đơn
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isCompleting}
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
            >
              Đóng
            </button>

            <button
              type="button"
              disabled={!canSubmit || isCompleting}
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#0070f4] hover:bg-blue-600 active:scale-95 text-white font-extrabold text-xs transition-all shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
            >
              {isCompleting ? (
                <>Đang xử lý chốt đơn...</>
              ) : (
                <>
                  <span>Xác nhận & Chốt đơn (F9)</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedPaymentModal;
