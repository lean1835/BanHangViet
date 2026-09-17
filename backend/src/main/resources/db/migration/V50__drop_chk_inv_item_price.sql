-- ==========================================================
-- Migration V50: Drop check constraints on e_invoice_items
-- Cho phép đơn giá âm (unit_price) và thành tiền âm (subtotal)
-- cho các dòng hàng khấu trừ / đổi trả trên hóa đơn bổ sung / điều chỉnh
-- ==========================================================

SET @drop_inv_price_chk = (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND TABLE_NAME = 'e_invoice_items'
              AND CONSTRAINT_NAME = 'chk_inv_item_price'
        ),
        'ALTER TABLE `e_invoice_items` DROP CHECK `chk_inv_item_price`',
        'SELECT 1'
    )
);
PREPARE stmt_drop_price_chk FROM @drop_inv_price_chk;
EXECUTE stmt_drop_price_chk;
DEALLOCATE PREPARE stmt_drop_price_chk;

SET @drop_inv_subtotal_chk = (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND TABLE_NAME = 'e_invoice_items'
              AND CONSTRAINT_NAME = 'chk_inv_item_subtotal'
        ),
        'ALTER TABLE `e_invoice_items` DROP CHECK `chk_inv_item_subtotal`',
        'SELECT 1'
    )
);
PREPARE stmt_drop_subtotal_chk FROM @drop_inv_subtotal_chk;
EXECUTE stmt_drop_subtotal_chk;
DEALLOCATE PREPARE stmt_drop_subtotal_chk;

SET @drop_inv_discount_chk = (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND TABLE_NAME = 'e_invoice_items'
              AND CONSTRAINT_NAME = 'chk_inv_item_discount'
        ),
        'ALTER TABLE `e_invoice_items` DROP CHECK `chk_inv_item_discount`',
        'SELECT 1'
    )
);
PREPARE stmt_drop_discount_chk FROM @drop_inv_discount_chk;
EXECUTE stmt_drop_discount_chk;
DEALLOCATE PREPARE stmt_drop_discount_chk;

SET @drop_inv_qty_chk = (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND TABLE_NAME = 'e_invoice_items'
              AND CONSTRAINT_NAME = 'chk_inv_item_qty'
        ),
        'ALTER TABLE `e_invoice_items` DROP CHECK `chk_inv_item_qty`',
        'SELECT 1'
    )
);
PREPARE stmt_drop_qty_chk FROM @drop_inv_qty_chk;
EXECUTE stmt_drop_qty_chk;
DEALLOCATE PREPARE stmt_drop_qty_chk;

SET @drop_inv_tax_chk = (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND TABLE_NAME = 'e_invoice_items'
              AND CONSTRAINT_NAME = 'chk_inv_item_tax'
        ),
        'ALTER TABLE `e_invoice_items` DROP CHECK `chk_inv_item_tax`',
        'SELECT 1'
    )
);
PREPARE stmt_drop_tax_chk FROM @drop_inv_tax_chk;
EXECUTE stmt_drop_tax_chk;
DEALLOCATE PREPARE stmt_drop_tax_chk;

