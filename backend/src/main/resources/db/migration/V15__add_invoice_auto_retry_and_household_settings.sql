CREATE TABLE IF NOT EXISTS business_household_settings (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    household_id VARCHAR(36) NOT NULL,
    auto_retry_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_retry_attempts INT NOT NULL DEFAULT 3,
    retry_interval_minutes INT NOT NULL DEFAULT 15,
    max_retry_hours_deadline INT NOT NULL DEFAULT 24,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_household_settings UNIQUE (household_id),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE e_invoices
ADD COLUMN retry_count INT NOT NULL DEFAULT 0,
ADD COLUMN max_retry_count INT NULL,
ADD COLUMN next_retry_at TIMESTAMP NULL,
ADD COLUMN last_retry_at TIMESTAMP NULL,
ADD COLUMN error_category VARCHAR(30) NULL;

ALTER TABLE invoice_status_logs MODIFY COLUMN changed_by_user_id VARCHAR(36) NULL;

CREATE INDEX idx_invoices_auto_retry ON e_invoices(household_id, status, next_retry_at);
