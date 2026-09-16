-- =========================================================================
-- Migration Script: Create Backup Verification Histories Table (NCL-14-CN-005)
-- Target table: backup_verification_histories
-- =========================================================================

CREATE TABLE IF NOT EXISTS backup_verification_histories (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh bản ghi kiểm chứng',
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại hộ kinh doanh sở hữu bản sao lưu',
    backup_history_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại trỏ đến bản sao lưu được kiểm chứng',
    backup_file_name VARCHAR(255) NOT NULL COMMENT 'Tên tệp bản sao lưu tại thời điểm thử nghiệm',
    backup_time TIMESTAMP NOT NULL COMMENT 'Thời điểm bản sao lưu được tạo ra ban đầu',
    file_size BIGINT NOT NULL DEFAULT 0 COMMENT 'Dung lượng tệp sao lưu tính theo bytes',
    status VARCHAR(20) NOT NULL DEFAULT 'PASSED' COMMENT 'Kết quả kiểm chứng: PASSED hoặc FAILED',
    execution_duration_ms BIGINT NOT NULL DEFAULT 0 COMMENT 'Thời gian thực thi thử phục hồi tính theo mili-giây',
    verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thực hiện kiểm thử',
    checked_file_readable BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Kết quả kiểm tra đọc và phân giải tệp',
    checked_record_counts_matched BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Kết quả đối soát số lượng bản ghi các bảng chính',
    checked_audit_chain_intact BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Kết quả kiểm tra tính toàn vẹn chuỗi Hash Chain QTN-25',
    product_count INT NOT NULL DEFAULT 0 COMMENT 'Số lượng sản phẩm kiểm chứng trong snapshot',
    customer_count INT NOT NULL DEFAULT 0 COMMENT 'Số lượng khách hàng kiểm chứng trong snapshot',
    supplier_count INT NOT NULL DEFAULT 0 COMMENT 'Số lượng nhà cung cấp kiểm chứng trong snapshot',
    user_count INT NOT NULL DEFAULT 0 COMMENT 'Số lượng tài khoản nhân viên kiểm chứng trong snapshot',
    audit_log_count INT NOT NULL DEFAULT 0 COMMENT 'Số lượng bản ghi nhật ký kiểm toán được kiểm chứng chuỗi',
    failure_reason TEXT NULL COMMENT 'Nguyên nhân chi tiết nếu lần thử nghiệm thất bại',
    trigger_type VARCHAR(20) NOT NULL DEFAULT 'AUTOMATIC' COMMENT 'Hình thức kích hoạt: AUTOMATIC hoặc MANUAL',
    notes TEXT NULL COMMENT 'Ghi chú bổ sung về lần thử phục hồi',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bvh_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_bvh_backup FOREIGN KEY (backup_history_id) REFERENCES backup_histories(id) ON DELETE CASCADE,
    CONSTRAINT chk_bvh_status CHECK (status IN ('PASSED', 'FAILED')),
    CONSTRAINT chk_bvh_trigger_type CHECK (trigger_type IN ('AUTOMATIC', 'MANUAL'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhật ký lịch sử thử phục hồi định kỳ và báo cáo tình trạng bản sao lưu (NCL-14-CN-005)';

CREATE INDEX idx_bvh_household_verified ON backup_verification_histories(household_id, verified_at DESC);
CREATE INDEX idx_bvh_household_status ON backup_verification_histories(household_id, status);
CREATE INDEX idx_bvh_backup_id ON backup_verification_histories(backup_history_id);
