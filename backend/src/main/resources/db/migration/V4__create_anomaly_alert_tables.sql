-- DB Migration Script: Create Anomaly Alert Tables and Indexes (NCL-14-CN-004)
-- Target tables: anomaly_alerts, anomaly_rule_configs

CREATE TABLE IF NOT EXISTS anomaly_rule_configs (
    id VARCHAR(36) NOT NULL,
    household_id VARCHAR(36) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    threshold_value DECIMAL(15,2) NOT NULL DEFAULT 5.00,
    time_window_minutes INT NOT NULL DEFAULT 10,
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_household_rule_type UNIQUE (household_id, rule_type),
    CONSTRAINT chk_rule_severity CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id VARCHAR(36) NOT NULL,
    household_id VARCHAR(36) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING',
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    actor_user_id VARCHAR(36) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    evidence_data JSON NULL,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by_user_id VARCHAR(36) NULL,
    reviewed_at TIMESTAMP NULL,
    review_notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_alert_severity CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
    CONSTRAINT chk_alert_status CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED')),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_anomaly_alerts_household_detected ON anomaly_alerts(household_id, detected_at);
CREATE INDEX idx_anomaly_alerts_household_status ON anomaly_alerts(household_id, status);
CREATE INDEX idx_anomaly_alerts_actor ON anomaly_alerts(actor_user_id);
CREATE INDEX idx_anomaly_rule_configs_household ON anomaly_rule_configs(household_id);
