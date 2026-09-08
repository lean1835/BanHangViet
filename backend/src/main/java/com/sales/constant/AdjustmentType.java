package com.sales.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum AdjustmentType {
    PERCENTAGE("Tăng/giảm theo tỷ lệ phần trăm (%)"),
    FIXED_AMOUNT("Tăng/giảm theo số tiền cố định (VNĐ)"),
    PROFIT_MARGIN("Thiết lập theo tỷ lệ lãi trên giá vốn (%)");

    private final String description;
}
