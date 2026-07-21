import type { TEInvoiceStatus } from "@/constants/eInvoice";

export type TInvoiceStatus = TEInvoiceStatus;

export interface IInvoice {
  id: string;
  lookupCode: string;
  symbol: string;
  customer: string;
  amount: number;
  taxAmount: number;
  finalAmount: number;
  status: TInvoiceStatus;
  taxAuthorityCode: string;
  time: string;
}
