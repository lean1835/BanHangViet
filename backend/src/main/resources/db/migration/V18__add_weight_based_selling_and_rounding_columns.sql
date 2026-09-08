-- V17: Add columns and constraints for weight-based selling and rounding rules
-- NCL-02-CN-008: Bán hàng theo cân với số lượng thập phân
-- Tuân thủ theo Structure Data/database_design.sql

-- 1. Bổ sung cấu hình bán theo cân vào bảng products
ALTER TABLE products 
    ADD COLUMN is_sold_by_weight BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN decimal_places INT NOT NULL DEFAULT 0,
    ADD COLUMN min_weight_step DECIMAL(12,3) NOT NULL DEFAULT 1.000,
    ADD COLUMN initial_stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    ADD CONSTRAINT chk_product_decimal_places CHECK (decimal_places >= 0 AND decimal_places <= 3),
    ADD CONSTRAINT chk_product_min_weight_step CHECK (min_weight_step > 0.000);

-- 2. Bổ sung trường chênh lệch làm tròn vào order_items
ALTER TABLE order_items 
    ADD COLUMN rounding_difference DECIMAL(15,2) NOT NULL DEFAULT 0.00;

-- 3. Bổ sung quy tắc làm tròn vào business_households
ALTER TABLE business_households 
    ADD COLUMN rounding_rule VARCHAR(20) NOT NULL DEFAULT 'HALF_UP',
    ADD CONSTRAINT chk_household_rounding_rule CHECK (rounding_rule IN ('HALF_UP', 'UP', 'DOWN', 'ROUND_TO_100', 'ROUND_TO_1000'));
