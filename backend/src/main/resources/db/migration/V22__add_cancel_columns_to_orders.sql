-- Migration V22: Bổ sung các cột lưu trữ lý do và kiểm toán hủy đơn hàng cho chức năng NCL-03-CN-009
ALTER TABLE `orders`
    ADD COLUMN `cancel_reason` VARCHAR(50) NULL COMMENT 'Lý do hủy đơn hàng' AFTER `discount_rate_or_value`,
    ADD COLUMN `cancel_reason_note` VARCHAR(500) NULL COMMENT 'Ghi chú chi tiết lý do hủy' AFTER `cancel_reason`,
    ADD COLUMN `canceled_by_user_id` VARCHAR(36) NULL COMMENT 'ID người thực hiện hủy đơn' AFTER `cancel_reason_note`,
    ADD COLUMN `canceled_at` TIMESTAMP NULL COMMENT 'Thời điểm hủy đơn' AFTER `canceled_by_user_id`;

ALTER TABLE `orders`
    ADD CONSTRAINT `fk_orders_canceled_by_user`
    FOREIGN KEY (`canceled_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT;

CREATE INDEX `idx_orders_cancel_lookup` ON `orders` (`household_id`, `status`, `canceled_at`);
CREATE INDEX `idx_orders_shift_cancel` ON `orders` (`shift_id`, `status`);
CREATE INDEX `idx_orders_canceled_by` ON `orders` (`canceled_by_user_id`);
