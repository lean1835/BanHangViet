import type { IProduct } from "@/modules/product/types/IProduct";
import type { ICustomer } from "@/modules/customer/types/ICustomer";

export const SALE_MODES = {
  FAST: "FAST",
  NORMAL: "NORMAL",
} as const;

export const PAYMENT_METHODS = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  DEBT: "DEBT",
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
  price: number;
  lineDiscount: number;
  lineTotal: number;
  backendItemId?: string;
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
}
