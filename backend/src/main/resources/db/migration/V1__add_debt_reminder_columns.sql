-- DB Migration Script: Auto Debt Reminders Columns and Index
-- Target tables: customers, customer_debts

-- 1. Add reminder configuration columns to customers table if not exists
ALTER TABLE customers 
    ADD COLUMN IF NOT EXISTS reminder_days_before INT NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS reminder_days_after INT NOT NULL DEFAULT 3;

-- 2. Add reminder tracking flags to customer_debts table if not exists
ALTER TABLE customer_debts 
    ADD COLUMN IF NOT EXISTS reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS overdue_reminder_sent TINYINT(1) NOT NULL DEFAULT 0;

-- 3. Add composite index for efficient keyset pagination and filtering on pending debt reminders
CREATE INDEX idx_debt_status_type_reminder ON customer_debts (status, type, reminder_sent, overdue_reminder_sent, due_date);
