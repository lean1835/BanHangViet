import { STORAGE_KEYS } from "@/constants/app";
import {
  ANOMALY_ALERT_TYPES,
  ANOMALY_ALERT_STATUSES,
  ANOMALY_SEVERITIES,
  type TAnomalyAlertStatus,
} from "@/constants/anomalyAlert";
import { ROLE_LABELS, USER_ROLES } from "@/constants/roles";
import { DEMO_ACCOUNTS } from "@/constants/demoAccounts";
import type { IAnomalyAlert } from "../types/IAnomalyAlert";

export interface IFailedLoginAttempt {
  username: string;
  timestamp: string;
  ip?: string;
  reason?: string;
}

export interface ICancelledInvoiceRecord {
  invoiceNumber: string;
  lookupCode?: string;
  actorUsername?: string;
  actorFullName?: string;
  reason: string;
  amount?: number;
  timestamp?: string;
}

export interface IDiscountOrderRecord {
  orderNumber: string;
  totalAmount: number;
  discountPercent: number;
  discountAmount: number;
  actorUsername?: string;
  actorFullName?: string;
  timestamp: string;
}

export interface IInventoryAdjustmentRecord {
  auditNumber: string;
  productName: string;
  systemQty: number;
  actualQty: number;
  diffQty: number;
  actorUsername?: string;
  actorFullName?: string;
  timestamp: string;
}

const DEFAULT_FAILED_LOGIN_THRESHOLD = 5;
const DEFAULT_FAILED_LOGIN_WINDOW_MINUTES = 15;

const DEFAULT_MASS_CANCEL_THRESHOLD = 5;
const DEFAULT_MASS_CANCEL_WINDOW_MINUTES = 10;

const DEFAULT_DISCOUNT_THRESHOLD_PERCENT = 30;
const DEFAULT_INVENTORY_DIFF_THRESHOLD = 50;

/**
 * Helper to resolve username and role label properly from current input or role ID
 */
export const resolveActorInfo = (
  rawUsername?: string | null,
  rawFullName?: string | null
): { username: string; fullName: string } => {
  let cleanUsername = (rawUsername && rawUsername.trim()) ? rawUsername.trim() : "chuho_viet";
  let cleanFullName = (rawFullName && rawFullName.trim()) ? rawFullName.trim() : "";

  // If rawUsername was passed as a role code like "VT-01", "VT-02", etc.
  if (cleanUsername === USER_ROLES.OWNER || cleanUsername === "VT-01") {
    cleanUsername = "chuho_viet";
    cleanFullName = cleanFullName || ROLE_LABELS[USER_ROLES.OWNER]; // "Chủ hộ kinh doanh"
  } else if (cleanUsername === USER_ROLES.CASHIER || cleanUsername === "VT-02") {
    cleanUsername = "nhanvien_viet";
    cleanFullName = cleanFullName || ROLE_LABELS[USER_ROLES.CASHIER]; // "Nhân viên bán hàng"
  } else if (cleanUsername === USER_ROLES.ACCOUNTANT || cleanUsername === "VT-03") {
    cleanUsername = "ketoan_viet";
    cleanFullName = cleanFullName || ROLE_LABELS[USER_ROLES.ACCOUNTANT]; // "Kế toán"
  } else if (cleanUsername === USER_ROLES.PLATFORM_ADMIN || cleanUsername === "VT-04") {
    cleanUsername = "quantri_viet";
    cleanFullName = cleanFullName || ROLE_LABELS[USER_ROLES.PLATFORM_ADMIN]; // "Quản trị nền tảng"
  } else if (cleanUsername === USER_ROLES.TAX_AUTHORITY || cleanUsername === "VT-05") {
    cleanUsername = "thue_viet";
    cleanFullName = cleanFullName || ROLE_LABELS[USER_ROLES.TAX_AUTHORITY]; // "Cơ quan thuế mô phỏng"
  }

  // If fullName is still empty, look up demo accounts or default
  if (!cleanFullName) {
    const demo = DEMO_ACCOUNTS.find(
      (d) => d.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (demo) {
      cleanFullName = demo.roleName;
    } else {
      cleanFullName = "Người dùng thao tác";
    }
  }

  return { username: cleanUsername, fullName: cleanFullName };
};

/**
 * Dispatch notification event to window
 */
const notifyAlertUpdated = () => {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-anomaly-updated"));
      window.dispatchEvent(new Event("storage"));
    }
  } catch {
    /* ignore */
  }
};

