-- DB Migration Script: Create Inventory Audit Tables and Indexes (NCL-13-CN-004)
-- Target tables: inventory_audits, inventory_audit_details

CREATE TABLE IF NOT EXISTS inventory_audits (
    id VARCHAR(36) NOT NULL,
    household_id VARCHAR(36) NOT NULL,
    created_by_user_id VARCHAR(36) NOT NULL,
    audit_number VARCHAR(50) NOT NULL,
    audit_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    total_items INT NOT NULL DEFAULT 0,
    total_difference_qty DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_inventory_audit_number UNIQUE (audit_number),
    CONSTRAINT chk_inventory_audit_status CHECK (status IN ('COMPLETED', 'CANCELLED')),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_audit_details (
    id VARCHAR(36) NOT NULL,
    audit_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    system_quantity DECIMAL(12,3) NOT NULL,
    actual_quantity DECIMAL(12,3) NOT NULL,
    difference_quantity DECIMAL(12,3) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_audit_actual_qty CHECK (actual_quantity >= 0.000),
    FOREIGN KEY (audit_id) REFERENCES inventory_audits(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_inventory_audits_household ON inventory_audits(household_id, audit_number);
CREATE INDEX idx_inventory_audits_date ON inventory_audits(household_id, audit_date);
