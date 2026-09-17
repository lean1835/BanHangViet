-- Migration Script: Create Product Exchange Tables (NCL-11-CN-005)
-- Description: Bảng Phiếu đổi hàng và Chi tiết mặt hàng đổi cho nghiệp vụ đổi hàng ngang giá không hoàn tiền và đổi món khác giá

CREATE TABLE IF NOT EXISTS product_exchange_tickets (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    household_id VARCHAR(36) NOT NULL,
    original_invoice_id VARCHAR(36) NOT NULL,
    original_order_id VARCHAR(36) NULL,
    customer_id VARCHAR(36) NULL,
    ticket_number VARCHAR(50) NOT NULL,
    created_by_user_id VARCHAR(36) NOT NULL,
    exchange_type VARCHAR(20) NOT NULL DEFAULT 'EQUAL_VALUE',
    total_return_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_exchange_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    difference_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    extra_payment_method VARCHAR(20) NULL,
    additional_invoice_id VARCHAR(36) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    reason TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_pet_household_ticket UNIQUE (household_id, ticket_number),
    CONSTRAINT chk_exchange_type CHECK (exchange_type IN ('EQUAL_VALUE', 'HIGHER_VALUE', 'LOWER_VALUE')),
    CONSTRAINT chk_exchange_status CHECK (status IN ('COMPLETED', 'REDIRECTED_TO_RETURN', 'CANCELED')),
    CONSTRAINT chk_extra_payment_method CHECK (
        extra_payment_method IS NULL OR 
        extra_payment_method IN ('CASH', 'BANK_TRANSFER', 'QR_TRANSFER', 'DEBT', 'NONE')
    ),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    FOREIGN KEY (original_invoice_id) REFERENCES e_invoices(id) ON DELETE RESTRICT,
    FOREIGN KEY (original_order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (additional_invoice_id) REFERENCES e_invoices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu trữ thông tin phiếu đổi hàng (NCL-11-CN-005)';

CREATE TABLE IF NOT EXISTS product_exchange_items (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    exchange_ticket_id VARCHAR(36) NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    invoice_item_id VARCHAR(36) NULL,
    product_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    tax_rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_pei_item_type CHECK (item_type IN ('RETURN_ITEM', 'EXCHANGE_ITEM')),
    CONSTRAINT chk_pei_quantity CHECK (quantity > 0.000),
    CONSTRAINT chk_pei_unit_price CHECK (unit_price >= 0.00),
    CONSTRAINT chk_pei_subtotal CHECK (subtotal >= 0.00),
    FOREIGN KEY (exchange_ticket_id) REFERENCES product_exchange_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết các mặt hàng trả lại và đổi sang trong phiếu đổi hàng (NCL-11-CN-005)';

-- Chỉ mục tối ưu truy vấn
CREATE INDEX idx_exchange_tickets_household_invoice ON product_exchange_tickets(household_id, original_invoice_id);
CREATE INDEX idx_exchange_tickets_type ON product_exchange_tickets(household_id, exchange_type);
CREATE INDEX idx_exchange_tickets_status ON product_exchange_tickets(household_id, status);
CREATE INDEX idx_exchange_items_ticket_type ON product_exchange_items(exchange_ticket_id, item_type);
CREATE INDEX idx_exchange_items_product ON product_exchange_items(product_id);
