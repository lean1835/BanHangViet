import type { IScreenGuideResponse } from "../types/screenGuide.types";

export const DEFAULT_SCREEN_GUIDES: Record<string, IScreenGuideResponse> = {
  SCREEN_PRODUCT_MANAGEMENT: {
    id: "guide-product",
    screenCode: "SCREEN_PRODUCT_MANAGEMENT",
    screenName: "Quản lý danh mục hàng hóa",
    description: "Khai báo hàng mới, mã vạch barcode, giá bán và kiểm soát tồn kho",
    actionUrl: "/products",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Tìm kiếm & Lọc tồn kho",
        content: "Tra cứu sản phẩm và kiểm tra tình trạng kho hàng.",
        targetElementSelector: "#product-search-input",
        buttonLabel: "Tìm kiếm & Lọc",
        details: [
          "Quét mã vạch hoặc gõ tên trên ô tìm kiếm trên cùng.",
          "Cột bên trái: Lọc theo Nhóm hàng hoặc kiểm tra hàng âm kho (màu đỏ) để kịp nhập bù.",
        ],
        tips: "Click đúp trực tiếp vào dòng sản phẩm trên bảng để sửa nhanh giá bán.",
      },
      {
        stepNumber: 2,
        title: "Khai báo hàng & Giá bán",
        content: "Nhập thông tin cơ bản của mặt hàng mới.",
        targetElementSelector: "#btn-add-product",
        buttonLabel: "Thêm hàng mới",
        details: [
          "Bấm nút Thêm hàng mới ở góc trên bên phải.",
          "Điền tên hàng, quét mã Barcode, nhập Giá bán thu ngân và Giá vốn.",
          "Tích chọn 'Bán theo cân' (rau, thịt) hoặc thêm 'Đơn vị quy đổi' (thùng/lon) nếu có.",
        ],
      },
      {
        stepNumber: 3,
        title: "Lưu & Đồng bộ quầy POS",
        content: "Lưu mặt hàng để bán ngay tại quầy thu ngân.",
        targetElementSelector: "#btn-save-product",
        buttonLabel: "Lưu mặt hàng",
        details: [
          "Bấm Lưu mặt hàng để đưa ngay sản phẩm lên quầy bán hàng POS.",
          "Sản phẩm sẵn sàng quét mã tính tiền ngay lập tức cho khách.",
        ],
      },
    ],
    faqs: [
      {
        question: "Hàng bị âm tồn kho (-17) thì xử lý thế nào?",
        answer: "Do bán hàng trước khi làm phiếu nhập. Hãy vào menu 'Nhập kho hàng hóa' bên trái để nhập bù lại số lượng thực tế.",
      },
      {
        question: "Làm sao để bán hàng theo cân (thịt, rau...)?",
        answer: "Trong biểu mẫu hàng hóa, tích vào ô 'Bán theo trọng lượng'. Khi bán tại POS, cân điện tử sẽ tự truyền số kg vào giỏ.",
      },
    ],
  },

  SCREEN_POS_CHECKOUT: {
    id: "guide-pos",
    screenCode: "SCREEN_POS_CHECKOUT",
    screenName: "Màn hình thu ngân & Bán hàng POS",
    description: "Quét mã vạch, chọn hàng cân ký, áp dụng giảm giá và in hóa đơn",
    actionUrl: "/pos",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Chọn hàng & Quét mã",
        content: "Đưa sản phẩm vào giỏ tính tiền.",
        targetElementSelector: "#pos-search-input",
        buttonLabel: "Tìm hàng hóa",
        details: [
          "Quét tia laser vào mã vạch bao bì hoặc gõ tên vào ô tìm kiếm.",
          "Với hàng cân ký (rau, thịt), cân điện tử tự truyền số kg vào giỏ hàng.",
        ],
      },
      {
        stepNumber: 2,
        title: "Chỉnh số lượng & Giảm giá",
        content: "Thay đổi số lượng mua hoặc áp dụng chiết khấu.",
        targetElementSelector: "#pos-cart-table",
        buttonLabel: "Giỏ hàng",
        details: [
          "Dùng nút (+)(-) để tăng giảm số lượng, hoặc đổi đơn vị sang Thùng.",
          "Nhập phần trăm chiết khấu nếu có ưu đãi cho khách.",
        ],
      },
      {
        stepNumber: 3,
        title: "Thanh toán & In hóa đơn",
        content: "Thu tiền và hoàn tất giao dịch.",
        targetElementSelector: "#btn-pos-checkout",
        buttonLabel: "Thanh toán (F9)",
        details: [
          "Bấm nút Thanh toán (phím F9) ở góc dưới màn hình.",
          "Chọn Tiền mặt (tự tính tiền thừa) hoặc quét mã VietQR và bấm Hoàn tất.",
        ],
        tips: "Nếu khách mua nợ, chọn tên khách hàng và chọn phương thức Ghi nợ.",
      },
    ],
    faqs: [
      {
        question: "Bị mất mạng Internet thì có bán hàng được không?",
        answer: "Được. Hệ thống tự động lưu đơn ngoại tuyến (Offline). Khi có mạng trở lại, đơn sẽ tự đồng bộ lên máy chủ.",
      },
    ],
  },

  SCREEN_CUSTOMER_DEBT: {
    id: "guide-debt",
    screenCode: "SCREEN_CUSTOMER_DEBT",
    screenName: "Sổ nợ & Đối chiếu công nợ",
    description: "Theo dõi đơn nợ chi tiết, thu nợ từng phần và lập biên bản đối chiếu",
    actionUrl: "/customers",
    targetRole: "VT-01",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Tra cứu sổ nợ khách",
        content: "Tìm kiếm khách hàng cần kiểm tra nợ.",
        targetElementSelector: "#debt-customer-search",
        buttonLabel: "Chọn khách nợ",
        details: [
          "Gõ tên hoặc SĐT khách vào ô tìm kiếm để mở sổ nợ chi tiết.",
          "Xem ô Tổng nợ hiện tại màu đỏ để biết tổng số tiền khách còn thiếu.",
        ],
      },
      {
        stepNumber: 2,
        title: "Thu nợ từng phần",
        content: "Ghi nhận tiền khách thanh toán để giảm nợ tự động.",
        targetElementSelector: "#btn-collect-debt",
        buttonLabel: "Thu nợ khách",
        details: [
          "Bấm nút Thu nợ, nhập số tiền khách trả (tiền mặt hoặc chuyển khoản).",
          "Hệ thống tự động trừ dần vào các đơn nợ cũ nhất trước.",
        ],
      },
      {
        stepNumber: 3,
        title: "Chốt đối chiếu nợ",
        content: "Lập biên bản chốt số nợ định kỳ và in giấy xác nhận.",
        targetElementSelector: "#btn-create-reconciliation",
        buttonLabel: "Lập đối chiếu nợ",
        details: [
          "Chuyển sang tab Đối chiếu nợ, chọn khoảng thời gian cần chốt.",
          "Bấm Lập đối chiếu nợ và bấm In biên bản cho khách ký xác nhận.",
        ],
        tips: "Biên bản đối chiếu nợ có chữ ký giúp tránh tranh chấp về sau.",
      },
    ],
    faqs: [
      {
        question: "Khách trả hết nợ rồi mà chuông vẫn báo nợ quá hạn?",
        answer: "Sau khi thu hết nợ hoặc lập biên bản chốt nợ, thông báo trên chuông sẽ tự động chuyển sang trạng thái 'Đã giải quyết'.",
      },
    ],
  },

  SCREEN_REPORTS_REVENUE: {
    id: "guide-reports-rev",
    screenCode: "SCREEN_REPORTS_REVENUE",
    screenName: "Báo cáo doanh thu & Bán chạy",
    description: "Xem tổng doanh thu thuần, số đơn hoàn thành và top mặt hàng bán chạy",
    actionUrl: "/reports",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Chọn mốc thời gian",
        content: "Chọn khoảng thời gian cần tổng hợp số liệu.",
        targetElementSelector: "#report-date-filter",
        buttonLabel: "Bộ lọc thời gian",
        details: [
          "Bấm chọn nhanh Hôm nay, 7 ngày qua hoặc Tháng này ở cột bên trái.",
          "Hệ thống tự động lọc toàn bộ doanh thu phát sinh trong kỳ.",
        ],
      },
      {
        stepNumber: 2,
        title: "Đọc doanh thu thuần",
        content: "Theo dõi 2 chỉ số tài chính cốt lõi.",
        targetElementSelector: "#report-summary-cards",
        buttonLabel: "Doanh thu thuần",
        details: [
          "Xem ô Doanh thu thuần (đã trừ khuyến mãi và tiền trả hàng).",
          "Xem ô Tổng đơn hoàn thành để biết số lượt khách đã mua.",
        ],
      },
      {
        stepNumber: 3,
        title: "Biểu đồ & Top bán chạy",
        content: "Phân tích xu hướng bán hàng của cửa hàng.",
        targetElementSelector: "#report-chart-section",
        buttonLabel: "Mặt hàng bán chạy",
        details: [
          "Xem biểu đồ cột để biết ngày nào bán chạy nhất trong tuần.",
          "Xem danh sách mặt hàng bán chạy để chủ động nhập hàng trước khi hết.",
        ],
      },
    ],
    faqs: [
      {
        question: "Muốn xem báo cáo để kê khai nộp thuế thì bấm vào đâu?",
        answer: "Ở cột bên trái, bấm vào mục 'Tờ khai thuế' hoặc 'Doanh thu lũy kế năm'.",
      },
    ],
  },

  SCREEN_ANNUAL_REVENUE: {
    id: "guide-annual-rev",
    screenCode: "SCREEN_ANNUAL_REVENUE",
    screenName: "Theo dõi doanh thu lũy kế năm & Ngưỡng thuế",
    description: "Giám sát doanh thu cộng dồn từ đầu năm và khoảng cách tới ngưỡng 1 tỷ",
    actionUrl: "/reports/annual-revenue",
    targetRole: "VT-01",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Xem doanh thu lũy kế",
        content: "Tổng tiền bán hàng tích lũy từ ngày 01/01 đến nay.",
        targetElementSelector: "#annual-accumulated-card",
        buttonLabel: "Doanh thu lũy kế",
        details: [
          "Số liệu tự động cộng dồn mỗi khi có đơn hàng mới hoàn thành.",
        ],
      },
      {
        stepNumber: 2,
        title: "Giám sát ngưỡng 1 tỷ",
        content: "Kiểm tra mức độ an toàn so với ngưỡng bắt buộc kê khai thuế.",
        targetElementSelector: "#annual-threshold-progress",
        buttonLabel: "Thanh tiến độ",
        details: [
          "Quan sát thanh phần trăm: Khi vượt 80% (800 triệu), chuông sẽ cảnh báo sớm.",
        ],
      },
      {
        stepNumber: 3,
        title: "Dự báo & Khuyến nghị",
        content: "Chủ động chuẩn bị chứng từ đầu vào.",
        targetElementSelector: "#annual-projection-card",
        buttonLabel: "Dự báo chạm ngưỡng",
        details: [
          "Xem ngày dự báo chạm ngưỡng để liên hệ kế toán chuẩn bị hóa đơn đầu vào.",
        ],
      },
    ],
  },

  SCREEN_E_INVOICE_CREATE: {
    id: "guide-e-invoice",
    screenCode: "SCREEN_E_INVOICE_CREATE",
    screenName: "Phát hành hóa đơn điện tử",
    description: "Tạo lập hóa đơn có mã của Cơ quan Thuế từ đơn bán hàng",
    actionUrl: "/e-invoices",
    targetRole: "VT-01",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Chọn đơn xuất hóa đơn",
        content: "Chọn đơn hàng đã hoàn tất để lập hóa đơn.",
        targetElementSelector: "#invoice-order-select",
        buttonLabel: "Chọn đơn hàng",
        details: [
          "Bấm Tạo hóa đơn mới và chọn đơn hàng trong danh sách.",
          "Toàn bộ mặt hàng và thành tiền được tự động đưa vào hóa đơn nháp.",
        ],
      },
      {
        stepNumber: 2,
        title: "Kiểm tra thông tin khách",
        content: "Điền thông tin công ty nếu khách yêu cầu hóa đơn VAT.",
        targetElementSelector: "#invoice-buyer-info",
        buttonLabel: "Thông tin khách",
        details: [
          "Khách lẻ: Để mặc định 'Người mua không lấy hóa đơn'.",
          "Khách công ty: Điền chính xác Mã số thuế, tên công ty và địa chỉ.",
        ],
      },
      {
        stepNumber: 3,
        title: "Gửi CQT cấp mã & Gửi khách",
        content: "Ký số và truyền dữ liệu lên Cơ quan Thuế.",
        targetElementSelector: "#btn-submit-to-tax",
        buttonLabel: "Gửi cơ quan thuế",
        details: [
          "Bấm nút Gửi CQT màu xanh để nhận mã xác thực hóa đơn hợp lệ.",
          "Bấm In hóa đơn hoặc gửi mã QR tra cứu cho khách xem trên điện thoại.",
        ],
      },
    ],
  },

  SCREEN_INVOICE_CONFIG: {
    id: "guide-invoice-cfg",
    screenCode: "SCREEN_INVOICE_CONFIG",
    screenName: "Cấu hình mẫu và ký hiệu hóa đơn",
    description: "Khai báo ký hiệu hóa đơn theo Thông tư 78 của Cơ quan Thuế",
    actionUrl: "/settings/invoice-template",
    targetRole: "VT-01",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Chọn loại mẫu hóa đơn",
        content: "Chọn mẫu số phù hợp với phương pháp tính thuế.",
        targetElementSelector: "#select-invoice-pattern",
        buttonLabel: "Chọn mẫu hóa đơn",
        details: [
          "Chọn Mẫu 1 (Hóa đơn GTGT) hoặc Mẫu 2 (Hóa đơn bán hàng hộ kinh doanh).",
        ],
      },
      {
        stepNumber: 2,
        title: "Nhập ký hiệu 7 ký tự",
        content: "Khai báo ký hiệu theo thông báo Thuế duyệt.",
        targetElementSelector: "#input-invoice-symbol",
        buttonLabel: "Nhập ký hiệu",
        details: [
          "Điền ký hiệu gồm 7 ký tự (ví dụ: 1C26TAA).",
          "Chữ C là có mã CQT, 26 là năm 2026, chữ T là hộ kinh doanh.",
        ],
      },
      {
        stepNumber: 3,
        title: "Lưu & Kích hoạt",
        content: "Kích hoạt dải số để sẵn sàng xuất hóa đơn tại quầy POS.",
        targetElementSelector: "#btn-save-invoice-template",
        buttonLabel: "Lưu ký hiệu",
        details: [
          "Bấm Lưu ký hiệu để hệ thống tự cấp dải số bắt đầu từ số 00000001.",
        ],
      },
    ],
  },

  SCREEN_TAX_PERIOD: {
    id: "guide-tax",
    screenCode: "SCREEN_TAX_PERIOD",
    screenName: "Sổ sách & Kỳ kê khai thuế",
    description: "Tổng hợp doanh thu, bảng kê mua vào và xuất tờ khai nộp thuế",
    actionUrl: "/reports/tax-declaration",
    targetRole: "VT-01",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Chọn kỳ kê khai thuế",
        content: "Chọn Tháng hoặc Quý cần kê khai nộp thuế.",
        targetElementSelector: "#tax-period-selector",
        buttonLabel: "Chọn kỳ thuế",
        details: [
          "Hệ thống tự động gom doanh thu theo từng nhóm ngành nghề chịu thuế.",
        ],
      },
      {
        stepNumber: 2,
        title: "Lập bảng kê mua vào",
        content: "Tổng hợp chi phí hóa đơn mua hàng đầu vào.",
        targetElementSelector: "#btn-gen-purchase-reg",
        buttonLabel: "Lập bảng kê mua vào",
        details: [
          "Bấm Lập bảng kê mua vào để chứng minh nguồn gốc xuất xứ hàng hóa.",
        ],
      },
      {
        stepNumber: 3,
        title: "Xuất tờ khai 01/CNKD",
        content: "Tải hồ sơ nộp lên Cổng thuế điện tử.",
        targetElementSelector: "#btn-export-tax-form",
        buttonLabel: "Xuất tờ khai",
        details: [
          "Kiểm tra số tiền thuế phải nộp và bấm Xuất tờ khai thuế để nộp trực tiếp.",
        ],
      },
    ],
  },

  SCREEN_DASHBOARD: {
    id: "guide-dashboard",
    screenCode: "SCREEN_DASHBOARD",
    screenName: "Tổng quan hoạt động kinh doanh",
    description: "Số liệu doanh thu trong ngày, số đơn hoàn thành và việc khẩn cấp",
    actionUrl: "/dashboard",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Chỉ số bán hôm nay",
        content: "Nắm bắt doanh thu và đơn hàng tức thì.",
        targetElementSelector: "#dashboard-stats-cards",
        buttonLabel: "Thẻ chỉ số",
        details: [
          "Xem doanh thu thuần trong ngày, số đơn hoàn thành và tiền mặt trong két.",
        ],
      },
      {
        stepNumber: 2,
        title: "Biểu đồ biến động tuần",
        content: "So sánh doanh thu các ngày trong tuần.",
        targetElementSelector: "#dashboard-revenue-chart",
        buttonLabel: "Biểu đồ tuần",
        details: [
          "Nhận diện ngày bán chạy nhất trong tuần để chuẩn bị nhân lực và hàng hóa.",
        ],
      },
      {
        stepNumber: 3,
        title: "Xử lý cảnh báo khẩn",
        content: "Kiểm tra và xử lý việc gấp trong ngày.",
        targetElementSelector: "#dashboard-alerts-section",
        buttonLabel: "Cảnh báo khẩn",
        details: [
          "Xử lý hóa đơn lỗi cấp mã, nợ quá hạn và danh sách hàng sắp hết kho.",
        ],
      },
    ],
  },

  SCREEN_ORDER_MANAGEMENT: {
    id: "guide-orders",
    screenCode: "SCREEN_ORDER_MANAGEMENT",
    screenName: "Quản lý danh sách đơn bán hàng",
    description: "Tra cứu đơn hàng, in lại phiếu tính tiền và xuất hóa đơn điện tử",
    actionUrl: "/orders",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Tìm kiếm đơn hàng",
        content: "Tra cứu nhanh bất kỳ giao dịch bán hàng nào.",
        targetElementSelector: "#order-search-input",
        buttonLabel: "Tìm đơn",
        details: [
          "Gõ mã hóa đơn hoặc số điện thoại khách hàng vào ô tìm kiếm trên cùng.",
        ],
      },
      {
        stepNumber: 2,
        title: "Lọc theo trạng thái",
        content: "Kiểm soát các đơn hoàn thành hoặc chờ thanh toán.",
        targetElementSelector: "#order-filter-status",
        buttonLabel: "Bộ lọc đơn",
        details: [
          "Lọc xem các đơn Đã hoàn thành, Chờ thanh toán hoặc Đã hủy.",
        ],
      },
      {
        stepNumber: 3,
        title: "In lại & Xuất HĐĐT",
        content: "Thao tác trên từng đơn hàng cụ thể.",
        targetElementSelector: "#order-list-table",
        buttonLabel: "Chi tiết đơn",
        details: [
          "Bấm vào đơn để in lại phiếu tính tiền hoặc bấm Phát hành HĐĐT gửi Thuế.",
        ],
      },
    ],
  },

  SCREEN_SHIFT_MANAGEMENT: {
    id: "guide-shifts",
    screenCode: "SCREEN_SHIFT_MANAGEMENT",
    screenName: "Quản lý ca bán hàng & Bàn giao tiền mặt",
    description: "Mở ca, theo dõi tiền mặt trong két và bàn giao khi đóng ca",
    actionUrl: "/shifts",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Mở ca thu ngân",
        content: "Bắt đầu ca làm việc và ghi nhận tiền thối.",
        targetElementSelector: "#btn-open-shift",
        buttonLabel: "Mở ca",
        details: [
          "Nhập số tiền mặt đầu ca để có tiền thối khách rồi bấm Xác nhận mở ca.",
        ],
      },
      {
        stepNumber: 2,
        title: "Theo dõi tiền trong ca",
        content: "Kiểm soát dòng tiền mặt và thu chi tại quầy.",
        targetElementSelector: "#shift-cash-summary",
        buttonLabel: "Tiền trong ca",
        details: [
          "Xem tổng doanh thu tiền mặt, chuyển khoản QR và các phiếu chi phát sinh.",
        ],
      },
      {
        stepNumber: 3,
        title: "Đóng ca & Bàn giao",
        content: "Kiểm đếm tiền thực tế khi hết ca.",
        targetElementSelector: "#btn-close-shift",
        buttonLabel: "Đóng ca & Bàn giao",
        details: [
          "Đếm tiền mặt thực tế trong két và bấm Kết ca để in biên bản bàn giao.",
        ],
      },
    ],
  },

  SCREEN_RETURN_TICKETS: {
    id: "guide-returns",
    screenCode: "SCREEN_RETURN_TICKETS",
    screenName: "Quản lý trả hàng & Hoàn tiền",
    description: "Tiếp nhận hàng trả lại, hoàn tiền và tự động cộng lại kho",
    actionUrl: "/return-tickets",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Tìm hóa đơn cũ",
        content: "Tra cứu giao dịch mua ban đầu của khách.",
        targetElementSelector: "#btn-create-return",
        buttonLabel: "Tạo phiếu trả",
        details: [
          "Bấm Tạo phiếu trả hàng và gõ mã hóa đơn cũ hoặc SĐT khách mua.",
        ],
      },
      {
        stepNumber: 2,
        title: "Chọn hàng khách trả",
        content: "Nhập số lượng hàng trả lại.",
        targetElementSelector: "#return-order-lookup",
        buttonLabel: "Chọn hàng trả",
        details: [
          "Nhập số lượng món khách trả lại và kiểm tra số tiền hoàn tính toán.",
        ],
      },
      {
        stepNumber: 3,
        title: "Xác nhận & Hoàn tiền",
        content: "Hoàn tiền cho khách và cập nhật tồn kho.",
        targetElementSelector: "#btn-confirm-return",
        buttonLabel: "Xác nhận hoàn tiền",
        details: [
          "Bấm Xác nhận để hoàn tiền cho khách và tự động cộng lại tồn kho.",
        ],
      },
    ],
  },

  SCREEN_GOODS_RECEIPT: {
    id: "guide-receipt",
    screenCode: "SCREEN_GOODS_RECEIPT",
    screenName: "Nhập kho hàng hóa",
    description: "Lập phiếu nhập kho để cộng tồn hàng và ghi nhận giá vốn",
    actionUrl: "/products/stock-entry",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Lập phiếu nhập kho",
        content: "Khởi tạo phiếu nhập hàng mới.",
        targetElementSelector: "#btn-create-receipt",
        buttonLabel: "Lập phiếu nhập",
        details: [
          "Bấm Lập phiếu nhập ở góc trên bên phải trang Nhập kho.",
        ],
      },
      {
        stepNumber: 2,
        title: "Chọn NCC & Mặt hàng",
        content: "Khai báo nhà cung cấp và danh sách hàng nhập.",
        targetElementSelector: "#receipt-item-selector",
        buttonLabel: "Thêm hàng nhập",
        details: [
          "Chọn nhà cung cấp và quét mã vạch các mặt hàng vừa giao tới tiệm.",
        ],
      },
      {
        stepNumber: 3,
        title: "Nhập giá vốn & Lưu",
        content: "Hoàn tất và cập nhật tồn kho tức thì.",
        targetElementSelector: "#btn-save-receipt",
        buttonLabel: "Lưu phiếu nhập",
        details: [
          "Điền số lượng, đơn giá nhập và bấm Lưu phiếu để cộng tồn kho.",
        ],
      },
    ],
  },

  SCREEN_PROMOTIONS: {
    id: "guide-promotions",
    screenCode: "SCREEN_PROMOTIONS",
    screenName: "Chương trình khuyến mại & Giảm giá",
    description: "Tạo chương trình giảm giá % hoặc tiền mặt kích thích mua sắm",
    actionUrl: "/promotions",
    targetRole: "VT-01",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Tạo chương trình mới",
        content: "Khởi tạo đợt khuyến mại mới cho tiệm.",
        targetElementSelector: "#btn-create-promo",
        buttonLabel: "Tạo khuyến mại",
        details: [
          "Bấm Thêm chương trình khuyến mại và đặt tên chương trình.",
        ],
      },
      {
        stepNumber: 2,
        title: "Cài đặt mức giảm giá",
        content: "Thiết lập tỷ lệ giảm và thời gian áp dụng.",
        targetElementSelector: "#promo-form-content",
        buttonLabel: "Cài đặt mức giảm",
        details: [
          "Chọn giảm theo % hoặc giảm tiền mặt cố định và chọn ngày áp dụng.",
        ],
      },
      {
        stepNumber: 3,
        title: "Kích hoạt bán POS",
        content: "Tự động trừ tiền giảm giá khi tính tiền.",
        targetElementSelector: "#btn-save-promo",
        buttonLabel: "Lưu & Bật khuyến mại",
        details: [
          "Bấm Lưu để quầy thu ngân tự động áp dụng giảm giá khi tính tiền.",
        ],
      },
    ],
  },

  SCREEN_EMPLOYEE_MANAGEMENT: {
    id: "guide-employees",
    screenCode: "SCREEN_EMPLOYEE_MANAGEMENT",
    screenName: "Quản lý nhân viên & Phân quyền",
    description: "Tạo tài khoản thu ngân hoặc kế toán và quản lý quyền truy cập",
    actionUrl: "/employees",
    targetRole: "VT-01",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Thêm nhân viên mới",
        content: "Tạo tài khoản mới cho nhân sự cửa hàng.",
        targetElementSelector: "#btn-add-employee",
        buttonLabel: "Thêm nhân viên",
        details: [
          "Bấm Thêm nhân viên ở góc trên bên phải màn hình.",
        ],
      },
      {
        stepNumber: 2,
        title: "Phân vai trò tài khoản",
        content: "Giới hạn quyền xem theo vị trí công việc.",
        targetElementSelector: "#employee-form-modal",
        buttonLabel: "Phân vai trò",
        details: [
          "Điền SĐT đăng nhập và chọn quyền Thu ngân (VT-02) hoặc Kế toán (VT-03).",
        ],
      },
      {
        stepNumber: 3,
        title: "Cấp mật khẩu đăng nhập",
        content: "Hoàn tất và bàn giao tài khoản.",
        targetElementSelector: "#btn-save-employee",
        buttonLabel: "Lưu nhân viên",
        details: [
          "Bấm Lưu và cung cấp mật khẩu để nhân viên đăng nhập vào ca.",
        ],
      },
    ],
  },

  SCREEN_BUSINESS_INFO: {
    id: "guide-business-settings",
    screenCode: "SCREEN_BUSINESS_INFO",
    screenName: "Cấu hình cửa hàng & Thông tin kinh doanh",
    description: "Cập nhật tên tiệm, mã số thuế, máy in hóa đơn và font chữ",
    actionUrl: "/settings",
    targetRole: "VT-01",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Thông tin hộ kinh doanh",
        content: "Đảm bảo thông tin in trên hóa đơn chính xác.",
        targetElementSelector: "#settings-business-profile",
        buttonLabel: "Thông tin hộ KD",
        details: [
          "Kiểm tra Tên hộ KD, Mã số thuế và địa chỉ in trên hóa đơn.",
        ],
      },
      {
        stepNumber: 2,
        title: "Cài đặt máy in hóa đơn",
        content: "Thiết lập in phiếu thanh toán tại quầy.",
        targetElementSelector: "#settings-printer-tab",
        buttonLabel: "Cài đặt máy in",
        details: [
          "Chọn khổ giấy K80/K58 và bật tự động in sau khi hoàn tất đơn.",
        ],
      },
      {
        stepNumber: 3,
        title: "Tùy chỉnh giao diện",
        content: "Phóng to chữ hoặc bật chế độ đơn giản hóa.",
        targetElementSelector: "#settings-display-tab",
        buttonLabel: "Giao diện hiển thị",
        details: [
          "Phóng to cỡ chữ hoặc bật chế độ đơn giản hóa giúp dễ thao tác.",
        ],
      },
    ],
  },

  SCREEN_SUPPLIER_MANAGEMENT: {
    id: "guide-supplier",
    screenCode: "SCREEN_SUPPLIER_MANAGEMENT",
    screenName: "Quản lý Nhà cung cấp & Công nợ nhập hàng",
    description: "Khai báo nhà cung cấp, theo dõi tiền nợ hàng và lịch sử nhập",
    actionUrl: "/products/suppliers",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Tìm kiếm & Lọc nợ NCC",
        content: "Tra cứu nhà cung cấp và kiểm tra số tiền còn nợ.",
        targetElementSelector: "input[placeholder*='nhà cung cấp']",
        buttonLabel: "Tìm kiếm NCC",
        details: [
          "Gõ tên, SĐT hoặc mã NCC trên thanh tìm kiếm phía trên.",
          "Cột bên trái: Lọc theo khoảng nợ hoặc trạng thái đang giao dịch.",
        ],
      },
      {
        stepNumber: 2,
        title: "Thêm mới nhà cung cấp",
        content: "Khai báo đối tác nhập hàng mới vào danh bạ.",
        targetElementSelector: "button:has-text('Nhà cung cấp')",
        buttonLabel: "+ Nhà cung cấp",
        details: [
          "Bấm nút [+ Nhà cung cấp] ở góc trên bên phải.",
          "Điền Tên đại lý/công ty, Số điện thoại liên hệ, Địa chỉ và Mã số thuế.",
        ],
      },
      {
        stepNumber: 3,
        title: "Sổ nợ & Thanh toán tiền",
        content: "Theo dõi lịch sử đơn nhập và thanh toán nợ.",
        targetElementSelector: "table tbody tr",
        buttonLabel: "Chi tiết & Trả nợ",
        details: [
          "Bấm trực tiếp vào dòng NCC để xem toàn bộ phiếu nhập kho đã mua.",
          "Bấm nút [Trả nợ NCC] khi chuyển khoản hoặc trả tiền mặt cho nhà cung cấp.",
        ],
        tips: "Có thể xuất file Excel danh sách nhà cung cấp bằng nút [Xuất file].",
      },
    ],
    faqs: [
      {
        question: "Làm sao biết còn nợ nhà cung cấp bao nhiêu tiền?",
        answer: "Xem cột 'Nợ hiện tại' màu đỏ trên danh sách, hoặc lọc nhanh ở cột bên trái.",
      },
      {
        question: "Muốn ngừng giao dịch với một nhà cung cấp?",
        answer: "Bấm vào biểu tượng ba chấm trên dòng NCC và chọn 'Chuyển sang ngừng hoạt động'.",
      },
    ],
  },

  SCREEN_INVENTORY_AUDIT: {
    id: "guide-inventory-audit",
    screenCode: "SCREEN_INVENTORY_AUDIT",
    screenName: "Kiểm kê kho hàng hóa",
    description: "Đếm số lượng thực tế tại quầy và cân bằng kho tự động",
    actionUrl: "/products/inventory-audits",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Tạo phiếu kiểm kê",
        content: "Bắt đầu đợt kiểm kho định kỳ.",
        targetElementSelector: "#btn-create-audit",
        buttonLabel: "Tạo phiếu kiểm",
        details: [
          "Bấm [Tạo phiếu kiểm] ở góc trên bên phải trang Kiểm kê.",
          "Chọn kiểm toàn bộ cửa hàng hoặc theo từng Nhóm hàng cụ thể.",
        ],
      },
      {
        stepNumber: 2,
        title: "Đếm & Nhập thực tế",
        content: "Ghi nhận số lượng đếm được trên quầy kệ.",
        targetElementSelector: "#audit-items-table",
        buttonLabel: "Nhập số lượng đếm",
        details: [
          "Quét mã vạch sản phẩm và điền số lượng đếm thực tế.",
          "Hệ thống tự tính cột 'Chênh lệch' (thừa hoặc thiếu so với phần mềm).",
        ],
      },
      {
        stepNumber: 3,
        title: "Cân bằng kho",
        content: "Khớp số lượng tồn kho với thực tế.",
        targetElementSelector: "#btn-balance-inventory",
        buttonLabel: "Cân bằng kho",
        details: [
          "Bấm [Cân bằng kho] để hệ thống tự động chỉnh lại số tồn theo số đếm thực tế.",
          "Số liệu kho sẽ được làm mới ngay trên màn hình bán hàng POS.",
        ],
      },
    ],
    faqs: [
      {
        question: "Hàng bị thừa hoặc thiếu có bị mất dữ liệu không?",
        answer: "Hệ thống sẽ lưu lại toàn bộ biên bản kiểm kê và lý do chênh lệch để chủ hộ tra cứu đối soát.",
      },
    ],
  },

  SCREEN_INVENTORY_WARNING: {
    id: "guide-inventory-warning",
    screenCode: "SCREEN_INVENTORY_WARNING",
    screenName: "Cảnh báo tồn kho & Gợi ý đặt hàng",
    description: "Phát hiện hàng sắp hết, âm kho và tự động gợi ý số lượng nhập bù",
    actionUrl: "/products/inventory-warnings",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Xem hàng chạm ngưỡng tồn",
        content: "Kiểm tra các mặt hàng sắp hết hoặc âm kho.",
        targetElementSelector: "#warning-list-table",
        buttonLabel: "Danh sách cảnh báo",
        details: [
          "Xem các sản phẩm có số tồn thấp hơn định mức tối thiểu.",
          "Các món bị âm kho (màu đỏ) cần được ưu tiên nhập bù ngay.",
        ],
      },
      {
        stepNumber: 2,
        title: "Đọc gợi ý số lượng nhập",
        content: "Dự báo lượng hàng cần mua dựa trên lịch sử bán.",
        targetElementSelector: "#suggestion-quantity-col",
        buttonLabel: "Gợi ý nhập hàng",
        details: [
          "Hệ thống tính tốc độ bán 28 ngày qua để tính số lượng cần nhập bù.",
          "Giúp tránh tình trạng thiếu hàng bán hoặc nhập quá nhiều gây đọng vốn.",
        ],
      },
      {
        stepNumber: 3,
        title: "Tạo phiếu nhập bù",
        content: "Chuyển nhanh sang đơn đặt hàng nhà cung cấp.",
        targetElementSelector: "#btn-create-replenishment",
        buttonLabel: "Tạo phiếu nhập",
        details: [
          "Tích chọn các món cần nhập và bấm [Tạo phiếu nhập].",
          "Dữ liệu tự động điền sang màn hình Nhập kho, không cần gõ lại từng món.",
        ],
      },
    ],
  },

  SCREEN_SUPPLIER_RETURN: {
    id: "guide-supplier-return",
    screenCode: "SCREEN_SUPPLIER_RETURN",
    screenName: "Quản lý trả hàng Nhà cung cấp",
    description: "Xuất trả hàng lỗi/hết hạn cho nhà cung cấp và giảm trừ nợ",
    actionUrl: "/products/supplier-returns",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Tạo phiếu xuất trả",
        content: "Lập phiếu khi có hàng hỏng hoặc cận date cần hoàn.",
        targetElementSelector: "#btn-create-supplier-return",
        buttonLabel: "Tạo phiếu trả NCC",
        details: [
          "Bấm nút [Tạo phiếu trả NCC] ở góc trên bên phải màn hình.",
          "Chọn Nhà cung cấp nhận lại hàng và lý do trả.",
        ],
      },
      {
        stepNumber: 2,
        title: "Chọn hàng & Đơn giá hoàn",
        content: "Đưa các sản phẩm trả vào phiếu.",
        targetElementSelector: "#return-items-selector",
        buttonLabel: "Chọn món trả",
        details: [
          "Quét mã hoặc chọn món hàng cần trả lại, nhập số lượng thực tế trả.",
          "Giá vốn hoàn tiền được tự động lấy theo phiếu nhập kho trước đó.",
        ],
      },
      {
        stepNumber: 3,
        title: "Lưu & Giảm trừ công nợ",
        content: "Cập nhật kho và sổ nợ nhà cung cấp.",
        targetElementSelector: "#btn-save-supplier-return",
        buttonLabel: "Lưu phiếu trả",
        details: [
          "Bấm [Lưu phiếu trả] để trừ ngay số lượng tồn kho.",
          "Tổng tiền trả hàng sẽ tự động cấn trừ vào số nợ còn phải trả của nhà cung cấp.",
        ],
      },
    ],
  },

  SCREEN_POS_TRANSFER: {
    id: "guide-pos-transfer",
    screenCode: "SCREEN_POS_TRANSFER",
    screenName: "Chuyển hàng giữa các điểm bán",
    description: "Điều chuyển tồn kho giữa quầy bán hàng và kho tổng",
    actionUrl: "/products/pos-transfers",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Chọn quầy xuất & Điểm nhận",
        content: "Thiết lập nguồn và đích điều chuyển.",
        targetElementSelector: "#transfer-locations-select",
        buttonLabel: "Chọn điểm chuyển",
        details: [
          "Chọn Kho nguồn xuất đi và Quầy/Điểm bán nhận hàng.",
        ],
      },
      {
        stepNumber: 2,
        title: "Chọn hàng điều chuyển",
        content: "Khai báo danh sách món và số lượng xuất chuyển.",
        targetElementSelector: "#transfer-item-search",
        buttonLabel: "Thêm món chuyển",
        details: [
          "Quét mã vạch hoặc gõ tên sản phẩm, nhập số lượng cần chuyển.",
        ],
      },
      {
        stepNumber: 3,
        title: "Xác nhận & Cập nhật kho",
        content: "Hoàn tất điều chuyển.",
        targetElementSelector: "#btn-confirm-transfer",
        buttonLabel: "Xác nhận chuyển",
        details: [
          "Bấm [Xác nhận chuyển], kho nguồn tự trừ số lượng và điểm bán đích nhận được ngay.",
        ],
      },
    ],
  },

  SCREEN_CUSTOMER_MANAGEMENT: {
    id: "guide-customer-mgmt",
    screenCode: "SCREEN_CUSTOMER_MANAGEMENT",
    screenName: "Quản lý danh sách khách hàng",
    description: "Lưu thông tin khách quen, số điện thoại, nhóm ưu đãi và lịch sử mua",
    actionUrl: "/customers",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Tìm kiếm & Phân loại khách",
        content: "Tra cứu khách hàng theo tên hoặc số điện thoại.",
        targetElementSelector: "input[placeholder*='khách hàng']",
        buttonLabel: "Tìm khách hàng",
        details: [
          "Gõ tên hoặc SĐT khách vào ô tìm kiếm.",
          "Cột bên trái: Lọc khách nợ quá hạn hoặc nhóm VIP.",
        ],
      },
      {
        stepNumber: 2,
        title: "Thêm mới khách hàng",
        content: "Khai báo hồ sơ khách hàng mới.",
        targetElementSelector: "button:has-text('Thêm khách hàng')",
        buttonLabel: "Thêm khách hàng",
        details: [
          "Bấm nút [Thêm khách hàng] ở góc phải.",
          "Điền Tên, Số điện thoại (dùng tích điểm và gửi hóa đơn), Địa chỉ.",
        ],
      },
      {
        stepNumber: 3,
        title: "Xem lịch sử mua & Nợ",
        content: "Quản lý tổng tiền đã mua và điểm tích lũy.",
        targetElementSelector: "table tbody tr",
        buttonLabel: "Xem chi tiết",
        details: [
          "Bấm vào dòng khách để xem toàn bộ đơn đã mua, số nợ và điểm thưởng.",
        ],
      },
    ],
  },

  SCREEN_CUSTOMER_LOYALTY: {
    id: "guide-customer-loyalty",
    screenCode: "SCREEN_CUSTOMER_LOYALTY",
    screenName: "Chương trình tích điểm & Khách hàng thân thiết",
    description: "Cộng điểm khi mua hàng, đổi điểm giảm giá và nâng hạng VIP",
    actionUrl: "/customers",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Tích điểm khi bán hàng",
        content: "Hệ thống tự tích điểm theo hóa đơn thanh toán.",
        targetElementSelector: "#pos-customer-selector",
        buttonLabel: "Chọn khách tại POS",
        details: [
          "Khi tính tiền tại quầy POS, chọn tên khách quen để hệ thống tự cộng điểm thưởng.",
        ],
      },
      {
        stepNumber: 2,
        title: "Đổi điểm trừ tiền",
        content: "Dùng điểm tích lũy để giảm giá đơn hàng.",
        targetElementSelector: "#pos-loyalty-redeem",
        buttonLabel: "Đổi điểm",
        details: [
          "Nhập số điểm khách muốn dùng để trừ trực tiếp vào số tiền cần thanh toán.",
        ],
      },
      {
        stepNumber: 3,
        title: "Tự động nâng hạng thành viên",
        content: "Khách đạt mốc chi tiêu tự lên hạng VIP.",
        targetElementSelector: "#customer-loyalty-tier",
        buttonLabel: "Hạng thành viên",
        details: [
          "Hệ thống tự thăng hạng VIP/Vàng/Bạc kèm chiết khấu tự động cho từng lần mua sau.",
        ],
      },
    ],
  },

  SCREEN_DISPLAY_SETTINGS: {
    id: "guide-display-settings",
    screenCode: "SCREEN_DISPLAY_SETTINGS",
    screenName: "Cài đặt giao diện & Hiển thị",
    description: "Tùy chỉnh cỡ chữ lớn, chế độ tối giản quầy thu ngân và độ tương phản",
    actionUrl: "/settings/display",
    targetRole: "ALL",
    viewCount: 0,
    isActive: true,
    totalSteps: 3,
    steps: [
      {
        stepNumber: 1,
        title: "Chọn cỡ chữ vừa mắt",
        content: "Phóng to hoặc thu nhỏ chữ trên toàn màn hình.",
        targetElementSelector: "#setting-font-size",
        buttonLabel: "Cỡ chữ",
        details: [
          "Chọn cỡ chữ Lớn nếu muốn nhìn rõ tên món và giá tiền từ khoảng cách xa.",
        ],
      },
      {
        stepNumber: 2,
        title: "Chế độ bán hàng POS",
        content: "Chuyển giữa chế độ Chuẩn và Tối giản.",
        targetElementSelector: "#setting-pos-mode",
        buttonLabel: "Chế độ quầy POS",
        details: [
          "Bật 'Chế độ tối giản' nếu quầy chỉ cần quét mã và thanh toán nhanh không rối mắt.",
        ],
      },
      {
        stepNumber: 3,
        title: "Lưu cấu hình giao diện",
        content: "Áp dụng ngay trên thiết bị.",
        targetElementSelector: "#btn-save-display-settings",
        buttonLabel: "Lưu cấu hình",
        details: [
          "Bấm [Lưu cấu hình] để lưu tùy biến riêng cho thiết bị của bạn.",
        ],
      },
    ],
  },
};

