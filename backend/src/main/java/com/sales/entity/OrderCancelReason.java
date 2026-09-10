package com.sales.entity;

import lombok.Getter;

@Getter
public enum OrderCancelReason {
    CUSTOMER_CHANGED_MIND("Khách đổi ý"),
    OUT_OF_STOCK("Hết hàng"),
    STAFF_INPUT_ERROR("Nhân viên nhập nhầm"),
    OTHER("Lý do khác");

    private final String description;

    OrderCancelReason(String description) {
        this.description = description;
    }

    public static boolean isValidReason(OrderCancelReason reason) {
        if (reason == null) return false;
        for (OrderCancelReason r : values()) {
            if (r == reason) return true;
        }
        return false;
    }
}
