-- V31: Thêm cấu hình ngưỡng chênh lệch ca bán hàng vào bảng cài đặt hộ kinh doanh (NCL-07-CN-010)
ALTER TABLE business_household_settings
ADD COLUMN shift_difference_threshold DECIMAL(15,2) NOT NULL DEFAULT 0.00;
