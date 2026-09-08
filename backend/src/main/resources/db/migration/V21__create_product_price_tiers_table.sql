-- Migration V20: Tạo bảng product_price_tiers và bổ sung cột cho order_items
-- Phục vụ chức năng NCL-02-CN-010: Quản lý giá bán lẻ và giá bán sỉ theo mức số lượng

CREATE TABLE IF NOT EXISTS product_price_tiers (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh bậc giá',
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết hộ kinh doanh để cô lập dữ liệu',
    product_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết sản phẩm',
    unit_conversion_id VARCHAR(36) NULL COMMENT 'Khóa ngoại đơn vị quy đổi (null nếu là đơn vị cơ bản)',
    tier_name VARCHAR(100) NOT NULL COMMENT 'Tên hiển thị của bậc giá (ví dụ: Giá bán lẻ, Giá sỉ cấp 1, Giá sỉ >= 10)',
    min_quantity DECIMAL(12, 3) NOT NULL DEFAULT 1.000 COMMENT 'Số lượng áp dụng tối thiểu',
    max_quantity DECIMAL(12, 3) NULL COMMENT 'Số lượng áp dụng tối đa (NULL nghĩa là không giới hạn trên)',
    price DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Đơn giá bán áp dụng cho bậc này',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái hiệu lực của bậc giá',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ppt_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_ppt_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_ppt_unit_conversion FOREIGN KEY (unit_conversion_id) REFERENCES product_unit_conversions(id) ON DELETE SET NULL,
    CONSTRAINT chk_ppt_min_qty CHECK (min_quantity > 0.000),
    CONSTRAINT chk_ppt_max_qty CHECK (max_quantity IS NULL OR max_quantity >= min_quantity),
    CONSTRAINT chk_ppt_price CHECK (price >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu cấu hình giá bán lẻ và giá bán sỉ theo mức số lượng';

CREATE INDEX idx_ppt_household ON product_price_tiers(household_id);
CREATE INDEX idx_ppt_product ON product_price_tiers(product_id);
CREATE INDEX idx_ppt_product_active ON product_price_tiers(product_id, is_active);
CREATE INDEX idx_ppt_unit_conversion ON product_price_tiers(unit_conversion_id);

ALTER TABLE order_items 
    ADD COLUMN price_tier_id VARCHAR(36) NULL COMMENT 'Khóa ngoại bậc giá đã áp dụng',
    ADD COLUMN price_tier_name VARCHAR(100) NULL COMMENT 'Tên bậc giá áp dụng hiển thị trên dòng hàng',
    ADD CONSTRAINT fk_order_item_price_tier FOREIGN KEY (price_tier_id) REFERENCES product_price_tiers(id) ON DELETE SET NULL;

CREATE INDEX idx_order_items_price_tier ON order_items(price_tier_id);
