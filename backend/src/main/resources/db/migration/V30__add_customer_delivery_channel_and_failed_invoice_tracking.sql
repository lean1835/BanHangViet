-- Thêm kênh nhận hóa đơn mặc định vào bảng khách hàng (customers)
ALTER TABLE customers 
ADD COLUMN default_delivery_channel VARCHAR(20) NULL DEFAULT 'QR',
ADD COLUMN default_delivery_address VARCHAR(255) NULL;

-- Thêm trạng thái giao hóa đơn cho khách vào bảng e_invoices
ALTER TABLE e_invoices 
ADD COLUMN customer_delivery_status VARCHAR(20) NOT NULL DEFAULT 'NOT_SENT';

-- Tạo Index hỗ trợ truy vấn danh sách hóa đơn giao thất bại theo Hộ kinh doanh
CREATE INDEX idx_e_invoices_customer_delivery ON e_invoices(household_id, customer_delivery_status);
