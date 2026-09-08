import type { IFailedDeliveryItem, IRetryDeliveryRequest } from "../types/IInvoiceDelivery";

const FAILED_DELIVERIES_STORAGE_KEY = "bhv_failed_invoice_deliveries";

export const INITIAL_MOCK_FAILED_DELIVERIES: IFailedDeliveryItem[] = [
  {
    id: "fail-001",
    invoiceId: "inv-mock-001",
    invoiceNumber: "HD000281",
    lookupCode: "LK89A21B",
    customerName: "Nguyễn Văn An",
    customerPhone: "0912345678",
    customerEmail: "nguyen.an@gmial..com",
    channel: "EMAIL",
    recipientAddress: "nguyen.an@gmial..com",
    failureReason: "Địa chỉ email không tồn tại hoặc sai cú pháp tên miền (550 Mailbox not found)",
    failureCode: "ERR_EMAIL_INVALID_SYNTAX",
    lastAttemptAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
    attemptCount: 1,
    history: [
      {
        attempt: 1,
        channel: "EMAIL",
        recipientAddress: "nguyen.an@gmial..com",
        errorMessage: "SMTP error: 550 Mailbox not found or syntax error in domain.",
        sentAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "fail-002",
    invoiceId: "inv-mock-002",
    invoiceNumber: "HD000282",
    lookupCode: "LK74D90C",
    customerName: "Trần Thị Mai (Tạp hóa Mai Linh)",
    customerPhone: "0987654321",
    customerEmail: "mai.linh.taphoa@vietnam-retail.vn",
    channel: "EMAIL",
    recipientAddress: "mai.linh.taphoa@vietnam-retail.vn",
    failureReason: "Hộp thư người nhận bị đầy, máy chủ từ chối nhận thêm thư (552 Mailbox quota exceeded)",
    failureCode: "ERR_EMAIL_QUOTA_EXCEEDED",
    lastAttemptAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
    attemptCount: 2,
    history: [
      {
        attempt: 1,
        channel: "EMAIL",
        recipientAddress: "mai.linh.taphoa@vietnam-retail.vn",
        errorMessage: "552 5.2.2 Mailbox is full / Quota exceeded",
        sentAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      },
      {
        attempt: 2,
        channel: "EMAIL",
        recipientAddress: "mai.linh.taphoa@vietnam-retail.vn",
        errorMessage: "552 5.2.2 Mailbox is full / Quota exceeded",
        sentAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "fail-003",
    invoiceId: "inv-mock-003",
    invoiceNumber: "HD000285",
    lookupCode: "LK52F11E",
    customerName: "Lê Hoàng Quân",
    customerPhone: "0905123999",
    customerEmail: "quan.le@gmail.com",
    channel: "ZALO",
    recipientAddress: "0905123999",
    failureReason: "Số điện thoại chưa kích hoạt Zalo hoặc chặn nhận tin nhắn từ Zalo Doanh nghiệp",
    failureCode: "ERR_ZALO_USER_NOT_REGISTERED",
    lastAttemptAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
    attemptCount: 1,
    history: [
      {
        attempt: 1,
        channel: "ZALO",
        recipientAddress: "0905123999",
        errorMessage: "Zalo OA API: -216 User not found or blocked OA messages.",
        sentAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
];

export function getStoredFailedDeliveries(): IFailedDeliveryItem[] {
  try {
    const raw = localStorage.getItem(FAILED_DELIVERIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FAILED_DELIVERIES_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_FAILED_DELIVERIES));
      return INITIAL_MOCK_FAILED_DELIVERIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_FAILED_DELIVERIES;
  }
}

export function saveStoredFailedDeliveries(items: IFailedDeliveryItem[]): void {
  try {
    localStorage.setItem(FAILED_DELIVERIES_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore storage error */
  }
}

export function removeFailedDelivery(invoiceId: string): void {
  const current = getStoredFailedDeliveries();
  const updated = current.filter((item) => item.invoiceId !== invoiceId && item.lookupCode !== invoiceId);
  saveStoredFailedDeliveries(updated);
}

export function recordFailedDeliveryAttempt(
  req: IRetryDeliveryRequest,
  success: boolean,
  errorMessage?: string
): IFailedDeliveryItem | null {
  const current = getStoredFailedDeliveries();
  const itemIndex = current.findIndex((item) => item.invoiceId === req.invoiceId || item.lookupCode === req.invoiceId);

  if (success) {
    if (itemIndex >= 0) {
      current.splice(itemIndex, 1);
      saveStoredFailedDeliveries(current);
    }
    return null;
  }

  const now = new Date().toISOString();
  if (itemIndex >= 0) {
    const target = current[itemIndex];
    const newAttempt = target.attemptCount + 1;
    target.attemptCount = newAttempt;
    target.channel = req.channel;
    target.recipientAddress = req.recipientAddress;
    target.lastAttemptAt = now;
    target.failureReason = errorMessage || "Gửi lại thất bại, vui lòng kiểm tra kết nối";
    target.history.unshift({
      attempt: newAttempt,
      channel: req.channel,
      recipientAddress: req.recipientAddress,
      errorMessage: errorMessage || "Gửi lại thất bại",
      sentAt: now,
    });
    current[itemIndex] = target;
    saveStoredFailedDeliveries(current);
    return target;
  } else {
    const newItem: IFailedDeliveryItem = {
      id: `fail-${Date.now()}`,
      invoiceId: req.invoiceId,
      lookupCode: req.invoiceId,
      channel: req.channel,
      recipientAddress: req.recipientAddress,
      failureReason: errorMessage || "Gửi thất bại",
      lastAttemptAt: now,
      attemptCount: 1,
      history: [
        {
          attempt: 1,
          channel: req.channel,
          recipientAddress: req.recipientAddress,
          errorMessage: errorMessage || "Gửi thất bại",
          sentAt: now,
        },
      ],
    };
    current.unshift(newItem);
    saveStoredFailedDeliveries(current);
    return newItem;
  }
}
