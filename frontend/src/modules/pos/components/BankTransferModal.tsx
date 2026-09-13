import React, { useState } from "react";
import {
  CreditCard,
  X,
  AlertTriangle,
  QrCode,
  Banknote,
  ShieldCheck,
  Hash,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  useConfirmBankTransferMutation,
  useSwitchPaymentMethodMutation,
} from "@/modules/order/services/orderApi";

interface IBankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  amount: number;
  qrCodeUrl?: string | null;
  onConfirmSuccess: (transactionCode: string) => Promise<void>;
  onSwitchToCashSuccess: () => void;
  isCompletingOrder?: boolean;
}

export const BankTransferModal: React.FC<IBankTransferModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
  qrCodeUrl,
  onConfirmSuccess,
  onSwitchToCashSuccess,
  isCompletingOrder = false,
}) => {
  const [transactionCode, setTransactionCode] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const [confirmBankTransferApi, { isLoading: isConfirming }] = useConfirmBankTransferMutation();
  const [switchPaymentMethodApi, { isLoading: isSwitching }] = useSwitchPaymentMethodMutation();

  if (!isOpen) return null;

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // Confirm bank transfer (NCL-03-CN-012-TC-01)
  const handleConfirm = async () => {
    if (!transactionCode.trim()) {
      setErrorMessage("Vui lòng nhập Mã giao dịch ngân hàng hoặc 4 số cuối để đối soát!");
      return;
    }

    setErrorMessage(null);
    try {
      await confirmBankTransferApi({
        orderId,
        data: {
          transactionCode: transactionCode.trim(),
          notes: notes.trim() || "Xác nhận chuyển khoản tại POS",
        },
      }).unwrap();

      await onConfirmSuccess(transactionCode.trim());
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Xác nhận chuyển khoản thất bại. Vui lòng kiểm tra lại!";
      setErrorMessage(msg);
    }
  };

  // Switch to cash when customer cancels bank transfer (NCL-03-CN-012-TC-03)
  const handleSwitchToCash = async () => {
    setErrorMessage(null);
    try {
      await switchPaymentMethodApi({
        orderId,
        data: {
          newPaymentMethod: "CASH",
          amountGiven: amount,
          notes: "Khách đổi ý chuyển sang Tiền mặt",
        },
      }).unwrap();

      onSwitchToCashSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Đổi hình thức thanh toán thất bại. Vui lòng thử lại!";
      setErrorMessage(msg);
    }
  };

  const isBusy = isConfirming || isSwitching || isCompletingOrder;

  const displayOrderCode = orderNumber
    ? orderNumber.startsWith("Hóa đơn") || orderNumber.startsWith("Đơn")
      ? orderNumber
      : `Đơn #${orderNumber}`
    : "Đơn hàng mới";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-[480px] max-h-[92vh] overflow-hidden flex flex-col animate-modal-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base truncate">
                  Xác Nhận Chuyển Khoản
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  VietQR 24/7
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {displayOrderCode} • Quét mã & đối soát giao dịch
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Target Amount Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100 dark:border-blue-900/50 shadow-2xs flex items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Số tiền cần chuyển khoản
              </span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight block">
                {formatCurrency(amount)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyAmount}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs shrink-0"
              title="Sao chép số tiền"
            >
              {copiedAmount ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>

          {/* QR Code Container */}
          {qrCodeUrl ? (
            <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2">
              <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200/80">
                <img src={qrCodeUrl} alt="VietQR" className="w-40 h-40 sm:w-44 sm:h-44 object-contain mx-auto" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Khách quét mã bằng bất kỳ ứng dụng ngân hàng nào</span>
              </span>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-xl bg-slate-50/50 flex flex-col items-center gap-2">
              <span className="w-5 h-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span>Đang kết nối cổng ngân hàng để tải mã VietQR...</span>
            </div>
          )}

          {/* Inputs Section */}
          <div className="space-y-3 pt-1">
            {/* Transaction Code Input (Required) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mã giao dịch ngân hàng / 4 số cuối</span>
                  <span className="text-rose-500 font-black">*</span>
                </label>
                <span className="text-[10px] font-semibold text-slate-400">Bắt buộc</span>
              </div>
              <input
                type="text"
                disabled={isBusy}
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && transactionCode.trim() && !isBusy) {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                placeholder="Ví dụ: VCB123456, FT987654 hoặc 1234..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs"
                autoFocus
              />
              <p className="text-[10.5px] text-slate-400 dark:text-slate-500 leading-tight">
                💡 Thu ngân đối chiếu thông báo biến động số dư trên app ngân hàng trước khi xác nhận.
              </p>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Ghi chú đối soát (tùy chọn):</span>
              </label>
              <input
                type="text"
                disabled={isBusy}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Khách CK từ Techcombank, tên Nguyen Van A..."
                className="w-full bg-slate-50/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Structured Robust Footer (Never Breaks or Overlaps) */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 flex flex-col gap-2 shrink-0">
          {/* Row 1: Primary Action Button (Full-width, prominent, high-impact) */}
          <button
            type="button"
            disabled={!transactionCode.trim() || isBusy}
            onClick={handleConfirm}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none inline-flex items-center justify-center gap-2"
          >
            {isBusy ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>Đang xác nhận giao dịch...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4.5 h-4.5" />
                <span>Đã nhận đủ tiền • Xác nhận & Chốt đơn</span>
              </>
            )}
          </button>

          {/* Row 2: Secondary Alternative Actions (Clean 2-button row, well spaced) */}
          <div className="flex items-center gap-2.5 w-full">
            {/* Switch to Cash button */}
            <button
              type="button"
              disabled={isBusy}
              onClick={handleSwitchToCash}
              className="flex-1 py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 dark:text-amber-200 border border-amber-200 dark:border-amber-700/80 text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 truncate"
              title="Khách đổi ý muốn trả tiền mặt, hệ thống tự chuyển phương thức mà không cần tạo lại đơn"
            >
              <Banknote className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Khách đổi sang Tiền mặt</span>
            </button>

            {/* Cancel / Close button */}
            <button
              type="button"
              disabled={isBusy}
              onClick={onClose}
              className="py-2 px-4 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-all shrink-0"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankTransferModal;
