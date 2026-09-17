package com.sales.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FaqCategory {
    INVOICE("Hóa đơn"),
    SALES("Bán hàng"),
    ACCOUNT("Tài khoản"),
    DATA("Dữ liệu");

    private final String displayName;
}
