-- ==========================================================
-- Migration V30: Cập nhật CHECK constraint chk_order_payment_method cho phép hình thức
-- thanh toán COMBINED (NCL-03-CN-011) và bổ sung payment_method cho e_invoices
-- Đảm bảo Idempotent: Hoạt động an toàn trên mọi môi trường (Local, CI, Staging, Prod)
-- ==========================================================

-- 1. Kiểm tra và xóa CHECK constraint chk_order_payment_method cũ trên bảng orders nếu tồn tại
SET @drop_chk = (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND TABLE_NAME = 'orders'
              AND CONSTRAINT_NAME = 'chk_order_payment_method'
        ),
        'ALTER TABLE `orders` DROP CHECK `chk_order_payment_method`',
        'SELECT 1'
    )
);
PREPARE stmt_drop FROM @drop_chk;
EXECUTE stmt_drop;
DEALLOCATE PREPARE stmt_drop;

-- 2. Bổ sung CHECK constraint mới hỗ trợ đầy đủ 4 hình thức thanh toán
ALTER TABLE `orders` ADD CONSTRAINT `chk_order_payment_method` 
    CHECK (`payment_method` IN ('CASH', 'BANK_TRANSFER', 'DEBT', 'COMBINED'));

-- 3. Bổ sung cột payment_method cho bảng e_invoices nếu chưa tồn tại
SET @add_col = (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'e_invoices'
              AND COLUMN_NAME = 'payment_method'
        ),
        'SELECT 1',
        'ALTER TABLE `e_invoices` ADD COLUMN `payment_method` VARCHAR(30) NULL AFTER `final_amount`'
    )
);
PREPARE stmt_add FROM @add_col;
EXECUTE stmt_add;
DEALLOCATE PREPARE stmt_add;
