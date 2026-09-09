export interface IShiftRevenueItem {
  shiftId: string;
  shiftCode: string;
  userId: string;
  username: string;
  fullName: string;
  posId?: string;
  posName?: string;
  openedAt: string;
  closedAt: string;
  durationMinutes: number;

  // Doanh thu & Dòng tiền
  openingCash: number;
  cashRevenue: number;
  transferRevenue: number;
  otherRevenue: number;
  totalRevenue: number;

  // Thu chi trong ca
  cashIn: number;
  cashOut: number;

  // Đơn hàng
  completedOrdersCount: number;
  canceledOrdersCount: number;

  // Đối soát két tiền
  closingCashExpected: number;
  closingCashActual: number;
  differenceAmount: number; // actual - expected
  differenceReason?: string | null;
  isOverThreshold: boolean;

  // Danh sách đơn hàng trong ca (cho Drawer chi tiết)
  orders?: IShiftOrderPreview[];
}

export interface IShiftOrderPreview {
  id: string;
  orderCode: string;
  customerName?: string;
  createdAt: string;
  totalAmount: number;
  paymentMethod: "CASH" | "TRANSFER" | "OTHER";
  status: "COMPLETED" | "CANCELED";
}

export interface IEmployeeRevenueSummary {
  userId: string;
  username: string;
  fullName: string;
  shiftsCount: number;
  totalRevenue: number;
  cashRevenue: number;
  transferRevenue: number;
  avgRevenuePerShift: number;
  totalOrdersCount: number;
  totalCanceledOrdersCount: number;
  discrepancyShiftsCount: number;
  overThresholdShiftsCount: number;
  totalDiscrepancyAmount: number;
  reliabilityRate: number; // Tỷ lệ % ca khớp tiền / an toàn
}

export interface IShiftRevenueReportFilter {
  fromDate: string;
  toDate: string;
  employeeId?: string;
  threshold?: number;
  onlyDiscrepancy?: boolean;
}

export interface IShiftRevenueReportResponse {
  fromDate: string;
  toDate: string;
  threshold: number;
  totalShifts: number;
  totalRevenue: number;
  totalCashRevenue: number;
  totalTransferRevenue: number;
  totalOrders: number;
  totalCanceledOrders: number;
  totalDiscrepancyAmount: number;
  overThresholdCount: number;
  shifts: IShiftRevenueItem[];
  employeeSummaries: IEmployeeRevenueSummary[];
}