/**
 * Lấy danh sách các lần đăng nhập thất bại từ LocalStorage
 */
export const getFailedLoginAttempts = (): IFailedLoginAttempt[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAILED_LOGIN_ATTEMPTS);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore parse error */
  }
  return [];
};

/**
 * Ghi nhận một lần đăng nhập thất bại và kiểm tra quy tắc RAPID_FAILED_LOGINS
 */
export const recordFailedLoginAttempt = (
  username: string,
  reason = "Đăng nhập sai mật khẩu",
  ip = "127.0.0.1"
): IAnomalyAlert | null => {
  const cleanUsername = (username && username.trim()) ? username.trim() : "nguoidung";
  const now = new Date();
  const nowIso = now.toISOString();

  const attempts = getFailedLoginAttempts();
  const newAttempt: IFailedLoginAttempt = {
    username: cleanUsername,
    timestamp: nowIso,
    ip,
    reason,
  };

  const updatedAttempts = [...attempts, newAttempt];

  // Lọc các lần thử trong cửa sổ thời gian (15 phút)
  const windowMillis = DEFAULT_FAILED_LOGIN_WINDOW_MINUTES * 60 * 1000;
  const cutoffTime = now.getTime() - windowMillis;

  const validAttempts = updatedAttempts.filter(
    (a) => new Date(a.timestamp).getTime() >= cutoffTime
  );

  try {
    localStorage.setItem(
      STORAGE_KEYS.FAILED_LOGIN_ATTEMPTS,
      JSON.stringify(validAttempts)
    );
  } catch {
    /* ignore write error */
  }

  // Đếm số lần thất bại của tài khoản này trong cửa sổ 15 phút
  const userAttempts = validAttempts.filter(
    (a) => a.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (userAttempts.length >= DEFAULT_FAILED_LOGIN_THRESHOLD) {
    const alertId = `alt-fail-login-${cleanUsername.toLowerCase()}`;
    const evidence = {
      targetUsername: cleanUsername,
      failedAttemptsCount: userAttempts.length,
      timeWindowMinutes: DEFAULT_FAILED_LOGIN_WINDOW_MINUTES,
      threshold: DEFAULT_FAILED_LOGIN_THRESHOLD,
      recentAttempts: userAttempts.slice(-10).map((a) => ({
        timestamp: a.timestamp,
        reason: a.reason,
        ip: a.ip,
      })),
      detectedAt: nowIso,
    };

    const newAlert: IAnomalyAlert = {
      id: alertId,
      householdId: "hh-current",
      alertType: ANOMALY_ALERT_TYPES.RAPID_FAILED_LOGINS,
      severity: ANOMALY_SEVERITIES.CRITICAL,
      title: `Cảnh báo đăng nhập thất bại liên tiếp (${userAttempts.length} lần trong ${DEFAULT_FAILED_LOGIN_WINDOW_MINUTES} phút)`,
      description: `Tài khoản "${cleanUsername}" đã thử đăng nhập thất bại ${userAttempts.length} lần liên tiếp trong vòng ${DEFAULT_FAILED_LOGIN_WINDOW_MINUTES} phút nghi vấn tấn công dò mật khẩu.`,
      actorUserId: undefined,
      actorUsername: cleanUsername,
      actorFullName: "Người dùng thao tác",
      status: ANOMALY_ALERT_STATUSES.PENDING,
      evidenceData: JSON.stringify(evidence, null, 2),
      detectedAt: nowIso,
      createdAt: nowIso,
    };

    saveLocalAnomalyAlert(newAlert);
    return newAlert;
  }

  return null;
};

/**
 * Ghi nhận một lần hủy hóa đơn và kiểm tra quy tắc MASS_INVOICE_CANCEL
 */
export const recordInvoiceCancellation = (
  record: Omit<ICancelledInvoiceRecord, "timestamp">
): IAnomalyAlert | null => {
  const now = new Date();
  const nowIso = now.toISOString();
  const storageKey = "cancelled_invoices_v1";

  let list: ICancelledInvoiceRecord[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) list = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  const updatedList = [...list, { ...record, timestamp: nowIso }];
  const cutoffTime = now.getTime() - DEFAULT_MASS_CANCEL_WINDOW_MINUTES * 60 * 1000;
  const validList = updatedList.filter(
    (x) => new Date(x.timestamp || 0).getTime() >= cutoffTime
  );

  try {
    localStorage.setItem(storageKey, JSON.stringify(validList));
  } catch {
    /* ignore */
  }

  const { username: cleanActorUsername, fullName: cleanActorFullName } =
    resolveActorInfo(record.actorUsername, record.actorFullName);

  const userCancels = validList.filter(
    (x) =>
      (x.actorUsername || "").toLowerCase() === cleanActorUsername.toLowerCase() ||
      (x.actorUsername || "").toLowerCase() === (record.actorUsername || "").toLowerCase()
  );

  if (userCancels.length >= DEFAULT_MASS_CANCEL_THRESHOLD) {
    const alertId = `alt-mass-cancel-${cleanActorUsername.toLowerCase()}`;
    const evidence = {
      actorUsername: cleanActorUsername,
      actorFullName: cleanActorFullName,
      cancelledCount: userCancels.length,
      timeWindowMinutes: DEFAULT_MASS_CANCEL_WINDOW_MINUTES,
      threshold: DEFAULT_MASS_CANCEL_THRESHOLD,
      invoices: userCancels.slice(-10),
      detectedAt: nowIso,
    };

    const newAlert: IAnomalyAlert = {
      id: alertId,
      householdId: "hh-current",
      alertType: ANOMALY_ALERT_TYPES.MASS_INVOICE_CANCEL,
      severity: ANOMALY_SEVERITIES.CRITICAL,
      title: `Phát hiện tài khoản hủy ${userCancels.length} hóa đơn trong ${DEFAULT_MASS_CANCEL_WINDOW_MINUTES} phút`,
      description: `Tài khoản "${cleanActorUsername}" đã thực hiện hủy ${userCancels.length} hóa đơn điện tử liên tiếp trong khoảng thời gian ngắn nghi vấn gian lận doanh thu.`,
      actorUsername: cleanActorUsername,
      actorFullName: cleanActorFullName,
      status: ANOMALY_ALERT_STATUSES.PENDING,
      evidenceData: JSON.stringify(evidence, null, 2),
      detectedAt: nowIso,
      createdAt: nowIso,
    };

    saveLocalAnomalyAlert(newAlert);
    return newAlert;
  }

  return null;
};

/**
 * Ghi nhận đơn hàng chiết khấu cao và kiểm tra quy tắc UNUSUAL_HIGH_DISCOUNT
 */
export const recordOrderDiscount = (
  record: Omit<IDiscountOrderRecord, "timestamp">
): IAnomalyAlert | null => {
  if (record.discountPercent < DEFAULT_DISCOUNT_THRESHOLD_PERCENT) return null;

  const { username: cleanActorUsername, fullName: cleanActorFullName } =
    resolveActorInfo(record.actorUsername, record.actorFullName);

  const now = new Date();
  const nowIso = now.toISOString();
  const alertId = `alt-high-discount-${record.orderNumber.toLowerCase()}`;

  const evidence = {
    orderNumber: record.orderNumber,
    totalAmount: record.totalAmount,
    discountPercent: record.discountPercent,
    discountAmount: record.discountAmount,
    thresholdPercent: DEFAULT_DISCOUNT_THRESHOLD_PERCENT,
    actorUsername: cleanActorUsername,
    actorFullName: cleanActorFullName,
    detectedAt: nowIso,
  };

  const newAlert: IAnomalyAlert = {
    id: alertId,
    householdId: "hh-current",
    alertType: ANOMALY_ALERT_TYPES.UNUSUAL_HIGH_DISCOUNT,
    severity: ANOMALY_SEVERITIES.WARNING,
    title: `Chiết khấu đơn hàng ${record.orderNumber} vượt mức (${record.discountPercent}%)`,
    description: `Đơn hàng ${record.orderNumber} được áp dụng mức giảm giá ${record.discountPercent}% (trị giá ${record.discountAmount?.toLocaleString("vi-VN")}đ), vượt ngưỡng an toàn ${DEFAULT_DISCOUNT_THRESHOLD_PERCENT}%.`,
    actorUsername: cleanActorUsername,
    actorFullName: cleanActorFullName,
    status: ANOMALY_ALERT_STATUSES.PENDING,
    evidenceData: JSON.stringify(evidence, null, 2),
    detectedAt: nowIso,
    createdAt: nowIso,
  };

  saveLocalAnomalyAlert(newAlert);
  return newAlert;
};

/**
 * Ghi nhận điều chỉnh kiểm kê chênh lệch lớn và kiểm tra quy tắc LARGE_INVENTORY_ADJUSTMENT
 */
export const recordInventoryAdjustment = (
  record: Omit<IInventoryAdjustmentRecord, "timestamp">
): IAnomalyAlert | null => {
  if (Math.abs(record.diffQty) < DEFAULT_INVENTORY_DIFF_THRESHOLD) return null;

  const { username: cleanActorUsername, fullName: cleanActorFullName } =
    resolveActorInfo(record.actorUsername, record.actorFullName);

  const now = new Date();
  const nowIso = now.toISOString();
  const alertId = `alt-inventory-diff-${record.auditNumber.toLowerCase()}`;

  const evidence = {
    auditNumber: record.auditNumber,
    productName: record.productName,
    systemQty: record.systemQty,
    actualQty: record.actualQty,
    differenceQty: record.diffQty,
    threshold: DEFAULT_INVENTORY_DIFF_THRESHOLD,
    actorUsername: cleanActorUsername,
    actorFullName: cleanActorFullName,
    detectedAt: nowIso,
  };

  const newAlert: IAnomalyAlert = {
    id: alertId,
    householdId: "hh-current",
    alertType: ANOMALY_ALERT_TYPES.LARGE_INVENTORY_ADJUSTMENT,
    severity: ANOMALY_SEVERITIES.WARNING,
    title: `Chênh lệch kiểm kê kho lớn tại phiếu ${record.auditNumber} (${record.diffQty > 0 ? "+" : ""}${record.diffQty} sản phẩm)`,
    description: `Phiếu kiểm kê ${record.auditNumber} ghi nhận điều chỉnh chênh lệch ${record.diffQty} sản phẩm đối với mặt hàng "${record.productName}", vượt ngưỡng kiểm soát ${DEFAULT_INVENTORY_DIFF_THRESHOLD} sản phẩm.`,
    actorUsername: cleanActorUsername,
    actorFullName: cleanActorFullName,
    status: ANOMALY_ALERT_STATUSES.PENDING,
    evidenceData: JSON.stringify(evidence, null, 2),
    detectedAt: nowIso,
    createdAt: nowIso,
  };

  saveLocalAnomalyAlert(newAlert);
  return newAlert;
};

/**
 * Lấy danh sách toàn bộ cảnh báo bất thường được lưu ở LocalStorage
 */
export const getLocalAnomalyAlerts = (): IAnomalyAlert[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_ANOMALY_ALERTS);
    if (raw) {
      const parsed: IAnomalyAlert[] = JSON.parse(raw);
      return parsed.map((a) => {
        const { username, fullName } = resolveActorInfo(a.actorUsername, a.actorFullName);
        const originalUsername = a.actorUsername || "";
        let title = a.title || "";
        let description = a.description || "";
        if (originalUsername.startsWith("VT-")) {
          title = title.replace(new RegExp(`"${originalUsername}"`, "g"), `"${username}"`);
          description = description.replace(new RegExp(`"${originalUsername}"`, "g"), `"${username}"`);
        }
        return {
          ...a,
          actorUsername: username,
          actorFullName: fullName,
          title,
          description,
        };
      });
    }
  } catch {
    /* ignore parse error */
  }
  return [];
};

