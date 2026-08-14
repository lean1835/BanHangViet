import { z } from "zod";

export const unlockPeriodSchema = z.object({
  reason: z
    .string()
    .min(1, "Vui lòng nhập lý do mở lại kỳ kê khai")
    .min(10, "Lý do mở lại kỳ phải có ít nhất 10 ký tự để phục vụ giải trình thuế"),
});

export type TUnlockPeriodFormData = z.infer<typeof unlockPeriodSchema>;
