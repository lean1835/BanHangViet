-- Drop legacy MySQL trigger on orders table that causes double stock deductions
DROP TRIGGER IF EXISTS trg_stock_sales_update;
