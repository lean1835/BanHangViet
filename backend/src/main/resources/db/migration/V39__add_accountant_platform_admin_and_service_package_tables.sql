-- V33: Thêm các bảng quản trị nền tảng, kế toán thuê ngoài và gói dịch vụ (NCL-01-CN-008, 009, 010, 011)

-- 1. Bổ sung các cột trạng thái khóa vào bảng business_households (NCL-01-CN-009)
ALTER TABLE business_households
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN lock_reason TEXT NULL,
ADD COLUMN locked_at TIMESTAMP NULL,
ADD COLUMN locked_by_user_id VARCHAR(36) NULL;

-- 2. Bảng Lời mời kế toán thuê ngoài (NCL-01-CN-008)
CREATE TABLE IF NOT EXISTS accountant_invitations (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    invitation_token VARCHAR(100) NOT NULL,
    accountant_phone VARCHAR(20) NOT NULL,
    accountant_email VARCHAR(100) NULL,
    invited_by_user_id VARCHAR(36) NOT NULL,
    access_duration_days INT NOT NULL DEFAULT 30,
    scope_permissions JSON NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    invitation_expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    accepted_by_user_id VARCHAR(36) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_invitation_token UNIQUE (invitation_token),
    CONSTRAINT chk_invitation_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REVOKED')),
    CONSTRAINT fk_acc_inv_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_acc_inv_inviter FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_acc_inv_accepter FOREIGN KEY (accepted_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_accountant_invitations_phone ON accountant_invitations(accountant_phone, status);
CREATE INDEX idx_accountant_invitations_token ON accountant_invitations(invitation_token);

-- 3. Bảng Phân công kế toán cho hộ kinh doanh (NCL-01-CN-008)
CREATE TABLE IF NOT EXISTS household_accountant_assignments (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    accountant_user_id VARCHAR(36) NOT NULL,
    invitation_id VARCHAR(36) NULL,
    scope_permissions JSON NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    access_expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    revoked_by_user_id VARCHAR(36) NULL,
    revoke_reason VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_household_accountant UNIQUE (household_id, accountant_user_id),
    CONSTRAINT chk_assignment_status CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    CONSTRAINT fk_acc_assign_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_acc_assign_accountant FOREIGN KEY (accountant_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_acc_assign_invitation FOREIGN KEY (invitation_id) REFERENCES accountant_invitations(id) ON DELETE SET NULL,
    CONSTRAINT fk_acc_assign_revoker FOREIGN KEY (revoked_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_accountant_assignments_user ON household_accountant_assignments(accountant_user_id, status);
CREATE INDEX idx_accountant_assignments_household ON household_accountant_assignments(household_id, status);

-- 4. Bảng Gói dịch vụ nền tảng (NCL-01-CN-010)
CREATE TABLE IF NOT EXISTS service_packages (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    max_users INT NOT NULL DEFAULT 5,
    max_pos_points INT NOT NULL DEFAULT 2,
    max_invoices_per_month INT NOT NULL DEFAULT 500,
    data_retention_days INT NOT NULL DEFAULT 365,
    price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_package_code UNIQUE (code),
    CONSTRAINT chk_pkg_max_users CHECK (max_users > 0),
    CONSTRAINT chk_pkg_max_pos CHECK (max_pos_points > 0),
    CONSTRAINT chk_pkg_max_inv CHECK (max_invoices_per_month > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng Đăng ký gói dịch vụ của hộ kinh doanh (NCL-01-CN-010)
CREATE TABLE IF NOT EXISTS household_subscriptions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    package_id VARCHAR(36) NOT NULL,
    assigned_by_user_id VARCHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_sub_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    CONSTRAINT fk_sub_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_package FOREIGN KEY (package_id) REFERENCES service_packages(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sub_assigner FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_household_subscriptions_household ON household_subscriptions(household_id, status);

-- 6. Bảng Thống kê mức sử dụng tài nguyên của hộ theo tháng (NCL-01-CN-010)
CREATE TABLE IF NOT EXISTS household_usage_stats (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    household_id VARCHAR(36) NOT NULL,
    month_year VARCHAR(7) NOT NULL,
    current_users_count INT NOT NULL DEFAULT 0,
    current_pos_count INT NOT NULL DEFAULT 0,
    invoices_issued_count INT NOT NULL DEFAULT 0,
    is_invoice_over_quota BOOLEAN NOT NULL DEFAULT FALSE,
    over_quota_invoice_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_household_month_usage UNIQUE (household_id, month_year),
    CONSTRAINT fk_usage_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_household_usage_month ON household_usage_stats(household_id, month_year);

-- 7. Bảng Sự cố diện rộng toàn nền tảng (NCL-01-CN-011)
CREATE TABLE IF NOT EXISTS platform_incidents (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'INVESTIGATING',
    affected_households_count INT NOT NULL DEFAULT 0,
    error_threshold_count INT NOT NULL DEFAULT 5,
    description TEXT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_incident_status CHECK (status IN ('INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_platform_incidents_status ON platform_incidents(status, severity);

-- 8. Bảng Nhật ký hệ thống toàn nền tảng (NCL-01-CN-011)
CREATE TABLE IF NOT EXISTS platform_system_logs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    household_id VARCHAR(36) NULL,
    error_code VARCHAR(50) NULL,
    message VARCHAR(500) NOT NULL,
    metadata JSON NULL,
    is_widespread_incident BOOLEAN NOT NULL DEFAULT FALSE,
    incident_id VARCHAR(36) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_plat_log_severity CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    CONSTRAINT fk_plat_log_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_plat_log_incident FOREIGN KEY (incident_id) REFERENCES platform_incidents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_platform_logs_severity_created ON platform_system_logs(severity, created_at);
CREATE INDEX idx_platform_logs_household ON platform_system_logs(household_id, created_at);
CREATE INDEX idx_platform_logs_event_type ON platform_system_logs(event_type, created_at);

-- 9. Khởi tạo danh mục gói dịch vụ mặc định
INSERT INTO service_packages (id, code, name, description, max_users, max_pos_points, max_invoices_per_month, data_retention_days, price, is_active)
VALUES
('pkg-001', 'BASIC', 'Gói Cơ Bản', 'Dành cho hộ kinh doanh nhỏ, tối đa 3 người dùng và 300 hóa đơn/tháng', 3, 1, 300, 180, 99000.00, TRUE),
('pkg-002', 'STANDARD', 'Gói Tiêu Chuẩn', 'Dành cho hộ kinh doanh vừa, tối đa 10 người dùng và 1.000 hóa đơn/tháng', 10, 3, 1000, 365, 499000.00, TRUE),
('pkg-003', 'PREMIUM', 'Gói Nâng Cao', 'Dành cho chuỗi cửa hàng, tối đa 50 người dùng và 5.000 hóa đơn/tháng', 50, 10, 5000, 730, 999000.00, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price);
