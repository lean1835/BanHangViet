-- V35: Bổ sung cột thuế GTGT cho orders và các trường điểm thưởng cho e_invoices (QTN-07 & QTN-26)

-- 1. Bổ sung cột tax_amount vào bảng orders nếu chưa tồn tại
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng tiền thuế GTGT đã tính trên đơn hàng';

-- 2. Bổ sung các cột điểm thưởng vào bảng e_invoices nếu chưa tồn tại
ALTER TABLE e_invoices
    ADD COLUMN IF NOT EXISTS point_discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số tiền giảm trừ do đổi điểm tích lũy',
    ADD COLUMN IF NOT EXISTS points_redeemed INT NOT NULL DEFAULT 0 COMMENT 'Số điểm khách đã sử dụng để đổi trừ tiền trên hóa đơn';
