-- V22: Create tables for invoice error notices (Mẫu 04/SS-HĐĐT - NCL-05-CN-005) and add is_error_notified column to e_invoices

ALTER TABLE e_invoices 
ADD COLUMN is_error_notified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE invoice_error_notices (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    household_id VARCHAR(36) NOT NULL,
    notice_code VARCHAR(50) NOT NULL,
    notice_type VARCHAR(20) NOT NULL DEFAULT '04/SS',
    notice_place VARCHAR(100) NULL,
    tax_authority_name VARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    tax_authority_code VARCHAR(100) NULL,
    tax_authority_response TEXT NULL,
    sent_to_tax_at TIMESTAMP NULL,
    tax_response_at TIMESTAMP NULL,
    created_by_user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_notice_code UNIQUE (notice_code),
    CONSTRAINT chk_notice_status CHECK (status IN ('DRAFT', 'WAITING_TAX_RESPONSE', 'ACCEPTED', 'REJECTED')),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE invoice_error_notice_items (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    notice_id VARCHAR(36) NOT NULL,
    invoice_id VARCHAR(36) NOT NULL,
    invoice_number VARCHAR(20) NULL,
    invoice_pattern VARCHAR(10) NULL,
    invoice_symbol VARCHAR(10) NULL,
    tax_authority_code VARCHAR(100) NULL,
    handling_type VARCHAR(30) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_notice_item UNIQUE (notice_id, invoice_id),
    CONSTRAINT chk_handling_type CHECK (handling_type IN ('CANCEL', 'ADJUST', 'REPLACE', 'EXPLAIN')),
    FOREIGN KEY (notice_id) REFERENCES invoice_error_notices(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES e_invoices(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_notice_household ON invoice_error_notices(household_id);
CREATE INDEX idx_notice_item_inv ON invoice_error_notice_items(invoice_id);
