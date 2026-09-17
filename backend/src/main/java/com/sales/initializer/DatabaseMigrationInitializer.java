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
