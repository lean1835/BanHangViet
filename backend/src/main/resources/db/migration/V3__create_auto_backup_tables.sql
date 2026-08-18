-- DB Migration Script: Create Auto Backup Tables and Indexes (NCL-14-CN-002)
-- Target tables: backup_configs, backup_histories

CREATE TABLE IF NOT EXISTS backup_configs (
    id VARCHAR(36) NOT NULL,
    household_id VARCHAR(36) NOT NULL,
    is_auto_backup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    scheduled_time VARCHAR(10) NOT NULL DEFAULT '01:00',
    retention_count INT NOT NULL DEFAULT 7,
    backup_type VARCHAR(20) NOT NULL DEFAULT 'FULL',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_household_backup_config UNIQUE (household_id),
    CONSTRAINT chk_backup_retention CHECK (retention_count >= 1 AND retention_count <= 100),
    CONSTRAINT chk_backup_config_type CHECK (backup_type IN ('FULL', 'PRODUCTS', 'ORDERS', 'INVOICES')),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS backup_histories (
    id VARCHAR(36) NOT NULL,
    household_id VARCHAR(36) NOT NULL,
    created_by_user_id VARCHAR(36) NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    backup_type VARCHAR(20) NOT NULL DEFAULT 'FULL',
    trigger_type VARCHAR(20) NOT NULL DEFAULT 'AUTOMATIC',
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    notes TEXT NULL,
    backup_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_backup_history_type CHECK (backup_type IN ('FULL', 'PRODUCTS', 'ORDERS', 'INVOICES')),
    CONSTRAINT chk_backup_trigger_type CHECK (trigger_type IN ('AUTOMATIC', 'MANUAL')),
    CONSTRAINT chk_backup_status CHECK (status IN ('SUCCESS', 'FAILED', 'PURGED')),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_backup_configs_household ON backup_configs(household_id);
CREATE INDEX idx_backup_histories_household_time ON backup_histories(household_id, backup_time);
