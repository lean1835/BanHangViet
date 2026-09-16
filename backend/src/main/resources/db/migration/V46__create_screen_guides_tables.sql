-- =========================================================================
-- Migration Script: Create Screen Guides Tables (NCL-19-CN-003)
-- Target tables: screen_guides, screen_guide_steps, screen_guide_view_logs
-- =========================================================================

-- 1. Bảng danh mục hướng dẫn màn hình hệ thống
CREATE TABLE IF NOT EXISTS screen_guides (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh hướng dẫn màn hình',
    screen_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã định danh duy nhất của màn hình (SCREEN_POS_CHECKOUT, SCREEN_INVOICE_CONFIG...)',
    screen_name VARCHAR(255) NOT NULL COMMENT 'Tên hiển thị thân thiện của màn hình',
    description VARCHAR(500) NULL COMMENT 'Mô tả ngắn gọn mục đích và chức năng của màn hình',
    action_url VARCHAR(255) NULL COMMENT 'Đường dẫn liên kết mở thẳng màn hình trên giao diện Frontend',
    target_role VARCHAR(50) NOT NULL DEFAULT 'ALL' COMMENT 'Nhóm vai trò áp dụng: ALL, VT-01, VT-02, VT-03',
    view_count BIGINT NOT NULL DEFAULT 0 COMMENT 'Tổng số lượt người dùng mở xem trợ giúp trên màn hình này',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái bật (TRUE) hoặc tạm tắt (FALSE) hướng dẫn',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo bản ghi',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật bản ghi gần nhất'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng danh mục hướng dẫn ngắn tại chỗ theo từng màn hình (NCL-19-CN-003)';

CREATE INDEX idx_sg_screen_code ON screen_guides(screen_code);
CREATE INDEX idx_sg_view_count ON screen_guides(view_count DESC);
CREATE INDEX idx_sg_is_active ON screen_guides(is_active);

-- 2. Bảng chi tiết các bước hướng dẫn (3 đến 5 bước ngắn gọn)
CREATE TABLE IF NOT EXISTS screen_guide_steps (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh bước hướng dẫn',
    guide_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết bảng screen_guides',
    step_number INT NOT NULL COMMENT 'Thứ tự bước thao tác (1, 2, 3, 4, 5)',
    title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề ngắn gọn của bước theo ngôn ngữ đời thường',
    content TEXT NOT NULL COMMENT 'Nội dung hướng dẫn chi tiết theo câu ngắn, chỉ rõ vị trí và hành động',
    target_element_selector VARCHAR(100) NULL COMMENT 'CSS Selector hoặc ID nút bấm để giao diện làm nổi bật vị trí',
    button_label VARCHAR(100) NULL COMMENT 'Tên nhãn nút trên giao diện cần bấm (ví dụ: Lưu ký hiệu, Thanh toán...)',
    image_url VARCHAR(500) NULL COMMENT 'Đường dẫn ảnh minh họa vị trí thao tác nút bấm trên màn hình',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo bước',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật bước',
    CONSTRAINT fk_sgs_guide FOREIGN KEY (guide_id) REFERENCES screen_guides(id) ON DELETE CASCADE,
    CONSTRAINT uq_sgs_guide_step UNIQUE (guide_id, step_number),
    CONSTRAINT chk_sgs_step_number CHECK (step_number >= 1 AND step_number <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu chi tiết các bước hướng dẫn thao tác (3-5 bước) theo màn hình (NCL-19-CN-003)';

CREATE INDEX idx_sgs_guide_step ON screen_guide_steps(guide_id, step_number ASC);

-- 3. Bảng nhật ký mở xem trợ giúp & Phục vụ cải tiến UX
CREATE TABLE IF NOT EXISTS screen_guide_view_logs (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh lượt mở xem trợ giúp',
    screen_code VARCHAR(50) NOT NULL COMMENT 'Mã màn hình được mở trợ giúp',
    household_id VARCHAR(36) NULL COMMENT 'Khóa ngoại hộ kinh doanh phát sinh lượt xem (NULL nếu là platform)',
    user_id VARCHAR(36) NULL COMMENT 'Khóa ngoại người dùng mở trợ giúp',
    duration_seconds INT NULL DEFAULT 0 COMMENT 'Thời gian người dùng mở xem trước khi đóng (giây)',
    completed BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Người dùng đã duyệt xem hết toàn bộ các bước hay chưa',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm người dùng mở khung hướng dẫn',
    CONSTRAINT fk_sgvl_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE SET NULL,
    CONSTRAINT fk_sgvl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhật ký lịch sử mở xem trợ giúp theo màn hình phục vụ cải tiến UX (NCL-19-CN-003)';

CREATE INDEX idx_sgvl_screen_created ON screen_guide_view_logs(screen_code, created_at DESC);
CREATE INDEX idx_sgvl_household ON screen_guide_view_logs(household_id, created_at DESC);
CREATE INDEX idx_sgvl_completed ON screen_guide_view_logs(completed);

-- =========================================================================
-- SEED DATA: KHỞI TẠO NỘI DUNG MẶC ĐỊNH CHO 7 MÀN HÌNH TRỌNG ĐIỂM
-- =========================================================================

-- 1. Màn hình Cấu hình Mẫu và Ký hiệu Hóa đơn (Phục vụ trực tiếp TC-02 khi phát hành hóa đơn bị chặn)
INSERT INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-01-inv-cfg', 'SCREEN_INVOICE_CONFIG', 'Cấu hình mẫu và ký hiệu hóa đơn điện tử', 
        'Khai báo ký hiệu hóa đơn theo chuẩn Cơ quan Thuế để đủ điều kiện phát hành hóa đơn', 
        '/settings/invoice-template', 'VT-01', 0, TRUE);

INSERT INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-01-inv-01', 'guide-01-inv-cfg', 1, 'Mở màn hình Cấu hình hóa đơn', 'Bấm vào biểu tượng Bánh răng (Cài đặt) ở góc trên bên phải, sau đó chọn mục Mẫu hóa đơn.', '#menu-settings-invoice', 'Cấu hình hóa đơn', '/images/guides/invoice_cfg_step1.png'),
('step-01-inv-02', 'guide-01-inv-cfg', 2, 'Chọn loại hóa đơn kinh doanh', 'Chọn loại Hóa đơn giá trị gia tăng (mẫu 1) hoặc Hóa đơn bán hàng (mẫu 2) phù hợp với phương pháp tính thuế của bạn.', '#select-invoice-pattern', 'Chọn loại hóa đơn', '/images/guides/invoice_cfg_step2.png'),
('step-01-inv-03', 'guide-01-inv-cfg', 3, 'Nhập ký hiệu hóa đơn', 'Điền ký hiệu hóa đơn gồm 7 ký tự theo thông báo của Thuế (ví dụ: 1C26TAA). Chữ số đầu là mẫu số, C là có mã CQT, 26 là năm 2026.', '#input-invoice-symbol', 'Nhập ký hiệu', '/images/guides/invoice_cfg_step3.png'),
('step-01-inv-04', 'guide-01-inv-cfg', 4, 'Bấm nút Lưu ký hiệu để hoàn tất', 'Kiểm tra lại ký hiệu vừa nhập rồi bấm nút Lưu màu xanh lá cây ở góc dưới màn hình để hoàn thành khai báo.', '#btn-save-invoice-template', 'Lưu ký hiệu', '/images/guides/invoice_cfg_step4.png');

-- 2. Màn hình Bán hàng POS (SCREEN_POS_CHECKOUT)
INSERT INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-02-pos-chk', 'SCREEN_POS_CHECKOUT', 'Màn hình thu ngân & Bán hàng POS', 
        'Các bước chọn hàng, sửa số lượng và thanh toán tiền cho khách tại quầy', 
        '/pos', 'ALL', 0, TRUE);

INSERT INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-02-pos-01', 'guide-02-pos-chk', 1, 'Tìm hoặc quét mã vạch sản phẩm', 'Dùng máy quét mã vạch vào bao bì sản phẩm hoặc gõ tên mặt hàng vào ô Tìm kiếm hàng hóa ở phía trên màn hình.', '#pos-search-input', 'Tìm hàng hóa', '/images/guides/pos_step1.png'),
('step-02-pos-02', 'guide-02-pos-chk', 2, 'Chọn mặt hàng và điều chỉnh số lượng', 'Bấm vào mặt hàng hiển thị để đưa vào giỏ. Bấm nút dấu cộng (+) hoặc trừ (-) trên dòng để tăng giảm số lượng mua.', '#pos-cart-table', 'Thêm vào giỏ', '/images/guides/pos_step2.png'),
('step-02-pos-03', 'guide-02-pos-chk', 3, 'Bấm nút Thanh toán màu xanh to', 'Nhìn sang góc dưới bên phải màn hình giỏ hàng và bấm nút Thanh toán có hiện tổng số tiền khách cần trả.', '#btn-pos-checkout', 'Thanh toán', '/images/guides/pos_step3.png'),
('step-02-pos-04', 'guide-02-pos-chk', 4, 'Nhập tiền khách đưa và Hoàn tất', 'Chọn hình thức Tiền mặt hoặc Chuyển khoản QR. Nhập số tiền khách đưa và bấm Hoàn tất để in hóa đơn trả khách.', '#btn-pos-complete', 'Hoàn tất đơn', '/images/guides/pos_step4.png');

-- 3. Màn hình Phát hành Hóa đơn Điện tử (SCREEN_E_INVOICE_CREATE)
INSERT INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-03-inv-crt', 'SCREEN_E_INVOICE_CREATE', 'Phát hành hóa đơn điện tử gửi Thuế', 
        'Tạo hóa đơn điện tử từ đơn hàng hoàn tất và gửi cấp mã cơ quan thuế', 
        '/invoices/create', 'VT-01', 0, TRUE);

INSERT INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-03-inv-01', 'guide-03-inv-crt', 1, 'Chọn đơn hàng cần xuất hóa đơn', 'Chọn đơn hàng đã thanh toán thành công trong danh sách đơn để tạo hóa đơn nháp.', '#invoice-order-select', 'Chọn đơn hàng', '/images/guides/inv_crt_step1.png'),
('step-03-inv-02', 'guide-03-inv-crt', 2, 'Kiểm tra thông tin người mua', 'Nhập tên khách hàng, mã số thuế hoặc địa chỉ nếu khách yêu cầu xuất hóa đơn công ty.', '#invoice-buyer-info', 'Thông tin người mua', '/images/guides/inv_crt_step2.png'),
('step-03-inv-03', 'guide-03-inv-crt', 3, 'Bấm nút Gửi Cơ quan Thuế cấp mã', 'Bấm nút Gửi CQT màu xanh đậm ở góc phải để hệ thống truyền dữ liệu hóa đơn lên hệ thống Thuế.', '#btn-submit-to-tax', 'Gửi cơ quan thuế', '/images/guides/inv_crt_step3.png'),
('step-03-inv-04', 'guide-03-inv-crt', 4, 'Nhận kết quả và giao hóa đơn cho khách', 'Khi trạng thái chuyển sang Đã cấp mã, bạn có thể bấm In hóa đơn hoặc Gửi mã QR tra cứu cho khách xem trên điện thoại.', '#btn-print-invoice', 'In / Gửi khách', '/images/guides/inv_crt_step4.png');

-- 4. Màn hình Quản lý Hàng hóa (SCREEN_PRODUCT_MANAGEMENT)
INSERT INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-04-prod-mgmt', 'SCREEN_PRODUCT_MANAGEMENT', 'Quản lý danh mục hàng hóa', 
        'Thêm mới mặt hàng, cài đặt giá bán và số lượng tồn kho ban đầu', 
        '/products', 'ALL', 0, TRUE);

