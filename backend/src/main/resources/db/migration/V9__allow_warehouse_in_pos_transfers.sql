-- DB Migration Script: Allow warehouse (null) in pos_transfers (NCL-17-CN-003)
ALTER TABLE pos_transfers MODIFY COLUMN from_point_of_sale_id VARCHAR(36) NULL;
ALTER TABLE pos_transfers MODIFY COLUMN to_point_of_sale_id VARCHAR(36) NULL;
