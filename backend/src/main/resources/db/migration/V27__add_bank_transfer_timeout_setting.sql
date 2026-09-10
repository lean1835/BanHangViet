ALTER TABLE business_household_settings
ADD COLUMN bank_transfer_timeout_minutes INT NOT NULL DEFAULT 15;
