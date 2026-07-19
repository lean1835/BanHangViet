import React, { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { useLoginMutation } from "../services/authApi";
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
import { DemoAccountsPanel } from "./DemoAccountsPanel";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

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
  const [form] = Form.useForm();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();

  const handleFinish = async (formValues: unknown) => {
    setErrorMsg(null);
    try {
      // Validate with Zod
      const values = loginSchema.parse(formValues);

      const response = await login(values).unwrap();
      dispatch(setCredentials(response));
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        setErrorMsg(
          error.issues[0]?.message ??
            AUTH_MESSAGES.LOGIN_INVALID_DATA,
        );
      } else {
        setErrorMsg(
          getApiErrorMessage(
            error,
            AUTH_MESSAGES.LOGIN_FAILED,
          ),
        );
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
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      requiredMark={false}
      className="flex flex-col gap-4 animate-auth-fade-in"
    >
      {errorMsg && (
        <Alert
          message={errorMsg}
          type="error"
          showIcon
          className="mb-2 rounded-lg"
        />
      )}

      <Form.Item
        label={
          <span className="font-semibold text-gray-700">
            {AUTH_UI.LOGIN.USERNAME_LABEL}
          </span>
        }
        name={AUTH_FORM_FIELDS.USERNAME}
        rules={[
          {
            required: true,
            message: AUTH_VALIDATION_MESSAGES.USERNAME_REQUIRED,
          },
        ]}
      >
        <Input
          placeholder={AUTH_UI.LOGIN.USERNAME_PLACEHOLDER}
          className="h-10 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
        />
      </Form.Item>

      <Form.Item
        label={
          <span className="font-semibold text-gray-700">
            {AUTH_UI.LOGIN.PASSWORD_LABEL}
          </span>
        }
        name={AUTH_FORM_FIELDS.PASSWORD}
        rules={[
          {
            required: true,
            message: AUTH_VALIDATION_MESSAGES.PASSWORD_REQUIRED,
          },
        ]}
      >
        <Input.Password
          placeholder={AUTH_UI.LOGIN.PASSWORD_PLACEHOLDER}
          className="h-10 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          className="w-full h-10 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark border-none font-bold text-sm"
        >
          {AUTH_UI.LOGIN.SUBMIT_LABEL}
        </Button>
      </Form.Item>

      <DemoAccountsPanel onSelect={handleDemoSelect} />
    </Form>
  );
};
