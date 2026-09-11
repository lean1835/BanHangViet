-- Migration V18: Tạo bảng đơn vị quy đổi và bổ sung cột cho order_items, goods_receipt_details
-- Phục vụ chức năng NCL-02-CN-007: Quản lý đơn vị tính và quy đổi đơn vị mua bán

-- 1. Tạo bảng product_unit_conversions
CREATE TABLE IF NOT EXISTS product_unit_conversions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    unit_name VARCHAR(50) NOT NULL,
    conversion_factor DECIMAL(12, 3) NOT NULL,
    price DECIMAL(15, 2) NULL,
    barcode VARCHAR(100) NULL,
    is_default_import BOOLEAN NOT NULL DEFAULT FALSE,
    is_default_sale BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_puc_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_puc_conversion_factor CHECK (conversion_factor > 0.000),
    CONSTRAINT chk_puc_price CHECK (price IS NULL OR price >= 0.00),
    CONSTRAINT uq_product_unit_name UNIQUE (product_id, unit_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu cấu hình đơn vị quy đổi của sản phẩm';

CREATE INDEX idx_puc_product_id ON product_unit_conversions(product_id);
CREATE INDEX idx_puc_barcode ON product_unit_conversions(barcode);

-- 2. Bổ sung các cột đơn vị quy đổi vào bảng order_items
ALTER TABLE order_items
    ADD COLUMN unit_conversion_id VARCHAR(36) NULL,
    ADD COLUMN unit_name VARCHAR(50) NULL,
    ADD COLUMN conversion_factor DECIMAL(12, 3) NULL DEFAULT 1.000,
    ADD COLUMN base_quantity DECIMAL(12, 3) NULL,
    ADD CONSTRAINT fk_order_items_unit_conversion FOREIGN KEY (unit_conversion_id) REFERENCES product_unit_conversions(id) ON DELETE SET NULL;

CREATE INDEX idx_order_items_unit_conversion ON order_items(unit_conversion_id);

-- 3. Bổ sung các cột đơn vị quy đổi vào bảng goods_receipt_details
ALTER TABLE goods_receipt_details
    ADD COLUMN unit_conversion_id VARCHAR(36) NULL,
    ADD COLUMN unit_name VARCHAR(50) NULL,
    ADD COLUMN conversion_factor DECIMAL(12, 3) NULL DEFAULT 1.000,
    ADD COLUMN base_quantity DECIMAL(12, 3) NULL,
    ADD COLUMN base_purchase_price DECIMAL(15, 2) NULL,
    ADD CONSTRAINT fk_grd_unit_conversion FOREIGN KEY (unit_conversion_id) REFERENCES product_unit_conversions(id) ON DELETE SET NULL;

CREATE INDEX idx_grd_unit_conversion ON goods_receipt_details(unit_conversion_id);
