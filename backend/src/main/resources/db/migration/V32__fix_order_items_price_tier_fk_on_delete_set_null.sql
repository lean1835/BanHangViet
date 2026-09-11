-- ==========================================================
-- Migration V32: Sửa foreign key constraint trên order_items.price_tier_id sang ON DELETE SET NULL
-- Đảm bảo an toàn và Idempotent: Hoạt động chuẩn xác trên mọi môi trường (Local, CI, Staging, Prod)
-- Không phụ thuộc vào tên constraint ngẫu nhiên do Hibernate tự sinh ra
-- ==========================================================

-- 1. Tra cứu và xóa foreign key cũ trên cột price_tier_id nếu có
SET @fk_name := (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'order_items' 
      AND COLUMN_NAME = 'price_tier_id' 
      AND REFERENCED_TABLE_NAME = 'product_price_tiers'
    LIMIT 1
);

SET @drop_fk_sql := IF(@fk_name IS NOT NULL, 
    CONCAT('ALTER TABLE `order_items` DROP FOREIGN KEY `', @fk_name, '`;'), 
    'SELECT 1;'
);
PREPARE stmt_drop FROM @drop_fk_sql;
EXECUTE stmt_drop;
DEALLOCATE PREPARE stmt_drop;

-- 2. Thêm lại foreign key với tên chuẩn hóa fk_order_item_price_tier và ON DELETE SET NULL
ALTER TABLE `order_items` 
    ADD CONSTRAINT `fk_order_item_price_tier` 
    FOREIGN KEY (`price_tier_id`) REFERENCES `product_price_tiers`(`id`) ON DELETE SET NULL;
