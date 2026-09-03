import React, { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Form, Input, Alert } from "antd";
import type { AuthOutletContext } from "@/pages/AuthPage";
import { useRegisterMutation } from "../services/authApi";
import { useAppDispatch } from "@/hooks/useRedux";
import { setCredentials } from "@/stores/authSlice";
import {
  AUTH_FORM_FIELDS,
  AUTH_MESSAGES,
  AUTH_UI,
  AUTH_VALIDATION,
  AUTH_VALIDATION_MESSAGES,
} from "@/constants/auth";
import { APP_ROUTES } from "@/constants/routes";
import { z } from "zod";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

const registerSchema = z.object({
  [AUTH_FORM_FIELDS.HOUSEHOLD_NAME]: z
    .string()
    .min(
      AUTH_VALIDATION.REQUIRED_TEXT_MIN_LENGTH,
      AUTH_VALIDATION_MESSAGES.HOUSEHOLD_NAME_REQUIRED,
    ),
  [AUTH_FORM_FIELDS.TAX_CODE]: z
    .string()
    .regex(
      AUTH_VALIDATION.TAX_CODE_PATTERN,
      AUTH_VALIDATION_MESSAGES.TAX_CODE_INVALID,
    ),
  [AUTH_FORM_FIELDS.HOUSEHOLD_PHONE]: z
    .string()
    .regex(
      AUTH_VALIDATION.VIETNAM_PHONE_PATTERN,
      AUTH_VALIDATION_MESSAGES.PHONE_INVALID,
    ),
  [AUTH_FORM_FIELDS.HOUSEHOLD_ADDRESS]: z
    .string()
    .min(
      AUTH_VALIDATION.REQUIRED_TEXT_MIN_LENGTH,
      AUTH_VALIDATION_MESSAGES.HOUSEHOLD_ADDRESS_REQUIRED,
    ),
  [AUTH_FORM_FIELDS.FULL_NAME]: z
    .string()
    .min(
      AUTH_VALIDATION.REQUIRED_TEXT_MIN_LENGTH,
      AUTH_VALIDATION_MESSAGES.FULL_NAME_REQUIRED,
    ),
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

interface RegisterFormProps {
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const outletContext = useOutletContext<AuthOutletContext | null>();
  const [form] = Form.useForm();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useAppDispatch();

  const handleFinish = async (formValues: unknown) => {
    setErrorMsg(null);
    try {
      // Validate with Zod
      const values = registerSchema.parse(formValues);

      const response = await register({
        householdName: values.householdName.trim(),
        taxCode: values.taxCode.trim(),
        householdPhone: values.householdPhone.trim(),
        householdAddress: values.householdAddress.trim(),
        fullName: values.fullName.trim(),
        username: values.username.trim(),
        password: values.password.trim(),
      }).unwrap();

      if (outletContext?.triggerDoorOpening) {
        await outletContext.triggerDoorOpening();
      }

      dispatch(setCredentials(response));
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        setErrorMsg(
          error.issues[0]?.message ??
            AUTH_MESSAGES.REGISTER_INVALID_DATA,
        );
      } else {
        setErrorMsg(
          getApiErrorMessage(
            error,
            AUTH_MESSAGES.REGISTER_FAILED,
          ),
        );
      }
    }
  };

  return (
    <div className="w-full max-w-[540px] min-h-[580px] sm:min-h-[590px] flex flex-col justify-between bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.03)] border border-slate-100 p-6 sm:p-8 transition-all my-auto">
      {/* Header */}
      <div className="text-center mb-3">
        <h2 className="text-2xl sm:text-[26px] font-bold text-slate-800 tracking-tight">
          Tạo tài khoản mới
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
          Đăng ký thông tin hộ kinh doanh để bắt đầu trải nghiệm
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
        className="flex flex-col flex-1 justify-between gap-1.5"
      >
        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            className="mb-2 rounded-xl border-red-200 bg-red-50/70 text-xs"
          />
        )}

        {/* Section 1: Hộ kinh doanh */}
        <div>
          <div className="font-bold text-[11px] text-kv-blue-primary mb-1 uppercase tracking-wider">
            {AUTH_UI.REGISTER.HOUSEHOLD_SECTION_LABEL}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Form.Item
              label={
                <span className="font-semibold text-gray-700 text-xs">
                  {AUTH_UI.REGISTER.HOUSEHOLD_NAME_LABEL}
                </span>
              }
              name={AUTH_FORM_FIELDS.HOUSEHOLD_NAME}
              className="mb-1.5"
              rules={[
                {
                  required: true,
                  message:
                    AUTH_VALIDATION_MESSAGES.HOUSEHOLD_NAME_FORM_REQUIRED,
                },
              ]}
            >
              <Input
                placeholder={AUTH_UI.REGISTER.HOUSEHOLD_NAME_PLACEHOLDER}
                className="h-10 rounded-xl border-gray-300 hover:border-kv-blue-primary focus:border-kv-blue-primary text-sm"
              />
            </Form.Item>
            <Form.Item
              label={
                <span className="font-semibold text-gray-700 text-xs">
                  {AUTH_UI.REGISTER.TAX_CODE_LABEL}
                </span>
              }
              name={AUTH_FORM_FIELDS.TAX_CODE}
              className="mb-1.5"
              rules={[
                {
                  required: true,
                  message: AUTH_VALIDATION_MESSAGES.TAX_CODE_REQUIRED,
                },
                {
                  pattern: AUTH_VALIDATION.TAX_CODE_PATTERN,
                  message: AUTH_VALIDATION_MESSAGES.TAX_CODE_FORM_INVALID,
                },
              ]}
            >
              <Input
                placeholder={AUTH_UI.REGISTER.TAX_CODE_PLACEHOLDER}
                className="h-10 rounded-xl border-gray-300 hover:border-kv-blue-primary focus:border-kv-blue-primary text-sm"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Form.Item
              label={
                <span className="font-semibold text-gray-700 text-xs">
                  {AUTH_UI.REGISTER.PHONE_LABEL}
                </span>
              }
              name={AUTH_FORM_FIELDS.HOUSEHOLD_PHONE}
              className="mb-1.5"
              rules={[
                {
                  required: true,
                  message: AUTH_VALIDATION_MESSAGES.PHONE_REQUIRED,
                },
                {
                  pattern: AUTH_VALIDATION.VIETNAM_PHONE_PATTERN,
                  message: AUTH_VALIDATION_MESSAGES.PHONE_FORM_INVALID,
                },
              ]}
            >
              <Input
                placeholder={AUTH_UI.REGISTER.PHONE_PLACEHOLDER}
                className="h-10 rounded-xl border-gray-300 hover:border-kv-blue-primary focus:border-kv-blue-primary text-sm"
              />
            </Form.Item>
            <Form.Item
              label={
                <span className="font-semibold text-gray-700 text-xs">
                  {AUTH_UI.REGISTER.ADDRESS_LABEL}
                </span>
              }
              name={AUTH_FORM_FIELDS.HOUSEHOLD_ADDRESS}
              className="mb-1.5"
              rules={[
                {
                  required: true,
                  message:
                    AUTH_VALIDATION_MESSAGES.HOUSEHOLD_ADDRESS_FORM_REQUIRED,
                },
              ]}
            >
              <Input
                placeholder={AUTH_UI.REGISTER.ADDRESS_PLACEHOLDER}
                className="h-10 rounded-xl border-gray-300 hover:border-kv-blue-primary focus:border-kv-blue-primary text-sm"
              />
            </Form.Item>
          </div>
        </div>

        {/* Section 2: Tài khoản quản trị */}
        <div>
          <div className="font-bold text-[11px] text-kv-blue-primary border-t border-gray-100 pt-2 mt-0.5 mb-1 uppercase tracking-wider">
            {AUTH_UI.REGISTER.ACCOUNT_SECTION_LABEL}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Form.Item
              label={
                <span className="font-semibold text-gray-700 text-xs">
                  {AUTH_UI.REGISTER.FULL_NAME_LABEL}
                </span>
              }
              name={AUTH_FORM_FIELDS.FULL_NAME}
              className="mb-1.5"
              rules={[
                {
                  required: true,
                  message: AUTH_VALIDATION_MESSAGES.FULL_NAME_FORM_REQUIRED,
                },
                {
                  min: AUTH_VALIDATION.OWNER_NAME_MIN_LENGTH,
                  message: AUTH_VALIDATION_MESSAGES.FULL_NAME_FORM_MIN_LENGTH,
                },
              ]}
            >
              <Input
                placeholder={AUTH_UI.REGISTER.FULL_NAME_PLACEHOLDER}
                className="h-10 rounded-xl border-gray-300 hover:border-kv-blue-primary focus:border-kv-blue-primary text-sm"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="font-semibold text-gray-700 text-xs">
                  {AUTH_UI.REGISTER.USERNAME_LABEL}
                </span>
              }
              name={AUTH_FORM_FIELDS.USERNAME}
              className="mb-1.5"
              rules={[
                {
                  required: true,
                  message: AUTH_VALIDATION_MESSAGES.USERNAME_REQUIRED,
                },
                {
                  min: AUTH_VALIDATION.USERNAME_MIN_LENGTH,
                  message: AUTH_VALIDATION_MESSAGES.USERNAME_FORM_MIN_LENGTH,
                },
              ]}
            >
              <Input
                placeholder={AUTH_UI.REGISTER.USERNAME_PLACEHOLDER}
                className="h-10 rounded-xl border-gray-300 hover:border-kv-blue-primary focus:border-kv-blue-primary text-sm"
              />
            </Form.Item>
          </div>

          <Form.Item
            label={
              <span className="font-semibold text-gray-700 text-xs">
                {AUTH_UI.REGISTER.PASSWORD_LABEL}
              </span>
            }
            name={AUTH_FORM_FIELDS.PASSWORD}
            className="mb-1.5"
            rules={[
              {
                required: true,
                message: AUTH_VALIDATION_MESSAGES.PASSWORD_REQUIRED,
              },
              {
                min: AUTH_VALIDATION.PASSWORD_MIN_LENGTH,
                message: AUTH_VALIDATION_MESSAGES.PASSWORD_FORM_MIN_LENGTH,
              },
            ]}
          >
            <Input.Password
              placeholder={AUTH_UI.REGISTER.PASSWORD_PLACEHOLDER}
              className="h-10 rounded-xl border-gray-300 hover:border-kv-blue-primary focus:border-kv-blue-primary text-sm"
            />
          </Form.Item>
        </div>

        <div className="mt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-[#0F56E8] hover:bg-[#0D4DCE] active:bg-[#0A3EB8] text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2 text-xs">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
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
                Đang xử lý đăng ký...
              </span>
            ) : (
              AUTH_UI.REGISTER.SUBMIT_LABEL
            )}
          </button>
        </div>

        {/* Footer: Back to Login link */}
        <div className="text-center text-xs sm:text-sm text-slate-500 mt-2.5">
          Đã có tài khoản?{" "}
          <Link
            to={APP_ROUTES.LOGIN}
            className="text-[#0F56E8] hover:text-blue-700 font-bold hover:underline transition-colors ml-1"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </Form>
    </div>
  );
};
