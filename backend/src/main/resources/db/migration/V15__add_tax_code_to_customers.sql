-- V15: Add tax_code column to customers table for corporate buyer info auto-fill and history (NCL-04-CN-006)
ALTER TABLE customers ADD COLUMN tax_code VARCHAR(20) NULL AFTER phone_number;
CREATE INDEX idx_customer_tax_code ON customers(household_id, tax_code);
