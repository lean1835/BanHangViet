-- DB Migration Script: Create POS Transfer Tables (NCL-17-CN-003)
-- Target tables: pos_transfers, pos_transfer_items

-- 1. Bảng Phiếu chuyển hàng giữa các điểm bán (pos_transfers)
CREATE TABLE IF NOT EXISTS pos_transfers (
    id VARCHAR(36) NOT NULL,
    household_id VARCHAR(36) NOT NULL,
    transfer_number VARCHAR(50) NOT NULL,
    from_point_of_sale_id VARCHAR(36) NOT NULL,
    to_point_of_sale_id VARCHAR(36) NOT NULL,
    created_by_user_id VARCHAR(36) NOT NULL,
    received_by_user_id VARCHAR(36) NULL,
    canceled_by_user_id VARCHAR(36) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_TRANSIT',
    total_items INT NOT NULL DEFAULT 0,
    total_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    notes TEXT NULL,
    cancel_reason TEXT NULL,
    transferred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP NULL,
    canceled_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_pos_transfer_number UNIQUE (transfer_number),
    CONSTRAINT chk_pos_transfer_status CHECK (status IN ('IN_TRANSIT', 'COMPLETED', 'CANCELED')),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    FOREIGN KEY (from_point_of_sale_id) REFERENCES points_of_sale(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_point_of_sale_id) REFERENCES points_of_sale(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (received_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (canceled_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_pos_transfers_household ON pos_transfers(household_id, status, transferred_at);
CREATE INDEX idx_pos_transfers_from_pos ON pos_transfers(from_point_of_sale_id);
CREATE INDEX idx_pos_transfers_to_pos ON pos_transfers(to_point_of_sale_id);

-- 2. Bảng Chi tiết mặt hàng chuyển (pos_transfer_items)
CREATE TABLE IF NOT EXISTS pos_transfer_items (
    id VARCHAR(36) NOT NULL,
    transfer_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_sku VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_pos_transfer_item_qty CHECK (quantity > 0.000),
    FOREIGN KEY (transfer_id) REFERENCES pos_transfers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_pos_transfer_items_transfer ON pos_transfer_items(transfer_id);
CREATE INDEX idx_pos_transfer_items_product ON pos_transfer_items(product_id);
