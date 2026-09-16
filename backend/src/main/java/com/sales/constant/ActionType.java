package com.sales.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ActionType {
    CANCEL_ORDER("Hủy đơn hàng đang tạo", "Đơn hàng"),
    CANCEL_INVOICE("Hủy hóa đơn điện tử", "Hóa đơn điện tử"),
    VOID_PAYMENT("Hủy giao dịch thanh toán", "Thanh toán"),
    RETURN_GOODS("Lập phiếu trả hàng", "Trả hàng");

    private final String actionName;
    private final String targetType;
}
