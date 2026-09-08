import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Phone, X, Loader2, CheckCircle2, ArrowLeft, RefreshCw, ShieldCheck, Clock } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import { useAppDispatch } from "@/hooks/useRedux";
import { updateUser } from "@/stores/authSlice";
import {
  useSendUpdatePhoneOtpMutation,
  useVerifyAndUpdatePhoneMutation,
} from "../services/profileApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface UpdatePhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhoneNumber?: string | null;
}

export const UpdatePhoneModal: React.FC<UpdatePhoneModalProps> = ({
  isOpen,
  onClose,
  currentPhoneNumber,
}) => {
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useNotification();

  const [sendOtp, { isLoading: isSendingOtp }] = useSendUpdatePhoneOtpMutation();
  const [verifyAndUpdatePhone, { isLoading: isVerifying }] = useVerifyAndUpdatePhoneMutation();

  const [step, setStep] = useState<1 | 2>(1);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [expireSeconds, setExpireSeconds] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const isBusy = isSendingOtp || isVerifying;

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isBusy,
  });

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setNewPhoneNumber("");
      setOtpCode("");
      setError(null);
      setCooldownSeconds(0);
      setExpireSeconds(0);
    }
  }, [isOpen]);

  // Timer cooldown (60s)
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Timer expiry (300s = 5m)
  useEffect(() => {
    if (expireSeconds <= 0) return;
    const timer = setInterval(() => {
      setExpireSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [expireSeconds]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const validatePhone = (phone: string): boolean => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setError("Số điện thoại mới không được để trống");
      return false;
    }
    const phoneRegex = /^0[35789][0-9]{8}$/;
    if (!phoneRegex.test(trimmed)) {
      setError("Số điện thoại không đúng định dạng (10 số, bắt đầu bằng 03, 05, 07, 08, 09)");
      return false;
    }
    if (currentPhoneNumber && trimmed === currentPhoneNumber.trim()) {
      setError("Số điện thoại mới trùng với số điện thoại hiện tại");
      return false;
    }
    return true;
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validatePhone(newPhoneNumber) || isSendingOtp) return;

    try {
      const res = await sendOtp({ newPhoneNumber: newPhoneNumber.trim() }).unwrap();
      showSuccess(res.message || "Mã OTP đã được gửi đến số điện thoại mới");
      setStep(2);
      setError(null);
      setOtpCode("");
      setCooldownSeconds(60);
      setExpireSeconds(res.result?.expiresInSeconds || 300);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Không thể gửi mã OTP. Vui lòng kiểm tra lại.");
      setError(msg);
      showError(msg);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || isSendingOtp) return;
    try {
      const res = await sendOtp({ newPhoneNumber: newPhoneNumber.trim() }).unwrap();
      showSuccess(res.message || "Đã gửi lại mã OTP mới");
      setError(null);
      setOtpCode("");
      setCooldownSeconds(60);
      setExpireSeconds(res.result?.expiresInSeconds || 300);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Gửi lại OTP thất bại.");
      setError(msg);
      showError(msg);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOtp = otpCode.trim();

    if (!trimmedOtp) {
      setError("Mã xác thực không được để trống");
      return;
    }
    if (!/^[0-9]{6}$/.test(trimmedOtp)) {
      setError("Mã xác thực phải gồm 6 chữ số");
      return;
    }

    try {
      const res = await verifyAndUpdatePhone({
        newPhoneNumber: newPhoneNumber.trim(),
        otpCode: trimmedOtp,
      }).unwrap();

      if (res.result?.phoneNumber) {
        dispatch(updateUser({ phoneNumber: res.result.phoneNumber }));
      }

      showSuccess("Cập nhật số điện thoại thành công");
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Xác thực OTP không thành công.");
      setError(msg);
      showError(msg);
    }
  };

  return createPortal(
    <div
      onClick={() => {
        if (!isBusy) onClose();
      }}
      className="app-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:items-center sm:p-4 animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-phone-title"
        className="app-modal-panel flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-kv-blue-primary px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Phone size={18} className="text-white/90" />
            <h2 id="update-phone-title" className="text-sm font-bold uppercase tracking-wider">
              {step === 1 ? "Cập nhật số điện thoại" : "Xác thực mã OTP"}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            disabled={isBusy}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Input Phone */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col p-6 gap-4">
            {currentPhoneNumber && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="text-slate-500 font-medium">Số điện thoại hiện tại:</span>
                <span className="font-extrabold text-slate-700 font-mono">
                  {currentPhoneNumber}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-phone-input" className="text-xs font-bold text-slate-700">
                Số điện thoại mới <span className="text-rose-500">*</span>
              </label>
              <input
                id="new-phone-input"
                type="tel"
                value={newPhoneNumber}
                onChange={(e) => {
                  setNewPhoneNumber(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ví dụ: 0912345678"
                maxLength={10}
                autoFocus
                disabled={isSendingOtp}
                className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border font-mono transition-colors outline-none ${
                  error
                    ? "border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 bg-white focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                }`}
              />
              {error ? (
                <span className="text-xs text-rose-500 font-medium">{error}</span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Hệ thống sẽ gửi mã OTP 6 số để xác thực bạn là chủ sở hữu số này.
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSendingOtp}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSendingOtp}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-kv-blue-primary hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang gửi OTP...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    Gửi mã OTP
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col p-6 gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Mã OTP gửi đến: </span>
                <span className="font-extrabold text-kv-blue-primary font-mono ml-1">
                  {newPhoneNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
                disabled={isBusy}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Đổi số
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="otp-input" className="text-xs font-bold text-slate-700">
                  Nhập mã OTP (6 số) <span className="text-rose-500">*</span>
                </label>
                {expireSeconds > 0 ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 font-mono">
                    <Clock size={12} />
                    Hiệu lực: {formatTime(expireSeconds)}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                    <Clock size={12} />
                    Đã hết hạn
                  </span>
                )}
              </div>

              <input
                id="otp-input"
                type="text"
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setOtpCode(val);
                  if (error) setError(null);
                }}
                placeholder="------"
                maxLength={6}
                autoFocus
                disabled={isBusy}
                className={`w-full text-center text-xl tracking-[0.4em] font-extrabold py-2.5 rounded-xl border font-mono transition-colors outline-none ${
                  error
                    ? "border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 bg-white focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                }`}
              />
              {error && (
                <span className="text-xs text-rose-500 font-medium text-center">{error}</span>
              )}
            </div>

            {/* Resend OTP button */}
            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldownSeconds > 0 || isBusy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-kv-blue-primary hover:text-blue-800 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={12} className={isSendingOtp ? "animate-spin" : ""} />
                {cooldownSeconds > 0
                  ? `Gửi lại mã sau (${cooldownSeconds}s)`
                  : "Chưa nhận được mã? Gửi lại"}
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft size={14} />
                Quay lại
              </button>
              <button
                type="submit"
                disabled={isBusy || otpCode.length !== 6 || expireSeconds <= 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-kv-blue-primary hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Xác thực & Lưu
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default UpdatePhoneModal;
