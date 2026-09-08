-- Migration V16: Tạo bảng cho chức năng NCL-02-CN-009 Cập nhật giá bán hàng loạt theo nhóm hàng

CREATE TABLE IF NOT EXISTS price_adjustment_batches (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh đợt điều chỉnh giá',
    batch_code VARCHAR(50) NOT NULL COMMENT 'Mã đợt điều chỉnh (ví dụ: PADJ-20260908-001)',
    name VARCHAR(255) NOT NULL COMMENT 'Tên/Mô tả đợt điều chỉnh giá',
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết hộ kinh doanh',
    adjustment_type VARCHAR(30) NOT NULL COMMENT 'Cơ chế điều chỉnh: PERCENTAGE, FIXED_AMOUNT, PROFIT_MARGIN',
    adjustment_value DECIMAL(15, 2) NOT NULL COMMENT 'Giá trị điều chỉnh (+/- % hoặc +/- số tiền hoặc % lãi)',
    target_group_id VARCHAR(36) NULL COMMENT 'Mã nhóm hàng áp dụng (null nếu chọn danh sách lẻ)',
    rounding_method VARCHAR(30) NOT NULL DEFAULT 'NONE' COMMENT 'Quy cách làm tròn: NONE, ROUND_TO_100, ROUND_TO_500, ROUND_TO_1000',
    status VARCHAR(20) NOT NULL DEFAULT 'APPLIED' COMMENT 'Trạng thái đợt: APPLIED, REVERTED',
    total_items INT NOT NULL DEFAULT 0 COMMENT 'Tổng số mặt hàng bị ảnh hưởng',
    below_cost_items INT NOT NULL DEFAULT 0 COMMENT 'Số mặt hàng có giá mới thấp hơn giá vốn',
    applied_by VARCHAR(36) NOT NULL COMMENT 'ID người dùng thực hiện áp dụng',
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm áp dụng giá mới',
    reverted_by VARCHAR(36) NULL COMMENT 'ID người dùng thực hiện hoàn tác',
    reverted_at TIMESTAMP NULL COMMENT 'Thời điểm hoàn tác',
    revert_reason VARCHAR(500) NULL COMMENT 'Lý do hoàn tác đợt đổi giá',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_padj_batch_household FOREIGN KEY (household_id) REFERENCES business_households(id),
    CONSTRAINT fk_padj_batch_group FOREIGN KEY (target_group_id) REFERENCES product_groups(id) ON DELETE SET NULL,
    CONSTRAINT fk_padj_batch_applied_by FOREIGN KEY (applied_by) REFERENCES users(id),
    CONSTRAINT fk_padj_batch_reverted_by FOREIGN KEY (reverted_by) REFERENCES users(id),
    CONSTRAINT chk_padj_batch_status CHECK (status IN ('APPLIED', 'REVERTED')),
    CONSTRAINT chk_padj_batch_type CHECK (adjustment_type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'PROFIT_MARGIN')),
    CONSTRAINT chk_padj_batch_rounding CHECK (rounding_method IN ('NONE', 'ROUND_TO_100', 'ROUND_TO_500', 'ROUND_TO_1000')),
    CONSTRAINT uq_padj_batch_code_household UNIQUE (household_id, batch_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu các đợt điều chỉnh giá bán hàng loạt';

CREATE INDEX idx_padj_batch_household ON price_adjustment_batches(household_id);
CREATE INDEX idx_padj_batch_code ON price_adjustment_batches(batch_code);
CREATE INDEX idx_padj_batch_status ON price_adjustment_batches(status);
CREATE INDEX idx_padj_batch_applied_at ON price_adjustment_batches(applied_at);

CREATE TABLE IF NOT EXISTS price_adjustment_items (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh dòng chi tiết',
    batch_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết đợt điều chỉnh',
    product_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết sản phẩm',
    old_price DECIMAL(15, 2) NOT NULL COMMENT 'Giá bán trước khi điều chỉnh',
    new_price DECIMAL(15, 2) NOT NULL COMMENT 'Giá bán mới sau điều chỉnh',
    price_difference DECIMAL(15, 2) NOT NULL COMMENT 'Chênh lệch giá tuyệt đối (= new_price - old_price)',
    cost_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Giá vốn bình quân tại thời điểm điều chỉnh theo QTN-23',
    is_below_cost BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đánh dấu giá mới thấp hơn giá vốn',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_padj_item_batch FOREIGN KEY (batch_id) REFERENCES price_adjustment_batches(id) ON DELETE CASCADE,
    CONSTRAINT fk_padj_item_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT chk_padj_item_new_price CHECK (new_price >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết các mặt hàng thay đổi giá trong đợt';

CREATE INDEX idx_padj_item_batch ON price_adjustment_items(batch_id);
CREATE INDEX idx_padj_item_product ON price_adjustment_items(product_id);
