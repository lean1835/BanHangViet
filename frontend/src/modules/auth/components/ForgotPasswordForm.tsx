import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Alert, message } from "antd";
import { KeyRound, Mail, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";
import { z } from "zod";
import {
  AUTH_FORM_FIELDS,
  AUTH_MESSAGES,
  AUTH_VALIDATION,
  AUTH_VALIDATION_MESSAGES,
} from "@/constants/auth";
import { APP_ROUTES } from "@/constants/routes";
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "../services/authApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

// Validation schemas with Zod
const stepOneSchema = z.object({
  [AUTH_FORM_FIELDS.EMAIL]: z
    .string()
    .trim()
    .min(1, AUTH_VALIDATION_MESSAGES.GMAIL_REQUIRED)
    .regex(
      AUTH_VALIDATION.GMAIL_PATTERN,
      AUTH_VALIDATION_MESSAGES.GMAIL_INVALID,
    ),
});

const stepTwoSchema = z
  .object({
    [AUTH_FORM_FIELDS.OTP_CODE]: z
      .string()
      .trim()
      .min(1, AUTH_VALIDATION_MESSAGES.OTP_REQUIRED)
      .length(
        AUTH_VALIDATION.OTP_LENGTH,
        AUTH_VALIDATION_MESSAGES.OTP_INVALID_LENGTH,
      ),
    [AUTH_FORM_FIELDS.NEW_PASSWORD]: z
      .string()
      .min(
        AUTH_VALIDATION.PASSWORD_MIN_LENGTH,
        AUTH_VALIDATION_MESSAGES.NEW_PASSWORD_MIN_LENGTH,
      ),
    [AUTH_FORM_FIELDS.CONFIRM_PASSWORD]: z
      .string()
      .min(1, AUTH_VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED),
  })
  .refine(
    (data) =>
      data[AUTH_FORM_FIELDS.NEW_PASSWORD] ===
      data[AUTH_FORM_FIELDS.CONFIRM_PASSWORD],
    {
      message: AUTH_VALIDATION_MESSAGES.PASSWORD_MISMATCH,
      path: [AUTH_FORM_FIELDS.CONFIRM_PASSWORD],
    },
  );

type Step = 1 | 2 | 3;

export const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [formStepOne] = Form.useForm();
  const [formStepTwo] = Form.useForm();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [email, setEmail] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3);

  const [forgotPassword, { isLoading: isSendingOtp }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cooldown countdown effect for Resend OTP (60s)
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cooldown]);

  // Success redirect countdown effect
  useEffect(() => {
    if (currentStep === 3) {
      if (redirectCountdown > 0) {
        redirectTimerRef.current = setTimeout(() => {
          setRedirectCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        navigate(APP_ROUTES.LOGIN);
      }
    }
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [currentStep, redirectCountdown, navigate]);

  // Bước 1: Yêu cầu gửi mã xác thực OTP qua Gmail
  const handleSendOtp = async (values: unknown) => {
    setErrorMsg(null);
    try {
      const parsed = stepOneSchema.parse(values);
      const targetEmail = parsed[AUTH_FORM_FIELDS.EMAIL];

      const res = await forgotPassword({ email: targetEmail }).unwrap();
      setEmail(targetEmail);
      setCooldown(60); // 60s cooldown chống spam
      setCurrentStep(2);
      message.success(res.message || AUTH_MESSAGES.FORGOT_PASSWORD_SUCCESS);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        setErrorMsg(err.issues[0]?.message || AUTH_MESSAGES.FORGOT_PASSWORD_FAILED);
      } else {
        setErrorMsg(
          getApiErrorMessage(err, AUTH_MESSAGES.FORGOT_PASSWORD_FAILED),
        );
      }
    }
  };

  // Gửi lại mã OTP trong Bước 2
  const handleResendOtp = async () => {
    if (cooldown > 0 || !email) return;
    setErrorMsg(null);
    try {
      const res = await forgotPassword({ email }).unwrap();
      setCooldown(60);
      message.success(res.message || AUTH_MESSAGES.FORGOT_PASSWORD_SUCCESS);
    } catch (err: unknown) {
      setErrorMsg(
        getApiErrorMessage(err, AUTH_MESSAGES.FORGOT_PASSWORD_FAILED),
      );
    }
  };

  // Bước 2: Xác nhận OTP và đặt mật khẩu mới
  const handleResetPassword = async (values: unknown) => {
    setErrorMsg(null);
    try {
      const parsed = stepTwoSchema.parse(values);

      await resetPassword({
        email,
        otpCode: parsed[AUTH_FORM_FIELDS.OTP_CODE],
        newPassword: parsed[AUTH_FORM_FIELDS.NEW_PASSWORD],
        confirmPassword: parsed[AUTH_FORM_FIELDS.CONFIRM_PASSWORD],
      }).unwrap();

      setCurrentStep(3);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        setErrorMsg(err.issues[0]?.message || AUTH_MESSAGES.RESET_PASSWORD_FAILED);
      } else {
        setErrorMsg(
          getApiErrorMessage(err, AUTH_MESSAGES.RESET_PASSWORD_FAILED),
        );
      }
    }
  };

  const handleBackToStepOne = () => {
    setCurrentStep(1);
    setErrorMsg(null);
  };

  return (
    <div className="w-full max-w-[540px] flex flex-col bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.03)] border border-slate-100 p-8 sm:p-10 transition-[box-shadow,border-color] duration-300">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-[#0F56E8] mb-3 shadow-inner">
          <KeyRound className="w-7 h-7" strokeWidth={2.2} />
        </div>
        <h2 className="text-2xl sm:text-[27px] font-bold text-slate-800 tracking-tight">
          {currentStep === 3 ? "Đổi mật khẩu thành công!" : "Đặt lại mật khẩu"}
        </h2>
        <p className="text-sm text-slate-400 mt-1.5 font-normal">
          {currentStep === 1 && "Nhập địa chỉ Gmail đã đăng ký để nhận mã xác thực OTP"}
          {currentStep === 2 && "Nhập mã xác thực và thiết lập mật khẩu mới"}
          {currentStep === 3 && "Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ"}
        </p>

        {/* Step Indicator */}
        {currentStep !== 3 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep === 1
                  ? "w-8 bg-[#0F56E8]"
                  : "w-2.5 bg-blue-200"
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep === 2
                  ? "w-8 bg-[#0F56E8]"
                  : "w-2.5 bg-slate-200"
              }`}
            />
          </div>
        )}
      </div>

      {errorMsg && (
        <Alert
          message={errorMsg}
          type="error"
          showIcon
          className="mb-4 rounded-xl border-red-200 bg-red-50/70 text-xs text-red-700"
        />
      )}

      {/* ===================== BƯỚC 1: NHẬP ĐỊA CHỈ GMAIL ===================== */}
      {currentStep === 1 && (
        <Form
          form={formStepOne}
          layout="vertical"
          onFinish={handleSendOtp}
          requiredMark={false}
          className="flex flex-col"
          initialValues={{ [AUTH_FORM_FIELDS.EMAIL]: email }}
        >
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Địa chỉ Gmail đã đăng ký
            </label>
            <Form.Item
              name={AUTH_FORM_FIELDS.EMAIL}
              className="mb-0"
              rules={[
                {
                  required: true,
                  message: AUTH_VALIDATION_MESSAGES.GMAIL_REQUIRED,
                },
              ]}
            >
              <Input
                prefix={<Mail className="w-4 h-4 text-slate-400 mr-1.5" />}
                placeholder="Ví dụ: taikhoan@gmail.com"
                autoFocus
                className="h-12 rounded-xl bg-slate-50/60 border-slate-200 hover:border-blue-400 focus:border-[#0F56E8] focus:bg-white text-base text-slate-800 px-4 transition-all"
              />
            </Form.Item>
            <p className="text-xs text-slate-400 mt-2">
              Mã xác thực một lần (OTP) có hiệu lực trong 5 phút sẽ được gửi đến hộp thư Gmail này.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSendingOtp}
            className="w-full h-12 mt-2 rounded-xl bg-[#0F56E8] hover:bg-[#0D4DCE] active:bg-[#0A3EB8] text-white font-semibold text-base shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
          >
            {isSendingOtp ? (
              <span className="inline-flex items-center gap-2 text-sm">
                <RefreshCw className="animate-spin w-5 h-5 text-white" />
                Đang gửi mã...
              </span>
            ) : (
              "Gửi mã xác thực về Gmail"
            )}
          </button>

          <div className="text-center mt-6">
            <Link
              to={APP_ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F56E8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </Form>
      )}

      {/* ===================== BƯỚC 2: NHẬP OTP & ĐẶT MẬT KHẨU MỚI ===================== */}
      {currentStep === 2 && (
        <Form
          form={formStepTwo}
          layout="vertical"
          onFinish={handleResetPassword}
          requiredMark={false}
          className="flex flex-col"
        >
          {/* Badge thông tin Gmail */}
          <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-xl p-3 mb-4 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-[#0F56E8]" />
              <span>Mã OTP đã gửi đến Gmail: <strong className="text-slate-900">{email}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleBackToStepOne}
              className="text-xs font-semibold text-[#0F56E8] hover:underline cursor-pointer"
            >
              Đổi Gmail khác
            </button>
          </div>

          {/* Ô nhập mã OTP */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">
                Mã xác thực OTP (6 chữ số)
              </label>
              <button
                type="button"
                disabled={cooldown > 0 || isSendingOtp}
                onClick={handleResendOtp}
                className="text-xs font-medium text-[#0F56E8] hover:text-blue-700 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Gửi lại sau (${cooldown}s)` : "Gửi lại mã OTP"}
              </button>
            </div>
            <Form.Item
              name={AUTH_FORM_FIELDS.OTP_CODE}
              className="mb-0"
              rules={[
                {
                  required: true,
                  message: AUTH_VALIDATION_MESSAGES.OTP_REQUIRED,
                },
              ]}
            >
              <Input
                placeholder="123456"
                maxLength={6}
                autoFocus
                className="h-12 rounded-xl bg-slate-50/60 border-slate-200 hover:border-blue-400 focus:border-[#0F56E8] focus:bg-white text-lg font-semibold tracking-widest text-center text-slate-800 px-4 transition-all"
              />
            </Form.Item>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Mã xác thực 6 chữ số đã được gửi tới hòm thư Gmail của bạn. Vui lòng kiểm tra cả hộp thư chính và thư rác (Spam).
            </p>
          </div>

          {/* Ô Mật khẩu mới */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mật khẩu mới
            </label>
            <Form.Item
              name={AUTH_FORM_FIELDS.NEW_PASSWORD}
              className="mb-0"
              rules={[
                {
                  required: true,
                  message: AUTH_VALIDATION_MESSAGES.NEW_PASSWORD_REQUIRED,
                },
              ]}
            >
              <Input.Password
                placeholder="Tối thiểu 6 ký tự"
                className="h-12 rounded-xl bg-slate-50/60 border-slate-200 hover:border-blue-400 focus:border-[#0F56E8] focus:bg-white text-base text-slate-800 px-4 transition-all"
              />
            </Form.Item>
          </div>

          {/* Ô Xác nhận mật khẩu mới */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Xác nhận mật khẩu mới
            </label>
            <Form.Item
              name={AUTH_FORM_FIELDS.CONFIRM_PASSWORD}
              className="mb-0"
              rules={[
                {
                  required: true,
                  message: AUTH_VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED,
                },
              ]}
            >
              <Input.Password
                placeholder="Nhập lại mật khẩu mới"
                className="h-12 rounded-xl bg-slate-50/60 border-slate-200 hover:border-blue-400 focus:border-[#0F56E8] focus:bg-white text-base text-slate-800 px-4 transition-all"
              />
            </Form.Item>
          </div>

          <button
            type="submit"
            disabled={isResetting}
            className="w-full h-12 mt-2 rounded-xl bg-[#0F56E8] hover:bg-[#0D4DCE] active:bg-[#0A3EB8] text-white font-semibold text-base shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
          >
            {isResetting ? (
              <span className="inline-flex items-center gap-2 text-sm">
                <RefreshCw className="animate-spin w-5 h-5 text-white" />
                Đang xử lý...
              </span>
            ) : (
              "Xác nhận đổi mật khẩu"
            )}
          </button>

          <div className="text-center mt-6">
            <Link
              to={APP_ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F56E8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Hủy và quay lại đăng nhập
            </Link>
          </div>
        </Form>
      )}

      {/* ===================== BƯỚC 3: THÀNH CÔNG ===================== */}
      {currentStep === 3 && (
        <div className="flex flex-col items-center text-center py-4 animate-card-reveal">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Mật khẩu đã được đặt lại thành công!
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
            Tất cả các phiên đăng nhập cũ đã được kết thúc an toàn. Vui lòng đăng nhập lại với mật khẩu mới.
          </p>

          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.LOGIN)}
            className="w-full h-12 rounded-xl bg-[#0F56E8] hover:bg-[#0D4DCE] text-white font-semibold text-base shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Đăng nhập ngay ({redirectCountdown}s)
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordForm;