INSERT INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-04-prod-01', 'guide-04-prod-mgmt', 1, 'Bấm nút Thêm mặt hàng mới', 'Tại danh sách hàng hóa, bấm nút Thêm hàng màu xanh ở phía trên góc phải màn hình.', '#btn-add-product', 'Thêm hàng mới', '/images/guides/prod_step1.png'),
('step-04-prod-02', 'guide-04-prod-mgmt', 2, 'Điền tên hàng và giá bán', 'Gõ tên hàng hóa dễ nhớ, đơn vị tính (gói, lon, cái, kg) và giá tiền bạn muốn bán cho khách.', '#product-form-fields', 'Điền thông tin', '/images/guides/prod_step2.png'),
('step-04-prod-03', 'guide-04-prod-mgmt', 3, 'Bấm nút Lưu hàng hóa', 'Bấm nút Lưu ở dưới cùng biểu mẫu để đưa sản phẩm lên quầy bán hàng POS ngay lập tức.', '#btn-save-product', 'Lưu mặt hàng', '/images/guides/prod_step3.png');

-- 5. Màn hình Đối chiếu Công nợ (SCREEN_CUSTOMER_DEBT)
INSERT INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-05-cust-debt', 'SCREEN_CUSTOMER_DEBT', 'Sổ nợ & Đối chiếu công nợ khách hàng', 
        'Theo dõi số tiền khách mua nợ, lập biên bản đối chiếu và in giấy xác nhận nợ', 
        '/debts', 'VT-01', 0, TRUE);

