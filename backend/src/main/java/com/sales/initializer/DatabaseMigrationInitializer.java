package com.sales.initializer;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Tự động kiểm tra và dọn dẹp các cấu trúc/trigger cơ sở dữ liệu cũ khi ứng dụng khởi động.
 * Đảm bảo trên mọi môi trường (Local, Staging, Production) không bị lỗi trừ tồn kho x2.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DatabaseMigrationInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            // Xóa bỏ trigger cũ trừ tồn kho tự động trong MySQL nếu còn tồn tại
            jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_stock_sales_update;");
            log.info("DatabaseMigrationInitializer: Đã kiểm tra và đảm bảo không tồn tại trigger cũ trg_stock_sales_update.");
        } catch (Exception e) {
            log.warn("DatabaseMigrationInitializer: Bỏ qua kiểm tra trigger database (H2 in-memory hoặc không hỗ trợ trigger): {}", e.getMessage());
        }

        try {
            // Đảm bảo from_point_of_sale_id và to_point_of_sale_id cho phép NULL (hỗ trợ chuyển hàng từ/đến Kho gốc)
            jdbcTemplate.execute("ALTER TABLE pos_transfers MODIFY COLUMN from_point_of_sale_id VARCHAR(36) NULL;");
            jdbcTemplate.execute("ALTER TABLE pos_transfers MODIFY COLUMN to_point_of_sale_id VARCHAR(36) NULL;");
            log.info("DatabaseMigrationInitializer: Đã đảm bảo pos_transfers cho phép NULL cho from/to_point_of_sale_id.");
        } catch (Exception e) {
            log.warn("DatabaseMigrationInitializer: Bỏ qua cập nhật cột pos_transfers (H2 in-memory hoặc không hỗ trợ MODIFY COLUMN): {}", e.getMessage());
        }

        try {
            // Drop check constraint chk_adjustment_ref sai logic (chặn hóa đơn gốc chuyển trạng thái ADJUSTED)
            jdbcTemplate.execute("ALTER TABLE e_invoices DROP CHECK chk_adjustment_ref;");
            log.info("DatabaseMigrationInitializer: Đã xóa check constraint sai chk_adjustment_ref trên bảng e_invoices thành công.");
        } catch (Exception e) {
            log.warn("DatabaseMigrationInitializer: Bỏ qua drop chk_adjustment_ref (có thể không tồn tại hoặc đã xóa): {}", e.getMessage());
        }

        try {
            // Đảm bảo chk_inv_status trên e_invoices cho phép trạng thái MANUAL_PROCESSING cho tự động gửi lại
            jdbcTemplate.execute("ALTER TABLE e_invoices DROP CHECK chk_inv_status;");
            jdbcTemplate.execute("ALTER TABLE e_invoices ADD CONSTRAINT chk_inv_status CHECK (status IN ('DRAFT', 'WAITING_TAX_CODE', 'ISSUED', 'SEND_ERROR', 'ADJUSTED', 'CANCELED', 'MANUAL_PROCESSING'));");
            log.info("DatabaseMigrationInitializer: Đã cập nhật check constraint chk_inv_status trên bảng e_invoices bao gồm MANUAL_PROCESSING.");
        } catch (Exception e) {
            log.warn("DatabaseMigrationInitializer: Bỏ qua cập nhật chk_inv_status: {}", e.getMessage());
        }

        try {
            // Drop check constraints trên e_invoice_items cho phép đơn giá và thành tiền âm khi lập hóa đơn đổi trả
            List<String> checkConstraints = jdbcTemplate.query(
                "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'e_invoice_items' AND CONSTRAINT_TYPE = 'CHECK'",
                (rs, rowNum) -> rs.getString("CONSTRAINT_NAME")
            );
            for (String chkName : checkConstraints) {
                try {
                    jdbcTemplate.execute("ALTER TABLE e_invoice_items DROP CHECK `" + chkName + "`");
                    log.info("DatabaseMigrationInitializer: Đã xóa check constraint {} trên e_invoice_items.", chkName);
                } catch (Exception dropEx) {
                    log.debug("DatabaseMigrationInitializer: Bỏ qua drop {}: {}", chkName, dropEx.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("DatabaseMigrationInitializer: Bỏ qua kiểm tra check constraints e_invoice_items: {}", e.getMessage());
        }

        try {
            // Cho phép changed_by_user_id NULL khi hệ thống tự động ghi log trạng thái hóa đơn (scheduler auto retry)
            jdbcTemplate.execute("ALTER TABLE invoice_status_logs MODIFY COLUMN changed_by_user_id VARCHAR(36) NULL;");
            log.info("DatabaseMigrationInitializer: Đã đảm bảo invoice_status_logs.changed_by_user_id cho phép NULL.");
        } catch (Exception e) {
            log.warn("DatabaseMigrationInitializer: Bỏ qua cập nhật cột invoice_status_logs: {}", e.getMessage());
        }

        try {
            // Đảm bảo foreign key từ order_items(price_tier_id) đến product_price_tiers có DELETE_RULE = 'SET NULL'
            List<String> invalidFks = jdbcTemplate.query(
                "SELECT rc.CONSTRAINT_NAME " +
                "FROM information_schema.REFERENTIAL_CONSTRAINTS rc " +
                "JOIN information_schema.KEY_COLUMN_USAGE kcu " +
                "  ON rc.CONSTRAINT_SCHEMA = kcu.TABLE_SCHEMA AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME " +
                "WHERE kcu.TABLE_SCHEMA = DATABASE() " +
                "  AND kcu.TABLE_NAME = 'order_items' " +
                "  AND kcu.COLUMN_NAME = 'price_tier_id' " +
                "  AND kcu.REFERENCED_TABLE_NAME = 'product_price_tiers' " +
                "  AND rc.DELETE_RULE != 'SET NULL'",
                (rs, rowNum) -> rs.getString("CONSTRAINT_NAME")
            );
            for (String fkName : invalidFks) {
                jdbcTemplate.execute("ALTER TABLE order_items DROP FOREIGN KEY `" + fkName + "`");
                jdbcTemplate.execute("ALTER TABLE order_items ADD CONSTRAINT fk_order_item_price_tier FOREIGN KEY (price_tier_id) REFERENCES product_price_tiers(id) ON DELETE SET NULL");
                log.info("DatabaseMigrationInitializer: Đã cập nhật foreign key {} sang fk_order_item_price_tier với ON DELETE SET NULL.", fkName);
            }
        } catch (Exception e) {
            log.warn("DatabaseMigrationInitializer: Bỏ qua kiểm tra foreign key order_items (H2 in-memory hoặc không hỗ trợ schema check): {}", e.getMessage());
        }

        try {
            // Đảm bảo có sẵn 3 gói dịch vụ nền tảng mặc định (NCL-01-CN-010) với giá cập nhật
            jdbcTemplate.execute(
                "INSERT INTO service_packages (id, code, name, description, max_users, max_pos_points, max_invoices_per_month, data_retention_days, price, is_active, created_at, updated_at) " +
                "VALUES " +
                "('pkg-001', 'BASIC', 'Gói Cơ Bản (Starter)', 'Dành cho hộ kinh doanh nhỏ, tối đa 3 tài khoản và 300 hóa đơn/tháng', 3, 1, 300, 180, 99000.00, TRUE, NOW(), NOW()), " +
                "('pkg-002', 'STANDARD', 'Gói Tiêu Chuẩn (Standard)', 'Dành cho hộ kinh doanh vừa, tối đa 10 tài khoản và 1.000 hóa đơn/tháng', 10, 3, 1000, 365, 499000.00, TRUE, NOW(), NOW()), " +
                "('pkg-003', 'PREMIUM', 'Gói Nâng Cao (Premium)', 'Dành cho chuỗi cửa hàng, tối đa 50 tài khoản và 5.000 hóa đơn/tháng', 50, 10, 5000, 730, 999000.00, TRUE, NOW(), NOW()) " +
                "ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price);"
            );
            log.info("DatabaseMigrationInitializer: Đã đồng bộ 3 gói dịch vụ nền tảng mặc định (BASIC, STANDARD, PREMIUM).");
        } catch (Exception e) {
            log.warn("DatabaseMigrationInitializer: Bỏ qua khởi tạo service_packages: {}", e.getMessage());
        }

        try {
            // NCL-01-CN-011: Khởi tạo dữ liệu nhật ký hệ thống toàn nền tảng mẫu (nếu chưa có)
            Integer logCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM platform_system_logs;", Integer.class);
            if (logCount == null || logCount == 0) {
                String hh1 = null;
                String hh2 = null;
                try {
                    List<String> hhIds = jdbcTemplate.queryForList("SELECT id FROM business_households LIMIT 2;", String.class);
                    if (hhIds.size() > 0) hh1 = hhIds.get(0);
                    if (hhIds.size() > 1) hh2 = hhIds.get(1);
                } catch (Exception ignored) {}

                String hh1Sql = hh1 != null ? "'" + hh1 + "'" : "NULL";
                String hh2Sql = hh2 != null ? "'" + hh2 + "'" : "NULL";

                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

                String t1 = now.minusMinutes(12).format(fmt);
                String t2 = now.minusMinutes(25).format(fmt);
                String t3 = now.minusMinutes(45).format(fmt);
                String t4 = now.minusHours(1).format(fmt);
                String t5 = now.minusHours(3).format(fmt);
                String t6 = now.minusHours(4).format(fmt);
                String t7 = now.minusHours(6).format(fmt);

                jdbcTemplate.execute(
                    "INSERT INTO platform_system_logs (id, event_type, severity, household_id, error_code, message, metadata, is_widespread_incident, created_at) " +
                    "VALUES " +
                    "('log-001', 'TAX_GATEWAY', 'WARNING', " + hh1Sql + ", 'TAX_SLOW_4001', 'Cổng Thuế (TCT) phản hồi chậm bất thường (độ trễ 4.250ms khi truyền nhận HĐĐT)', '{\"gateway\":\"https://hoadondientu.gdt.gov.vn\",\"latencyMs\":4250,\"clientIp\":\"10.0.0.12\",\"httpStatus\":200}', FALSE, '" + t1 + "'), " +
                    "('log-002', 'SUBSCRIPTION', 'INFO', " + hh1Sql + ", NULL, 'Nâng cấp gói dịch vụ thành công: Gói Tiêu Chuẩn (499.000 đ/tháng) - Thời hạn hiệu lực 12 tháng', '{\"actor\":\"admin\",\"planCode\":\"STANDARD\",\"price\":499000,\"durationMonths\":12}', FALSE, '" + t2 + "'), " +
                    "('log-003', 'SECURITY', 'WARNING', " + hh2Sql + ", 'SEC_LOCK_01', 'Khóa tạm thời tài khoản hộ kinh doanh do yêu cầu tạm ngừng hoạt động sửa mặt bằng', '{\"actor\":\"admin\",\"reason\":\"Hộ tạm ngừng kinh doanh theo yêu cầu\",\"activeTokensRevoked\":3}', FALSE, '" + t3 + "'), " +
                    "('log-004', 'INVOICE_QUEUE', 'INFO', " + hh1Sql + ", NULL, 'Xử lý thành công lô 150 hóa đơn truyền nhận thuế định kỳ qua cổng TCT theo Nghị định 123', '{\"batchId\":\"batch-20260916-01\",\"total\":150,\"success\":150,\"failed\":0}', FALSE, '" + t4 + "'), " +
                    "('log-005', 'BACKUP', 'INFO', NULL, NULL, 'Sao lưu cơ sở dữ liệu toàn nền tảng tự động định kỳ hoàn tất thành công (dung lượng 128MB)', '{\"backupType\":\"DAILY_AUTOMATED\",\"storage\":\"local_vault\",\"sizeMb\":128,\"checksum\":\"sha256-abc1234\"}', FALSE, '" + t5 + "'), " +
                    "('log-006', 'SYSTEM_ERROR', 'ERROR', " + hh2Sql + ", 'DB_DEADLOCK_02', 'Phát hiện xung đột khóa tài nguyên khi ghi nhận hóa đơn bán lẻ đồng thời (Deadlock tự động phục hồi)', '{\"table\":\"orders\",\"lockMode\":\"X\",\"retryCount\":2,\"recovered\":true}', FALSE, '" + t6 + "'), " +
                    "('log-007', 'TAX_GATEWAY', 'CRITICAL', " + hh1Sql + ", 'TAX_TIMEOUT_500', 'Mất kết nối cổng Tổng cục Thuế khi đồng bộ trạng thái hóa đơn điện tử (GAP 48: chuyển hàng đợi ngoại tuyến)', '{\"endpoint\":\"/api/v1/invoices/sync\",\"httpStatus\":504,\"retryCount\":3,\"offlineQueue\":true}', TRUE, '" + t7 + "');"
                );
                log.info("DatabaseMigrationInitializer: Đã nạp 7 bản ghi nhật ký hệ thống mẫu phong phú (NCL-01-CN-011).");
            }
        } catch (Exception e) {
            log.warn("DatabaseMigrationInitializer: Bỏ qua khởi tạo platform_system_logs: {}", e.getMessage());
        }

        try {
            // Cập nhật các dòng hàng khấu trừ cũ sang định dạng Đổi trả kèm tên sản phẩm (bỏ theo HĐ gốc)
            String updateDeductionSql =
                "UPDATE e_invoice_items eii " +
                "JOIN product_exchange_tickets pet ON pet.additional_invoice_id = eii.invoice_id " +
                "JOIN product_exchange_items pei ON pei.exchange_ticket_id = pet.id AND pei.item_type = 'RETURN_ITEM' " +
                "SET eii.product_name = CONCAT('Đổi trả: ', pei.product_name), " +
                "    eii.unit = pei.unit, " +
                "    eii.product_id = pei.product_id, " +
                "    eii.unit_price = -ABS(pei.unit_price) " +
                "WHERE eii.product_name LIKE 'Khấu trừ%' OR eii.product_name LIKE 'Đổi trả: % (theo HĐ gốc%';";
            int updatedRows = jdbcTemplate.update(updateDeductionSql);
            if (updatedRows > 0) {
                log.info("DatabaseMigrationInitializer: Đã cập nhật {} dòng đổi trả cũ sang định dạng gọn gàng.", updatedRows);
            }

            // Lược bỏ bớt chú thích dài dòng trên hóa đơn đổi hàng cũ
            jdbcTemplate.update("UPDATE e_invoices SET footer_note = NULL WHERE footer_note LIKE 'Hóa đơn phát sinh phần chênh lệch cho phiếu đổi hàng%';");
        } catch (Exception e) {
            log.warn("DatabaseMigrationInitializer: Bỏ qua cập nhật e_invoice_items khấu trừ cũ: {}", e.getMessage());
        }
    }
}
