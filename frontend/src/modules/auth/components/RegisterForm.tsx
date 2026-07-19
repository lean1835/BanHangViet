import React, { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
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
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      requiredMark={false}
      className="flex flex-col gap-3 animate-auth-fade-in"
    >
      {errorMsg && (
        <Alert
          message={errorMsg}
          type="error"
          showIcon
          className="mb-2 rounded-lg"
        />
      )}

      <div className="font-bold text-xs text-kv-blue-primary mb-1 uppercase tracking-wide">
        {AUTH_UI.REGISTER.HOUSEHOLD_SECTION_LABEL}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Form.Item
          label={
            <span className="font-semibold text-gray-700 text-xs">
              {AUTH_UI.REGISTER.HOUSEHOLD_NAME_LABEL}
            </span>
          }
          name={AUTH_FORM_FIELDS.HOUSEHOLD_NAME}
          className="mb-2"
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
            className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
          />
        </Form.Item>
        <Form.Item
          label={
            <span className="font-semibold text-gray-700 text-xs">
              {AUTH_UI.REGISTER.TAX_CODE_LABEL}
            </span>
          }
          name={AUTH_FORM_FIELDS.TAX_CODE}
          className="mb-2"
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
            className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
          />
        </Form.Item>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Form.Item
          label={
            <span className="font-semibold text-gray-700 text-xs">
              {AUTH_UI.REGISTER.PHONE_LABEL}
            </span>
          }
          name={AUTH_FORM_FIELDS.HOUSEHOLD_PHONE}
          className="mb-2"
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
            className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
          />
        </Form.Item>
        <Form.Item
          label={
            <span className="font-semibold text-gray-700 text-xs">
              {AUTH_UI.REGISTER.ADDRESS_LABEL}
            </span>
          }
          name={AUTH_FORM_FIELDS.HOUSEHOLD_ADDRESS}
          className="mb-2"
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
            className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
          />
        </Form.Item>
      </div>

      <div className="font-bold text-xs text-kv-blue-primary border-t border-gray-100 pt-3 mt-1 mb-1 uppercase tracking-wide">
        {AUTH_UI.REGISTER.ACCOUNT_SECTION_LABEL}
      </div>

      {/* Họ tên — full width */}
      <Form.Item
        label={
          <span className="font-semibold text-gray-700 text-xs">
            {AUTH_UI.REGISTER.FULL_NAME_LABEL}
          </span>
        }
        name={AUTH_FORM_FIELDS.FULL_NAME}
        className="mb-2"
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
          className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
        />
      </Form.Item>

      <div className="grid grid-cols-2 gap-3">
        <Form.Item
          label={
            <span className="font-semibold text-gray-700 text-xs">
              {AUTH_UI.REGISTER.USERNAME_LABEL}
            </span>
          }
          name={AUTH_FORM_FIELDS.USERNAME}
          className="mb-2"
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
            className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
          />
        </Form.Item>
        <Form.Item
          label={
            <span className="font-semibold text-gray-700 text-xs">
              {AUTH_UI.REGISTER.PASSWORD_LABEL}
            </span>
          }
          name={AUTH_FORM_FIELDS.PASSWORD}
          className="mb-2"
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
            className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
          />
        </Form.Item>
      </div>

      <Form.Item className="mb-0 mt-2">
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          className="w-full h-10 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark border-none font-bold text-sm"
        >
          {AUTH_UI.REGISTER.SUBMIT_LABEL}
        </Button>
      </Form.Item>
    </Form>
  );
};
