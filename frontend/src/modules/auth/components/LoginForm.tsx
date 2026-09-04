import React, { useState, useRef, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Form, Input, Alert, message } from "antd";
import type { AuthOutletContext } from "@/pages/AuthPage";
import { useLoginMutation } from "../services/authApi";
import { useAppDispatch } from "@/hooks/useRedux";
import { setCredentials } from "@/stores/authSlice";
import {
  AUTH_FORM_FIELDS,
  AUTH_MESSAGES,
  AUTH_VALIDATION,
  AUTH_VALIDATION_MESSAGES,
} from "@/constants/auth";
import { APP_ROUTES } from "@/constants/routes";
import { z } from "zod";
import { DemoAccountsPanel } from "./DemoAccountsPanel";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { recordFailedLoginAttempt } from "@/modules/anomaly_alert/utils/anomalyStorage";

const loginSchema = z.object({
  [AUTH_FORM_FIELDS.USERNAME]: z
    .string()
    .min(
      AUTH_VALIDATION.USERNAME_MIN_LENGTH,
      AUTH_VALIDATION_MESSAGES.USERNAME_MIN_LENGTH,
    ),
  [AUTH_FORM_FIELDS.PASSWORD]: z
    .string()
    .min(
      AUTH_VALIDATION.PASSWORD_MIN_LENGTH,
      AUTH_VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH,
    ),
});

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const outletContext = useOutletContext<AuthOutletContext | null>();
  const [form] = Form.useForm();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [isDemoExpanded, setIsDemoExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();

  const handleDemoExpandedChange = (expanded: boolean) => {
    setIsDemoExpanded(expanded);
    const el = cardRef.current?.parentElement;
    if (!el) return;

    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }

    if (expanded) {
      // Cố định vị trí top hiện tại để khi mở danh sách demo, form chỉ mở rộng trượt êm ái xuống dưới
      el.style.marginTop = `${el.offsetTop}px`;
      el.style.marginBottom = "auto";
    } else {
      // Đợi animation đóng 300ms hoàn tất rồi mới khôi phục căn giữa tự nhiên, tránh bị giật khung
      collapseTimerRef.current = setTimeout(() => {
        if (el) {
          el.style.marginTop = "";
          el.style.marginBottom = "";
        }
      }, 310);
    }
  };

  useEffect(() => {
    const el = cardRef.current?.parentElement;
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
      if (el) {
        el.style.marginTop = "";
        el.style.marginBottom = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!isDemoExpanded) return;

    const handleResize = () => {
      const el = cardRef.current?.parentElement;
      if (el) {
        el.style.marginTop = "";
        el.style.marginBottom = "";
        requestAnimationFrame(() => {
          if (el) {
            el.style.marginTop = `${el.offsetTop}px`;
            el.style.marginBottom = "auto";
          }
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDemoExpanded]);

  const handleFinish = async (formValues: unknown) => {
    setErrorMsg(null);
    const rawUsername =
      (formValues as Record<string, unknown>)?.[AUTH_FORM_FIELDS.USERNAME] as string ||
      (formValues as Record<string, unknown>)?.username as string ||
      "nguoidung";

    try {
      const parsedValues = loginSchema.parse(formValues);

      try {
        const response = await login(parsedValues).unwrap();
        if (outletContext?.triggerDoorOpening) {
          await outletContext.triggerDoorOpening();
        }
        dispatch(setCredentials(response));
        onSuccess();
      } catch (apiError: unknown) {
        const errMessage = getApiErrorMessage(apiError, AUTH_MESSAGES.LOGIN_FAILED);
        setErrorMsg(errMessage);
        // Ghi nhận cảnh báo đăng nhập thất bại bất thường
        recordFailedLoginAttempt(parsedValues.username, errMessage);
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const msg = error.issues[0]?.message ?? AUTH_MESSAGES.LOGIN_INVALID_DATA;
        setErrorMsg(msg);
        recordFailedLoginAttempt(rawUsername, msg);
      } else {
        const msg = getApiErrorMessage(error, AUTH_MESSAGES.LOGIN_FAILED);
        setErrorMsg(msg);
        recordFailedLoginAttempt(rawUsername, msg);
      }
    }
  };

  const handleDemoSelect = (username: string, password: string) => {
    form.setFieldsValue({
      [AUTH_FORM_FIELDS.USERNAME]: username,
      [AUTH_FORM_FIELDS.PASSWORD]: password,
    });
    form.submit();
  };

  return (
    <div
      ref={cardRef}
      className="w-full max-w-[540px] flex flex-col bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.03)] border border-slate-100 p-8 sm:p-10 transition-[box-shadow,border-color] duration-300"
    >
      {/* Greeting Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-[27px] font-bold text-slate-800 tracking-tight">
          Chào mừng trở lại!
        </h2>
        <p className="text-sm text-slate-400 mt-2 font-normal">
          Nhập thông tin đăng nhập của bạn để tiếp tục
        </p>
      </div>

      {errorMsg && (
        <Alert
          message={errorMsg}
          type="error"
          showIcon
          className="mb-4 rounded-xl border-red-200 bg-red-50/70 text-xs"
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
        className="flex flex-col"
      >
        {/* Username / Email Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Email hoặc Tên đăng nhập
          </label>
          <Form.Item
            name={AUTH_FORM_FIELDS.USERNAME}
            className="mb-0"
            rules={[
              {
                required: true,
                message: AUTH_VALIDATION_MESSAGES.USERNAME_REQUIRED,
              },
            ]}
          >
            <Input
              placeholder="yannxlu123@email.com / admin"
              className="h-12 rounded-xl bg-slate-50/60 border-slate-200 hover:border-blue-400 focus:border-[#0F56E8] focus:bg-white text-base text-slate-800 px-4 transition-all"
            />
          </Form.Item>
        </div>

        {/* Password Input */}
        <div className="mb-3">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Mật khẩu
          </label>
          <Form.Item
            name={AUTH_FORM_FIELDS.PASSWORD}
            className="mb-0"
            rules={[
              {
                required: true,
                message: AUTH_VALIDATION_MESSAGES.PASSWORD_REQUIRED,
              },
            ]}
          >
            <Input.Password
              placeholder="••••••••••••"
              className="h-12 rounded-xl bg-slate-50/60 border-slate-200 hover:border-blue-400 focus:border-[#0F56E8] focus:bg-white text-base text-slate-800 px-4 transition-all"
            />
          </Form.Item>
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between mt-2.5 mb-7 select-none">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 hover:text-slate-800">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#0F56E8] focus:ring-blue-400 cursor-pointer"
            />
            <span>Ghi nhớ tôi</span>
          </label>

          <button
            type="button"
            onClick={() =>
              message.info("Vui lòng liên hệ quản trị viên để hỗ trợ khôi phục mật khẩu.")
            }
            className="text-sm font-medium text-[#0F56E8] hover:text-blue-700 hover:underline transition-colors"
          >
            Quên mật khẩu?
          </button>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-[#0F56E8] hover:bg-[#0D4DCE] active:bg-[#0A3EB8] text-white font-semibold text-base shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2 text-sm">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Đang đăng nhập...
            </span>
          ) : (
            "Đăng nhập"
          )}
        </button>

        {/* Footer: Register link */}
        <div className="text-center text-sm text-slate-500 mt-6">
          Chưa có tài khoản?{" "}
          <Link
            to={APP_ROUTES.REGISTER}
            className="text-[#0F56E8] hover:text-blue-700 font-bold hover:underline transition-colors ml-1"
          >
            Đăng ký ngay
          </Link>
        </div>
      </Form>

      {/* Demo Accounts Panel (Tài khoản thử nghiệm nhanh) */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <DemoAccountsPanel
          onSelect={handleDemoSelect}
          onExpandedChange={handleDemoExpandedChange}
        />
      </div>
    </div>
  );
};

