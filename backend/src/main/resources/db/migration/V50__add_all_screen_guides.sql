-- =========================================================================
-- Migration Script: Add Screen Guides for All Remaining Screens (NCL-19-CN-003)
-- Covers: Dashboard, Revenue Reports, Annual Revenue, Orders, Shifts, Returns, Promotions, Employees, Settings
-- =========================================================================

-- 1. Màn hình Tổng quan kinh doanh (SCREEN_DASHBOARD)
INSERT IGNORE INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-08-dashboard', 'SCREEN_DASHBOARD', 'Tổng quan hoạt động kinh doanh',
        'Nắm bắt nhanh doanh thu trong ngày, số đơn hoàn thành và các cảnh báo quan trọng',
        '/dashboard', 'ALL', 0, TRUE);

INSERT IGNORE INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-08-dash-01', 'guide-08-dashboard', 1, 'Theo dõi doanh thu & Đơn hàng', 'Quan sát các thẻ chỉ số trên cùng để biết doanh thu thuần hôm nay, số đơn đã bán và tiền mặt thực tế.', '#dashboard-stats-cards', 'Số liệu tổng quan', '/images/guides/dash_step1.png'),
('step-08-dash-02', 'guide-08-dashboard', 2, 'Xem biểu đồ tăng trưởng', 'Biểu đồ cột thể hiện biến động doanh thu theo từng ngày trong tuần hoặc tháng để bạn so sánh hiệu quả.', '#dashboard-revenue-chart', 'Biểu đồ', '/images/guides/dash_step2.png'),
('step-08-dash-03', 'guide-08-dashboard', 3, 'Xử lý việc khẩn cấp & Tồn kho', 'Kiểm tra danh sách hàng sắp hết và các cảnh báo hóa đơn lỗi hoặc nợ quá hạn để xử lý kịp thời.', '#dashboard-alerts-section', 'Cảnh báo khẩn', '/images/guides/dash_step3.png');

-- 2. Màn hình Báo cáo doanh thu & Bán chạy (SCREEN_REPORTS_REVENUE)
INSERT IGNORE INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-09-reports-rev', 'SCREEN_REPORTS_REVENUE', 'Báo cáo doanh thu & Mặt hàng bán chạy',
        'Xem thống kê tổng tiền bán hàng, lợi nhuận ước tính và top sản phẩm được khách chuộng nhất',
        '/reports', 'ALL', 0, TRUE);

INSERT IGNORE INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-09-rev-01', 'guide-09-reports-rev', 1, 'Chọn mốc thời gian cần xem', 'Ở cột bên trái, bấm chọn nhanh Hôm nay, 7 ngày qua, Tháng này hoặc chọn khoảng ngày cụ thể bạn muốn theo dõi.', '#report-date-filter', 'Chọn khoảng thời gian', '/images/guides/rev_step1.png'),
('step-09-rev-02', 'guide-09-reports-rev', 2, 'Đọc số liệu Doanh thu thuần & Đơn', 'Nhìn lên 2 ô phía trên để biết tổng số tiền thu được sau khi trừ khuyến mãi/trả hàng và tổng số đơn đã phục vụ.', '#report-summary-cards', 'Tổng doanh thu', '/images/guides/rev_step2.png'),
('step-09-rev-03', 'guide-09-reports-rev', 3, 'Xem biểu đồ ngày & Top hàng bán chạy', 'Kéo xuống để xem các ngày bán được nhiều tiền nhất và danh sách mặt hàng bán chạy để kịp thời nhập thêm hàng.', '#report-chart-section', 'Mặt hàng bán chạy', '/images/guides/rev_step3.png');

-- 3. Màn hình Doanh thu lũy kế năm & Ngưỡng thuế (SCREEN_ANNUAL_REVENUE)
INSERT IGNORE INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-10-annual-rev', 'SCREEN_ANNUAL_REVENUE', 'Theo dõi doanh thu lũy kế năm & Ngưỡng thuế',
        'Giám sát tổng doanh thu tích lũy trong năm và khoảng cách tới ngưỡng 1 tỷ đồng theo quy định Thuế',
        '/reports/annual-revenue', 'VT-01', 0, TRUE);

INSERT IGNORE INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-10-ann-01', 'guide-10-annual-rev', 1, 'Xem tổng doanh thu lũy kế từ đầu năm', 'Hệ thống tự động cộng dồn doanh thu hợp lệ từ ngày 01/01 đến thời điểm hiện tại của cả hộ kinh doanh.', '#annual-accumulated-card', 'Doanh thu lũy kế', '/images/guides/ann_step1.png'),
('step-10-ann-02', 'guide-10-annual-rev', 2, 'Kiểm tra mức độ an toàn so với ngưỡng 1 tỷ', 'Thanh tiến độ thể hiện phần trăm doanh thu đã đạt. Khi đạt trên 80% (800 triệu), hệ thống sẽ bật cảnh báo sớm.', '#annual-threshold-progress', 'Thanh tiến độ', '/images/guides/ann_step2.png'),
('step-10-ann-03', 'guide-10-annual-rev', 3, 'Xem dự báo & Khuyến nghị kế toán', 'Đọc phần dự báo xu hướng để biết thời điểm có thể chạm ngưỡng, giúp chủ hộ chuẩn bị hóa đơn đầu vào đầy đủ.', '#annual-projection-card', 'Dự báo & Khuyến nghị', '/images/guides/ann_step3.png');

