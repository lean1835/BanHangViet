package com.sales.common.constant;

public class ReconciliationStatus {
    public static final String DRAFT = "DRAFT";         // Bản nháp đang xem xét / in cho khách ký
    public static final String CONFIRMED = "CONFIRMED"; // Khách đã ký xác nhận, chủ hộ chốt khóa sổ
    public static final String CANCELLED = "CANCELLED"; // Bản nháp bị hủy bỏ

    private ReconciliationStatus() {
        // private constructor
    }
}
