import React, { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { useLoginMutation } from "../services/authApi";
import { useAppDispatch } from "@/hooks/redux";
import { setCredentials } from "@/stores/authSlice";
import { z } from "zod";
import { DemoAccountsPanel } from "./DemoAccountsPanel";

const loginSchema = z.object({
  username: z.string().min(4, "Tên đăng nhập phải chứa ít nhất 4 ký tự"),
  password: z.string().min(6, "Mật khẩu phải chứa ít nhất 6 ký tự"),
});

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();

  const handleFinish = async (values: any) => {
    setErrorMsg(null);
    try {
      // Validate with Zod
      loginSchema.parse(values);

      const response = await login(values).unwrap();
      dispatch(setCredentials(response));
      onSuccess();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrorMsg(err.errors[0].message);
      } else if (err.data && err.data.message) {
        setErrorMsg(err.data.message);
      } else {
        setErrorMsg("Đã xảy ra lỗi đăng nhập. Vui lòng thử lại!");
      }
    }
  };

  const handleDemoSelect = (username: string, password: string) => {
    form.setFieldsValue({ username, password });
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
        label={<span className="font-semibold text-gray-700">Tên đăng nhập:</span>}
        name="username"
        rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}
      >
        <Input
          placeholder="Tên tài khoản hoặc email"
          className="h-10 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
        />
      </Form.Item>

      <Form.Item
        label={<span className="font-semibold text-gray-700">Mật khẩu:</span>}
        name="password"
        rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
      >
        <Input.Password
          placeholder="Mật khẩu tài khoản"
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
          ĐĂNG NHẬP HỆ THỐNG
        </Button>
      </Form.Item>

      <DemoAccountsPanel onSelect={handleDemoSelect} />
    </Form>
  );
};