-- 4. Màn hình Quản lý đơn hàng (SCREEN_ORDER_MANAGEMENT)
INSERT IGNORE INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-11-orders', 'SCREEN_ORDER_MANAGEMENT', 'Quản lý danh sách đơn bán hàng',
        'Tra cứu lịch sử đơn hàng, kiểm tra chi tiết thanh toán và trạng thái hóa đơn điện tử',
        '/orders', 'ALL', 0, TRUE);

INSERT IGNORE INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-11-ord-01', 'guide-11-orders', 1, 'Tìm kiếm đơn hàng', 'Gõ mã hóa đơn (ví dụ HD...) hoặc tên khách hàng vào ô tìm kiếm để tra lại giao dịch mua hàng.', '#order-search-input', 'Tìm đơn', '/images/guides/ord_step1.png'),
('step-11-ord-02', 'guide-11-orders', 2, 'Lọc theo thời gian & Trạng thái', 'Chọn lọc các đơn Đã hoàn thành, Chờ thanh toán hoặc Đã hủy để kiểm soát doanh thu.', '#order-filter-status', 'Bộ lọc', '/images/guides/ord_step2.png'),
('step-11-ord-03', 'guide-11-orders', 3, 'Bấm vào dòng để xem chi tiết & In lại', 'Bấm trực tiếp vào đơn để xem các mặt hàng đã mua, in lại hóa đơn tính tiền hoặc bấm Phát hành HĐĐT gửi Thuế.', '#order-list-table', 'Chi tiết đơn hàng', '/images/guides/ord_step3.png');

-- 5. Màn hình Quản lý ca bán hàng (SCREEN_SHIFT_MANAGEMENT)
INSERT IGNORE INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-12-shifts', 'SCREEN_SHIFT_MANAGEMENT', 'Quản lý ca bán hàng & Bàn giao tiền mặt',
        'Mở ca thu ngân, kiểm đếm tiền mặt phát sinh trong ca và bàn giao tiền cho ca sau',
        '/shifts', 'ALL', 0, TRUE);

INSERT IGNORE INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-12-shf-01', 'guide-12-shifts', 1, 'Mở ca đầu ngày', 'Khi nhân viên đến ca, nhập số tiền mặt đầu ca để có tiền thối trả lại cho khách mua hàng.', '#btn-open-shift', 'Mở ca', '/images/guides/shf_step1.png'),
('step-12-shf-02', 'guide-12-shifts', 2, 'Theo dõi tiền mặt trong ca', 'Xem tổng doanh thu tiền mặt, chuyển khoản QR và các khoản thu chi phát sinh trong ca trực tiếp.', '#shift-cash-summary', 'Tiền mặt trong ca', '/images/guides/shf_step2.png'),
('step-12-shf-03', 'guide-12-shifts', 3, 'Kiểm đếm và Đóng ca bàn giao', 'Hết ca làm việc, bấm nút Kết ca / Đóng ca, đếm số tiền thực tế trong két để hệ thống đối chiếu chênh lệch.', '#btn-close-shift', 'Đóng ca & Bàn giao', '/images/guides/shf_step3.png');

-- 6. Màn hình Quản lý trả hàng (SCREEN_RETURN_TICKETS)
INSERT IGNORE INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-13-returns', 'SCREEN_RETURN_TICKETS', 'Quản lý trả hàng & Hoàn tiền',
        'Tiếp nhận sản phẩm khách trả lại, hoàn tiền và tự động cộng lại tồn kho',
        '/return-tickets', 'ALL', 0, TRUE);

INSERT IGNORE INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-13-ret-01', 'guide-13-returns', 1, 'Bấm Tạo phiếu trả hàng', 'Bấm nút Tạo phiếu trả hàng ở góc trên bên phải màn hình để bắt đầu tiếp nhận.', '#btn-create-return', 'Tạo phiếu trả', '/images/guides/ret_step1.png'),
('step-13-ret-02', 'guide-13-returns', 2, 'Tìm đơn mua hàng ban đầu', 'Gõ mã hóa đơn cũ của khách để hệ thống hiển thị danh sách các món khách đã từng mua.', '#return-order-lookup', 'Chọn đơn cũ', '/images/guides/ret_step2.png'),
('step-13-ret-03', 'guide-13-returns', 3, 'Chọn số lượng trả và Hoàn tiền', 'Nhập số lượng mặt hàng khách trả lại, kiểm tra số tiền hoàn và bấm Xác nhận để cộng kho.', '#btn-confirm-return', 'Xác nhận hoàn tiền', '/images/guides/ret_step3.png');