/**
 * Lưu hoặc cập nhật một cảnh báo bất thường vào LocalStorage
 */
export const saveLocalAnomalyAlert = (alert: IAnomalyAlert): void => {
  try {
    const alerts = getLocalAnomalyAlerts();
    const existingIndex = alerts.findIndex((a) => a.id === alert.id);

    let updatedAlerts: IAnomalyAlert[];
    if (existingIndex >= 0) {
      const existing = alerts[existingIndex];
      updatedAlerts = [...alerts];
      updatedAlerts[existingIndex] = {
        ...alert,
        status:
          existing.status !== ANOMALY_ALERT_STATUSES.PENDING
            ? existing.status
            : alert.status,
        reviewNotes: existing.reviewNotes || alert.reviewNotes,
        reviewedAt: existing.reviewedAt || alert.reviewedAt,
        reviewedByUsername:
          existing.reviewedByUsername || alert.reviewedByUsername,
      };
    } else {
      updatedAlerts = [alert, ...alerts];
    }

    localStorage.setItem(
      STORAGE_KEYS.LOCAL_ANOMALY_ALERTS,
      JSON.stringify(updatedAlerts)
    );
    notifyAlertUpdated();
  } catch {
    /* ignore write error */
  }
};

/**
 * Cập nhật trạng thái đánh giá/xử lý cảnh báo (Review / Dismiss)
 */
