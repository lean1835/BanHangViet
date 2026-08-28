export const SALES_ANALYTICS_COPY = {
  PEAK_HOURS: {
    TITLE: "Phân tích giờ cao điểm & ngày bán chạy",
    SUBTITLE:
      "Nhận diện khung giờ đông khách và ngày bán chạy nhất để tối ưu xếp ca nhân viên và chuẩn bị nguồn hàng phục vụ",
    HEATMAP_TITLE: "Biểu đồ nhiệt phân bố bán hàng (Heatmap 7 ngày x 24 giờ)",
    HEATMAP_SUBTITLE:
      "Màu sắc càng đậm thể hiện doanh thu và lượng giao dịch càng tập trung cao",
    HOURLY_CHART_TITLE: "Phân tích doanh thu 24 khung giờ",
    DAY_OF_WEEK_CHART_TITLE: "Phân tích doanh thu các ngày trong tuần",
    INSIGHTS_TITLE: "Thông tin thông minh & Khuyến nghị quản trị",
    EMPTY_STATE_TITLE: "Chưa đủ dữ liệu phân tích bán hàng",
    EMPTY_STATE_DESC:
      "Cần ít nhất một vài giao dịch hoàn thành trong khoảng thời gian đã chọn để hệ thống xây dựng biểu đồ nhiệt và đưa ra gợi ý xếp ca chính xác.",
    KPI: {
      TOTAL_ORDERS: "Tổng số đơn hàng",
      TOTAL_REVENUE: "Tổng doanh thu kỳ",
      AVERAGE_ORDER_VALUE: "Giá trị trung bình / đơn",
      BUSIEST_DAY: "Ngày bán chạy nhất",
      PEAK_HOUR: "Khung giờ vàng",
      QUIETEST_HOUR: "Khung giờ vắng khách",
    },
    PERMISSION_DENIED_TITLE: "Quyền truy cập bị giới hạn",
    PERMISSION_DENIED_DESC:
      "Báo cáo phân tích giờ cao điểm và doanh thu tổng chỉ dành cho Chủ hộ kinh doanh (VT-01) và Kế toán (VT-03).",
    ALL_POS: "Tất cả điểm bán",
  },
  SLOW_MOVING: {
    TITLE: "Cảnh báo mặt hàng bán chậm & tồn lâu",
    SUBTITLE:
      "Kiểm soát các mặt hàng không phát sinh giao dịch trong thời gian dài để kịp thời có kế hoạch xả hàng hoặc kiểm kê thu hồi vốn",
    TAB_LABEL: "Hàng bán chậm & tồn lâu",
    KPI: {
      TOTAL_PRODUCTS: "Mặt hàng đọng vốn",
      TOTAL_STOCK: "Tổng số lượng tồn đọng",
      TOTAL_CAPITAL: "Tổng vốn đọng (Giá vốn)",
      TOTAL_RETAIL: "Giá trị bán lẻ ước tính",
    },
    THRESHOLD_LABEL: "Ngưỡng không bán quá:",
    THRESHOLD_UNIT: "ngày",
    EMPTY_STATE_TITLE: "Không có hàng tồn đọng quá hạn",
    EMPTY_STATE_DESC:
      "Tất cả mặt hàng trong kho đều phát sinh giao dịch bán hàng trong vòng số ngày đã chọn. Tồn kho đang được luân chuyển tốt.",
    PERMISSION_DENIED_TITLE: "Quyền truy cập bị giới hạn",
    PERMISSION_DENIED_DESC:
      "Thông tin giá vốn và hàng tồn đọng lâu chỉ dành cho Chủ hộ kinh doanh (VT-01) và Kế toán (VT-03) theo dõi.",
    TABLE_HEADERS: {
      INDEX: "STT",
      SKU: "Mã SKU",
      PRODUCT_NAME: "Tên mặt hàng",
      GROUP: "Nhóm hàng",
      UNIT: "Đơn vị",
      STOCK: "Tồn kho",
      DAYS_WITHOUT_SALE: "Số ngày chưa bán",
      COST_PRICE: "Giá vốn",
      PRICE: "Giá bán",
      STAGNANT_CAPITAL: "Vốn đang đọng",
      LAST_SALE_DATE: "Lần bán cuối",
      ACTIONS: "Thao tác",
    },
    ACTIONS: {
      CREATE_PROMOTION: "Tạo khuyến mại xả hàng",
      INVENTORY_AUDIT: "Kiểm kê kho",
    },
  },
} as const;

export const SLOW_MOVING_THRESHOLDS = [
  { value: 30, label: "30 ngày (1 tháng)" },
  { value: 60, label: "60 ngày (2 tháng - Khuyên dùng)" },
  { value: 90, label: "90 ngày (1 quý)" },
  { value: 180, label: "180 ngày (6 tháng)" },
  { value: 365, label: "365 ngày (1 năm)" },
] as const;

export const HEATMAP_INTENSITY_GRADIENTS = [
  { threshold: 0.0, bg: "bg-slate-50", text: "text-slate-400", border: "border-slate-100" },
  { threshold: 0.2, bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-200" },
  { threshold: 0.4, bg: "bg-blue-200", text: "text-blue-900", border: "border-blue-300" },
  { threshold: 0.7, bg: "bg-indigo-400 text-white", text: "text-white", border: "border-indigo-500" },
  { threshold: 1.0, bg: "bg-blue-700 text-white", text: "text-white", border: "border-blue-800" },
] as const;
