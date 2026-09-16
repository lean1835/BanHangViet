-- V42: Thêm cột cost_price vào bảng order_items để lưu snapshot giá vốn tại thời điểm bán (NCL-07-CN-008)
ALTER TABLE order_items
ADD COLUMN cost_price DECIMAL(15,2) NOT NULL DEFAULT 0.00;

-- Khởi tạo giá trị ban đầu cho các dòng đơn hàng cũ từ giá vốn sản phẩm hiện tại
UPDATE order_items oi
JOIN products p ON oi.product_id = p.id
SET oi.cost_price = COALESCE(p.cost_price, 0.00)
WHERE oi.cost_price = 0.00;
