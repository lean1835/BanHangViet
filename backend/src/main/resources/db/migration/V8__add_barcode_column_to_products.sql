-- V8__add_barcode_column_to_products.sql
-- Thêm cột barcode vào bảng products và đánh chỉ mục hỗ trợ truy vấn quét mã vạch theo hộ kinh doanh

ALTER TABLE products ADD COLUMN barcode VARCHAR(100) NULL AFTER sku;

CREATE INDEX idx_products_household_barcode ON products (household_id, barcode);
