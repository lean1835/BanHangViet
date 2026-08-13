import { z } from "zod";
import { SUPPLIER_STATUS } from "@/constants/supplier";

const MAX_DEBT_AMOUNT = 9_999_999_999_999;

export const supplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên nhà cung cấp.")
    .max(100, "Tên nhà cung cấp không được vượt quá 100 ký tự."),
  phoneNumber: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, ""))
    .refine(
      (value) => /^[0-9]{9,15}$/.test(value),
      "Số điện thoại phải gồm từ 9 đến 15 chữ số.",
    ),
  email: z
    .string()
    .trim()
    .max(100, "Email không được vượt quá 100 ký tự.")
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Email không đúng định dạng.",
    ),
  groupId: z.string().trim().max(36),
  taxCode: z
    .string()
    .trim()
    .max(20, "Mã số thuế không được vượt quá 20 ký tự.")
    .refine(
      (value) => !value || /^\d{10}(?:-\d{3})?$/.test(value),
      "Mã số thuế phải gồm 10 chữ số hoặc có dạng 0123456789-001.",
    ),
  address: z
    .string()
    .trim()
    .max(255, "Địa chỉ không được vượt quá 255 ký tự."),
  initialDebt: z
    .number({ invalid_type_error: "Nợ ban đầu phải là một số hợp lệ." })
    .finite("Nợ ban đầu phải là một số hợp lệ.")
    .min(0, "Nợ ban đầu không được nhỏ hơn 0.")
    .max(MAX_DEBT_AMOUNT, "Nợ ban đầu vượt quá giới hạn cho phép."),
  note: z
    .string()
    .trim()
    .max(1000, "Ghi chú không được vượt quá 1.000 ký tự."),
  status: z.enum([SUPPLIER_STATUS.ACTIVE, SUPPLIER_STATUS.INACTIVE]),
});

export const supplierGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên nhóm nhà cung cấp.")
    .max(100, "Tên nhóm không được vượt quá 100 ký tự."),
  note: z
    .string()
    .trim()
    .max(1000, "Ghi chú không được vượt quá 1.000 ký tự."),
});

export type TSupplierFormValues = z.infer<typeof supplierSchema>;
export type TSupplierGroupFormValues = z.infer<typeof supplierGroupSchema>;
