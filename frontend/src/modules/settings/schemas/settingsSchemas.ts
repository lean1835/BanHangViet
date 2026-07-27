import { z } from "zod";

export const householdInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên hộ kinh doanh không được để trống")
    .max(255, "Tên hộ kinh doanh không được vượt quá 255 ký tự"),
  taxCode: z
    .string()
    .trim()
    .min(1, "Mã số thuế không được để trống")
    .regex(/^[0-9]{10}(-[0-9]{3})?$/, "Mã số thuế phải đúng định dạng 10 hoặc 13 chữ số (ví dụ: 0123456789 hoặc 0123456789-001)"),
  address: z
    .string()
    .trim()
    .min(1, "Địa chỉ cửa hàng không được để trống")
    .max(500, "Địa chỉ không được vượt quá 500 ký tự"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Số điện thoại không được để trống")
    .regex(/^0[35789][0-9]{8}$/, "Số điện thoại không đúng định dạng (Ví dụ: 0988888888)"),
  representativeName: z
    .string()
    .trim()
    .max(100, "Tên người đại diện không được vượt quá 100 ký tự")
    .optional()
    .or(z.literal("")),
});

export type THouseholdInfoFormData = z.infer<typeof householdInfoSchema>;

export const invoiceTemplateSchema = z.object({
  invoicePattern: z
    .string()
    .trim()
    .min(1, "Mẫu số hóa đơn không được để trống")
    .max(10, "Mẫu số hóa đơn không vượt quá 10 ký tự"),
  invoiceSymbol: z
    .string()
    .trim()
    .min(1, "Ký hiệu hóa đơn không được để trống")
    .max(10, "Ký hiệu hóa đơn không vượt quá 10 ký tự")
    .transform((val) => val.toUpperCase()),
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề hóa đơn không được để trống")
    .max(150, "Tiêu đề hóa đơn không vượt quá 150 ký tự"),
  footerNote: z.string().trim().optional().or(z.literal("")),
});

export type TInvoiceTemplateFormData = z.infer<typeof invoiceTemplateSchema>;

export const taxRateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên mức thuế không được để trống")
    .max(50, "Tên mức thuế không vượt quá 50 ký tự"),
  ratePercentage: z.coerce
    .number({ invalid_type_error: "Tỷ lệ thuế phải là số hợp lệ" })
    .min(0, "Tỷ lệ thuế không được nhỏ hơn 0%")
    .max(100, "Tỷ lệ thuế không được vượt quá 100%"),
  isActive: z.boolean(),
});

export type TTaxRateFormData = z.infer<typeof taxRateSchema>;
