import React, { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { useLoginMutation } from "../services/authApi";
import { useAppDispatch } from "@/hooks/redux";
import { setCredentials } from "@/stores/authSlice";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
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

  const handleQuickFill = (username: string) => {
    form.setFieldsValue({
      username,
      password: "123",
    });
    // Trigger submit
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2 text-xs text-blue-800">
        <div className="flex items-center gap-2 font-bold mb-2">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.7c-.29.37-.452.83-.452 1.3V18h-4v-1.1c0-.47-.162-.93-.452-1.3l-.548-.7z"
            />
          </svg>
          <span>Kiểm thử nhanh tài khoản mẫu:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            onClick={() => handleQuickFill("chuho_viet")}
            className="bg-white border border-blue-300 px-2 py-1 rounded cursor-pointer font-semibold text-gray-700 hover:bg-blue-100 hover:border-kv-blue-primary transition-colors"
          >
            Chủ hộ (chuho_viet)
          </span>
          <span
            onClick={() => handleQuickFill("nhanvien_viet")}
            className="bg-white border border-blue-300 px-2 py-1 rounded cursor-pointer font-semibold text-gray-700 hover:bg-blue-100 hover:border-kv-blue-primary transition-colors"
          >
            Nhân viên (nhanvien_viet)
          </span>
          <span
            onClick={() => handleQuickFill("ketoan_viet")}
            className="bg-white border border-blue-300 px-2 py-1 rounded cursor-pointer font-semibold text-gray-700 hover:bg-blue-100 hover:border-kv-blue-primary transition-colors"
          >
            Kế toán (ketoan_viet)
          </span>
          <span
            onClick={() => handleQuickFill("quantri_viet")}
            className="bg-white border border-blue-300 px-2 py-1 rounded cursor-pointer font-semibold text-gray-700 hover:bg-blue-100 hover:border-kv-blue-primary transition-colors"
          >
            Quản trị (quantri_viet)
          </span>
          <span
            onClick={() => handleQuickFill("thue_viet")}
            className="bg-white border border-blue-300 px-2 py-1 rounded cursor-pointer font-semibold text-gray-700 hover:bg-blue-100 hover:border-kv-blue-primary transition-colors"
          >
            Thuế (thue_viet)
          </span>

        </div>
      </div>
    </Form>
  );
};