INSERT INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-05-debt-01', 'guide-05-cust-debt', 1, 'Chọn khách hàng cần xem nợ', 'Gõ tên hoặc số điện thoại khách hàng quen vào ô tìm kiếm để mở trang sổ nợ của khách đó.', '#debt-customer-search', 'Chọn khách nợ', '/images/guides/debt_step1.png'),
('step-05-debt-02', 'guide-05-cust-debt', 2, 'Xem các đơn hàng chưa trả tiền', 'Kiểm tra danh sách các ngày mua nợ, số tiền từng đơn và tổng nợ hiện tại của khách.', '#debt-ledger-table', 'Xem chi tiết nợ', '/images/guides/debt_step2.png'),
('step-05-debt-03', 'guide-05-cust-debt', 3, 'Bấm nút Lập đối chiếu công nợ', 'Chọn khoảng thời gian (ví dụ từ đầu tháng đến nay) và bấm nút Lập đối chiếu nợ để chốt số liệu.', '#btn-create-reconciliation', 'Lập đối chiếu nợ', '/images/guides/debt_step3.png'),
('step-05-debt-04', 'guide-05-cust-debt', 4, 'Bấm In giấy xác nhận nợ gửi khách', 'Bấm nút In biên bản để gửi giấy xác nhận nợ có ghi rõ chi tiết từng đơn hàng cho khách ký tên.', '#btn-print-reconciliation', 'In giấy chốt nợ', '/images/guides/debt_step4.png');

