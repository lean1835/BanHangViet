-- =========================================================================
-- Migration Script: Create FAQ and Support Information Tables (NCL-19-CN-004)
-- Target tables: faq_items, support_channels
-- =========================================================================

-- 1. Bảng lưu trữ câu hỏi thường gặp
CREATE TABLE IF NOT EXISTS faq_items (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh câu hỏi thường gặp',
    category VARCHAR(50) NOT NULL COMMENT 'Nhóm câu hỏi: INVOICE, SALES, ACCOUNT, DATA',
    question VARCHAR(500) NOT NULL COMMENT 'Nội dung câu hỏi ngắn gọn theo ngôn ngữ đời thường',
    answer TEXT NOT NULL COMMENT 'Nội dung câu trả lời hướng dẫn xử lý ngắn gọn, dễ hiểu',
    action_url VARCHAR(255) NULL COMMENT 'Đường dẫn liên kết mở thẳng màn hình xử lý trên giao diện Frontend',
    action_label VARCHAR(100) NULL COMMENT 'Tên nhãn nút trên giao diện cần bấm (ví dụ: Xem hóa đơn lỗi, Đổi mật khẩu)',
    keywords VARCHAR(500) NULL COMMENT 'Các từ khóa tìm kiếm nhanh phân tách bằng dấu phẩy',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị ưu tiên trong nhóm danh mục',
    view_count BIGINT NOT NULL DEFAULT 0 COMMENT 'Tổng số lượt người dùng mở xem câu hỏi này',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái hiệu lực (TRUE: hiển thị, FALSE: tạm ẩn)',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo câu hỏi',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật câu hỏi gần nhất',
    CONSTRAINT chk_faq_category CHECK (category IN ('INVOICE', 'SALES', 'ACCOUNT', 'DATA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu trữ câu hỏi thường gặp (NCL-19-CN-004)';

CREATE INDEX idx_faq_category ON faq_items(category);
CREATE INDEX idx_faq_is_active ON faq_items(is_active);
CREATE INDEX idx_faq_order ON faq_items(category, display_order ASC);
CREATE INDEX idx_faq_view_count ON faq_items(view_count DESC);

-- 2. Bảng lưu thông tin các kênh liên hệ hỗ trợ kỹ thuật
CREATE TABLE IF NOT EXISTS support_channels (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh kênh hỗ trợ kỹ thuật',
    channel_type VARCHAR(50) NOT NULL COMMENT 'Loại kênh: HOTLINE, ZALO, EMAIL, WORKING_HOURS, PORTAL',
    channel_name VARCHAR(100) NOT NULL COMMENT 'Tên hiển thị thân thiện của kênh (ví dụ: Tổng đài kỹ thuật, Zalo hỗ trợ 24/7)',
    contact_value VARCHAR(255) NOT NULL COMMENT 'Giá trị liên hệ: Số điện thoại, Email, Giờ làm việc hoặc Đường dẫn liên kết',
    description VARCHAR(255) NULL COMMENT 'Mô tả ngắn gọn (ví dụ: Miễn cước cuộc gọi, Phản hồi sau 5 phút)',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị ưu tiên',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái kích hoạt kênh hỗ trợ',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo kênh',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật kênh',
    CONSTRAINT chk_sc_type CHECK (channel_type IN ('HOTLINE', 'ZALO', 'EMAIL', 'WORKING_HOURS', 'PORTAL'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu thông tin các kênh liên hệ hỗ trợ kỹ thuật (NCL-19-CN-004)';

CREATE INDEX idx_sc_is_active ON support_channels(is_active);
CREATE INDEX idx_sc_order ON support_channels(display_order ASC);

-- 3. Nạp dữ liệu khởi tạo mặc định (Initial Seed Data)
-- Seed kênh liên hệ hỗ trợ kỹ thuật
INSERT INTO support_channels (id, channel_type, channel_name, contact_value, description, display_order, is_active)
VALUES
('sc-001', 'HOTLINE', 'Tổng đài hỗ trợ kỹ thuật', '1900 6868', 'Miễn phí cước cuộc gọi, tiếp nhận 07:30 - 22:00', 1, TRUE),
('sc-002', 'ZALO', 'Zalo hỗ trợ kỹ thuật 24/7', '0988 123 456', 'Tiếp nhận hình ảnh lỗi và giải đáp tức thì', 2, TRUE),
('sc-003', 'EMAIL', 'Hộp thư điện tử hỗ trợ', 'hotro@banhangviet.vn', 'Phản hồi chi tiết trong vòng 15 phút', 3, TRUE),
('sc-004', 'WORKING_HOURS', 'Giờ làm việc bộ phận hỗ trợ', '07:30 - 22:00 (Thứ Hai - Chủ Nhật)', 'Hỗ trợ liên tục tất cả các ngày trong tuần, kể cả ngày lễ', 4, TRUE),
('sc-005', 'PORTAL', 'Cổng hướng dẫn & Câu hỏi thường gặp', 'https://hotro.banhangviet.vn', 'Tra cứu cẩm nang và tài liệu số hóa', 5, TRUE);

-- Seed câu hỏi thường gặp cho 4 nhóm chuẩn hóa: INVOICE, SALES, ACCOUNT, DATA
-- Nhóm 1: Hóa đơn (INVOICE)
INSERT INTO faq_items (id, category, question, answer, action_url, action_label, keywords, display_order, view_count, is_active)
VALUES
('faq-inv-001', 'INVOICE', 'Hóa đơn điện tử bị treo hoặc gửi Cơ quan thuế bị lỗi thì xử lý thế nào?', 'Mở màn hình Quản lý hóa đơn điện tử, lọc trạng thái Gửi lỗi hoặc Đang xử lý. Bạn có thể nhấn nút "Gửi lại thuế" để hệ thống truyền lại dữ liệu. Nếu Cơ quan thuế từ chối do sai sót thông tin, xem chi tiết lý do từ chối để chỉnh sửa kịp thời.', '/invoices?status=FAILED', 'Kiểm tra hóa đơn lỗi', 'hóa đơn treo, hoa don treo, loi hoa don, thue tu choi, gui thue loi, hoa don loi', 1, 15, TRUE),
('faq-inv-002', 'INVOICE', 'Làm thế nào để sửa hoặc điều chỉnh hóa đơn đã cấp mã bị sai sót?', 'Với hóa đơn đã được Cơ quan thuế cấp mã nhưng phát hiện sai sót, bạn vào danh sách Hóa đơn, chọn hóa đơn cần xử lý và nhấn "Lập hóa đơn điều chỉnh" hoặc "Lập hóa đơn thay thế" theo quy định của Thông tư 78.', '/invoices', 'Xem danh sách hóa đơn', 'sua hoa don, dieu chinh hoa don, hoa don sai, thay the hoa don, thong tu 78', 2, 8, TRUE),
('faq-inv-003', 'INVOICE', 'Dải số hóa đơn bị hết số thì cần làm gì để tiếp tục xuất đơn?', 'Khi dải số hóa đơn đã dùng hết, hệ thống sẽ chặn xuất đơn mới. Bạn cần vào mục Cấu hình hóa đơn để khai báo dải số hóa đơn mới theo ký hiệu mẫu số đã đăng ký với Cơ quan thuế.', '/settings/invoice-ranges', 'Khai báo dải số mới', 'het so hoa don, dai so hoa don, ky hieu mau so, het dai so', 3, 5, TRUE);

-- Nhóm 2: Tài khoản (ACCOUNT)
INSERT INTO faq_items (id, category, question, answer, action_url, action_label, keywords, display_order, view_count, is_active)
VALUES
('faq-acc-001', 'ACCOUNT', 'Quên mật khẩu đăng nhập hoặc muốn đổi mật khẩu thì làm sao?', 'Nếu bạn đang đăng nhập, hãy vào trang Thông tin cá nhân rồi chọn "Đổi mật khẩu". Nếu bạn quên mật khẩu ngoài màn hình đăng nhập, hãy nhấn "Quên mật khẩu" để nhận mã OTP qua Email hoặc Số điện thoại để đặt lại mật khẩu mới.', '/profile/change-password', 'Đổi mật khẩu ngay', 'quen mat khau, doi mat khau, doi pass, quen pass, reset mat khau, otp', 1, 20, TRUE),
('faq-acc-002', 'ACCOUNT', 'Tài khoản nhân viên thu ngân bị khóa thì mở khóa ở đâu?', 'Chỉ chủ hộ kinh doanh mới có quyền mở khóa tài khoản nhân viên. Chủ hộ vào mục Cài đặt -> Quản lý nhân viên, tìm nhân viên đang bị khóa và bấm "Mở khóa tài khoản".', '/settings/employees', 'Quản lý nhân viên', 'khoa tai khoan, mo khoa nhan vien, thu ngan bi khoa, tai khoan bi khoa', 2, 6, TRUE);

-- Nhóm 3: Bán hàng (SALES)
INSERT INTO faq_items (id, category, question, answer, action_url, action_label, keywords, display_order, view_count, is_active)
VALUES
('faq-sal-001', 'SALES', 'Đơn hàng bán xong chưa kịp xuất hóa đơn thì tìm lại ở đâu?', 'Bạn vào màn hình Danh sách đơn hàng tại quầy POS, sử dụng bộ lọc "Chưa xuất hóa đơn" để tra cứu đơn hàng cần phát hành bổ sung.', '/pos/orders', 'Danh sách đơn hàng', 'tim don hang, don chua xuat hoa don, pos ban hang, hoa don chua xuat', 1, 12, TRUE),
('faq-sal-002', 'SALES', 'Cách xử lý khi khách hàng trả lại hàng đã mua?', 'Để xử lý đổi trả hàng, bạn vào mục Bán hàng -> Phiếu trả hàng, chọn đơn hàng gốc hoặc quét mã vạch sản phẩm để hệ thống tự động hoàn tiền và hoàn tồn kho chuẩn xác.', '/return-tickets', 'Lập phiếu trả hàng', 'tra hang, doi tra, phieu tra hang, hoan tien, khach tra hang', 2, 9, TRUE);

-- Nhóm 4: Dữ liệu (DATA)
INSERT INTO faq_items (id, category, question, answer, action_url, action_label, keywords, display_order, view_count, is_active)
VALUES
('faq-dat-001', 'DATA', 'Dữ liệu của tôi được sao lưu như thế nào và làm sao kiểm tra an toàn?', 'Hệ thống tự động sao lưu dữ liệu toàn bộ cửa hàng hàng ngày vào lúc 02:30 sáng. Bạn có thể vào mục Cài đặt sao lưu để xem lịch sử và kết quả chạy thử phục hồi định kỳ.', '/settings/backup', 'Xem lịch sử sao lưu', 'sao luu du lieu, backup, mat du lieu, an toan du lieu, phuc hoi', 1, 7, TRUE),
('faq-dat-002', 'DATA', 'Cách kiểm tra và đối soát công nợ khách hàng định kỳ?', 'Vào phân hệ Khách hàng -> Đối soát công nợ, chọn khoảng thời gian và khách hàng để xem chi tiết các phát sinh mua nợ, thanh toán và số dư nợ hiện tại.', '/debt/reconciliation', 'Đối soát công nợ', 'doi soat cong no, cong no khach hang, so no, cong no', 2, 4, TRUE);
