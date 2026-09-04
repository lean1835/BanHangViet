package com.sales.initializer;

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
    }
}