-- 6. Màn hình Nhập kho hàng hóa (SCREEN_GOODS_RECEIPT)
INSERT INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-06-goods-rcpt', 'SCREEN_GOODS_RECEIPT', 'Nhập kho hàng hóa từ nhà cung cấp', 
        'Tạo phiếu nhập kho để cập nhật số lượng tồn kho và theo dõi giá vốn hàng mua', 
        '/inventory/receipts', 'ALL', 0, TRUE);

INSERT INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-06-rcpt-01', 'guide-06-goods-rcpt', 1, 'Bấm nút Tạo phiếu nhập kho', 'Bấm nút màu xanh Lập phiếu nhập ở góc trên bên phải trang Quản lý kho.', '#btn-create-receipt', 'Lập phiếu nhập', '/images/guides/rcpt_step1.png'),
('step-06-rcpt-02', 'guide-06-goods-rcpt', 2, 'Chọn nhà cung cấp và mặt hàng nhập', 'Gõ tên nhà cung cấp giao hàng, sau đó quét mã vạch hoặc chọn các mặt hàng vừa nhận vào phiếu.', '#receipt-item-selector', 'Thêm hàng nhập', '/images/guides/rcpt_step2.png'),
('step-06-rcpt-03', 'guide-06-goods-rcpt', 3, 'Nhập số lượng, đơn giá và Bấm Lưu', 'Điền số lượng thực nhận và giá nhập từ bên giao hàng, sau đó bấm nút Lưu phiếu nhập kho để cộng tồn hàng.', '#btn-save-receipt', 'Lưu phiếu nhập', '/images/guides/rcpt_step3.png');

-- 7. Màn hình Sổ sách & Kỳ kê khai thuế (SCREEN_TAX_PERIOD)
INSERT INTO screen_guides (id, screen_code, screen_name, description, action_url, target_role, view_count, is_active)
VALUES ('guide-07-tax-period', 'SCREEN_TAX_PERIOD', 'Sổ sách & Kỳ kê khai thuế', 
        'Tổng hợp doanh thu bán ra, bảng kê mua vào và kiểm tra số liệu chuẩn bị nộp thuế', 
        '/tax-periods', 'VT-01', 0, TRUE);

INSERT INTO screen_guide_steps (id, guide_id, step_number, title, content, target_element_selector, button_label, image_url)
VALUES 
('step-07-tax-01', 'guide-07-tax-period', 1, 'Chọn kỳ tính thuế Tháng hoặc Quý', 'Chọn đúng kỳ bạn cần nộp thuế (ví dụ Quý 3 năm 2026) để hệ thống tự động gom dữ liệu bán hàng.', '#tax-period-selector', 'Chọn kỳ thuế', '/images/guides/tax_step1.png'),
('step-07-tax-02', 'guide-07-tax-period', 2, 'Kiểm tra bảng tổng hợp doanh thu', 'Xem lại tổng tiền bán ra, tiền thuế từng nhóm ngành hàng để đảm bảo khớp với thực tế.', '#tax-summary-view', 'Kiểm tra doanh thu', '/images/guides/tax_step2.png'),
('step-07-tax-03', 'guide-07-tax-period', 3, 'Bấm Lập bảng kê mua vào', 'Bấm nút Lập bảng kê mua vào để rà soát chi phí hàng hóa mua trong kỳ phục vụ thanh tra thuế.', '#btn-gen-purchase-reg', 'Lập bảng kê mua vào', '/images/guides/tax_step3.png'),
('step-07-tax-04', 'guide-07-tax-period', 4, 'Bấm Xuất tờ khai thuế', 'Bấm nút Tải tờ khai thuế 01/CNKD hoặc xuất file Excel để gửi cho kế toán hoặc nộp lên Cổng thuế.', '#btn-export-tax-form', 'Xuất tờ khai', '/images/guides/tax_step4.png');