export const updateLocalAnomalyAlert = (
  alertId: string,
  status: TAnomalyAlertStatus,
  reviewNotes: string,
  reviewedByUsername?: string
): IAnomalyAlert | null => {
  try {
    const alerts = getLocalAnomalyAlerts();
    const target = alerts.find((a) => a.id === alertId);

    const nowIso = new Date().toISOString();
    let updatedTarget: IAnomalyAlert;

    if (target) {
      updatedTarget = {
        ...target,
        status,
        reviewNotes,
        reviewedAt: nowIso,
        reviewedByUsername: reviewedByUsername || "Chủ hộ",
      };
      const updatedList = alerts.map((a) =>
        a.id === alertId ? updatedTarget : a
      );
      localStorage.setItem(
        STORAGE_KEYS.LOCAL_ANOMALY_ALERTS,
        JSON.stringify(updatedList)
      );
      notifyAlertUpdated();
      return updatedTarget;
    } else {
      updatedTarget = {
        id: alertId,
        householdId: "DEMO_HOUSEHOLD",
        alertType: ANOMALY_ALERT_TYPES.AUDIT_CHAIN_BREACH,
        severity: ANOMALY_SEVERITIES.CRITICAL,
        title: "Cảnh báo bất thường",
        description: "",
        status,
        reviewNotes,
        reviewedAt: nowIso,
        reviewedByUsername: reviewedByUsername || "Chủ hộ",
        detectedAt: nowIso,
        createdAt: nowIso,
      };
      localStorage.setItem(
        STORAGE_KEYS.LOCAL_ANOMALY_ALERTS,
        JSON.stringify([updatedTarget, ...alerts])
      );
      notifyAlertUpdated();
      return updatedTarget;
    }
  } catch {
    return null;
  }
};
