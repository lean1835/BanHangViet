-- ==========================================================
-- NCL-03-CN-010: Đặt tên nhận diện và treo nhiều đơn theo bàn hoặc khách
-- Migration V23: Tạo bảng dining_tables, thêm cột order_label, dining_table_id vào orders
-- và thêm cấu hình max_order_holding_hours vào business_household_settings
-- ==========================================================

-- 1. Tạo bảng danh mục bàn ăn phục vụ tại chỗ
CREATE TABLE IF NOT EXISTS dining_tables (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh bàn ăn',
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết hộ kinh doanh để cô lập dữ liệu',
    name VARCHAR(100) NOT NULL COMMENT 'Tên bàn ăn (ví dụ: Bàn 1, Bàn VIP, Mang về 01)',
    area VARCHAR(100) NULL COMMENT 'Khu vực đặt bàn (ví dụ: Tầng 1, Sân vườn, Tầng lửng)',
    seat_capacity INT NOT NULL DEFAULT 4 COMMENT 'Số lượng chỗ ngồi ước tính',
    sort_order INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị trên màn hình POS',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái hoạt động của bàn',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dining_tables_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT chk_dining_tables_capacity CHECK (seat_capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng danh mục bàn ăn phục vụ tại chỗ';

CREATE INDEX idx_dining_tables_household ON dining_tables(household_id);
CREATE INDEX idx_dining_tables_household_active ON dining_tables(household_id, is_active);

-- 2. Cập nhật bảng orders để lưu tên nhận diện và liên kết bàn ăn
ALTER TABLE orders 
    ADD COLUMN order_label VARCHAR(100) NULL COMMENT 'Tên gợi nhớ/nhận diện đơn hàng (ví dụ: Bác Nam áo xanh, Chị Lan mang về)',
    ADD COLUMN dining_table_id VARCHAR(36) NULL COMMENT 'Khóa ngoại liên kết bàn ăn nếu phục vụ tại bàn',
    ADD CONSTRAINT fk_orders_dining_table FOREIGN KEY (dining_table_id) REFERENCES dining_tables(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_dining_table ON orders(dining_table_id);
CREATE INDEX idx_orders_status_shift ON orders(household_id, shift_id, status);

-- 3. Cập nhật bảng business_household_settings cấu hình thời gian cảnh báo đơn treo quá hạn
ALTER TABLE business_household_settings 
    ADD COLUMN max_order_holding_hours INT NOT NULL DEFAULT 4 COMMENT 'Thời gian treo đơn tối đa cho phép trước khi cảnh báo quá hạn (giờ)';
