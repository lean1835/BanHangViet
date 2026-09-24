import { z } from "zod";

export const unlockPeriodSchema = z.object({
  reason: z
    .string()
    .min(1, "Vui lòng nhập lý do mở lại kỳ kê khai")
    .min(10, "Lý do mở lại kỳ phải có ít nhất 10 ký tự để phục vụ giải trình thuế")
    .max(500, "Lý do không được vượt quá 500 ký tự"),
});

export type TUnlockPeriodFormData = z.infer<typeof unlockPeriodSchema>;

export const generatePeriodSchema = z.object({
  periodType: z.enum(["QUARTERLY", "MONTHLY"]),
  year: z.number().int().min(2020, "Năm không hợp lệ").max(2030, "Năm không hợp lệ"),
  periodNumber: z.number().int().min(1, "Kỳ không hợp lệ").max(12, "Kỳ không hợp lệ"),
});

export type TGeneratePeriodFormData = z.infer<typeof generatePeriodSchema>;

export const warningThresholdSchema = z.object({
  warningThresholdPercentage: z.coerce
    .number({ invalid_type_error: "Tỷ lệ cảnh báo phải là số" })
    .min(50, "Tỷ lệ cảnh báo hợp lệ phải từ 50.0% đến 99.0%")
    .max(99, "Tỷ lệ cảnh báo hợp lệ phải từ 50.0% đến 99.0%"),
});

export type TWarningThresholdFormData = z.infer<typeof warningThresholdSchema>;

export const taxReminderSettingsSchema = z.object({
  taxPeriodType: z.enum(["MONTHLY", "QUARTERLY"]),
  taxReminderDaysBefore: z.coerce
    .number({ invalid_type_error: "Số ngày nhắc phải là số" })
    .int("Số ngày nhắc phải là số nguyên")
    .min(1, "Số ngày nhắc trước hạn phải từ 1 đến 30 ngày")
    .max(30, "Số ngày nhắc trước hạn phải từ 1 đến 30 ngày"),
  taxReminderEnabled: z.boolean(),
});

export type TTaxReminderSettingsFormData = z.infer<typeof taxReminderSettingsSchema>;
