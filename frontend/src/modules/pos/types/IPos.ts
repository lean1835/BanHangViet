import type { IProduct } from "@/modules/product/types/IProduct";
import type { ICustomer } from "@/modules/customer/types/ICustomer";
import type { IOrderPaymentRequest } from "@/modules/order/types/IOrder";

export const SALE_MODES = {
  FAST: "FAST",
  NORMAL: "NORMAL",
} as const;

export const PAYMENT_METHODS = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  DEBT: "DEBT",
  COMBINED: "COMBINED",
} as const;

export const ORDER_STATUSES = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
} as const;

export const DISCOUNT_TYPES = {
  PERCENTAGE: "PERCENTAGE",
  CASH: "CASH",
} as const;

export type TSaleMode = (typeof SALE_MODES)[keyof typeof SALE_MODES];
export type TPaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];
export type TOrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];
export type TDiscountType = (typeof DISCOUNT_TYPES)[keyof typeof DISCOUNT_TYPES];

export interface IPosCartItem {
  id: string; // unique item line id or product id
  product: IProduct;
  quantity: number;
  price: number; // unit price (original or effective)
  lineDiscount: number; // discount amount for this line (total discount)
  lineTotal: number; // final amount after promotion discount: (quantity * price) - lineDiscount
  backendItemId?: string;
  promotionId?: string | null;
  promotionName?: string | null;
  hasPromotion?: boolean;
  bypassPromotion?: boolean;
  priceTierId?: string | null;
  priceTierName?: string | null;
  baseRetailPrice?: number;
  originalSubtotal?: number;
  unitConversionId?: string | null;
  unitName?: string;
  conversionFactor?: number;
  buyAmount?: number;
  roundingDifference?: number;
  isSoldByWeight?: boolean;
  decimalPlaces?: number;
  minWeightStep?: number;
}

export interface IPosTab {
  id: string; // local tab UUID
  orderNumber: string; // e.g., "Hóa đơn 1"
  status: TOrderStatus;
  backendOrderId?: string;
  customerId?: string;
  customer?: ICustomer | null;
  saleMode: TSaleMode;
  items: IPosCartItem[];
  discountType: TDiscountType;
  discountValue: number;
  paymentMethod: TPaymentMethod;
  amountGiven: number;
  vatRate?: number; // Order VAT rate percentage (e.g. 0, 5, 8, 10)
  isSaved: boolean;
  // NCL-03-CN-010: Đặt tên nhận diện và treo nhiều đơn theo bàn hoặc khách
  orderLabel?: string;
  diningTableId?: string;
  diningTableName?: string;
  diningTableArea?: string;
  isOverdue?: boolean;
  holdingDurationMinutes?: number;
  // NCL-03-CN-011 & NCL-03-CN-012: Thanh toán kết hợp & Xác nhận chuyển khoản
  combinedPayments?: IOrderPaymentRequest[];
  dueDate?: string;
  bankTransferConfirmed?: boolean;
  bankTransferTxCode?: string;
  qrCodeUrl?: string | null;
}
