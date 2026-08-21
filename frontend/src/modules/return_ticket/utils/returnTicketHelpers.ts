import {
  RETURN_TICKET_STATUS_LABELS,
  RETURN_TICKET_STATUS_BADGES,
  REFUND_PAYMENT_METHOD_LABELS,
  type TReturnTicketStatus,
  type TRefundPaymentMethod,
} from "@/constants/returnTicket";

export const getReturnTicketStatusLabel = (status: string | undefined): string => {
  if (!status) return "Không xác định";
  return (
    RETURN_TICKET_STATUS_LABELS[status as TReturnTicketStatus] ||
    status
  );
};

export const getReturnTicketStatusBadge = (status: string | undefined) => {
  if (!status || !(status in RETURN_TICKET_STATUS_BADGES)) {
    return {
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-200",
      label: status || "N/A",
    };
  }
  return RETURN_TICKET_STATUS_BADGES[status as TReturnTicketStatus];
};

export const getRefundPaymentMethodLabel = (method: string | undefined): string => {
  if (!method) return "Tiền mặt";
  return (
    REFUND_PAYMENT_METHOD_LABELS[method as TRefundPaymentMethod] ||
    method
  );
};

export const formatReturnTicketDateTime = (
  isoString: string | null | undefined
): string => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return isoString || "";
  }
};

export const isReturnPeriodExpired = (
  invoiceDate: string | null | undefined,
  maxDays: number = 7
): { isExpired: boolean; daysSince: number } => {
  if (!invoiceDate) return { isExpired: false, daysSince: 0 };
  try {
    const issued = new Date(invoiceDate).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - issued) / (1000 * 60 * 60 * 24));
    return {
      isExpired: diffDays > maxDays,
      daysSince: diffDays,
    };
  } catch {
    return { isExpired: false, daysSince: 0 };
  }
};
