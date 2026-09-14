-- V36: Tạo bảng tax_purchase_registers và bổ sung cột theo dõi giá trị mua vào vào tax_declaration_periods (NCL-12-CN-006)

CREATE TABLE IF NOT EXISTS tax_purchase_registers (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh dòng bảng kê mua vào',
    period_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết kỳ kê khai thuế',
    receipt_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết phiếu nhập kho gốc',
    receipt_detail_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết dòng chi tiết phiếu nhập',
    receipt_number VARCHAR(50) NOT NULL COMMENT 'Số hiệu phiếu nhập kho',
    receipt_date DATETIME NOT NULL COMMENT 'Ngày giờ phát sinh phiếu nhập',
    supplier_id VARCHAR(36) NULL COMMENT 'Khóa ngoại nhà cung cấp (NULL nếu phiếu không gắn NCC)',
    supplier_name VARCHAR(255) NULL COMMENT 'Tên nhà cung cấp tại thời điểm lập bảng kê',
    supplier_tax_code VARCHAR(50) NULL COMMENT 'Mã số thuế nhà cung cấp',
    supplier_invoice_number VARCHAR(50) NULL COMMENT 'Số hóa đơn của nhà cung cấp nếu có',
    product_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại mặt hàng',
    product_code VARCHAR(50) NOT NULL COMMENT 'Mã SKU / Barcode mặt hàng',
    product_name VARCHAR(255) NOT NULL COMMENT 'Tên mặt hàng',
    unit_name VARCHAR(50) NULL COMMENT 'Tên đơn vị tính cơ sở',
    base_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0.000 COMMENT 'Số lượng theo đơn vị tính cơ sở',
    base_purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Đơn giá nhập theo đơn vị cơ sở',
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Thành tiền mua vào (base_quantity * base_purchase_price)',
    is_supplier_missing BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đánh dấu phiếu nhập thiếu thông tin NCC (TC-02)',
    notes TEXT NULL COMMENT 'Ghi chú phiếu nhập hoặc lý do cảnh báo',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm ghi nhận bản ghi',
    CONSTRAINT fk_tpr_period FOREIGN KEY (period_id) REFERENCES tax_declaration_periods(id) ON DELETE CASCADE,
    CONSTRAINT fk_tpr_receipt FOREIGN KEY (receipt_id) REFERENCES goods_receipts(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tpr_receipt_detail FOREIGN KEY (receipt_detail_id) REFERENCES goods_receipt_details(id) ON DELETE CASCADE,
    CONSTRAINT fk_tpr_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tpr_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_tpr_period_id (period_id),
    INDEX idx_tpr_supplier_id (supplier_id),
    INDEX idx_tpr_receipt_date (receipt_date),
    INDEX idx_tpr_missing_supplier (is_supplier_missing)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng kê hàng hóa dịch vụ mua vào theo kỳ thuế (NCL-12-CN-006)';

-- Bổ sung các trường tổng hợp mua vào vào bảng tax_declaration_periods
ALTER TABLE tax_declaration_periods
    ADD COLUMN IF NOT EXISTS total_purchase_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng giá trị hàng hóa mua vào toàn kỳ',
    ADD COLUMN IF NOT EXISTS total_purchase_receipts INT NOT NULL DEFAULT 0 COMMENT 'Tổng số phiếu nhập kho phát sinh trong kỳ';
