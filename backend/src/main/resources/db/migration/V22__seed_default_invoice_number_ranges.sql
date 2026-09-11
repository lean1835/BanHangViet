-- V22: Khoi tao dai so hoa don mac dinh cho cac ho kinh doanh (NCL-04-CN-009)

INSERT INTO invoice_number_ranges (id, household_id, invoice_pattern, invoice_symbol, start_number, end_number, current_number, warning_threshold, status, created_at, updated_at)
SELECT 
    UUID(),
    bh.id,
    COALESCE(it.invoice_pattern, '1'),
    COALESCE(it.invoice_symbol, 'C26TAA'),
    1,
    100000,
    0,
    50,
    'ACTIVE',
    NOW(),
    NOW()
FROM business_households bh
LEFT JOIN invoice_templates it ON it.household_id = bh.id
WHERE NOT EXISTS (
    SELECT 1 FROM invoice_number_ranges inr 
    WHERE inr.household_id = bh.id 
      AND inr.invoice_pattern = COALESCE(it.invoice_pattern, '1')
      AND inr.invoice_symbol = COALESCE(it.invoice_symbol, 'C26TAA')
      AND inr.deleted_at IS NULL
);
