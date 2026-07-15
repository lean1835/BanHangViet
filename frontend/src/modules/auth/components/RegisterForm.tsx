import React, { useState } from "react";
import { Form, Input, Button, Alert } from "antd";
import { useRegisterMutation } from "../services/authApi";
import { useAppDispatch } from "@/hooks/redux";
import { setCredentials } from "@/stores/authSlice";
import { z } from "zod";

const registerSchema = z.object({
  householdName: z.string().min(1, "Vui lòng nhập tên Hộ kinh doanh"),
  taxCode: z.string().regex(/^\d{10}(-\d{3})?$/, "Mã số thuế không hợp lệ! Vui lòng nhập đúng 10 hoặc 13 chữ số (dạng XXXXXXXXXX-XXX)."),
  householdPhone: z.string().regex(/^(0[3|5|7|8|9])([0-9]{8})$/, "Số điện thoại không đúng định dạng Việt Nam!"),
  householdAddress: z.string().min(1, "Vui lòng nhập địa chỉ Hộ kinh doanh"),
  fullName: z.string().min(1, "Vui lòng nhập họ và tên chủ hộ"),
  username: z.string().min(4, "Tên đăng nhập phải chứa ít nhất 4 ký tự"),
  password: z.string().min(6, "Mật khẩu phải chứa ít nhất 6 ký tự"),
});

interface RegisterFormProps {
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useAppDispatch();

  const handleFinish = async (values: any) => {
    setErrorMsg(null);
    try {
      // Validate with Zod
      registerSchema.parse(values);

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
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrorMsg(err.errors[0].message);
      } else if (err.data && err.data.message) {
        setErrorMsg(err.data.message);
      } else {
        setErrorMsg("Đã xảy ra lỗi đăng ký hộ kinh doanh. Vui lòng thử lại!");
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
        Thông tin Hộ kinh doanh:
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Form.Item
          label={<span className="font-semibold text-gray-700 text-xs">Tên Hộ kinh doanh*:</span>}
          name="householdName"
          className="mb-2"
          rules={[{ required: true, message: "Vui lòng nhập tên Hộ kinh doanh!" }]}
        >
          <Input
            placeholder="Ví dụ: Tạp Hóa Việt"
            className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
          />
        </Form.Item>
        <Form.Item
          label={<span className="font-semibold text-gray-700 text-xs">Mã số thuế*:</span>}
          name="taxCode"
          className="mb-2"
          rules={[
            { required: true, message: "Vui lòng nhập mã số thuế!" },
            {
              pattern: /^\d{10}(-\d{3})?$/,
              message: "Mã số thuế gồm 10 hoặc 13 chữ số (dạng XXXXXXXXXX-XXX).",
            },
          ]}
        >
          <Input
            placeholder="10 hoặc 13 chữ số"
            className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
          />
        </Form.Item>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Form.Item
          label={<span className="font-semibold text-gray-700 text-xs">Số điện thoại*:</span>}
          name="householdPhone"
          className="mb-2"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại!" },
            {
              pattern: /^(0[3|5|7|8|9])([0-9]{8})$/,
              message: "Định dạng SĐT Việt Nam không hợp lệ!",
            },
          ]}
        >
          <Input
            placeholder="Số điện thoại liên hệ"
            className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
          />
        </Form.Item>
        <Form.Item
          label={<span className="font-semibold text-gray-700 text-xs">Địa chỉ cửa hàng*:</span>}
          name="householdAddress"
          className="mb-2"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ Hộ kinh doanh!" }]}
        >
          <Input
            placeholder="Địa chỉ hộ kinh doanh"
            className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
          />
        </Form.Item>
      </div>

      <div className="font-bold text-xs text-kv-blue-primary border-t border-gray-100 pt-3 mt-1 mb-1 uppercase tracking-wide">
        Thiết lập Tài khoản Quản lý (Chủ hộ):
      </div>

      {/* Họ tên — full width */}
      <Form.Item
        label={<span className="font-semibold text-gray-700 text-xs">Họ và tên chủ hộ*:</span>}
        name="fullName"
        className="mb-2"
        rules={[
          { required: true, message: "Vui lòng nhập họ và tên!" },
          { min: 2, message: "Họ tên phải từ 2 ký tự trở lên!" },
        ]}
      >
        <Input
          placeholder="Ví dụ: Nguyễn Văn An"
          className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
        />
      </Form.Item>

      <div className="grid grid-cols-2 gap-3">
        <Form.Item
          label={<span className="font-semibold text-gray-700 text-xs">Tên đăng nhập*:</span>}
          name="username"
          className="mb-2"
          rules={[
            { required: true, message: "Vui lòng nhập tên đăng nhập!" },
            { min: 4, message: "Tối thiểu 4 ký tự!" },
          ]}
        >
          <Input
            placeholder="Tên đăng nhập"
            className="h-9 border-gray-300 rounded-lg hover:border-kv-blue-primary focus:border-kv-blue-primary"
          />
        </Form.Item>
        <Form.Item
          label={<span className="font-semibold text-gray-700 text-xs">Mật khẩu*:</span>}
          name="password"
          className="mb-2"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu!" },
            { min: 6, message: "Tối thiểu 6 ký tự!" },
          ]}
        >
          <Input.Password
            placeholder="Mật khẩu chủ hộ"
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
          ĐĂNG KÝ & BẮT ĐẦU TRẢI NGHIỆM
        </Button>
      </Form.Item>
    </Form>
  );
};
