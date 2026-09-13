-- V31: Drop check constraint chk_adjustment_ref on e_invoices because it prevents original invoices from transitioning to ADJUSTED status (where original_invoice_id is NULL)
ALTER TABLE e_invoices DROP CHECK chk_adjustment_ref;
