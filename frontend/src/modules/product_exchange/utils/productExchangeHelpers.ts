import {
  EXCHANGE_TYPE_LABELS,
  EXCHANGE_TYPE_BADGES,
  EXCHANGE_STATUS_LABELS,
  EXCHANGE_STATUS_BADGES,
  EXTRA_PAYMENT_METHOD_LABELS,
  type TExchangeType,
} from "@/constants/productExchange";

export const getExchangeTypeLabel = (type?: string | null): string => {
  if (!type) return "Không xác định";
  return EXCHANGE_TYPE_LABELS[type as TExchangeType] || type;
};

export const getExchangeTypeBadge = (type?: string | null) => {
  if (!type || !(type in EXCHANGE_TYPE_BADGES)) {
    return {
      bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-200 dark:border-slate-700",
    };
  }
  return EXCHANGE_TYPE_BADGES[type as TExchangeType];
};

export const getExchangeStatusLabel = (status?: string | null): string => {
  if (!status) return "Không xác định";
  return EXCHANGE_STATUS_LABELS[status] || status;
};

export const getExchangeStatusBadge = (status?: string | null) => {
  if (!status || !(status in EXCHANGE_STATUS_BADGES)) {
    return {
      bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-200 dark:border-slate-700",
    };
  }
  return EXCHANGE_STATUS_BADGES[status];
};

export const getPaymentMethodLabel = (method?: string | null): string => {
  if (!method) return "Không có";
  return EXTRA_PAYMENT_METHOD_LABELS[method] || method;
};

export const formatExchangeTicketDateTime = (
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
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
};

export const getDaysSinceIssued = (createdAtStr?: string): number => {
  if (!createdAtStr) return 0;
  const created = new Date(createdAtStr).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};


