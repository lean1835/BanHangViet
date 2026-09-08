-- V17: Tao bang quan ly dai so hoa don va nhat ky ket noi co quan thue (NCL-04-CN-009, NCL-04-CN-010)

CREATE TABLE IF NOT EXISTS invoice_number_ranges (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    invoice_pattern VARCHAR(10) NOT NULL,
    invoice_symbol VARCHAR(10) NOT NULL,
    start_number INT NOT NULL DEFAULT 1,
    end_number INT NOT NULL DEFAULT 1000,
    current_number INT NOT NULL DEFAULT 0,
    warning_threshold INT NOT NULL DEFAULT 50,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    deleted_at DATETIME(6) NULL,
    CONSTRAINT fk_invoice_range_household FOREIGN KEY (household_id) REFERENCES business_households(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_invoice_range_lookup ON invoice_number_ranges (household_id, invoice_pattern, invoice_symbol, status, deleted_at);

CREATE TABLE IF NOT EXISTS tax_connection_logs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    household_id VARCHAR(36) NULL,
    status VARCHAR(20) NOT NULL,
    response_time_ms INT NULL,
    last_successful_response_at DATETIME(6) NULL,
    pending_queue_count INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_tax_log_household FOREIGN KEY (household_id) REFERENCES business_households(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tax_log_household_created ON tax_connection_logs (household_id, created_at DESC);
