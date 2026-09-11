import type {
  IShiftRevenueItem,
  IEmployeeRevenueSummary,
  IShiftRevenueReportResponse,
  IShiftOrderPreview,
} from "../types/IShiftRevenueReport";

const SAMPLE_ORDERS_POOL: IShiftOrderPreview[] = [
  {
    id: "ord-001",
    orderCode: "HD-260901-01",
    customerName: "Nguyễn Thị Mai (Khách lẻ)",
    createdAt: "08:15:20",
    totalAmount: 185000,
    paymentMethod: "CASH",
    status: "COMPLETED",
  },
  {
    id: "ord-002",
    orderCode: "HD-260901-02",
    customerName: "Anh Tuấn - Tiệm thuốc",
    createdAt: "09:30:10",
    totalAmount: 420000,
    paymentMethod: "TRANSFER",
    status: "COMPLETED",
  },
  {
    id: "ord-003",
    orderCode: "HD-260901-03",
    customerName: "Chị Lan - Tạp hóa",
    createdAt: "10:45:00",
    totalAmount: 310000,
    paymentMethod: "CASH",
    status: "COMPLETED",
  },
  {
    id: "ord-004",
    orderCode: "HD-260901-04",
    customerName: "Khách lẻ vãng lai",
    createdAt: "11:15:30",
    totalAmount: 95000,
    paymentMethod: "TRANSFER",
    status: "COMPLETED",
  },
  {
    id: "ord-005",
    orderCode: "HD-260901-05",
    customerName: "Bác Hùng (Khách quen)",
    createdAt: "11:55:00",
    totalAmount: 150000,
    paymentMethod: "CASH",
    status: "CANCELED",
  },
];

