-- DB Migration Script: Create POS Employee Assignment and POS Inventory Tables (NCL-17-CN-002)
-- Target tables: users, shifts, orders, pos_inventories

-- 1. Add point_of_sale_id to users table if not exists
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS point_of_sale_id VARCHAR(36) NULL,
    ADD CONSTRAINT fk_users_pos FOREIGN KEY (point_of_sale_id) REFERENCES points_of_sale(id) ON DELETE SET NULL;

CREATE INDEX idx_users_point_of_sale ON users(household_id, point_of_sale_id);

-- 2. Add point_of_sale_id to shifts table if not exists
ALTER TABLE shifts
    ADD COLUMN IF NOT EXISTS point_of_sale_id VARCHAR(36) NULL,
    ADD CONSTRAINT fk_shifts_pos FOREIGN KEY (point_of_sale_id) REFERENCES points_of_sale(id) ON DELETE SET NULL;

CREATE INDEX idx_shifts_point_of_sale ON shifts(household_id, point_of_sale_id);

-- 3. Add point_of_sale_id to orders table if not exists
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS point_of_sale_id VARCHAR(36) NULL,
    ADD CONSTRAINT fk_orders_pos FOREIGN KEY (point_of_sale_id) REFERENCES points_of_sale(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_point_of_sale ON orders(household_id, point_of_sale_id);

-- 4. Create table pos_inventories (Tồn kho riêng theo từng điểm bán)
CREATE TABLE IF NOT EXISTS pos_inventories (
    id VARCHAR(36) NOT NULL,
    household_id VARCHAR(36) NOT NULL,
    point_of_sale_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    min_stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_pos_product UNIQUE (point_of_sale_id, product_id),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    FOREIGN KEY (point_of_sale_id) REFERENCES points_of_sale(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_pos_inventories_household_pos ON pos_inventories(household_id, point_of_sale_id);
CREATE INDEX idx_pos_inventories_product ON pos_inventories(product_id);
