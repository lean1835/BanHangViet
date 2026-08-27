export interface IPosRevenueItem {
  posId: string;
  posName: string;
  posCode: string;
  address: string;
  orderCount: number;
  totalAmount: number;
  discountAmount: number;
  netRevenue: number;
  invoiceCount: number;
  revenueProportion: number; // Tỷ trọng % so với tổng hộ
  isDefault: boolean;
  isActive: boolean;
}

export interface IPosRevenueSummary {
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  totalOrders: number;
  totalInvoices: number;
  topPerformingPosName?: string;
  items: IPosRevenueItem[];
}