export const generateMockShiftRevenueData = (
  fromDate: string,
  toDate: string,
  selectedEmployeeId?: string,
  threshold: number = 50000,
  onlyDiscrepancy: boolean = false
): IShiftRevenueReportResponse => {
  // Bộ dữ liệu ca làm việc mẫu
  const baseShifts: IShiftRevenueItem[] = [
    {
      shiftId: "shift-101",
      shiftCode: "CA-20260901-01",
      userId: "emp-001",
      username: "cashier01",
      fullName: "Nguyễn Văn An",
      posId: "pos-01",
      posName: "Quầy 01 - Cửa Hàng Chính",
      openedAt: `${fromDate} 07:00:00`,
      closedAt: `${fromDate} 12:30:00`,
      durationMinutes: 330,
      openingCash: 500000,
      cashRevenue: 2850000,
      transferRevenue: 3400000,
      otherRevenue: 0,
      totalRevenue: 6250000,
      cashIn: 0,
      cashOut: 150000, // Chi trả tiền rác / ship
      completedOrdersCount: 28,
      canceledOrdersCount: 1,
      closingCashExpected: 3200000, // 500k + 2850k - 150k
      closingCashActual: 3200000,
      differenceAmount: 0,
      differenceReason: null,
      isOverThreshold: false,
      orders: SAMPLE_ORDERS_POOL,
    },
    {
      shiftId: "shift-102",
      shiftCode: "CA-20260901-02",
      userId: "emp-002",
      username: "cashier02",
      fullName: "Trần Thị Bình",
      posId: "pos-01",
      posName: "Quầy 01 - Cửa Hàng Chính",
      openedAt: `${fromDate} 12:30:00`,
      closedAt: `${fromDate} 18:00:00`,
      durationMinutes: 330,
      openingCash: 500000,
      cashRevenue: 3120000,
      transferRevenue: 4250000,
      otherRevenue: 0,
      totalRevenue: 7370000,
      cashIn: 200000, // Khách trả nợ cũ
      cashOut: 0,
      completedOrdersCount: 34,
      canceledOrdersCount: 2,
      closingCashExpected: 3820000, // 500k + 3120k + 200k
      closingCashActual: 3835000,
      differenceAmount: 15000, // +15.000 đ
      differenceReason: "Khách mua lẻ không nhận lại 15.000đ tiền thối",
      isOverThreshold: Math.abs(15000) >= threshold,
      orders: SAMPLE_ORDERS_POOL,
    },
    {
      shiftId: "shift-103",
      shiftCode: "CA-20260902-01",
      userId: "emp-003",
      username: "cashier03",
      fullName: "Lê Hoàng Nam",
      posId: "pos-02",
      posName: "Quầy 02 - Chi Nhánh Phố Huế",
      openedAt: `${toDate} 07:15:00`,
      closedAt: `${toDate} 13:00:00`,
      durationMinutes: 345,
      openingCash: 500000,
      cashRevenue: 1950000,
      transferRevenue: 2100000,
      otherRevenue: 0,
      totalRevenue: 4050000,
      cashIn: 0,
      cashOut: 50000,
      completedOrdersCount: 19,
      canceledOrdersCount: 0,
      closingCashExpected: 2400000,
      closingCashActual: 2150000, // Lệch -250.000 đ (Vượt ngưỡng TC-02)
      differenceAmount: -250000,
      differenceReason: "Nhầm lẫn tiền thối cho đơn thanh toán tiền mặt giá trị lớn #HD-089",
      isOverThreshold: Math.abs(-250000) >= threshold,
      orders: SAMPLE_ORDERS_POOL,
    },
    {
      shiftId: "shift-104",
      shiftCode: "CA-20260902-02",
      userId: "emp-001",
      username: "cashier01",
      fullName: "Nguyễn Văn An",
      posId: "pos-01",
      posName: "Quầy 01 - Cửa Hàng Chính",
      openedAt: `${toDate} 13:00:00`,
      closedAt: `${toDate} 18:30:00`,
      durationMinutes: 330,
      openingCash: 500000,
      cashRevenue: 4100000,
      transferRevenue: 5200000,
      otherRevenue: 0,
      totalRevenue: 9300000,
      cashIn: 0,
      cashOut: 0,
      completedOrdersCount: 42,
      canceledOrdersCount: 1,
      closingCashExpected: 4600000,
      closingCashActual: 4600000,
      differenceAmount: 0,
      differenceReason: null,
      isOverThreshold: false,
      orders: SAMPLE_ORDERS_POOL,
    },
    {
      shiftId: "shift-105",
      shiftCode: "CA-20260903-01",
      userId: "emp-004",
      username: "cashier04",
      fullName: "Phạm Thu Hà",
      posId: "pos-02",
      posName: "Quầy 02 - Chi Nhánh Phố Huế",
      openedAt: `${fromDate} 07:30:00`,
      closedAt: `${fromDate} 12:45:00`,
      durationMinutes: 315,
      openingCash: 600000,
      cashRevenue: 2200000,
      transferRevenue: 3100000,
      otherRevenue: 0,
      totalRevenue: 5300000,
      cashIn: 0,
      cashOut: 100000,
      completedOrdersCount: 25,
      canceledOrdersCount: 0,
      closingCashExpected: 2700000,
      closingCashActual: 2700000,
      differenceAmount: 0,
      differenceReason: null,
      isOverThreshold: false,
      orders: SAMPLE_ORDERS_POOL,
    },
    {
      shiftId: "shift-106",
      shiftCode: "CA-20260903-02",
      userId: "emp-002",
      username: "cashier02",
      fullName: "Trần Thị Bình",
      posId: "pos-01",
      posName: "Quầy 01 - Cửa Hàng Chính",
      openedAt: `${toDate} 13:00:00`,
      closedAt: `${toDate} 19:15:00`,
      durationMinutes: 375,
      openingCash: 500000,
      cashRevenue: 3800000,
      transferRevenue: 4900000,
      otherRevenue: 0,
      totalRevenue: 8700000,
      cashIn: 0,
      cashOut: 0,
      completedOrdersCount: 38,
      canceledOrdersCount: 1,
      closingCashExpected: 4300000,
      closingCashActual: 4380000, // Lệch +80.000 đ (Vượt ngưỡng TC-02)
      differenceAmount: 80000,
      differenceReason: "Thu tiền khách trả bù tiền nợ đơn hôm trước chưa kịp vào sổ",
      isOverThreshold: Math.abs(80000) >= threshold,
      orders: SAMPLE_ORDERS_POOL,
    },
  ];

  // Lọc theo nhân viên nếu có
  let filteredShifts = baseShifts;
  if (selectedEmployeeId && selectedEmployeeId.trim() !== "") {
    filteredShifts = filteredShifts.filter((s) => s.userId === selectedEmployeeId);
  }

  // Cập nhật lại cờ isOverThreshold dựa theo threshold hiện tại
  filteredShifts = filteredShifts.map((s) => ({
    ...s,
    isOverThreshold: Math.abs(s.differenceAmount) >= threshold && s.differenceAmount !== 0,
  }));

  // Lọc chỉ ca có chênh lệch nếu bật toggle
  if (onlyDiscrepancy) {
    filteredShifts = filteredShifts.filter((s) => s.differenceAmount !== 0);
  }

  // Tổng hợp theo nhân viên (Employee Aggregation)
  const employeeMap = new Map<string, IShiftRevenueItem[]>();
  baseShifts.forEach((s) => {
    if (!employeeMap.has(s.userId)) {
      employeeMap.set(s.userId, []);
    }
    employeeMap.get(s.userId)!.push(s);
  });

  const employeeSummaries: IEmployeeRevenueSummary[] = Array.from(employeeMap.entries()).map(
    ([userId, shifts]) => {
      const userShifts = selectedEmployeeId ? shifts.filter((s) => s.userId === selectedEmployeeId) : shifts;
      const count = userShifts.length;
      const totalRev = userShifts.reduce((acc, c) => acc + c.totalRevenue, 0);
      const cashRev = userShifts.reduce((acc, c) => acc + c.cashRevenue, 0);
      const transferRev = userShifts.reduce((acc, c) => acc + c.transferRevenue, 0);
      const totalOrders = userShifts.reduce((acc, c) => acc + c.completedOrdersCount, 0);
      const totalCanceled = userShifts.reduce((acc, c) => acc + c.canceledOrdersCount, 0);
      const totalDiff = userShifts.reduce((acc, c) => acc + c.differenceAmount, 0);
      const diffShiftsCount = userShifts.filter((s) => s.differenceAmount !== 0).length;
      const overThreshCount = userShifts.filter((s) => Math.abs(s.differenceAmount) >= threshold && s.differenceAmount !== 0).length;

      const matchedCount = count - diffShiftsCount;
      const reliabilityRate = count > 0 ? Math.round((matchedCount / count) * 100) : 100;

      const first = userShifts[0] || shifts[0];
      return {
        userId,
        username: first.username,
        fullName: first.fullName,
        shiftsCount: count,
        totalRevenue: totalRev,
        cashRevenue: cashRev,
        transferRevenue: transferRev,
        avgRevenuePerShift: count > 0 ? Math.round(totalRev / count) : 0,
        totalOrdersCount: totalOrders,
        totalCanceledOrdersCount: totalCanceled,
        discrepancyShiftsCount: diffShiftsCount,
        overThresholdShiftsCount: overThreshCount,
        totalDiscrepancyAmount: totalDiff,
        reliabilityRate,
      };
    }
  ).filter((e) => e.shiftsCount > 0);

  // Tính toán KPIs toàn bộ
  const totalRev = filteredShifts.reduce((acc, c) => acc + c.totalRevenue, 0);
  const totalCash = filteredShifts.reduce((acc, c) => acc + c.cashRevenue, 0);
  const totalTransfer = filteredShifts.reduce((acc, c) => acc + c.transferRevenue, 0);
  const totalOrders = filteredShifts.reduce((acc, c) => acc + c.completedOrdersCount, 0);
  const totalCanceled = filteredShifts.reduce((acc, c) => acc + c.canceledOrdersCount, 0);
  const totalDiff = filteredShifts.reduce((acc, c) => acc + c.differenceAmount, 0);
  const overThresholdCount = filteredShifts.filter((s) => s.isOverThreshold).length;

  return {
    fromDate,
    toDate,
    threshold,
    totalShifts: filteredShifts.length,
    totalRevenue: totalRev,
    totalCashRevenue: totalCash,
    totalTransferRevenue: totalTransfer,
    totalOrders,
    totalCanceledOrders: totalCanceled,
    totalDiscrepancyAmount: totalDiff,
    overThresholdCount,
    shifts: filteredShifts,
    employeeSummaries,
  };
};
