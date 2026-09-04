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
