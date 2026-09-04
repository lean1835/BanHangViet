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
  limitOrdersEnabled: z.boolean(),
  offlineMaxOrders: z.coerce.number({ invalid_type_error: "Số đơn tối đa phải là số hợp lệ" }).optional(),
  limitHoursEnabled: z.boolean(),
  offlineMaxHours: z.coerce.number({ invalid_type_error: "Số giờ tối đa phải là số hợp lệ" }).optional(),
}).superRefine((data, ctx) => {
  if (data.limitOrdersEnabled) {
    const val = data.offlineMaxOrders;
    if (val === undefined || val === null || isNaN(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập số đơn tối đa cho phép bán",
        path: ["offlineMaxOrders"],
      });
    } else if (val < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Số đơn tối đa tối thiểu là 1 đơn",
        path: ["offlineMaxOrders"],
      });
    } else if (val > 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Số đơn tối đa không quá 1000 đơn",
        path: ["offlineMaxOrders"],
      });
    }
  }

  if (data.limitHoursEnabled) {
    const val = data.offlineMaxHours;
    if (val === undefined || val === null || isNaN(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập số giờ tối đa cho phép bán",
        path: ["offlineMaxHours"],
      });
    } else if (val < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Thời gian bán tối đa tối thiểu là 1 giờ",
        path: ["offlineMaxHours"],
      });
    } else if (val > 168) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Thời gian bán tối đa không quá 168 giờ (7 ngày)",
        path: ["offlineMaxHours"],
      });
    }
  }
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
