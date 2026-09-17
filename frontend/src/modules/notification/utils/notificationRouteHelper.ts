import { APP_ROUTES } from "@/constants/routes";
import type { IAppNotificationResponse } from "../types/IAppNotification";

/**
 * Chuẩn hóa actionUrl từ notification về đúng route thực tế trên FE
 * Khắc phục tình trạng URL backend trả về (như /debts) không khớp route FE
 * dẫn đến bị fallback về Dashboard.
 */
export const resolveNotificationActionUrl = (
  notif: Pick<IAppNotificationResponse, "actionUrl" | "targetType" | "targetId">
): string => {
  const rawUrl = notif.actionUrl;
  const targetType = notif.targetType;

  if (!rawUrl && !targetType) {
    return APP_ROUTES.NOTIFICATIONS;
  }

  const target = (rawUrl || "").trim();

  // 1. Công nợ khách hàng (CUSTOMER_DEBT hoặc đường dẫn chứa /debts)
  if (target.includes("/debts") || targetType === "CUSTOMER_DEBT") {
    try {
      const parsedUrl = new URL(target, "http://dummy.local");
      const customerId = parsedUrl.searchParams.get("customerId");
      if (customerId) {
        return `${APP_ROUTES.CUSTOMERS}/${customerId}?tab=debt`;
      }
    } catch {
      // Fallback khi parse lỗi
    }
    return `${APP_ROUTES.CUSTOMERS}?debtStatus=OVERDUE`;
  }

  // 2. Doanh thu theo năm (/tax/annual-revenue hoặc /reports/annual-revenue)
  if (target.includes("annual-revenue")) {
    return APP_ROUTES.REPORT_ANNUAL_REVENUE;
  }

  // 3. Tờ khai thuế (/reports/tax-declaration)
  if (target.includes("tax-declaration")) {
    return target;
  }

  // 4. Hóa đơn điện tử (/e-invoices)
  if (target.includes("e-invoices")) {
    return target;
  }

  return target || APP_ROUTES.NOTIFICATIONS;
};