-- 7. Màn hình Chương trình khuyến mại (SCREEN_PROMOTIONS)
INSERT IGNORE INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-14-promotions', 'SCREEN_PROMOTIONS', 'Chương trình khuyến mại & Giảm giá',
        'Tạo chương trình giảm giá phần trăm hoặc tặng kèm để kích thích khách mua nhiều hàng hơn',
        '/promotions', 'VT-01', 0, TRUE);

INSERT IGNORE INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-14-pro-01', 'guide-14-promotions', 1, 'Bấm Tạo khuyến mại mới', 'Bấm nút Thêm chương trình khuyến mại màu xanh để mở biểu mẫu thiết lập.', '#btn-create-promo', 'Tạo khuyến mại', '/images/guides/pro_step1.png'),
('step-14-pro-02', 'guide-14-promotions', 2, 'Cài đặt mức giảm và thời gian', 'Đặt tên chương trình, ngày bắt đầu, ngày kết thúc và mức giảm giá (ví dụ giảm 10% hoặc giảm 20.000đ).', '#promo-form-content', 'Cài đặt mức giảm', '/images/guides/pro_step2.png'),
('step-14-pro-03', 'guide-14-promotions', 3, 'Kích hoạt và Bán hàng', 'Bấm Lưu. Khi thu ngân bán các món thuộc chương trình tại màn hình POS, hệ thống sẽ tự động trừ tiền giảm giá.', '#btn-save-promo', 'Lưu & Bật khuyến mại', '/images/guides/pro_step3.png');

-- 8. Màn hình Quản lý nhân viên (SCREEN_EMPLOYEE_MANAGEMENT)
INSERT IGNORE INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-15-employees', 'SCREEN_EMPLOYEE_MANAGEMENT', 'Quản lý nhân viên & Phân quyền tài khoản',
        'Tạo tài khoản cho nhân viên thu ngân hoặc kế toán và quản lý trạng thái hoạt động',
        '/employees', 'VT-01', 0, TRUE);

INSERT IGNORE INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-15-emp-01', 'guide-15-employees', 1, 'Bấm Thêm nhân viên', 'Tại màn hình danh sách nhân viên, bấm nút Thêm nhân viên mới ở góc phải.', '#btn-add-employee', 'Thêm nhân viên', '/images/guides/emp_step1.png'),
('step-15-emp-02', 'guide-15-employees', 2, 'Nhập thông tin & Chọn vai trò', 'Điền họ tên, số điện thoại để nhân viên đăng nhập. Chọn vai trò Thu ngân (VT-02) hoặc Kế toán (VT-03).', '#employee-form-modal', 'Phân vai trò', '/images/guides/emp_step2.png'),
('step-15-emp-03', 'guide-15-employees', 3, 'Lưu và Cung cấp mật khẩu', 'Bấm nút Lưu để hoàn tất tạo tài khoản. Cung cấp mật khẩu đăng nhập ban đầu cho nhân viên sử dụng.', '#btn-save-employee', 'Lưu nhân viên', '/images/guides/emp_step3.png');

-- 9. Màn hình Cấu hình cửa hàng (SCREEN_BUSINESS_INFO)
INSERT IGNORE INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-16-settings', 'SCREEN_BUSINESS_INFO', 'Cấu hình cửa hàng & Thông tin kinh doanh',
        'Cập nhật tên hộ kinh doanh, địa chỉ, mã số thuế và thiết lập máy in hóa đơn',
        '/settings', 'VT-01', 0, TRUE);

INSERT IGNORE INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-16-set-01', 'guide-16-settings', 1, 'Kiểm tra thông tin pháp lý hộ kinh doanh', 'Đảm bảo Tên cửa hàng, Mã số thuế và Địa chỉ kinh doanh luôn chính xác để in đúng lên hóa đơn gửi khách.', '#settings-business-profile', 'Thông tin hộ KD', '/images/guides/set_step1.png'),
('step-16-set-02', 'guide-16-settings', 2, 'Cài đặt máy in hóa đơn', 'Chọn khổ giấy in (K80 hoặc K58) và cấu hình chế độ tự động in sau khi hoàn tất đơn hàng POS.', '#settings-printer-tab', 'Cài đặt máy in', '/images/guides/set_step2.png'),
('step-16-set-03', 'guide-16-settings', 3, 'Tùy chỉnh font chữ & Giao diện đơn giản', 'Bấm vào mục Giao diện để phóng to cỡ chữ hoặc bật chế độ Tối giản hóa giúp người lớn tuổi dễ thao tác.', '#settings-display-tab', 'Giao diện hiển thị', '/images/guides/set_step3.png');
