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
    }
}
